<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Xls as XlsReader;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Tests\TestCase;

class SalesImportTest extends TestCase
{
    private function planilha(array $linhas, string $formato = 'Xls'): UploadedFile
    {
        $planilha = new Spreadsheet();
        $planilha->getActiveSheet()->fromArray($linhas, null, 'A1', true);

        $caminho = tempnam(sys_get_temp_dir(), 'vnd');
        IOFactory::createWriter($planilha, $formato)->save($caminho);

        return new UploadedFile($caminho, 'vendas.' . strtolower($formato), null, null, true);
    }

    public function test_template_is_a_real_xls(): void
    {
        $this->actingAsApi($this->createUser($this->createCompany(), 'USER', ['caixa']));

        $resposta = $this->get('/api/orders/import-template', ['Accept' => 'application/json'])
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.ms-excel');

        $this->assertStringContainsString('modelo-importacao-vendas.xls', $resposta->headers->get('Content-Disposition'));

        $caminho = tempnam(sys_get_temp_dir(), 'tpl');
        file_put_contents($caminho, $resposta->getContent());
        $planilha = (new XlsReader())->load($caminho);

        $this->assertSame(['Vendas', 'Instruções'], $planilha->getSheetNames());
        $this->assertSame(['Data', 'Cliente', 'Valor', 'Pagamento'], $planilha->getSheet(0)->rangeToArray('A1:D1')[0]);
    }

    public function test_dry_run_recognizes_payment_variations_and_reports_errors(): void
    {
        $this->actingAsApi($this->createUser($this->createCompany(), 'USER', ['caixa']));

        $arquivo = $this->planilha([
            ['Data', 'Cliente', 'Valor', 'Pagamento'],
            ['10/05/2026', 'Maria', 150, 'PIX'],
            ['10/05/2026', '', '1.234,56', 'Cartão de crédito'],
            ['11/05/2026', 'José', 30, 'fiado'],
            ['32/05/2026', 'Data ruim', 10, 'Pix'],
            ['12/05/2026', 'Sem valor', '', 'Pix'],
            ['12/05/2026', 'Forma estranha', 10, 'Cheque'],
            ['12/05/2026', 'Sem forma', 10, ''],
        ]);

        $resposta = $this->post('/api/orders/import', ['file' => $arquivo, 'dry_run' => 1], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('summary.total', 7)
            ->assertJsonPath('summary.valid', 3)
            ->assertJsonPath('summary.invalid', 4);

        $linhas = collect($resposta->json('rows'))->keyBy('line');

        $this->assertSame('pix', $linhas[2]['payment_method']);
        $this->assertSame('credito', $linhas[3]['payment_method']);
        $this->assertSame('Cliente', $linhas[3]['customer_name']);
        $this->assertEquals(1234.56, $linhas[3]['amount']);
        $this->assertSame('pendente', $linhas[4]['payment_method']);
        $this->assertNotEmpty($linhas[5]['errors']);
        $this->assertNotEmpty($linhas[6]['errors']);
        $this->assertStringContainsString('não reconhecida', $linhas[7]['errors'][0]);
        $this->assertStringContainsString('em branco', $linhas[8]['errors'][0]);

        $this->assertSame(0, Order::count());
    }

    public function test_import_creates_closed_sales_with_sequential_numbers(): void
    {
        $company = $this->createCompany();
        $this->actingAsApi($this->createUser($company, 'USER', ['caixa']));

        // Venda que já existia: a numeração continua a partir dela
        Order::create(['partner_company_id' => $company->id, 'command_number' => 7, 'status' => 'aberto', 'total' => 0, 'order_date' => '2026-05-01']);

        $arquivo = $this->planilha([
            ['Data', 'Cliente', 'Valor', 'Pagamento'],
            ['10/05/2026', 'Maria', 150, 'Pix'],
            ['10/05/2026', 'Sem forma', 80, ''],
            ['11/05/2026', 'Fiado', 30, 'Pendente'],
            ['11/05/2026', 'Inválida', -1, 'Pix'],
        ], 'Xlsx');

        $this->post('/api/orders/import', ['file' => $arquivo, 'default_payment_method' => 'dinheiro'], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('imported', 3)
            ->assertJsonPath('skipped.0.line', 5);

        $importadas = Order::where('partner_company_id', $company->id)->where('command_number', '>', 7)->orderBy('command_number')->get();

        $this->assertSame([8, 9, 10], $importadas->pluck('command_number')->all());
        $this->assertSame(['fechado', 'fechado', 'pendente'], $importadas->pluck('status')->all());
        $this->assertSame(['pix', 'dinheiro', 'pendente'], $importadas->pluck('payment_method')->all());
        $this->assertSame('2026-05-10', $importadas[0]->closed_at->toDateString());

        // Entram no resumo do caixa do dia (só as pagas)
        $this->getJson('/api/orders/daily-summary?start_date=2026-05-10&end_date=2026-05-10')
            ->assertOk()
            ->assertJsonPath('0.total_entradas', 230);
    }

    public function test_import_requires_caixa_access_and_valid_payment(): void
    {
        $company = $this->createCompany();

        $this->actingAsApi($this->createUser($company, 'USER', ['vendas']));
        $this->get('/api/orders/import-template', ['Accept' => 'application/json'])->assertForbidden();
        $this->post('/api/orders/import', [
            'file' => $this->planilha([['Data', 'Cliente', 'Valor', 'Pagamento'], ['10/05/2026', 'A', 1, 'Pix']]),
        ], ['Accept' => 'application/json'])->assertForbidden();

        $this->actingAsApi($this->createUser($company, 'USER', ['caixa']));
        $this->post('/api/orders/import', [
            'file' => $this->planilha([['Data', 'Cliente', 'Valor', 'Pagamento'], ['10/05/2026', 'A', 1, '']]),
            'default_payment_method' => 'cheque',
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('default_payment_method');
    }
}
