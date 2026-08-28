<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\PartnerCompanyController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PartnerCompanyUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderItemController;

/*
|--------------------------------------------------------------------------
| Rotas públicas
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

/*
|--------------------------------------------------------------------------
| Rotas protegidas por JWT
|--------------------------------------------------------------------------
*/

Route::middleware('auth:api')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Rotas para produtos
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);           // Listar
        Route::get('/code/{code}', [ProductController::class, 'findByCode']); // Buscar por código
        Route::post('/', [ProductController::class, 'store']);          // Criar
        Route::get('/{id}', [ProductController::class, 'show']);        // Mostrar
        Route::put('/{id}', [ProductController::class, 'update']);      // Atualizar
        Route::delete('/{id}', [ProductController::class, 'destroy']);  // Deletar
        Route::patch('/{id}/stock', [ProductController::class, 'updateStock']); // Atualizar estoque
    });

    // ========== CATEGORIAS ==========
    Route::apiResource('categories', CategoryController::class);

    // ========== MESAS ==========
    // API Resource já cria: index, store, show, update, destroy
    Route::apiResource('tables', TableController::class);
    // Rota adicional para listar comandas de uma mesa específica
    Route::get('/tables/{tableId}/orders', [OrderController::class, 'getByTable']);

    // ========== COMANDAS (ORDERS) ==========
    Route::prefix('orders')->group(function () {

        Route::post('/summary', [OrderController::class, 'salesSummary']);

        // Resumo diário do caixa
        Route::get('/daily-summary', [OrderController::class, 'dailySummary']);

        // Transações de um dia específico
        Route::get('/by-date/{date}', [OrderController::class, 'byDate']);

        // Relatório de entradas por ano
        Route::get('/reports/entries', [OrderController::class, 'reportEntries']);
        Route::put('/{id}', [OrderController::class, 'update']);

        Route::get('/', [OrderController::class, 'index']);
        Route::get('/{id}', [OrderController::class, 'show']);
        Route::post('/', [OrderController::class, 'store']);
        Route::delete('/{id}', [OrderController::class, 'destroy']);
        Route::post('/{id}/close', [OrderController::class, 'close']);
    });

    // ========== ORDER ITEMS ==========
    Route::prefix('order-items/')->group(function () {
        Route::put('/{id}', [OrderItemController::class, 'updateItem']);
        Route::delete('/{id}', [OrderItemController::class, 'destroy']);
        Route::post('order/{id}/item', [OrderItemController::class, 'store']);
        Route::get('/{id}/items', [OrderItemController::class, 'getItems']);
        Route::get('/products-summary', [OrderItemController::class, 'productsSummary']);
        Route::get('/products-summary/filtered', [OrderItemController::class, 'productsSummaryWithFilters']);
    });

    // ========== GASTOS (EXPENSES) ==========
    Route::prefix('expenses')->group(function () {
        Route::get('/', [ExpenseController::class, 'index']);           // Listar gastos
        Route::get('/summary', [ExpenseController::class, 'summary']);  // Resumo do dia
        Route::get('/monthly-summary', [ExpenseController::class, 'monthlySummary']); // Resumo do mês
        Route::post('/', [ExpenseController::class, 'store']);          // Criar gasto
        Route::get('/{id}', [ExpenseController::class, 'show']);        // Mostrar gasto
        Route::put('/{id}', [ExpenseController::class, 'update']);      // Atualizar gasto
        Route::delete('/{id}', [ExpenseController::class, 'destroy']);  // Deletar gasto
        Route::post('/import-csv', [ExpenseController::class, 'importCsv']); // Importar gasto
    });


    Route::prefix('expense-categories')->group(function () {
        Route::get('/', [ExpenseCategoryController::class, 'index']);
        Route::post('/', [ExpenseCategoryController::class, 'store']);
        Route::get('/{id}', [ExpenseCategoryController::class, 'show']);
        Route::put('/{id}', [ExpenseCategoryController::class, 'update']);
        Route::delete('/{id}', [ExpenseCategoryController::class, 'destroy']);
        Route::post('/products/bulk-stock', [ProductController::class, 'bulkUpdateStock']);
    });

    // ========== EMPRESAS PARCEIRAS ==========
    Route::prefix('partner-companies')->group(function () {
        Route::get('/', [PartnerCompanyController::class, 'index']);         // Listar
        Route::post('/', [PartnerCompanyController::class, 'store']);        // Cadastrar
        Route::get('/{id}', [PartnerCompanyController::class, 'show']);      // Buscar por ID
        Route::put('/{id}', [PartnerCompanyController::class, 'update']);    // Atualizar
        Route::delete('/{id}', [PartnerCompanyController::class, 'destroy']); // Excluir
    });

    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('{id}', [UserController::class, 'show']);
        Route::put('{id}', [UserController::class, 'update']);
        Route::delete('{id}', [UserController::class, 'destroy']);
    });

    Route::prefix('partner-company-users')->group(function () {
        Route::get('/', [PartnerCompanyUserController::class, 'index']);
        Route::post('/', [PartnerCompanyUserController::class, 'store']);
        Route::get('{id}', [PartnerCompanyUserController::class, 'show']);
        Route::put('{id}', [PartnerCompanyUserController::class, 'update']);
        Route::patch('{id}/deactivate', [PartnerCompanyUserController::class, 'deactivate']);
    });
});
