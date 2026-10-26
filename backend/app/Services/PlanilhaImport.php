<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Reader\Csv;
use PhpOffice\PhpSpreadsheet\Reader\IReader;
use PhpOffice\PhpSpreadsheet\Reader\Xls;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Base das importações de planilha (.xls, .xlsx ou .csv) de 4 colunas.
 *
 * Cada importação define os nomes aceitos para as colunas e como validar
 * uma linha; a leitura do arquivo e a conversão de datas e valores ficam aqui.
 */
abstract class PlanilhaImport
{
    public const MAX_LINHAS = 1000;

    /**
     * Nomes aceitos no cabeçalho para cada coluna, na ordem padrão
     * (usada quando a planilha não tem cabeçalho).
     *
     * @return array<string, string[]>
     */
    abstract protected function colunas(): array;

    /** Colunas que precisam estar no cabeçalho para ele ser reconhecido. */
    abstract protected function colunasObrigatorias(): array;

    /** @param array<string, mixed> $valores valores da linha por coluna */
    abstract protected function validarLinha(int $linha, array $valores): array;

    /**
     * @return array<int, array<string, mixed>> uma entrada por linha preenchida, com "line" e "errors"
     */
    public function analisar(UploadedFile $arquivo): array
    {
        $linhas = $this->lerLinhas($arquivo);

        if (!$linhas) {
            return [];
        }

        [$mapa, $inicio] = $this->mapearColunas($linhas[0]);

        $resultado = [];

        foreach (array_slice($linhas, $inicio, null, true) as $indice => $valores) {
            // Linhas totalmente vazias são ignoradas (comuns no fim da planilha).
            if (!array_filter($valores, fn ($v) => trim((string) $v) !== '')) {
                continue;
            }

            if (count($resultado) >= self::MAX_LINHAS) {
                throw new \InvalidArgumentException('A planilha passa do limite de ' . self::MAX_LINHAS . ' linhas.');
            }

            $porColuna = array_map(fn ($posicao) => $valores[$posicao] ?? null, $mapa);
            $resultado[] = $this->validarLinha($indice + 1, $porColuna);
        }

        return $resultado;
    }

    private function lerLinhas(UploadedFile $arquivo): array
    {
        $leitor = $this->leitorPara($arquivo);
        $leitor->setReadDataOnly(true);

        $planilha = $leitor->load($arquivo->getRealPath());
        $aba = $planilha->getSheet(0);

        // Limita a área lida: evita planilhas com milhões de linhas "fantasmas".
        $ultimaLinha = min($aba->getHighestDataRow(), self::MAX_LINHAS + 50);
        $letras = array_slice(['A', 'B', 'C', 'D', 'E', 'F'], 0, count($this->colunas()));

        $linhas = [];
        for ($linha = 1; $linha <= $ultimaLinha; $linha++) {
            $linhas[$linha - 1] = array_map(fn ($letra) => $aba->getCell($letra . $linha)->getValue(), $letras);
        }

        $planilha->disconnectWorksheets();

        return $linhas;
    }

    /**
     * Leitor escolhido pela extensão (nunca por detecção automática do conteúdo).
     */
    private function leitorPara(UploadedFile $arquivo): IReader
    {
        return match (strtolower($arquivo->getClientOriginalExtension())) {
            'xls'  => new Xls(),
            'xlsx' => new Xlsx(),
            'csv', 'txt' => tap(new Csv(), function (Csv $csv) {
                $csv->setDelimiter(null); // detecta ";" ou ","
                $csv->setInputEncoding(Csv::GUESS_ENCODING);
            }),
            default => throw new \InvalidArgumentException('Formato não suportado. Use .xls, .xlsx ou .csv.'),
        };
    }

    /**
     * Identifica as colunas pelo cabeçalho; sem cabeçalho, assume a ordem padrão.
     *
     * @return array{0: array<string,int>, 1: int}
     */
    private function mapearColunas(array $primeiraLinha): array
    {
        $normalizados = array_map(fn ($v) => $this->normalizar((string) $v), $primeiraLinha);
        $ordemPadrao = array_flip(array_keys($this->colunas()));
        $mapa = [];

        foreach ($this->colunas() as $chave => $nomes) {
            foreach ($normalizados as $posicao => $cabecalho) {
                if (in_array($cabecalho, $nomes, true)) {
                    $mapa[$chave] = $posicao;
                    break;
                }
            }
        }

        $temCabecalho = !array_diff($this->colunasObrigatorias(), array_keys($mapa));

        return $temCabecalho ? [$mapa + $ordemPadrao, 1] : [$ordemPadrao, 0];
    }

    protected function converterData(mixed $valor): ?string
    {
        if ($valor === null || $valor === '') {
            return null;
        }

        try {
            // Datas digitadas no Excel chegam como número serial.
            if (is_numeric($valor)) {
                $data = Carbon::instance(ExcelDate::excelToDateTimeObject((float) $valor));
            } else {
                $texto = trim((string) $valor);
                $data = null;
                foreach (['d/m/Y', 'd/m/y', 'Y-m-d', 'd-m-Y', 'd.m.Y'] as $formato) {
                    $tentativa = Carbon::createFromFormat('!' . $formato, $texto);
                    // Rejeita datas que "transbordam" (31/02 viraria 03/03).
                    if ($tentativa && $tentativa->format($formato) === $texto) {
                        $data = $tentativa;
                        break;
                    }
                }
            }
        } catch (\Throwable) {
            return null;
        }

        if (!$data || $data->year < 2000 || $data->year > 2100) {
            return null;
        }

        return $data->toDateString();
    }

    protected function converterValor(mixed $valor): ?float
    {
        if (is_int($valor) || is_float($valor)) {
            return round((float) $valor, 2);
        }

        $texto = preg_replace('/[R$\s\x{00A0}]/u', '', (string) $valor);
        if ($texto === '') {
            return null;
        }

        // Formato brasileiro: 1.234,56
        if (str_contains($texto, ',')) {
            $texto = str_replace(['.', ','], ['', '.'], $texto);
        }

        return is_numeric($texto) ? round((float) $texto, 2) : null;
    }

    /** Erros comuns de data e valor, na mesma redação para todas as importações. */
    protected function errosDataEValor(?string $data, ?float $valor): array
    {
        $erros = [];

        if (!$data) {
            $erros[] = 'Data inválida (use DD/MM/AAAA).';
        }

        if ($valor === null || $valor <= 0) {
            $erros[] = 'Valor inválido (deve ser maior que zero).';
        } elseif ($valor > 99_999_999.99) {
            $erros[] = 'Valor acima do permitido.';
        }

        return $erros;
    }

    protected function normalizar(string $texto): string
    {
        return Str::lower(Str::ascii(trim($texto)));
    }
}
