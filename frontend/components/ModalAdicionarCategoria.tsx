import React from "react";

interface ModalAdicionarCategoriaProps {
  showModalCategoria: boolean;
  setShowModalCategoria: (show: boolean) => void;
  novaCategoria: {
    name: string;
    icon: string;
    color: string;
  };
  setNovaCategoria: React.Dispatch<
    React.SetStateAction<{
      name: string;
      icon: string;
      color: string;
    }>
  >;
  cores: string[];
  adicionarCategoria: () => void;
}

export const ModalAdicionarCategoria: React.FC<
  ModalAdicionarCategoriaProps
> = ({
  showModalCategoria,
  setShowModalCategoria,
  novaCategoria,
  setNovaCategoria,
  cores,
  adicionarCategoria,
}) => {
  if (!showModalCategoria) return null;

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
        zIndex: 1002,
      }}
      onClick={() => setShowModalCategoria(false)}
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
        <h2 style={{ margin: "0 0 20px 0", fontSize: "var(--fs-2xl)" }}>Nova Categoria</h2>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: "var(--fs-md)",
              fontWeight: 500,
            }}
          >
            Nome:
          </label>
          <input
            type="text"
            placeholder="Ex: Combustível, Verduras..."
            value={novaCategoria.name}
            onChange={(e) =>
              setNovaCategoria({ ...novaCategoria, name: e.target.value })
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
            Cor:
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {cores.map((cor) => (
              <button
                key={cor}
                onClick={() =>
                  setNovaCategoria({ ...novaCategoria, color: cor })
                }
                style={{
                  width: 32,
                  height: 32,
                  background: cor,
                  border:
                    novaCategoria.color === cor
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          <input
            type="color"
            value={novaCategoria.color}
            onChange={(e) =>
              setNovaCategoria({ ...novaCategoria, color: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setShowModalCategoria(false)}
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
            onClick={adicionarCategoria}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
};
