import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faEdit,
  faMinus,
  faPlus,
  faSave,
  faTimes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

interface Product {
  id: number;
  name: string;
  product_code: string;
  price: number;
  quantity: number;
  category_id: number;
  category?: {
    id: number;
    name: string;
  };
  active: boolean;
}

interface TabelaProdutosProps {
  produtos: Product[];
  loading: boolean;
  formatCurrency: (value: any) => string;
  abrirModalEditar: (produto: Product) => void;
  removerProduto: (id: number, name: string) => void;
  salvarAlteracoesEstoque: (
    alteracoes: { id: number; quantity: number }[],
  ) => void;
}

export const TabelaProdutos: React.FC<TabelaProdutosProps> = ({
  produtos,
  loading,
  formatCurrency,
  abrirModalEditar,
  removerProduto,
  salvarAlteracoesEstoque,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState<
    { id: number; quantity: number }[]
  >([]);
  const [modoEdicao, setModoEdicao] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          color: "var(--text-muted)",
          fontSize: "var(--fs-sm)",
        }}
      >
        Carregando...
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          color: "var(--text-muted)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ fontSize: "var(--fs-display)", marginBottom: 12 }}><FontAwesomeIcon icon={faBoxOpen} style={{ color: "var(--text-subtle)" }} /></div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--fs-sm)",
          }}
        >
          Nenhum produto encontrado
        </p>
      </div>
    );
  }

  const getQuantidadeAtual = (
    produtoId: number,
    quantidadeOriginal: number,
  ) => {
    const alteracao = alteracoesPendentes.find((a) => a.id === produtoId);

    return alteracao ? alteracao.quantity : quantidadeOriginal;
  };

  const alterarQuantidade = (
    produtoId: number,
    quantidadeOriginal: number,
    delta: number,
  ) => {
    const quantidadeAtual = getQuantidadeAtual(produtoId, quantidadeOriginal);

    const novaQuantidade = Math.max(0, quantidadeAtual + delta);

    setAlteracoesPendentes((prev) => {
      const existing = prev.find((a) => a.id === produtoId);

      if (existing) {
        if (novaQuantidade === quantidadeOriginal) {
          return prev.filter((a) => a.id !== produtoId);
        }

        return prev.map((a) =>
          a.id === produtoId ? { ...a, quantity: novaQuantidade } : a,
        );
      }

      if (novaQuantidade !== quantidadeOriginal) {
        return [
          ...prev,
          {
            id: produtoId,
            quantity: novaQuantidade,
          },
        ];
      }

      return prev;
    });

    setModoEdicao(true);
  };

  const cancelarAlteracoes = () => {
    setAlteracoesPendentes([]);
    setModoEdicao(false);
  };

  const salvarAlteracoes = () => {
    if (alteracoesPendentes.length > 0) {
      salvarAlteracoesEstoque(alteracoesPendentes);
      setAlteracoesPendentes([]);
      setModoEdicao(false);
    }
  };

  const BannerPendentes = () => (
    <div
      style={{
        background: "var(--warning-soft)",
        border: "1px solid var(--warning-border)",
        padding: "10px 14px",
        borderRadius: 10,
        marginBottom: 16,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "center",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: "var(--fs-xs)",
          color: "var(--warning-text)",
          textAlign: isMobile ? "center" : "left",
        }}
      >
        <FontAwesomeIcon icon={faSave} style={{ marginRight: 6 }} />
        {alteracoesPendentes.length} alteração(ões) pendente(s)
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
        }}
      >
        <button
          onClick={cancelarAlteracoes}
          style={{
            padding: "6px 12px",
            background: "var(--surface)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: "var(--fs-xs)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
          Cancelar
        </button>

        <button
          onClick={salvarAlteracoes}
          style={{
            padding: "6px 12px",
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: "var(--fs-xs)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FontAwesomeIcon icon={faSave} />
          Salvar ({alteracoesPendentes.length})
        </button>
      </div>
    </div>
  );

  // =========================
  // DESKTOP
  // =========================

  if (!isMobile) {
    return (
      <div>
        {modoEdicao && BannerPendentes()}

        <div
          style={{
            overflowX: "auto",
            border: "1px solid var(--border)",
            borderRadius: 10,
            background: "var(--surface)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "left",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Código
                </th>

                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "left",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Produto
                </th>

                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "left",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Categoria
                </th>

                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "right",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Preço
                </th>

                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "center",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Estoque
                </th>

                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "center",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {produtos.map((p, i) => {
                const quantidadeAtual = getQuantidadeAtual(p.id, p.quantity);

                const temAlteracao = alteracoesPendentes.some(
                  (a) => a.id === p.id,
                );

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom:
                        i < produtos.length - 1 ? "1px solid var(--border)" : "none",
                      background: temAlteracao ? "var(--warning-soft)" : "var(--surface)",
                    }}
                  >
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {p.product_code || "-"}
                    </td>

                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: "var(--fs-sm)",
                        fontWeight: 500,
                        color: "var(--text)",
                      }}
                    >
                      {p.name}
                    </td>

                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {p.category?.name || "-"}
                    </td>

                    <td
                      style={{
                        padding: "11px 14px",
                        textAlign: "right",
                        fontSize: "var(--fs-sm)",
                        fontWeight: 600,
                        color: "var(--primary)",
                      }}
                    >
                      {formatCurrency(p.price)}
                    </td>

                    <td
                      style={{
                        padding: "11px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() =>
                            alterarQuantidade(p.id, p.quantity, -1)
                          }
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--danger)";
                            e.currentTarget.style.borderColor = "var(--danger-border)";
                            e.currentTarget.style.background = "var(--danger-soft)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-muted)";
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.background = "var(--surface)";
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faMinus}
                            style={{ fontSize: "var(--fs-2xs)" }}
                          />
                        </button>

                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "var(--fs-sm)",
                            minWidth: 32,
                            textAlign: "center",
                            color: temAlteracao ? "var(--warning)" : "var(--text)",
                          }}
                        >
                          {quantidadeAtual}
                        </span>

                        <button
                          onClick={() => alterarQuantidade(p.id, p.quantity, 1)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--primary)";
                            e.currentTarget.style.borderColor = "var(--primary-border)";
                            e.currentTarget.style.background = "var(--primary-soft)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-muted)";
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.background = "var(--surface)";
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faPlus}
                            style={{ fontSize: "var(--fs-2xs)" }}
                          />
                        </button>
                      </div>

                      {temAlteracao && (
                        <div
                          style={{
                            fontSize: "var(--fs-2xs)",
                            color: "var(--warning)",
                            marginTop: 3,
                          }}
                        >
                          pendente
                        </div>
                      )}
                    </td>

                    <td
                      style={{
                        padding: "11px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => abrirModalEditar(p)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            fontSize: "var(--fs-md)",
                            padding: 4,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--primary)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-muted)";
                          }}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>

                        <button
                          onClick={() => removerProduto(p.id, p.name)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            fontSize: "var(--fs-md)",
                            padding: 4,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--danger)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-muted)";
                          }}
                          title="Excluir"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            textAlign: "center",
            fontSize: "var(--fs-2xs)",
            color: "var(--text-muted)",
          }}
        >
          Total: {produtos.length} produtos
        </div>
      </div>
    );
  }

  // =========================
  // MOBILE
  // =========================

  return (
    <div>
      {modoEdicao && BannerPendentes()}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {produtos.map((p) => {
          const quantidadeAtual = getQuantidadeAtual(p.id, p.quantity);

          const temAlteracao = alteracoesPendentes.some((a) => a.id === p.id);

          return (
            <div
              key={p.id}
              style={{
                background: temAlteracao ? "var(--warning-soft)" : "var(--surface)",
                borderRadius: 10,
                padding: 12,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "var(--fs-sm)",
                      color: "var(--text)",
                    }}
                  >
                    {p.name}
                  </div>

                  <div
                    style={{
                      fontSize: "var(--fs-2xs)",
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    Cód: {p.product_code || "-"}
                  </div>
                </div>

                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "var(--fs-sm)",
                    color: "var(--primary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(p.price)}
                </div>
              </div>

              <div
                style={{
                  fontSize: "var(--fs-2xs)",
                  color: "var(--text-muted)",
                  marginBottom: 10,
                }}
              >
                {p.category?.name || "Sem categoria"}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  borderTop: "1px solid var(--surface-3)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Estoque
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => alterarQuantidade(p.id, p.quantity, -1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesomeIcon icon={faMinus} style={{ fontSize: "var(--fs-2xs)" }} />
                  </button>

                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "var(--fs-sm)",
                      minWidth: 28,
                      textAlign: "center",
                      color: temAlteracao ? "var(--warning)" : "var(--text)",
                    }}
                  >
                    {quantidadeAtual}
                  </span>

                  <button
                    onClick={() => alterarQuantidade(p.id, p.quantity, 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: "var(--fs-2xs)" }} />
                  </button>
                </div>
              </div>

              {temAlteracao && (
                <div
                  style={{
                    fontSize: "var(--fs-2xs)",
                    color: "var(--warning)",
                    marginTop: 5,
                    textAlign: "right",
                  }}
                >
                  Alteração pendente
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: "1px solid var(--surface-3)",
                }}
              >
                <button
                  onClick={() => abrirModalEditar(p)}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: "var(--fs-sm)",
                    width: 30,
                    height: 30,
                  }}
                  title="Editar"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>

                <button
                  onClick={() => removerProduto(p.id, p.name)}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: "var(--fs-sm)",
                    width: 30,
                    height: 30,
                  }}
                  title="Excluir"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: 10,
          padding: "8px 12px",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          textAlign: "center",
          fontSize: "var(--fs-2xs)",
          color: "var(--text-muted)",
        }}
      >
        Total: {produtos.length} produtos
      </div>
    </div>
  );
};
