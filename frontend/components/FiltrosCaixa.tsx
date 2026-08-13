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
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          background: filtroCategoria === null ? "#f3f4f6" : "#ffffff",
          color: filtroCategoria === null ? "#374151" : "#6b7280",
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
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            background: filtroCategoria === cat.id ? "#f3f4f6" : "#ffffff",
            color: filtroCategoria === cat.id ? "#374151" : "#6b7280",
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
