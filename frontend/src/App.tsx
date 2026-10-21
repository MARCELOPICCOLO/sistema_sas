import { Suspense, lazy, useCallback, useEffect, useState, type ComponentType } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NavRail from "./components/NavRail";
import Topbar from "./components/Topbar";
import api, {
  SESSION_EXPIRED_EVENT,
  clearSession,
  getToken,
} from "./api/axios";
import { fetchSession, type SessionUser } from "./auth/session";
import { MODULOS, pathDoModulo, type ModuloSlug } from "./modules";

type PaginaModulo = ComponentType;

// Cada módulo vira um arquivo separado, baixado só quando a tela é aberta.
const Produtos = lazy(() => import("./pages/Produtos"));
const Caixa = lazy(() => import("./pages/Caixa"));
const GestaoVendas = lazy(() => import("./pages/GestaoVendas"));
const GerenciamentoEquipe = lazy(() => import("./pages/GerenciamentoEquipe"));
const GestaoRelatorios = lazy(() => import("./pages/GestaoRelatorios"));

const PAGINAS: Record<ModuloSlug, PaginaModulo> = {
  produtos: Produtos,
  vendas: GestaoVendas,
  caixa: Caixa,
  gestao_relatorio: GestaoRelatorios,
  gestao_equipe: GerenciamentoEquipe,
};

function TelaCarregando() {
  return (
    <div className="app-loading">
      <div className="spinner" />
      <p>Carregando...</p>
    </div>
  );
}

function AcessoNegado({ onVoltar }: { onVoltar: () => void }) {
  return (
    <div className="app-loading">
      <div className="empty-icon">
        <FontAwesomeIcon icon={faLock} />
      </div>
      <h2>Acesso não autorizado</h2>
      <p>Você não tem permissão para acessar este módulo.</p>
      <button className="btn btn-primary" onClick={onVoltar}>
        Voltar ao início
      </button>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));
  const [avisoSessao, setAvisoSessao] = useState("");

  // =========================================================
  // SESSÃO
  // =========================================================

  useEffect(() => {
    if (!getToken()) {
      return;
    }

    let ativo = true;

    fetchSession()
      .then((sessao) => ativo && setUser(sessao))
      .catch(() => {
        clearSession();
        if (ativo) setUser(null);
      })
      .finally(() => ativo && setLoading(false));

    return () => {
      ativo = false;
    };
  }, []);

  // Token expirado/inválido em qualquer requisição -> volta para o login.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setAvisoSessao("Sua sessão expirou. Entre novamente.");
      navigate("/", { replace: true });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [navigate]);

  const handleLoginSuccess = useCallback((sessao: SessionUser) => {
    setAvisoSessao("");
    setUser(sessao);
    navigate("/", { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // O token pode já estar expirado; a sessão local é encerrada de qualquer forma.
    }

    clearSession();
    setUser(null);
    navigate("/", { replace: true });
  }, [navigate]);

  /** Compatível com as telas existentes: setTela("caixa"), setTela("dashboard")... */
  const setTela = useCallback(
    (tela: string) => navigate(tela === "dashboard" ? "/" : pathDoModulo(tela)),
    [navigate],
  );

  if (loading) {
    return <TelaCarregando />;
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} aviso={avisoSessao} />;
  }

  const permitidos = new Set(user.telas.map((t) => t.slug));

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="shell">
            <NavRail user={user} onLogout={handleLogout} />
            <div className="shell-content">
              <Topbar user={user} onLogout={handleLogout} />
              <Dashboard user={user} setTela={setTela} />
            </div>
          </div>
        }
      />

      {MODULOS.map(({ slug, path }) => {
        const Pagina = PAGINAS[slug];

        return (
          <Route
            key={slug}
            path={path}
            element={
              permitidos.has(slug) ? (
                <div className="shell">
                  <NavRail user={user} onLogout={handleLogout} />
                  <div className="shell-content module-page">
                    <Topbar user={user} onLogout={handleLogout} />
                    <Suspense fallback={<TelaCarregando />}>
                      <Pagina />
                    </Suspense>
                  </div>
                </div>
              ) : (
                <AcessoNegado onVoltar={() => navigate("/")} />
              )
            }
          />
        );
      })}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
