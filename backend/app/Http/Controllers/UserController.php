<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Lista todos os usuários.
     */
    public function index()
    {
        return response()->json(User::all());
    }

    /**
     * Cadastra um novo usuário.
     */
    public function store(Request $request)
    {
        $user = Auth::guard('api')->user();

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'username'  => 'required|string|max:255|unique:users,username',
            'email'     => 'required|email|max:255|unique:users,email',
            'contact'   => 'nullable|string|max:20',
            'password'  => 'required|string|min:6',
            'active'    => 'boolean',
            'is_master' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json($user, 201);
    }

    /**
     * Exibe um usuário.
     */
    public function show(int $id)
    {
        $user = User::findOrFail($id);

        return response()->json($user);
    }

    /**
     * Atualiza um usuário.
     */
    public function update(Request $request, int $id)
    {
        $user = Auth::guard('api')->user();

        $validated = $request->validate([
            'full_name' => 'sometimes|required|string|max:255',
            'username'  => 'sometimes|required|string|max:255|unique:users,username,' . $user->id,
            'email'     => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'contact'   => 'nullable|string|max:20',
            'password'  => 'nullable|string|min:6',
            'active'    => 'boolean',
            'is_master' => 'boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user);
    }

    /**
     * Remove um usuário.
     */
    public function destroy(int $id)
    {
        $user = User::findOrFail($id);

        $user->delete();

        return response()->json([
            'message' => 'Usuário removido com sucesso.'
        ]);
    }
}
