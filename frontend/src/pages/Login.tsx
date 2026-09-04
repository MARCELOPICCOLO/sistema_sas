// pages/Login.tsx

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faSignInAlt,
  faSpinner,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";

import api from "../api/axios";

interface Tela {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  ativo: boolean | number;
}

interface UsuarioApi {
  id: number;
  full_name?: string;
  username?: string;
  email?: string;
  contact?: string | null;
  active?: boolean;
  is_master?: boolean;
  created_at?: string;
  updated_at?: string;
  telas?: Tela[];
}

interface MeResponse {
  user: UsuarioApi;
  company_id: number | null;
  tela_ids?: number[];
  telas?: Tela[];
}

interface LoginProps {
  onLoginSuccess: (userData: {
    id: number;
    login: string;
    email: string;
  }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Credenciais válidas (hardcoded para teste)
  const validCredentials = [
    {
      login: "admin",
      password: "admin",
      id: 1,
      email: "admin@exemplo.com",
    },
    {
      login: "operador",
      password: "123456",
      id: 2,
      email: "operador@exemplo.com",
    },
    {
      login: "teste",
      password: "123456",
      id: 3,
      email: "teste@exemplo.com",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!login.trim() || !password.trim()) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      /**
       * ============================================================
       * 1. LOGIN
       * ============================================================
       */
      const response = await api.post("/auth/login", {
        username: login.trim(),
        password: password.trim(),
      });

      const token = response.data.access_token;

      if (!token) {
        throw new Error("Token de autenticação não foi retornado.");
      }

      /**
       * Salva o token.
       */
      localStorage.setItem("auth_token", token);

      console.log("Login realizado:", response.data);

      /**
       * ============================================================
       * 2. BUSCAR USUÁRIO AUTENTICADO
       * ============================================================
       *
       * A resposta do /auth/me possui:
       *
       * {
       *   user: {...},
       *   company_id: ...,
       *   tela_ids: [...],
       *   telas: [...]
       * }
       *
       * Portanto, o usuário está em:
       *
       * userResponse.data.user
       */
      const userResponse = await api.get<MeResponse>("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const dados: MeResponse = userResponse.data;

      console.log("Resposta /auth/me:", dados);

      /**
       * Validação da resposta.
       */
      if (!dados?.user?.id) {
        throw new Error("A API /auth/me não retornou um usuário válido.");
      }

      const usuario = dados.user;

      /**
       * ============================================================
       * 3. MONTAR AS TELAS DO USUÁRIO
       * ============================================================
       *
       * Preferimos as telas que vêm dentro de user.telas.
       *
       * Caso não existam, usamos dados.telas.
       */
      const telasUsuario: Tela[] = Array.isArray(usuario.telas)
        ? usuario.telas
        : Array.isArray(dados.telas)
          ? dados.telas
          : [];

      /**
       * IDs das telas.
       *
       * Preferimos tela_ids retornado pela API.
       * Caso não exista, montamos pelos objetos de telas.
       */
      const telaIds: number[] = Array.isArray(dados.tela_ids)
        ? dados.tela_ids
        : telasUsuario.map((tela) => tela.id);

      /**
       * ============================================================
       * 4. USUÁRIO QUE SERÁ GRAVADO NO LOCALSTORAGE
       * ============================================================
       *
       * Aqui salvamos o usuário completo retornado pelo /auth/me.
       *
       * Isso é importante porque o Dashboard poderá posteriormente
       * utilizar:
       *
       * localStorage.getItem("user")
       *
       * sem precisar chamar /auth/me novamente.
       */
      const usuarioParaSalvar = {
        ...usuario,

        /**
         * Garantimos que as telas estejam dentro do objeto user.
         */
        telas: telasUsuario,

        /**
         * Também guardamos os IDs para facilitar verificações.
         */
        tela_ids: telaIds,

        /**
         * Mantemos login para compatibilidade com o frontend atual.
         */
        login: usuario.username,
      };

      /**
       * ============================================================
       * 5. SALVAR USUÁRIO NO LOCALSTORAGE
       * ============================================================
       */
      localStorage.setItem("user", JSON.stringify(usuarioParaSalvar));

      /**
       * Log para conferência no navegador.
       */
      console.log("Usuário salvo no localStorage:", usuarioParaSalvar);

      /**
       * ============================================================
       * 6. DADOS ENVIADOS PARA O COMPONENTE PAI
       * ============================================================
       *
       * Mantemos exatamente o formato que o LoginProps atual
       * espera.
       */
      const userData = {
        id: usuario.id,
        login: usuario.username || "",
        email: usuario.email || "",
      };

      onLoginSuccess(userData);
    } catch (error: any) {
      console.error("Erro no login:", error);

      /**
       * Se o login falhar, não deixamos usuário antigo no storage.
       */
      localStorage.removeItem("user");

      /**
       * Se o token foi salvo antes de ocorrer um erro no /me,
       * também removemos o token.
       */
      localStorage.removeItem("auth_token");

      setError(
        error.response?.data?.message ??
          error.message ??
          "Usuário ou senha inválidos",
      );
    } finally {
      setLoading(false);
    }
  };

  // Preencher credenciais de teste
  const fillCredentials = (user: string, pass: string) => {
    setLogin(user);
    setPassword(pass);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: "24px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "40px",
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "#ecfdf5",
              marginBottom: 18,
            }}
          >
            <FontAwesomeIcon
              icon={faUtensils}
              style={{
                fontSize: 22,
                color: "#059669",
              }}
            />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 600,
              color: "#111827",
              letterSpacing: "-0.3px",
            }}
          >
            Sistema de Gestão
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              color: "#6b7280",
            }}
          >
            Entre na sua conta para continuar
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 7,
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Usuário
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "0 12px",
                background: "#ffffff",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <FontAwesomeIcon
                icon={faUser}
                style={{
                  fontSize: 14,
                  color: "#9ca3af",
                }}
              />

              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Digite seu usuário"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  outline: "none",
                  color: "#111827",
                }}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                marginBottom: 7,
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Senha
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "0 12px",
                background: "#ffffff",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <FontAwesomeIcon
                icon={faLock}
                style={{
                  fontSize: 14,
                  color: "#9ca3af",
                }}
              />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  outline: "none",
                  color: "#111827",
                }}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  fontSize: 13,
                  padding: "4px",
                }}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                <FontAwesomeIcon icon={faUser} style={{ opacity: 0 }} />

                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "11px 13px",
                borderRadius: 8,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: 13,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#dc2626",
                  flexShrink: 0,
                }}
              />

              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#9ca3af" : "#059669",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s, transform 0.1s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#047857";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#059669";
              }
            }}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Entrando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSignInAlt} />
                Entrar
              </>
            )}
          </button>

          {/* Botões de credenciais rápidas */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => fillCredentials("admin", "admin")}
              style={{
                padding: "6px 11px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#4b5563",
                cursor: "pointer",
                fontSize: 11,
                transition: "background 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              admin / admin
            </button>

            <button
              type="button"
              onClick={() => fillCredentials("operador", "123456")}
              style={{
                padding: "6px 11px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#4b5563",
                cursor: "pointer",
                fontSize: 11,
                transition: "background 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              operador / 123456
            </button>
          </div>

          <div
            style={{
              marginTop: 10,
              textAlign: "center",
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            Clique para preencher automaticamente
          </div>
        </form>
      </div>
    </div>
  );
}
