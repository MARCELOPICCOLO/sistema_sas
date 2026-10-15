import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faRightFromBracket,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate } from "react-router-dom";

import type { SessionUser } from "../auth/session";
import { MODULOS } from "../modules";

interface NavRailProps {
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

/** Barra lateral fixa para alternar entre os módulos liberados ao usuário. */
export default function NavRail({ user, onLogout }: NavRailProps) {
  const navigate = useNavigate();
  const permitidos = new Set(user.telas.map((t) => t.slug));
  const nome = user.full_name || user.username;

  return (
    <aside className="rail" aria-label="Navegação principal">
      <button
        className="rail__logo"
        onClick={() => navigate("/")}
        aria-label="Início"
        title="Início"
      >
        <FontAwesomeIcon icon={faUtensils} />
      </button>

      <nav className="rail__nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `rail__item${isActive ? " is-active" : ""}`}
          data-label="Início"
          aria-label="Início"
        >
          <FontAwesomeIcon icon={faHouse} />
        </NavLink>

        {MODULOS.filter((m) => permitidos.has(m.slug)).map((m) => (
          <NavLink
            key={m.slug}
            to={m.path}
            className={({ isActive }) => `rail__item${isActive ? " is-active" : ""}`}
            data-label={m.titulo}
            aria-label={m.titulo}
          >
            <FontAwesomeIcon icon={m.icon} />
          </NavLink>
        ))}
      </nav>

      <div className="rail__footer">
        <span className="rail__avatar" title={nome}>
          {iniciais(nome)}
        </span>

        <button
          className="rail__item is-logout"
          onClick={onLogout}
          data-label="Sair"
          aria-label="Sair"
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
      </div>
    </aside>
  );
}
