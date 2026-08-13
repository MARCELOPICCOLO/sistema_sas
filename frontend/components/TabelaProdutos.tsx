import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faMinus,
  faPlus,
  faSave,
  faTimes,
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
          color: "#6b7280",
          fontSize: 13,
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
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          color: "#6b7280",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
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
        background: "#fffbeb",
        border: "1px solid #fde68a",
        padding: "10px 14px",
        borderRadius: 8,
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
          fontSize: 12,
          color: "#92400e",
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
            background: "#fff",
            color: "#6b7280",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
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
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
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
        {modoEdicao && <BannerPendentes />}

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
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
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Código
                </th>

                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Produto
                </th>

                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Categoria
                </th>

                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "right",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Preço
                </th>

                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Estoque
                </th>

                <th
                  style={{
                    padding: "11px 14px",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
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
                        i < produtos.length - 1 ? "1px solid #f0f0f0" : "none",
                      background: temAlteracao ? "#fffbeb" : "#fff",
                    }}
                  >
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      {p.product_code || "-"}
                    </td>

                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#111827",
                      }}
                    >
                      {p.name}
                    </td>

                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      {p.category?.name || "-"}
                    </td>

                    <td
                      style={{
                        padding: "11px 14px",
                        textAlign: "right",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#059669",
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
                            borderRadius: 5,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            color: "#6b7280",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#dc2626";
                            e.currentTarget.style.borderColor = "#fecaca";
                            e.currentTarget.style.background = "#fef2f2";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#6b7280";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "#fff";
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faMinus}
                            style={{ fontSize: 10 }}
                          />
                        </button>

                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            minWidth: 32,
                            textAlign: "center",
                            color: temAlteracao ? "#d97706" : "#111827",
                          }}
                        >
                          {quantidadeAtual}
                        </span>

                        <button
                          onClick={() => alterarQuantidade(p.id, p.quantity, 1)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 5,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            color: "#6b7280",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#059669";
                            e.currentTarget.style.borderColor = "#a7f3d0";
                            e.currentTarget.style.background = "#ecfdf5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#6b7280";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "#fff";
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faPlus}
                            style={{ fontSize: 10 }}
                          />
                        </button>
                      </div>

                      {temAlteracao && (
                        <div
                          style={{
                            fontSize: 9,
                            color: "#d97706",
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
                            color: "#6b7280",
                            fontSize: 14,
                            padding: 4,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#10b981";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#6b7280";
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
                            color: "#6b7280",
                            fontSize: 14,
                            padding: 4,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#6b7280";
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
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            textAlign: "center",
            fontSize: 11,
            color: "#6b7280",
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
      {modoEdicao && <BannerPendentes />}

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
                background: temAlteracao ? "#fffbeb" : "#fff",
                borderRadius: 8,
                padding: 12,
                border: "1px solid #e5e7eb",
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
                      fontSize: 13,
                      color: "#111827",
                    }}
                  >
                    {p.name}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    Cód: {p.product_code || "-"}
                  </div>
                </div>

                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#059669",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(p.price)}
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
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
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "#374151",
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
                      borderRadius: 5,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#6b7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesomeIcon icon={faMinus} style={{ fontSize: 10 }} />
                  </button>

                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      minWidth: 28,
                      textAlign: "center",
                      color: temAlteracao ? "#d97706" : "#111827",
                    }}
                  >
                    {quantidadeAtual}
                  </span>

                  <button
                    onClick={() => alterarQuantidade(p.id, p.quantity, 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 5,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#6b7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: 10 }} />
                  </button>
                </div>
              </div>

              {temAlteracao && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#d97706",
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
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                <button
                  onClick={() => abrirModalEditar(p)}
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 5,
                    cursor: "pointer",
                    color: "#6b7280",
                    fontSize: 13,
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
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 5,
                    cursor: "pointer",
                    color: "#6b7280",
                    fontSize: 13,
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
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          textAlign: "center",
          fontSize: 11,
          color: "#6b7280",
        }}
      >
        Total: {produtos.length} produtos
      </div>
    </div>
  );
};
