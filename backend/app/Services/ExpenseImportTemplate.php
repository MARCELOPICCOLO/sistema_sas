<?php

namespace App\Services;

use App\Models\ExpenseCategory;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Gera o modelo de planilha (.xls) para importação de gastos.
 *
 * Abas: "Gastos" (a preencher, com exemplos), "Categorias" (as da empresa,
 * usadas na lista suspensa da coluna Categoria) e "Instruções".
 */
class ExpenseImportTemplate
{
    use MontaPlanilhaModelo;

    public function gerar(int $companyId): string
    {
        $categorias = ExpenseCategory::where('partner_company_id', $companyId)
            ->orderBy('name')
            ->pluck('name')
            ->all();

        $planilha = $this->novaPlanilha('Modelo de importação de gastos');

        $gastos = $planilha->getActiveSheet();
        $gastos->setTitle('Gastos');
        $this->montarGastos($gastos, $categorias);

        $abaCategorias = $planilha->createSheet();
        $abaCategorias->setTitle('Categorias');
        $this->montarCategorias($abaCategorias, $categorias);

        $this->abaInstrucoes($planilha, 'Como preencher a planilha de gastos', [
            'Preencha a aba "Gastos", uma linha por gasto. Apague as 3 linhas de exemplo.',
            'Data: no formato DD/MM/AAAA (ex.: 05/01/2026).',
            'Descrição: texto livre, até 255 caracteres.',
            'Valor: número maior que zero (ex.: 1234,56). Não use "R$".',
            'Categoria: escolha na lista. Em branco, será usada a categoria padrão escolhida na importação.',
            'Não altere a ordem nem os nomes das colunas do cabeçalho.',
            'Limite de 1.000 gastos por arquivo.',
        ]);

        return $this->emXls($planilha);
    }

    private function montarGastos(Worksheet $aba, array $categorias): void
    {
        $aba->fromArray(['Data', 'Descrição', 'Valor', 'Categoria'], null, 'A1');
        $this->estilizarCabecalho($aba, 'A1:D1');

        $exemplo = $categorias[0] ?? '';
        $hoje = new \DateTimeImmutable('today');
        $exemplos = [
            [$hoje->modify('-2 days'), 'Compra de material de escritório', 89.90, $exemplo],
            [$hoje->modify('-1 day'), 'Conta de energia', 432.15, $categorias[1] ?? $exemplo],
            [$hoje, 'Frete de mercadorias', 150.00, $exemplo],
        ];

        foreach ($exemplos as $i => [$data, $descricao, $valor, $categoria]) {
            $linha = $i + 2;
            $aba->setCellValue("A{$linha}", ExcelDate::PHPToExcel($data));
            $aba->setCellValue("B{$linha}", $descricao);
            $aba->setCellValue("C{$linha}", $valor);
            $aba->setCellValue("D{$linha}", $categoria);
        }

        $ultima = $this->linhasPreparadas + 1;
        $aba->getStyle("A2:A{$ultima}")->getNumberFormat()->setFormatCode('dd/mm/yyyy');
        $aba->getStyle("C2:C{$ultima}")->getNumberFormat()->setFormatCode('#,##0.00');
        $this->marcarExemplos($aba, 'A2:D4');

        if ($categorias) {
            $validacao = new DataValidation();
            $validacao->setType(DataValidation::TYPE_LIST)
                ->setAllowBlank(true)
                ->setShowDropDown(true)
                ->setShowErrorMessage(true)
                ->setErrorStyle(DataValidation::STYLE_WARNING)
                ->setErrorTitle('Categoria não cadastrada')
                ->setError('Escolha uma categoria da lista (aba "Categorias").')
                ->setFormula1('Categorias!$A$2:$A$' . (count($categorias) + 1));

            $aba->setDataValidation("D2:D{$ultima}", $validacao);
        }

        $this->larguras($aba, ['A' => 14, 'B' => 44, 'C' => 14, 'D' => 26]);
        $aba->freezePane('A2');
    }

    private function montarCategorias(Worksheet $aba, array $categorias): void
    {
        $aba->setCellValue('A1', 'Categorias cadastradas');
        $this->estilizarCabecalho($aba, 'A1');

        if (!$categorias) {
            $aba->setCellValue('A2', 'Nenhuma categoria cadastrada. Cadastre em Caixa > Categorias.');
        }

        foreach ($categorias as $i => $nome) {
            $aba->setCellValue('A' . ($i + 2), $nome);
        }

        $aba->getColumnDimension('A')->setWidth(40);
    }
}
