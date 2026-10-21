// components/SidebarEquipe.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

interface SidebarEquipeProps {
  onNovoColaborador: () => void;
}

export function SidebarEquipe({
  onNovoColaborador,
}: SidebarEquipeProps) {
  return (
    <div
      className="sidebar-dark"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        height: "var(--page-h)",
        position: "sticky",
        top: "var(--topbar-h)",
      }}
    >
      {/* Logo / Título */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 32,
          padding: "0 8px",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "var(--primary-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary)",
          }}
        >
          <FontAwesomeIcon icon={faUsers} style={{ fontSize: "var(--fs-xl)" }} />
        </div>
        <div>
          <div
            style={{
              fontSize: "var(--fs-lg)",
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            Equipe
          </div>
          <div
            style={{
              fontSize: "var(--fs-2xs)",
              color: "var(--text-muted)",
            }}
          >
            Gerenciamento
          </div>
        </div>
      </div>

      {/* Botão Novo Colaborador */}
      <button
        onClick={onNovoColaborador}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: "12px 16px",
          background: "var(--primary-solid)",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          color: "#fff",
          fontSize: "var(--fs-md)",
          fontWeight: 500,
          transition: "background 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--primary-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--primary-solid)";
        }}
      >
        <FontAwesomeIcon icon={faPlus} />
        <span>Novo colaborador</span>
      </button>
    </div>
  );
}
