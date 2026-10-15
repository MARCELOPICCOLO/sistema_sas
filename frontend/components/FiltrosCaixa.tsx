import React from "react";

interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface FiltrosCaixaProps {
  categorias: ExpenseCategory[];
  filtroCategoria: number | null;
  setFiltroCategoria: (id: number | null) => void;
}

export const FiltrosCaixa: React.FC<FiltrosCaixaProps> = ({
  categorias,
  filtroCategoria,
  setFiltroCategoria,
}) => {
  if (categorias.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => setFiltroCategoria(null)}
        style={{
          padding: "5px 10px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: filtroCategoria === null ? "var(--surface-3)" : "var(--surface)",
          color: filtroCategoria === null ? "var(--text-secondary)" : "var(--text-muted)",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        Todos
      </button>

      {categorias.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setFiltroCategoria(cat.id)}
          style={{
            padding: "5px 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: filtroCategoria === cat.id ? "var(--surface-3)" : "var(--surface)",
            color: filtroCategoria === cat.id ? "var(--text-secondary)" : "var(--text-muted)",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};
