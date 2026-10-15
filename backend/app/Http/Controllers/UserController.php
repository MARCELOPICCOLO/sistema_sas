<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Lista os usuários da empresa atual, exceto o usuário autenticado.
     */
    public function index()
    {
        $companyId = CurrentCompany::id();

        $usuarios = $this->companyUsersQuery()
            ->where('users.id', '!=', Auth::guard('api')->id())
            ->with('telas:id,nome,slug,descricao,ativo')
            ->orderBy('full_name')
            ->get()
            ->map(fn (User $usuario) => $this->present($usuario, $companyId));

        return response()->json($usuarios);
    }

    public function store(Request $request)
    {
        $companyId = CurrentCompany::id();

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'username'  => ['required', 'string', 'max:255', 'regex:/^\S+$/', 'unique:users,username'],
            'email'     => 'required|email|max:255|unique:users,email',
            'contact'   => 'nullable|string|max:20',
            'password'  => ['required', 'string', Password::min(6)],
            'role'      => 'required|in:ADMIN,USER',
            'telas'     => 'nullable|array',
            'telas.*'   => ['integer', Rule::exists('telas', 'id')->where('ativo', true)],
        ]);

        if (!CurrentCompany::isAdmin() && $validated['role'] !== 'USER') {
            return $this->forbidden('Somente administradores podem criar usuários administradores.');
        }

        $usuario = DB::transaction(function () use ($validated, $companyId) {
            $usuario = User::create([
                'full_name' => $validated['full_name'],
                'username'  => $validated['username'],
                'email'     => $validated['email'],
                'contact'   => $validated['contact'] ?? null,
                'password'  => Hash::make($validated['password']),
                'active'    => true,
                'is_master' => false,
            ]);

            $usuario->partnerCompanies()->attach($companyId, [
                'role'   => $validated['role'],
                'active' => true,
            ]);

            $usuario->telas()->sync($validated['telas'] ?? []);

            return $usuario;
        });

        $usuario->load('telas:id,nome,slug,descricao,ativo');

        return response()->json([
            'message'  => 'Usuário cadastrado com sucesso.',
            'user'     => $this->present($usuario, $companyId),
            'tela_ids' => $usuario->telas->pluck('id')->values(),
        ], 201);
    }

    public function show(int $id)
    {
        $companyId = CurrentCompany::id();

        $usuario = $this->companyUsersQuery()
            ->with('telas:id,nome,slug,descricao,ativo')
            ->findOrFail($id);

        return response()->json($this->present($usuario, $companyId));
    }

    public function update(Request $request, int $id)
    {
        $companyId = CurrentCompany::id();
        $usuario = $this->companyUsersQuery()->findOrFail($id);

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'username'  => ['required', 'string', 'max:255', 'regex:/^\S+$/', Rule::unique('users', 'username')->ignore($usuario->id)],
            'email'     => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($usuario->id)],
            'contact'   => 'nullable|string|max:20',
            'password'  => ['nullable', 'string', Password::min(6)],
            'role'      => 'required|in:ADMIN,USER',
            'telas'     => 'nullable|array',
            'telas.*'   => ['integer', Rule::exists('telas', 'id')->where('ativo', true)],
        ]);

        if ($error = $this->guardManagement($usuario, $companyId, $validated['role'])) {
            return $error;
        }

        DB::transaction(function () use ($usuario, $validated, $companyId) {
            $dados = [
                'full_name' => $validated['full_name'],
                'username'  => $validated['username'],
                'email'     => $validated['email'],
                'contact'   => $validated['contact'] ?? null,
            ];

            if (!empty($validated['password'])) {
                $dados['password'] = Hash::make($validated['password']);
            }

            $usuario->update($dados);

            $usuario->partnerCompanies()->updateExistingPivot($companyId, [
                'role' => $validated['role'],
            ]);

            $usuario->telas()->sync($validated['telas'] ?? []);
        });

        $usuario->load('telas:id,nome,slug,descricao,ativo');
        $presented = $this->present($usuario, $companyId);

        return response()->json([
            'message'  => 'Usuário atualizado com sucesso.',
            'user'     => $presented,
            'tela_ids' => $presented['tela_ids'],
        ]);
    }

    /**
     * Remove o vínculo do usuário com a empresa atual.
     */
    public function destroy(int $id)
    {
        $companyId = CurrentCompany::id();
        $usuario = $this->companyUsersQuery()->findOrFail($id);

        if ($error = $this->guardManagement($usuario, $companyId)) {
            return $error;
        }

        $usuario->partnerCompanies()->detach($companyId);

        return response()->json(['message' => 'Usuário removido da empresa com sucesso.']);
    }

    /**
     * Alterna (ativa/desativa) o vínculo do usuário com a empresa atual.
     */
    public function toggleStatus(int $id)
    {
        $companyId = CurrentCompany::id();
        $usuario = $this->companyUsersQuery()->findOrFail($id);

        if ($error = $this->guardManagement($usuario, $companyId)) {
            return $error;
        }

        $ativo = !$this->membershipOf($usuario, $companyId)->active;

        $usuario->partnerCompanies()->updateExistingPivot($companyId, ['active' => $ativo]);

        return response()->json([
            'message' => $ativo ? 'Usuário ativado com sucesso.' : 'Usuário desativado com sucesso.',
            'active'  => $ativo,
        ]);
    }

    private function companyUsersQuery()
    {
        $companyId = CurrentCompany::id();

        return User::whereHas('partnerCompanies', fn ($q) => $q->where('partner_companies.id', $companyId))
            ->with(['partnerCompanies' => fn ($q) => $q->where('partner_companies.id', $companyId)]);
    }

    private function membershipOf(User $usuario, int $companyId)
    {
        $usuario->loadMissing(['partnerCompanies' => fn ($q) => $q->where('partner_companies.id', $companyId)]);

        return $usuario->partnerCompanies->firstWhere('id', $companyId)?->pivot;
    }

    /**
     * Regras de hierarquia: ninguém gerencia a si mesmo por esta tela,
     * e usuários comuns não gerenciam administradores nem promovem ninguém.
     */
    private function guardManagement(User $alvo, int $companyId, ?string $novoPapel = null)
    {
        if ($alvo->id === Auth::guard('api')->id()) {
            return $this->forbidden('Você não pode alterar o seu próprio usuário por esta tela.');
        }

        $papelAlvo = $this->membershipOf($alvo, $companyId)?->role;

        if ($papelAlvo === 'MASTER' && CurrentCompany::role() !== 'MASTER') {
            return $this->forbidden('Você não tem permissão para alterar este usuário.');
        }

        if (!CurrentCompany::isAdmin() && ($papelAlvo !== 'USER' || ($novoPapel && $novoPapel !== 'USER'))) {
            return $this->forbidden('Somente administradores podem gerenciar administradores.');
        }

        return null;
    }

    private function present(User $usuario, int $companyId): array
    {
        $vinculo = $this->membershipOf($usuario, $companyId);
        $telas = $usuario->relationLoaded('telas') ? $usuario->telas : collect();

        return [
            'id'         => $usuario->id,
            'full_name'  => $usuario->full_name,
            'username'   => $usuario->username,
            'email'      => $usuario->email,
            'contact'    => $usuario->contact,
            'active'     => (bool) ($vinculo?->active ?? false),
            'role'       => $vinculo?->role,
            'created_at' => $usuario->created_at,
            'tela_ids'   => $telas->pluck('id')->values()->all(),
            'telas'      => $telas->map(fn ($t) => $t->only(['id', 'nome', 'slug', 'descricao', 'ativo']))->values()->all(),
        ];
    }

    private function forbidden(string $message)
    {
        return response()->json(['message' => $message], 403);
    }
}
