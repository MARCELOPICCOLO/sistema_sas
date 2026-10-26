<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Gera o modelo de planilha (.xls) para importação de vendas.
 *
 * Abas: "Vendas" (a preencher, com exemplos e lista suspensa das formas de
 * pagamento) e "Instruções".
 */
class SalesImportTemplate
{
    use MontaPlanilhaModelo;

    public function gerar(): string
    {
        $planilha = $this->novaPlanilha('Modelo de importação de vendas');

        $aba = $planilha->getActiveSheet();
        $aba->setTitle('Vendas');
        $aba->fromArray(['Data', 'Cliente', 'Valor', 'Pagamento'], null, 'A1');
        $this->estilizarCabecalho($aba, 'A1:D1');

        $hoje = new \DateTimeImmutable('today');
        $exemplos = [
            [$hoje->modify('-2 days'), 'Maria Souza', 150.00, 'Pix'],
            [$hoje->modify('-1 day'), 'João Silva', 89.90, 'Crédito'],
            [$hoje, '', 42.50, 'Dinheiro'],
        ];

        foreach ($exemplos as $i => [$data, $cliente, $valor, $pagamento]) {
            $linha = $i + 2;
            $aba->setCellValue("A{$linha}", ExcelDate::PHPToExcel($data));
            $aba->setCellValue("B{$linha}", $cliente);
            $aba->setCellValue("C{$linha}", $valor);
            $aba->setCellValue("D{$linha}", $pagamento);
        }

        $ultima = $this->linhasPreparadas + 1;
        $aba->getStyle("A2:A{$ultima}")->getNumberFormat()->setFormatCode('dd/mm/yyyy');
        $aba->getStyle("C2:C{$ultima}")->getNumberFormat()->setFormatCode('#,##0.00');
        $this->marcarExemplos($aba, 'A2:D4');

        $validacao = new DataValidation();
        $validacao->setType(DataValidation::TYPE_LIST)
            ->setAllowBlank(true)
            ->setShowDropDown(true)
            ->setShowErrorMessage(true)
            ->setErrorStyle(DataValidation::STYLE_WARNING)
            ->setErrorTitle('Forma de pagamento')
            ->setError('Use Dinheiro, Pix, Crédito, Débito ou Pendente.')
            ->setFormula1('"' . implode(',', SalesImport::PAGAMENTOS) . '"');
        $aba->setDataValidation("D2:D{$ultima}", $validacao);

        $this->larguras($aba, ['A' => 14, 'B' => 36, 'C' => 14, 'D' => 18]);
        $aba->freezePane('A2');

        $this->abaInstrucoes($planilha, 'Como preencher a planilha de vendas', [
            'Preencha a aba "Vendas", uma linha por venda. Apague as 3 linhas de exemplo.',
            'Data: no formato DD/MM/AAAA (ex.: 05/01/2026).',
            'Cliente: opcional. Em branco, a venda fica como "Cliente".',
            'Valor: total da venda, maior que zero (ex.: 1234,56). Não use "R$".',
            'Pagamento: Dinheiro, Pix, Crédito, Débito ou Pendente (venda ainda não paga). Em branco, será usada a forma padrão escolhida na importação.',
            'As vendas entram como já finalizadas, sem itens, na data informada.',
            'Não altere a ordem nem os nomes das colunas do cabeçalho.',
            'Limite de 1.000 vendas por arquivo.',
        ]);

        return $this->emXls($planilha);
    }
}
