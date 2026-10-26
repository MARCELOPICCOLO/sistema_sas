<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderItemController;
use App\Http\Controllers\PartnerCompanyController;
use App\Http\Controllers\PartnerCompanyUserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TelaController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| Autenticação
|--------------------------------------------------------------------------
*/

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware(['auth:api', 'throttle:api'])->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    /*
    |--------------------------------------------------------------------------
    | Rotas da empresa atual
    |--------------------------------------------------------------------------
    | Todas exigem usuário ativo vinculado a uma empresa ativa ("company")
    | e acesso à tela (módulo) correspondente ("tela:<slug>").
    | Os dados são sempre filtrados pela empresa do usuário autenticado.
    */

    Route::middleware('company')->group(function () {

        // ========== PRODUTOS E CATEGORIAS ==========
        // Leitura também liberada para quem lança vendas.
        Route::middleware('tela:produtos,vendas')->group(function () {
            Route::get('/products', [ProductController::class, 'index']);
            Route::get('/products/code/{code}', [ProductController::class, 'findByCode']);
            Route::get('/products/{id}', [ProductController::class, 'show'])->whereNumber('id');
            Route::get('/categories', [CategoryController::class, 'index']);
            Route::get('/categories/{id}', [CategoryController::class, 'show'])->whereNumber('id');
        });

        Route::middleware('tela:produtos')->group(function () {
            Route::post('/products', [ProductController::class, 'store']);
            Route::post('/products/bulk-stock', [ProductController::class, 'bulkUpdateStock']);
            Route::put('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');
            Route::patch('/products/{id}/stock', [ProductController::class, 'updateStock'])->whereNumber('id');
            Route::delete('/products/{id}', [ProductController::class, 'destroy'])->whereNumber('id');

            Route::post('/categories', [CategoryController::class, 'store']);
            Route::put('/categories/{id}', [CategoryController::class, 'update'])->whereNumber('id');
            Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->whereNumber('id');
        });

        // ========== VENDAS (COMANDAS) ==========
        Route::middleware('tela:vendas')->group(function () {
            Route::get('/orders/by-date/{date}', [OrderController::class, 'byDate']);
            Route::get('/orders/{id}', [OrderController::class, 'show'])->whereNumber('id');
            Route::put('/orders/{id}', [OrderController::class, 'update'])->whereNumber('id');
            Route::post('/orders/{id}/close', [OrderController::class, 'close'])->whereNumber('id');
            Route::delete('/orders/{id}', [OrderController::class, 'destroy'])->whereNumber('id');

            Route::post('/order-items/order/{id}/item', [OrderItemController::class, 'store'])->whereNumber('id');
            Route::get('/order-items/{id}/items', [OrderItemController::class, 'getItems'])->whereNumber('id');
            Route::put('/order-items/{id}', [OrderItemController::class, 'updateItem'])->whereNumber('id');
            Route::delete('/order-items/{id}', [OrderItemController::class, 'destroy'])->whereNumber('id');
        });

        // Criação de comandas: vendas (PDV) e caixa (importação de vendas).
        Route::post('/orders', [OrderController::class, 'store'])->middleware('tela:vendas,caixa');

        // ========== CAIXA ==========
        Route::middleware('tela:caixa,gestao_relatorio')->group(function () {
            Route::get('/orders', [OrderController::class, 'index']);
            Route::post('/orders/summary', [OrderController::class, 'salesSummary']);
            Route::get('/orders/daily-summary', [OrderController::class, 'dailySummary']);
            Route::get('/expenses', [ExpenseController::class, 'index']);
            Route::get('/expenses/summary', [ExpenseController::class, 'summary']);
            Route::get('/expenses/monthly-summary', [ExpenseController::class, 'monthlySummary']);
            Route::get('/expense-categories', [ExpenseCategoryController::class, 'index']);
        });

        Route::middleware('tela:caixa')->group(function () {
            Route::post('/expenses', [ExpenseController::class, 'store']);
            Route::get('/expenses/import-template', [ExpenseController::class, 'importTemplate']);
            Route::post('/expenses/import', [ExpenseController::class, 'import']);
            Route::get('/orders/import-template', [OrderController::class, 'importTemplate']);
            Route::post('/orders/import', [OrderController::class, 'import']);
            Route::get('/expenses/{id}', [ExpenseController::class, 'show'])->whereNumber('id');
            Route::put('/expenses/{id}', [ExpenseController::class, 'update'])->whereNumber('id');
            Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy'])->whereNumber('id');

            Route::post('/expense-categories', [ExpenseCategoryController::class, 'store']);
            Route::get('/expense-categories/{id}', [ExpenseCategoryController::class, 'show'])->whereNumber('id');
            Route::put('/expense-categories/{id}', [ExpenseCategoryController::class, 'update'])->whereNumber('id');
            Route::delete('/expense-categories/{id}', [ExpenseCategoryController::class, 'destroy'])->whereNumber('id');
        });

        // ========== RELATÓRIOS ==========
        Route::middleware('tela:gestao_relatorio')->group(function () {
            Route::get('/orders/reports/entries', [OrderController::class, 'reportEntries']);
            Route::get('/order-items/products-summary', [OrderItemController::class, 'productsSummary']);
            Route::get('/order-items/products-summary/filtered', [OrderItemController::class, 'productsSummaryWithFilters']);
        });

        // ========== EQUIPE ==========
        Route::middleware('tela:gestao_equipe')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::get('/users/{id}', [UserController::class, 'show'])->whereNumber('id');
            Route::put('/users/{id}', [UserController::class, 'update'])->whereNumber('id');
            Route::delete('/users/{id}', [UserController::class, 'destroy'])->whereNumber('id');
            Route::patch('/partner-company-users/{id}/deactivate', [UserController::class, 'toggleStatus'])->whereNumber('id');

            Route::get('/telas', [TelaController::class, 'ativas']);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Administração da plataforma (somente master)
    |--------------------------------------------------------------------------
    */

    Route::middleware('master')->prefix('admin')->group(function () {
        Route::apiResource('partner-companies', PartnerCompanyController::class)
            ->parameters(['partner-companies' => 'id']);
        Route::patch('partner-companies/{id}/status', [PartnerCompanyController::class, 'toggleStatus'])->whereNumber('id');
        Route::apiResource('partner-company-users', PartnerCompanyUserController::class)
            ->parameters(['partner-company-users' => 'id']);
        Route::apiResource('telas', TelaController::class);
    });
});
