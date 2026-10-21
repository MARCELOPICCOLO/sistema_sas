import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate } from "react-router-dom";

import type { SessionUser } from "../auth/session";
import { APP_ICON, APP_NAME } from "../brand";
import { MODULOS } from "../modules";

interface NavRailProps {
  user: SessionUser;
  onLogout: () => void;
}

/** Barra lateral fixa para alternar entre os módulos liberados ao usuário. */
export default function NavRail({ user, onLogout }: NavRailProps) {
  const navigate = useNavigate();
  const permitidos = new Set(user.telas.map((t) => t.slug));

  return (
    <aside className="rail" aria-label="Navegação principal">
      <button
        className="rail__logo"
        onClick={() => navigate("/")}
        aria-label={APP_NAME}
        title={APP_NAME}
      >
        <FontAwesomeIcon icon={APP_ICON} />
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
