<?php

namespace App\Services;

use App\Models\ExpenseCategory;
use Illuminate\Support\Collection;

/**
 * Lê e valida uma planilha de gastos.
 *
 * Colunas: Data | Descrição | Valor | Categoria.
 * A categoria pode ser o nome (sem diferenciar maiúsculas/acentos) ou o ID
 * de uma categoria da empresa; em branco, usa a categoria padrão informada.
 */
class ExpenseImport extends PlanilhaImport
{
    /** @var Collection<int, ExpenseCategory> */
    private Collection $categorias;

    public function __construct(int $companyId, private ?int $categoriaPadraoId = null)
    {
        $this->categorias = ExpenseCategory::where('partner_company_id', $companyId)->get(['id', 'name']);
    }

    protected function colunas(): array
    {
        return [
            'data'      => ['data', 'date', 'data do gasto'],
            'descricao' => ['descricao', 'description', 'historico'],
            'valor'     => ['valor', 'amount', 'total', 'valor (r$)'],
            'categoria' => ['categoria', 'category'],
        ];
    }

    protected function colunasObrigatorias(): array
    {
        return ['data', 'descricao', 'valor'];
    }

    protected function validarLinha(int $linha, array $valores): array
    {
        $data = $this->converterData($valores['data']);
        $valor = $this->converterValor($valores['valor']);
        $erros = $this->errosDataEValor($data, $valor);

        $descricao = trim((string) $valores['descricao']);
        if ($descricao === '') {
            $erros[] = 'Descrição em branco.';
        } elseif (mb_strlen($descricao) > 255) {
            $erros[] = 'Descrição com mais de 255 caracteres.';
        }

        [$categoriaId, $categoriaNome, $erroCategoria] = $this->resolverCategoria($valores['categoria']);
        if ($erroCategoria) {
            $erros[] = $erroCategoria;
        }

        return [
            'line'          => $linha,
            'date'          => $data,
            'description'   => $descricao,
            'amount'        => $valor,
            'category_id'   => $categoriaId,
            'category_name' => $categoriaNome,
            'errors'        => $erros,
        ];
    }

    /**
     * @return array{0:?int, 1:?string, 2:?string} [id, nome, erro]
     */
    private function resolverCategoria(mixed $valor): array
    {
        $texto = trim((string) $valor);

        if ($texto === '') {
            $padrao = $this->categoriaPadraoId ? $this->categorias->firstWhere('id', $this->categoriaPadraoId) : null;

            return $padrao
                ? [$padrao->id, $padrao->name, null]
                : [null, null, 'Categoria em branco (escolha uma categoria padrão).'];
        }

        $encontrada = ctype_digit($texto)
            ? $this->categorias->firstWhere('id', (int) $texto)
            : $this->categorias->first(fn ($c) => $this->normalizar($c->name) === $this->normalizar($texto));

        return $encontrada
            ? [$encontrada->id, $encontrada->name, null]
            : [null, null, "Categoria \"{$texto}\" não encontrada."];
    }
}
