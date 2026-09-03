<?php

namespace App\Http\Controllers;

use App\Models\Tela;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TelaController extends Controller
{
    /**
     * Lista todas as telas.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tela::query();

        // Filtro por status
        if ($request->has('ativo')) {
            $query->where('ativo', $request->boolean('ativo'));
        }

        // Busca por nome, slug ou descrição
        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('nome', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('descricao', 'like', "%{$search}%");
            });
        }

        $telas = $query
            ->orderBy('nome')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $telas,
        ]);
    }

    /**
     * Cria uma nova tela.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome' => [
                'required',
                'string',
                'max:255',
            ],
            'slug' => [
                'required',
                'string',
                'max:255',
                'unique:telas,slug',
            ],
            'descricao' => [
                'nullable',
                'string',
            ],
            'ativo' => [
                'nullable',
                'boolean',
            ],
        ]);

        $tela = Tela::create([
            'nome' => $validated['nome'],
            'slug' => $validated['slug'],
            'descricao' => $validated['descricao'] ?? null,
            'ativo' => $validated['ativo'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tela criada com sucesso.',
            'data' => $tela,
        ], 201);
    }

    /**
     * Exibe uma tela específica.
     */
    public function show(Tela $tela): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $tela,
        ]);
    }

    /**
     * Atualiza uma tela.
     */
    public function update(Request $request, Tela $tela): JsonResponse
    {
        $validated = $request->validate([
            'nome' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('telas', 'slug')->ignore($tela->id),
            ],
            'descricao' => [
                'nullable',
                'string',
            ],
            'ativo' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $tela->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tela atualizada com sucesso.',
            'data' => $tela->fresh(),
        ]);
    }

    /**
     * Remove uma tela.
     */
    public function destroy(Tela $tela): JsonResponse
    {
        // Remove os vínculos com usuários antes de excluir a tela.
        $tela->usuarios()->detach();

        $tela->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tela removida com sucesso.',
        ]);
    }

    /**
     * Lista somente as telas ativas.
     *
     * Esse endpoint será utilizado pela gestão
     * de usuários/equipes para carregar as telas
     * disponíveis para atribuição.
     */
    public function ativas(): JsonResponse
    {
        $telas = Tela::query()
            ->where('ativo', true)
            ->orderBy('nome')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $telas,
        ]);
    }
}
