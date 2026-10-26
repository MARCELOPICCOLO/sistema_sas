<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xls;

/**
 * Partes comuns dos modelos de planilha (.xls) de importação.
 */
trait MontaPlanilhaModelo
{
    /** Linhas da aba principal que recebem formato e lista suspensa. */
    private int $linhasPreparadas = 500;

    private function novaPlanilha(string $titulo): Spreadsheet
    {
        $planilha = new Spreadsheet();
        $planilha->getProperties()->setTitle($titulo)->setCreator('Nexo');

        return $planilha;
    }

    /** Gera o binário .xls (Excel 97-2003) e libera a memória da planilha. */
    private function emXls(Spreadsheet $planilha): string
    {
        $planilha->setActiveSheetIndex(0);

        ob_start();
        (new Xls($planilha))->save('php://output');
        $conteudo = (string) ob_get_clean();

        $planilha->disconnectWorksheets();

        return $conteudo;
    }

    private function estilizarCabecalho(Worksheet $aba, string $intervalo): void
    {
        $estilo = $aba->getStyle($intervalo);
        $estilo->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $estilo->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('2563EB');
        $estilo->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
        $estilo->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('1E40AF');
        $aba->getRowDimension(1)->setRowHeight(22);
    }

    /** Linhas de exemplo em itálico cinza, para o usuário saber que pode apagá-las. */
    private function marcarExemplos(Worksheet $aba, string $intervalo): void
    {
        $aba->getStyle($intervalo)->getFont()->setItalic(true)->getColor()->setRGB('64748B');
    }

    /** @param string[] $passos */
    private function abaInstrucoes(Spreadsheet $planilha, string $titulo, array $passos): void
    {
        $aba = $planilha->createSheet();
        $aba->setTitle('Instruções');

        $linhas = [[$titulo], ['']];
        foreach ($passos as $i => $passo) {
            $linhas[] = [($i + 1) . '. ' . $passo];
        }

        $aba->fromArray($linhas, null, 'A1');
        $aba->getStyle('A1')->getFont()->setBold(true)->setSize(13)->getColor()->setRGB('1D4ED8');
        $aba->getColumnDimension('A')->setWidth(100);
    }

    /** @param array<string, int> $larguras */
    private function larguras(Worksheet $aba, array $larguras): void
    {
        foreach ($larguras as $coluna => $largura) {
            $aba->getColumnDimension($coluna)->setWidth($largura);
        }
    }
}
