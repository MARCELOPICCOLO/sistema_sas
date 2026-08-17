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
      style={{
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Botão Voltar ao Dashboard */}
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
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.2s",
            color: "#6b7280",
            fontSize: 13,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ecfdf5";
            e.currentTarget.style.borderColor = "#a7f3d0";
            e.currentTarget.style.color = "#059669";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar ao Dashboard
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
            borderRadius: 10,
            background: "#ecfdf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#059669",
          }}
        >
          <FontAwesomeIcon icon={faUsers} style={{ fontSize: 18 }} />
        </div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Equipe
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#6b7280",
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
          background: "#10b981",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          transition: "background 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#059669";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#10b981";
        }}
      >
        <FontAwesomeIcon icon={faPlus} />
        <span>Novo colaborador</span>
      </button>
    </div>
  );
}
