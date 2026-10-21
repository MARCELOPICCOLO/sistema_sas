import React from "react";

interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface ModalAdicionarSaidaProps {
  showModalSaida: boolean;
  setShowModalSaida: (show: boolean) => void;
  novaSaida: {
    descricao: string;
    valor: number;
    category_id: number;
    data: string;
  };
  setNovaSaida: React.Dispatch<
    React.SetStateAction<{
      descricao: string;
      valor: number;
      category_id: number;
      data: string;
    }>
  >;
  categorias: ExpenseCategory[];
  adicionarSaida: () => void;
}

export const ModalAdicionarSaida: React.FC<ModalAdicionarSaidaProps> = ({
  showModalSaida,
  setShowModalSaida,
  novaSaida,
  setNovaSaida,
  categorias,
  adicionarSaida,
}) => {
  if (!showModalSaida) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1001,
      }}
      onClick={() => setShowModalSaida(false)}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          padding: 24,
          width: "90%",
          maxWidth: 450,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 20px 0", fontSize: "var(--fs-2xl)" }}>
          Nova Saída (Gasto)
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: "var(--fs-md)",
              fontWeight: 500,
            }}
          >
            Data:
          </label>
          <input
            type="date"
            value={novaSaida.data}
            onChange={(e) =>
              setNovaSaida({ ...novaSaida, data: e.target.value })
            }
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: "var(--fs-md)",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: "var(--fs-md)",
              fontWeight: 500,
            }}
          >
            Descrição:
          </label>
          <input
            type="text"
            placeholder="Ex: Compra de insumos..."
            value={novaSaida.descricao}
            onChange={(e) =>
              setNovaSaida({ ...novaSaida, descricao: e.target.value })
            }
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: "var(--fs-md)",
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: "var(--fs-md)",
              fontWeight: 500,
            }}
          >
            Categoria:
          </label>
          <select
            value={novaSaida.category_id}
            onChange={(e) =>
              setNovaSaida({
                ...novaSaida,
                category_id: Number(e.target.value),
              })
            }
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: "var(--fs-md)",
            }}
          >
            <option value={0}>Selecione uma categoria</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: "var(--fs-md)",
              fontWeight: 500,
            }}
          >
            Valor (R$):
          </label>
          <input
            type="text"
            placeholder="0,00"
            value={
              novaSaida.valor === 0
                ? ""
                : novaSaida.valor.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
            }
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              const cents = parseInt(value, 10);
              if (isNaN(cents)) setNovaSaida({ ...novaSaida, valor: 0 });
              else setNovaSaida({ ...novaSaida, valor: cents / 100 });
            }}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: "var(--fs-md)",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setShowModalSaida(false)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-secondary)",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "var(--shadow-card)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={adicionarSaida}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: "none",
              background: "var(--danger)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Adicionar Saída
          </button>
        </div>
      </div>
    </div>
  );
};
