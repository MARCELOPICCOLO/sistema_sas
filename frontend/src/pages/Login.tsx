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
    { login: "admin", password: "admin", id: 1, email: "admin@exemplo.com" },
    {
      login: "operador",
      password: "123456",
      id: 2,
      email: "operador@exemplo.com",
    },
    { login: "teste", password: "123456", id: 3, email: "teste@exemplo.com" },
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
      const response = await api.post("/auth/login", {
        username: login.trim(),
        password: password.trim(),
      });

      const token = response.data.access_token;

      localStorage.setItem("auth_token", token);

      console.log("Login realizado:", response.data);

      // Buscar usuário autenticado pelo token
      const userResponse = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = userResponse.data;

      console.log("Usuário autenticado:", user);

      const userData = {
        id: user.id,
        login: user.username,
        email: user.email,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      onLoginSuccess(userData);
    } catch (error: any) {
      console.error(error);

      setError(error.response?.data?.message ?? "Usuário ou senha inválidos");
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
        background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "40px 32px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              marginBottom: 16,
            }}
          >
            <FontAwesomeIcon
              icon={faUtensils}
              style={{ fontSize: 32, color: "#fff" }}
            />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#1f2937",
            }}
          >
            Sistema de Gestão
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 14,
              color: "#6b7280",
            }}
          >
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 6,
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
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "0 12px",
                transition: "all 0.2s",
                background: "#f9fafb",
              }}
            >
              <FontAwesomeIcon
                icon={faUser}
                style={{ fontSize: 16, color: "#9ca3af" }}
              />
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Digite seu usuário"
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  outline: "none",
                  color: "#1f2937",
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
                marginBottom: 6,
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
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "0 12px",
                transition: "all 0.2s",
                background: "#f9fafb",
              }}
            >
              <FontAwesomeIcon
                icon={faLock}
                style={{ fontSize: 16, color: "#9ca3af" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  outline: "none",
                  color: "#1f2937",
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
                  fontSize: 14,
                  padding: "4px",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "#fee2e2",
                color: "#dc2626",
                fontSize: 13,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>❌</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#9ca3af" : "#10b981",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#059669";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#10b981";
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
              marginTop: 16,
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
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "#f3f4f6",
                color: "#374151",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e5e7eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
              }}
            >
              admin / admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("operador", "123456")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "#f3f4f6",
                color: "#374151",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e5e7eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
              }}
            >
              operador / 123456
            </button>
          </div>

          <div
            style={{
              marginTop: 12,
              textAlign: "center",
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            Clique nos botões para preencher automaticamente
          </div>
        </form>
      </div>
    </div>
  );
}
