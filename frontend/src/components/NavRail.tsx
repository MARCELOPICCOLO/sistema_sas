import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faHouse,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

import { ROLE_LABEL, type SessionUser } from "../auth/session";
import { modulosDoUsuario } from "../modules";

interface NavRailProps {
  user: SessionUser;
  onLogout: () => void;
}

const CHAVE = "rail-expandida";

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const lerPreferencia = () => {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
};

/**
 * Barra lateral dos módulos: ícones em "blocos" claros sobre a cor da marca.
 * A aba na borda expande a barra para mostrar o nome de cada módulo.
 */
export default function NavRail({ user, onLogout }: NavRailProps) {
  const [expandida, setExpandida] = useState(lerPreferencia);

  const nome = user.full_name || user.username;
  const papel = user.is_master ? "Master da plataforma" : user.role ? ROLE_LABEL[user.role] : "Usuário";

  const alternar = () =>
    setExpandida((atual) => {
      try {
        localStorage.setItem(CHAVE, atual ? "0" : "1");
      } catch {
        // Sem persistência: vale só nesta sessão.
      }
      return !atual;
    });

  const itens = [
    { chave: "inicio", path: "/", titulo: "Início", icon: faHouse, end: true },
    ...modulosDoUsuario(user).map((m) => ({ chave: m.slug, path: m.path, titulo: m.titulo, icon: m.icon, end: false })),
  ];

  return (
    <aside className={`rail${expandida ? " is-expanded" : ""}`} aria-label="Navegação principal">
      <nav className="rail__nav">
        {itens.map((item) => (
          <NavLink
            key={item.chave}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `rail__item${isActive ? " is-active" : ""}`}
            data-label={item.titulo}
            aria-label={item.titulo}
          >
            <span className="rail__tile">
              <FontAwesomeIcon icon={item.icon} />
            </span>
            <span className="rail__label">{item.titulo}</span>
          </NavLink>
        ))}
      </nav>

      <div className="rail__footer">
        <div className="rail__user" title={`${nome} — ${papel}`}>
          <span className="rail__avatar">{iniciais(nome)}</span>
          <span className="rail__label">
            <strong>{nome}</strong>
            <small>{papel}</small>
          </span>
        </div>

        <button className="rail__item is-logout" onClick={onLogout} data-label="Sair" aria-label="Sair">
          <span className="rail__tile is-plain">
            <FontAwesomeIcon icon={faRightFromBracket} />
          </span>
          <span className="rail__label">Sair</span>
        </button>
      </div>

      <button
        className="rail__toggle"
        onClick={alternar}
        aria-label={expandida ? "Recolher menu" : "Expandir menu"}
        aria-expanded={expandida}
        title={expandida ? "Recolher menu" : "Expandir menu"}
      >
        <FontAwesomeIcon icon={expandida ? faChevronLeft : faChevronRight} />
      </button>
    </aside>
  );
}
