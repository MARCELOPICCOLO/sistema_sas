import { useState, type SyntheticEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightToBracket,
  faChartLine,
  faCircleExclamation,
  faEye,
  faEyeSlash,
  faLock,
  faBolt,
  faShieldHalved,
  faSpinner,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import api, { TOKEN_KEY, clearSession, getErrorMessage } from "../api/axios";
import { fetchSession, type SessionUser } from "../auth/session";
import { APP_ICON, APP_NAME, APP_TAGLINE } from "../brand";
import "./Login.css";

interface LoginProps {
  onLoginSuccess: (user: SessionUser) => void;
  aviso?: string;
}

const DESTAQUES = [
  { icon: faBolt, texto: "Vendas e pedidos em tempo real" },
  { icon: faChartLine, texto: "Financeiro e relatórios em um painel" },
  { icon: faShieldHalved, texto: "Acesso por perfil e permissões" },
];

export default function Login({ onLoginSuccess, aviso }: LoginProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!login.trim() || !password) {
      setError("Informe usuário e senha.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        username: login.trim(),
        password,
      });

      if (!data?.access_token) {
        throw new Error("Token não retornado.");
      }

      localStorage.setItem(TOKEN_KEY, data.access_token);

      const sessao = await fetchSession();
      onLoginSuccess(sessao);
    } catch (err) {
      clearSession();
      setError(getErrorMessage(err, "Não foi possível entrar. Tente novamente."));
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const mensagem = error || aviso;

  return (
    <div className="login-page">
      <aside className="login-brand">
        <div className="login-brand__head">
          <span className="login-brand__logo">
            <FontAwesomeIcon icon={APP_ICON} />
          </span>
          <span className="login-brand__name">{APP_NAME}</span>
        </div>

        <div>
          <span className="login-brand__eyebrow">{APP_TAGLINE}</span>
          <h1>Toda a operação do seu negócio, em um só lugar.</h1>
          <p>Vendas, estoque, financeiro e equipe com dados em tempo real.</p>
        </div>

        {/* Ilustração decorativa do painel (valores ilustrativos) */}
        <div className="login-preview" aria-hidden>
          <div className="login-preview__bar">
            <i />
            <i />
            <i />
          </div>
          <div className="login-preview__kpis">
            <span>
              <small>Vendas hoje</small>
              <strong>R$ 4,8 mil</strong>
              <em>▲ 12%</em>
            </span>
            <span>
              <small>Pedidos</small>
              <strong>36</strong>
              <em>▲ 8%</em>
            </span>
            <span>
              <small>Saldo</small>
              <strong>R$ 2,1 mil</strong>
              <em>▲ 5%</em>
            </span>
          </div>
          <div className="login-preview__chart">
            {[38, 52, 44, 70, 58, 84, 66].map((h, i) => (
              <b key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <ul className="login-brand__list">
          {DESTAQUES.map((item) => (
            <li key={item.texto}>
              <span>
                <FontAwesomeIcon icon={item.icon} />
              </span>
              {item.texto}
            </li>
          ))}
        </ul>

        <small>© {new Date().getFullYear()} {APP_NAME}</small>
      </aside>

      <main className="login-main">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card__mobile-logo">
            <FontAwesomeIcon icon={APP_ICON} />
          </div>

          <h2>Bem-vindo de volta</h2>
          <p className="login-card__subtitle">Entre com suas credenciais para continuar.</p>

          {mensagem && (
            <div className={`login-alert ${error ? "is-error" : "is-info"}`} role="alert">
              <FontAwesomeIcon icon={faCircleExclamation} />
              <span>{mensagem}</span>
            </div>
          )}

          <label className="login-field">
            <span>Usuário</span>
            <div className="login-input">
              <FontAwesomeIcon icon={faUser} />
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Seu usuário"
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </div>
          </label>

          <label className="login-field">
            <span>Senha</span>
            <div className="login-input">
              <FontAwesomeIcon icon={faLock} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-input__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </label>

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Entrando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faArrowRightToBracket} /> Entrar
              </>
            )}
          </button>

          <p className="login-card__help">
            Esqueceu a senha? Solicite a redefinição ao administrador.
          </p>
        </form>
      </main>
    </div>
  );
}
