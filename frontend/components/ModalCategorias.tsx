import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPen,
  faTrash,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

interface Category {
  id: number;
  name: string;
  restaurant_id: number;
}

interface ModalCategoriasProps {
  showModalCategoria: boolean;
  setShowModalCategoria: (show: boolean) => void;
  categorias: Category[];
  editandoCategoria: Category | null;
  setEditandoCategoria: (cat: Category | null) => void;
  novaCategoria: { name: string };
  setNovaCategoria: (cat: { name: string }) => void;
  adicionarCategoria: () => void;
  editarCategoria: () => void;
  excluirCategoria: (id: number, name: string) => void;
}

export const ModalCategorias: React.FC<ModalCategoriasProps> = ({
  showModalCategoria,
  setShowModalCategoria,
  categorias,
  editandoCategoria,
  setEditandoCategoria,
  novaCategoria,
  setNovaCategoria,
  adicionarCategoria,
  editarCategoria,
  excluirCategoria,
}) => {
  if (!showModalCategoria) return null;

  const fecharModal = () => {
    setShowModalCategoria(false);
    setEditandoCategoria(null);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    height: 42,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "#fff",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1001,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          fecharModal();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "var(--shadow-modal)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid var(--surface-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              Categorias
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--text-subtle)",
              }}
            >
              Adicione, edite ou remova categorias de produtos.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "none",
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Fechar"
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: 14 }} />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div
          style={{
            padding: "22px",
            overflowY: "auto",
          }}
        >
          {/* NOVA CATEGORIA */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                marginBottom: 7,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary)",
              }}
            >
              Nova categoria
            </label>

            <div
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              <input
                type="text"
                placeholder="Nome da categoria"
                value={novaCategoria.name}
                onChange={(e) =>
                  setNovaCategoria({
                    name: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarCategoria();
                  }
                }}
                style={{
                  ...inputStyle,
                  flex: 1,
                }}
              />

              <button
                type="button"
                onClick={adicionarCategoria}
                disabled={!novaCategoria.name.trim()}
                style={{
                  height: 42,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "none",
                  background: novaCategoria.name.trim() ? "var(--primary)" : "var(--border)",
                  color: novaCategoria.name.trim() ? "#fff" : "var(--text-subtle)",
                  cursor: novaCategoria.name.trim() ? "pointer" : "not-allowed",
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* DIVISOR */}
          <div
            style={{
              height: 1,
              background: "var(--surface-3)",
              marginBottom: 20,
            }}
          />

          {/* LISTA */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Categorias cadastradas
              </span>

              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-subtle)",
                }}
              >
                {categorias.length}{" "}
                {categorias.length === 1 ? "categoria" : "categorias"}
              </span>
            </div>

            {categorias.length === 0 ? (
              <div
                style={{
                  padding: "28px 20px",
                  border: "1px dashed var(--border)",
                  borderRadius: 12,
                  textAlign: "center",
                  color: "var(--text-subtle)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                  }}
                >
                  Nenhuma categoria cadastrada.
                </p>
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid var(--surface-3)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {categorias.map((cat, index) => {
                  const editando = editandoCategoria?.id === cat.id;

                  return (
                    <div
                      key={cat.id}
                      style={{
                        padding: "11px 12px",
                        borderBottom:
                          index !== categorias.length - 1
                            ? "1px solid var(--surface-3)"
                            : "none",
                        background: editando ? "var(--surface-2)" : "#fff",
                      }}
                    >
                      {editando ? (
                        /* MODO EDIÇÃO */
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
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
                              ...inputStyle,
                              height: 38,
                              flex: 1,
                            }}
                            autoFocus
                          />

                          <button
                            type="button"
                            onClick={editarCategoria}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              border: "none",
                              background: "var(--primary-soft)",
                              color: "var(--primary)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Salvar"
                          >
                            <FontAwesomeIcon
                              icon={faCheck}
                              style={{ fontSize: 13 }}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditandoCategoria(null)}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              border: "1px solid var(--border)",
                              background: "#fff",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "var(--shadow-card)",
                            }}
                            title="Cancelar edição"
                          >
                            <FontAwesomeIcon
                              icon={faTimes}
                              style={{ fontSize: 13 }}
                            />
                          </button>
                        </div>
                      ) : (
                        /* MODO NORMAL */
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {cat.name}
                          </span>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {/* EDITAR */}
                            <button
                              type="button"
                              onClick={() => setEditandoCategoria(cat)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: "none",
                                background: "transparent",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Editar categoria"
                            >
                              <FontAwesomeIcon
                                icon={faPen}
                                style={{ fontSize: 12 }}
                              />
                            </button>

                            {/* EXCLUIR */}
                            <button
                              type="button"
                              onClick={() => excluirCategoria(cat.id, cat.name)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: "none",
                                background: "transparent",
                                color: "var(--text-subtle)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Excluir categoria"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                style={{ fontSize: 12 }}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--surface-3)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={fecharModal}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "#fff",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              boxShadow: "var(--shadow-card)",
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
