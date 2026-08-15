import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Produtos from "./pages/Produtos";
import Caixa from "./pages/Caixa";
import Dashboard from "./pages/Dashboard";
import GestaoPontosVenda from "./pages/GestaoPontosVenda";
import GestaoVendas from "./pages/GestaoVendas";
import GerenciamentoEquipe from "./pages/GerenciamentoEquipe";
import api from "./api/axios";

interface User {
  id: number;
  login: string;
  email: string;
}

type Tela =
  | "dashboard"
  | "gestao_pontos"
  | "produtos"
  | "caixa"
  | "vendas"
  | "gestao_equipe";

export default function App() {
  const [tela, setTela] = useState<Tela>("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // VERIFICAR AUTENTICAÇÃO
  // =========================================================

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        const user = response.data;

        const userData: User = {
          id: user.id,
          login: user.username,
          email: user.email,
        };

        setUser(userData);

        localStorage.setItem("user", JSON.stringify(userData));

        setIsAuthenticated(true);
      } catch (error) {
        console.log("Sessão inválida");

        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");

        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setTela("dashboard");
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");

    setUser(null);
    setIsAuthenticated(false);
    setTela("dashboard");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#f3f4f6",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "4px solid #e5e7eb",
              borderTopColor: "#10b981",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          />

          <p
            style={{
              marginTop: 16,
              color: "#6b7280",
            }}
          >
            Carregando...
          </p>

          <style>
            {`
              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // =========================================================
  // LOGIN
  // =========================================================

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // =========================================================
  // PROPS COMPARTILHADAS
  // =========================================================

  const commonProps = {
    user,
    onLogout: handleLogout,
  };

  // =========================================================
  // APLICAÇÃO
  // =========================================================

  return (
    <div
      style={{
        height: "100vh",
        background: "#FAFAFA",
        overflow: "auto",
      }}
    >
      {tela === "dashboard" && <Dashboard setTela={setTela} {...commonProps} />}

      {tela === "gestao_pontos" && (
        <GestaoPontosVenda setTela={setTela} {...commonProps} />
      )}

      {tela === "produtos" && <Produtos setTela={setTela} {...commonProps} />}

      {tela === "caixa" && <Caixa setTela={setTela} {...commonProps} />}

      {tela === "vendas" && <GestaoVendas setTela={setTela} {...commonProps} />}

      {tela === "gestao_equipe" && (
        <GerenciamentoEquipe setTela={setTela} {...commonProps} />
      )}

      {/* 
      {tela === "relatorio" && (
        <Relatorio
          setTela={setTela}
          {...commonProps}
        />
      )}
      */}
    </div>
  );
}
