// components/SidebarEquipe.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUsers,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

interface SidebarEquipeProps {
  onNovoColaborador: () => void;
  onVoltarDashboard: () => void;
}

export function SidebarEquipe({
  onNovoColaborador,
  onVoltarDashboard,
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
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Botão Voltar ao início */}
      <div
        style={{
          marginBottom: 20,
        }}
      >
        <button
          onClick={onVoltarDashboard}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "9px 12px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            cursor: "pointer",
            transition: "all 0.2s",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--primary-soft)";
            e.currentTarget.style.borderColor = "var(--primary-border)";
            e.currentTarget.style.color = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface-2)";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar ao início
        </button>
      </div>

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
          <FontAwesomeIcon icon={faUsers} style={{ fontSize: 18 }} />
        </div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            Equipe
          </div>
          <div
            style={{
              fontSize: 11,
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
          background: "var(--primary)",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          transition: "background 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--primary)";
        }}
      >
        <FontAwesomeIcon icon={faPlus} />
        <span>Novo colaborador</span>
      </button>
    </div>
  );
}
