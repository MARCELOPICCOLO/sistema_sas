// components/ResumoEquipe.tsx

import type { Usuario } from "../src/pages/GerenciamentoEquipe";

interface ResumoEquipeProps {
  usuarios: Usuario[];
}

export function ResumoEquipe({ usuarios }: ResumoEquipeProps) {
  const total = usuarios.length;
  const ativos = usuarios.filter((u) => u.active).length;
  const administradores = usuarios.filter(
    (u) => u.role === "MASTER" || u.role === "ADMIN",
  ).length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div style={cardStyle}>
        <div style={labelStyle}>Total de usuários</div>
        <div style={valueStyle}>{total}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Usuários ativos</div>
        <div
          style={{
            ...valueStyle,
            color: "var(--primary)",
          }}
        >
          {ativos}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Administradores</div>
        <div style={valueStyle}>{administradores}</div>
      </div>
    </div>
  );
}

// =========================================================
// ESTILOS
// =========================================================

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "16px 18px",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  marginBottom: 6,
};

const valueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: "var(--text)",
};
