<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Xls as XlsReader;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Tests\TestCase;

class ExpenseImportTest extends TestCase
{
    /** Cria um arquivo .xls/.xlsx com as linhas informadas (primeira = cabeçalho). */
    private function planilha(array $linhas, string $formato = 'Xls'): UploadedFile
    {
        $planilha = new Spreadsheet();
        $planilha->getActiveSheet()->fromArray($linhas, null, 'A1', true);

        $caminho = tempnam(sys_get_temp_dir(), 'imp');
        IOFactory::createWriter($planilha, $formato)->save($caminho);

        return new UploadedFile($caminho, 'gastos.' . strtolower($formato), null, null, true);
    }

    public function test_template_is_a_real_xls_with_company_categories(): void
    {
        $company = $this->createCompany();
        $outra = $this->createCompany();
        ExpenseCategory::create(['partner_company_id' => $company->id, 'name' => 'Energia']);
        ExpenseCategory::create(['partner_company_id' => $company->id, 'name' => 'Aluguel']);
        ExpenseCategory::create(['partner_company_id' => $outra->id, 'name' => 'Segredo da outra']);

        $this->actingAsApi($this->createUser($company, 'USER', ['caixa']));

        $resposta = $this->get('/api/expenses/import-template', ['Accept' => 'application/json'])
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.ms-excel');

        $this->assertStringContainsString('modelo-importacao-gastos.xls', $resposta->headers->get('Content-Disposition'));

        $caminho = tempnam(sys_get_temp_dir(), 'tpl');
        file_put_contents($caminho, $resposta->getContent());

        // Lê de volta como BIFF (.xls de verdade)
        $planilha = (new XlsReader())->load($caminho);

        $this->assertSame(['Gastos', 'Categorias', 'Instruções'], $planilha->getSheetNames());
        $this->assertSame(['Data', 'Descrição', 'Valor', 'Categoria'], $planilha->getSheet(0)->rangeToArray('A1:D1')[0]);

        $categorias = array_column($planilha->getSheet(1)->rangeToArray('A2:A10'), 0);
        $this->assertContains('Aluguel', $categorias);
        $this->assertContains('Energia', $categorias);
        $this->assertNotContains('Segredo da outra', $categorias);
    }

    public function test_dry_run_validates_each_row_without_saving(): void
    {
        $company = $this->createCompany();
        $energia = ExpenseCategory::create(['partner_company_id' => $company->id, 'name' => 'Energia Elétrica']);
        $outra = ExpenseCategory::create(['partner_company_id' => $this->createCompany()->id, 'name' => 'Alheia']);

        $this->actingAsApi($this->createUser($company, 'USER', ['caixa']));

        $arquivo = $this->planilha([
            ['Data', 'Descrição', 'Valor', 'Categoria'],
            [ExcelDate::PHPToExcel(new \DateTime('2026-05-10')), 'Conta de luz', 432.15, 'energia eletrica'], // nome sem acento/maiúscula
            ['11/05/2026', 'Por ID', '1.234,56', (string) $energia->id],
            ['31/02/2026', 'Data inválida', 10, 'Energia Elétrica'],
            ['12/05/2026', '', 10, 'Energia Elétrica'],
            ['12/05/2026', 'Valor zero', 0, 'Energia Elétrica'],
            ['12/05/2026', 'Categoria de outra empresa', 10, (string) $outra->id],
            ['12/05/2026', 'Sem categoria e sem padrão', 10, ''],
            [null, null, null, null], // linha vazia é ignorada
        ]);

        $resposta = $this->post('/api/expenses/import', ['file' => $arquivo, 'dry_run' => 1], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('summary.total', 7)
            ->assertJsonPath('summary.valid', 2)
            ->assertJsonPath('summary.invalid', 5);

        $linhas = collect($resposta->json('rows'))->keyBy('line');

        $this->assertSame('2026-05-10', $linhas[2]['date']);
        $this->assertSame($energia->id, $linhas[2]['category_id']);
        $this->assertEquals(1234.56, $linhas[3]['amount']);
        $this->assertNotEmpty($linhas[4]['errors']);
        $this->assertNotEmpty($linhas[5]['errors']);
        $this->assertNotEmpty($linhas[6]['errors']);
        $this->assertStringContainsString('não encontrada', $linhas[7]['errors'][0]);
        $this->assertStringContainsString('Categoria em branco', $linhas[8]['errors'][0]);

        $this->assertSame(0, Expense::count());
    }

    public function test_import_saves_only_valid_rows_and_uses_default_category(): void
    {
        $company = $this->createCompany();
        $padrao = ExpenseCategory::create(['partner_company_id' => $company->id, 'name' => 'Diversos']);
        ExpenseCategory::create(['partner_company_id' => $company->id, 'name' => 'Frete']);

        $this->actingAsApi($this->createUser($company, 'USER', ['caixa']));

        $arquivo = $this->planilha([
            ['Data', 'Descrição', 'Valor', 'Categoria'],
            ['01/06/2026', 'Sem categoria', 50, ''],
            ['02/06/2026', 'Frete', 80, 'Frete'],
            ['03/06/2026', 'Inválida', -5, 'Frete'],
        ], 'Xlsx');

        $this->post('/api/expenses/import', ['file' => $arquivo, 'default_category_id' => $padrao->id], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('imported', 2)
            ->assertJsonPath('skipped.0.line', 4);

        $this->assertSame(2, Expense::where('partner_company_id', $company->id)->count());
        $this->assertSame('Diversos', Expense::where('description', 'Sem categoria')->first()->category->name);
    }

    public function test_import_requires_caixa_access_and_valid_file(): void
    {
        $company = $this->createCompany();

        $this->actingAsApi($this->createUser($company, 'USER', ['vendas']));
        $this->get('/api/expenses/import-template', ['Accept' => 'application/json'])->assertForbidden();

        $this->actingAsApi($this->createUser($company, 'USER', ['caixa']));

        $this->post('/api/expenses/import', [
            'file' => UploadedFile::fake()->createWithContent('gastos.pdf', '%PDF'),
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('file');

        // Arquivo com extensão .xls mas conteúdo inválido
        $this->post('/api/expenses/import', [
            'file' => UploadedFile::fake()->createWithContent('gastos.xls', 'isto não é uma planilha'),
        ], ['Accept' => 'application/json'])->assertStatus(422);

        // Categoria padrão de outra empresa é rejeitada
        $alheia = ExpenseCategory::create(['partner_company_id' => $this->createCompany()->id, 'name' => 'X']);
        $this->post('/api/expenses/import', [
            'file' => $this->planilha([['Data', 'Descrição', 'Valor'], ['01/06/2026', 'A', 1]]),
            'default_category_id' => $alheia->id,
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('default_category_id');
    }
}
