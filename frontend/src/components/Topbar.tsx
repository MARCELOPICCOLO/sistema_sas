import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faChevronDown,
  faMagnifyingGlass,
  faMoon,
  faRightFromBracket,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

import { ROLE_LABEL, type SessionUser } from "../auth/session";
import { APP_ICON, APP_NAME, APP_TAGLINE } from "../brand";
import { modulosDoUsuario } from "../modules";
import { aplicarTema, temaInicial, type Tema } from "../theme";

interface TopbarProps {
  user: SessionUser;
  onLogout: () => void;
}

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

/**
 * Barra superior branca com a marca à esquerda (e a empresa do usuário),
 * busca de módulos e tema. O usuário e o "Sair" ficam na barra lateral;
 * no celular, onde ela some, o menu do usuário aparece aqui.
 */
export default function Topbar({ user, onLogout }: TopbarProps) {
  const navigate = useNavigate();

  const [tema, setTema] = useState<Tema>(temaInicial);
  const [busca, setBusca] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const modulos = useMemo(() => modulosDoUsuario(user), [user]);

  const resultados = modulos.filter((m) =>
    `${m.titulo} ${m.descricao}`.toLowerCase().includes(busca.trim().toLowerCase()),
  );

  const nome = user.full_name || user.username;
  const empresa = user.company?.trade_name || user.company?.corporate_name;

  // Ctrl+K / Cmd+K abre a busca.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setBuscaAberta(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fecha o menu do usuário ao clicar fora.
  useEffect(() => {
    if (!menuAberto) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuAberto(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuAberto]);

  const irPara = (path: string) => {
    navigate(path);
    setBusca("");
    setBuscaAberta(false);
    inputRef.current?.blur();
  };

  const alternarTema = () => {
    const novo: Tema = tema === "dark" ? "light" : "dark";
    aplicarTema(novo);
    setTema(novo);
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__brand" onClick={() => navigate("/")} aria-label={`${APP_NAME} — início`}>
          <span className="topbar__logo">
            <FontAwesomeIcon icon={APP_ICON} />
          </span>
          <span className="topbar__brand-text">
            <strong>{APP_NAME}</strong>
            <small>{APP_TAGLINE}</small>
          </span>
        </button>

        {empresa && (
          <>
            <span className="topbar__divider" aria-hidden />
            <span className="topbar__company" title={empresa}>
              <FontAwesomeIcon icon={faBuilding} />
              <span>{empresa}</span>
            </span>
          </>
        )}
      </div>

      <div className="topbar__search">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="topbar__search-icon" />
        <input
          ref={inputRef}
          value={busca}
          placeholder="Buscar módulo..."
          aria-label="Buscar módulo"
          onChange={(e) => {
            setBusca(e.target.value);
            setDestaque(0);
            setBuscaAberta(true);
          }}
          onFocus={() => setBuscaAberta(true)}
          onBlur={() => window.setTimeout(() => setBuscaAberta(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setDestaque((d) => Math.min(d + 1, resultados.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setDestaque((d) => Math.max(d - 1, 0));
            } else if (e.key === "Enter" && resultados[destaque]) {
              irPara(resultados[destaque].path);
            } else if (e.key === "Escape") {
              inputRef.current?.blur();
            }
          }}
        />
        <kbd className="topbar__kbd">Ctrl K</kbd>

        {buscaAberta && (
          <div className="topbar__results" role="listbox">
            {resultados.length === 0 ? (
              <p>Nenhum módulo encontrado.</p>
            ) : (
              resultados.map((m, i) => (
                <button
                  key={m.slug}
                  role="option"
                  aria-selected={i === destaque}
                  className={i === destaque ? "is-active" : ""}
                  onMouseEnter={() => setDestaque(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => irPara(m.path)}
                >
                  <span className="topbar__result-icon" style={{ background: m.cor }}>
                    <FontAwesomeIcon icon={m.icon} />
                  </span>
                  <span>
                    <strong>{m.titulo}</strong>
                    <small>{m.descricao}</small>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="topbar__right">
        <button
          className="topbar__icon-btn"
          onClick={alternarTema}
          aria-label={tema === "dark" ? "Usar tema claro" : "Usar tema escuro"}
          title={tema === "dark" ? "Tema claro" : "Tema escuro"}
        >
          <FontAwesomeIcon icon={tema === "dark" ? faSun : faMoon} />
        </button>

        <div className="topbar__user" ref={menuRef}>
          <button
            className="topbar__user-btn"
            onClick={() => setMenuAberto((v) => !v)}
            aria-expanded={menuAberto}
            aria-haspopup="menu"
          >
            <span className="topbar__avatar">{iniciais(nome)}</span>
            <span className="topbar__user-info">
              <strong>{nome}</strong>
              <small>{user.is_master ? "Master da plataforma" : user.role ? ROLE_LABEL[user.role] : "Usuário"}</small>
            </span>
            <FontAwesomeIcon icon={faChevronDown} className="topbar__chevron" />
          </button>

          {menuAberto && (
            <div className="topbar__menu" role="menu">
              <div className="topbar__menu-head">
                <strong>{nome}</strong>
                <small>{user.email}</small>
              </div>
              <button role="menuitem" className="is-danger" onClick={onLogout}>
                <FontAwesomeIcon icon={faRightFromBracket} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
