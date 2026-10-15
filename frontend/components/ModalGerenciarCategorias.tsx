import React from "react";

interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface Transaction {
  id: number;
  category_id: number;
  type: string;
}

interface ModalGerenciarCategoriasProps {
  showModalGerenciar: boolean;
  setShowModalGerenciar: (show: boolean) => void;
  categorias: ExpenseCategory[];
  editandoCategoria: ExpenseCategory | null;
  setEditandoCategoria: (cat: ExpenseCategory | null) => void;
  transacoes: Transaction[];
  editarCategoria: () => void;
  excluirCategoria: (id: number, name: string) => void;
  setShowModalCategoria: (show: boolean) => void;
}

export const ModalGerenciarCategorias: React.FC<
  ModalGerenciarCategoriasProps
> = ({
  showModalGerenciar,
  setShowModalGerenciar,
  categorias,
  editandoCategoria,
  setEditandoCategoria,
  transacoes,
  editarCategoria,
  excluirCategoria,
  setShowModalCategoria,
}) => {
  if (!showModalGerenciar) return null;

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
        zIndex: 1000,
      }}
      onClick={() => {
        setShowModalGerenciar(false);
        setEditandoCategoria(null);
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          width: "90%",
          maxWidth: 550,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>Gerenciar Categorias</h2>
          <button
            onClick={() => setShowModalCategoria(true)}
            style={{
              padding: "6px 12px",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            + Nova Categoria
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {categorias.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--surface-2)",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            >
              {editandoCategoria?.id === cat.id ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="text"
                    value={editandoCategoria.name}
                    onChange={(e) =>
                      setEditandoCategoria({
                        ...editandoCategoria,
                        name: e.target.value,
                      })
                    }
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      flex: 1,
                    }}
                    autoFocus
                  />
                  <input
                    type="color"
                    value={editandoCategoria.color}
                    onChange={(e) =>
                      setEditandoCategoria({
                        ...editandoCategoria,
                        color: e.target.value,
                      })
                    }
                    style={{
                      width: 50,
                      height: 36,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  />
                  <button
                    onClick={editarCategoria}
                    style={{
                      padding: "6px 12px",
                      background: "var(--primary)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditandoCategoria(null)}
                    style={{
                      padding: "6px 12px",
                      background: "var(--text-muted)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: cat.color,
                        border: "1px solid var(--border)",
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {cat.name}
                    </span>
                    {transacoes.some(
                      (t) => t.type === "saida" && t.category_id === cat.id,
                    ) && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--warning)",
                          background: "var(--warning-soft)",
                          padding: "2px 6px",
                          borderRadius: 14,
                        }}
                      >
                        em uso
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setEditandoCategoria(cat)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 18,
                        cursor: "pointer",
                        color: "var(--text-muted)",
                      }}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => excluirCategoria(cat.id, cat.name)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 18,
                        cursor: "pointer",
                        color: "var(--danger)",
                      }}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setShowModalGerenciar(false);
            setEditandoCategoria(null);
          }}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "10px",
            background: "var(--text-secondary)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
