// components/FiltrosEquipe.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

interface FiltrosEquipeProps {
  busca: string;
  onBuscaChange: (value: string) => void;
  filtroRole: "TODOS" | "MASTER" | "ADMIN" | "USER";
  onFiltroRoleChange: (value: "TODOS" | "MASTER" | "ADMIN" | "USER") => void;
  isMobile?: boolean;
}

export function FiltrosEquipe({
  busca,
  onBuscaChange,
  filtroRole,
  onFiltroRoleChange,
  isMobile = false,
}: FiltrosEquipeProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        marginBottom: 12,
        padding: isMobile ? "12px" : "14px 16px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 10,
        alignItems: isMobile ? "stretch" : "center",
        flexWrap: isMobile ? "nowrap" : "wrap",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          position: "relative",
          flex: 1,
          minWidth: isMobile ? "auto" : 220,
        }}
      >
        <FontAwesomeIcon
          icon={faSearch}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-subtle)",
            fontSize: 12,
          }}
        />

        <input
          type="text"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar colaborador..."
          style={{
            width: "100%",
            height: 36,
            boxSizing: "border-box",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0 12px 0 34px",
            fontSize: 13,
            color: "var(--text-secondary)",
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        />
      </div>

      <select
        value={filtroRole}
        onChange={(e) =>
          onFiltroRoleChange(
            e.target.value as "TODOS" | "MASTER" | "ADMIN" | "USER",
          )
        }
        style={{
          height: 36,
          minWidth: isMobile ? "100%" : 150,
          width: isMobile ? "100%" : "auto",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "0 10px",
          fontSize: 13,
          color: "var(--text-secondary)",
          background: "var(--surface)",
          outline: "none",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--primary)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        <option value="TODOS">Todos os perfis</option>
        <option value="ADMIN">Administrador</option>
        <option value="USER">Usuário</option>
      </select>
    </div>
  );
}
