// components/TabelaProdutosPdv.tsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import ModalConfigProduto from "./ModalConfigProduto";

interface Produto {
  id: number;
  name: string;
  price: number;
  product_code?: string;
  category?: {
    id: number;
    name: string;
  };
}

interface Categoria {
  id: number;
  name: string;
}

interface Venda {
  id: number;
  customer_name: string;
  status: string;
  total?: number;
  table_id?: number;
}

interface PontoVenda {
  id: number;
  number: number;
}

interface TabelaProdutosPdvProps {
  produtos: Produto[];
  categorias: Categoria[];
  pontosVenda?: PontoVenda[];
  onProductSelect: (
    produto: Produto,
    vendaId: number,
    precoPersonalizado: number,
    quantify: number,
  ) => void;
  vendasAbertas?: Venda[];
  disabled?: boolean;
  isMobile?: boolean;
}

const TabelaProdutosPdv: React.FC<TabelaProdutosPdvProps> = ({
  produtos,
  categorias,
  pontosVenda = [],
  onProductSelect,
  vendasAbertas = [],
  disabled = false,
  isMobile = false,
}) => {
  const [filtroProduto, setFiltroProduto] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  const [modalVisible, setModalVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(
    null,
  );
  const [precoPersonalizado, setPrecoPersonalizado] = useState("");
  const [usarPrecoPersonalizado, setUsarPrecoPersonalizado] = useState(false);
  const [vendaSelecionadaId, setVendaSelecionadaId] = useState<number | null>(
    null,
  );
  const [quantidade, setQuantidade] = useState(1);

  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // =========================
  // FILTROS
  // =========================

  const produtosFiltrados = produtos.filter((produto) => {
    const searchTerm = filtroProduto.toLowerCase();

    const matchesName = produto.name.toLowerCase().includes(searchTerm);

    const matchesCode =
      produto.product_code &&
      produto.product_code.toLowerCase().includes(searchTerm);

    return matchesName || matchesCode;
  });

  const quantidadeFinal = Math.max(1, Math.floor(Number(quantidade)));

  const categoriasUnicas = [
    "todas",
    ...new Set(categorias.map((cat) => cat.name)),
  ];

  const produtosFiltradosPorCategoria = produtosFiltrados.filter((produto) => {
    if (categoriaSelecionada === "todas") return true;

    const categoriaProduto = categorias.find(
      (cat) => cat.id === produto.category?.id,
    );

    return categoriaProduto?.name === categoriaSelecionada;
  });

  // =========================
  // AUXILIARES
  // =========================

  const getNomePontoVenda = (tableId?: number): string => {
    if (!tableId) return "-";

    const ponto = pontosVenda.find((p) => p.id === tableId);

    if (!ponto) return "-";

    return ponto.number === 0
      ? "Balcão"
      : `Ponto ${ponto.number.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (value: number): string => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
  };

  // =========================
  // AÇÕES
  // =========================

  const handleAddClick = (produto: Produto) => {
    if (vendasAbertas.length === 0) {
      showToast("⚠️ Abra uma nova venda primeiro");
      return;
    }

    setProdutoSelecionado(produto);
    setPrecoPersonalizado("");
    setUsarPrecoPersonalizado(false);
    setVendaSelecionadaId(null);
    setQuantidade(1); // Reset quantidade ao abrir modal
    setModalVisible(true);
  };

  const handleConfirmAdd = () => {
    if (!produtoSelecionado) return;

    let precoFinal = produtoSelecionado.price;

    if (usarPrecoPersonalizado) {
      const valorNumerico = parseFloat(precoPersonalizado.replace(",", "."));

      if (!isNaN(valorNumerico) && valorNumerico > 0) {
        precoFinal = valorNumerico;
      } else {
        showToast("⚠️ Informe um preço válido");
        return;
      }
    }

    if (vendasAbertas.length === 1 && !vendaSelecionadaId) {
      onProductSelect(
        produtoSelecionado,
        vendasAbertas[0].id,
        precoFinal,
        quantidadeFinal,
      );

      showToast(
        `✅ ${quantidadeFinal}x ${produtoSelecionado.name} adicionado!`,
      );
      closeModal();
    } else if (vendaSelecionadaId) {
      onProductSelect(
        produtoSelecionado,
        vendaSelecionadaId,
        precoFinal,
        quantidadeFinal,
      );

      showToast(
        `✅ ${quantidadeFinal}x ${produtoSelecionado.name} adicionado!`,
      );
      closeModal();
    } else {
      showToast("⚠️ Selecione uma venda");
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setProdutoSelecionado(null);
    setPrecoPersonalizado("");
    setVendaSelecionadaId(null);
    setUsarPrecoPersonalizado(false);
    setQuantidade(1);
  };

  // =========================
  // TOAST
  // =========================

  const Toast = () => {
    if (!toast.show) return null;

    const isWarning = toast.message.includes("⚠️");

    return (
      <div
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10000,
          background: isWarning ? "#f59e0b" : "#10b981",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: 13,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 8,
          animation: "slideDown 0.3s ease-out",
          minWidth: 200,
          justifyContent: "center",
        }}
      >
        {!isWarning && <FontAwesomeIcon icon={faCheck} />}

        {toast.message}

        <style>
          {`
            @keyframes slideDown {
              from {
                transform: translateX(-50%) translateY(-20px);
                opacity: 0;
              }

              to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
              }
            }
          `}
        </style>
      </div>
    );
  };

  // =========================
  // FILTROS
  // =========================

  const filtros = (
    <div
      style={{
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#f3f4f6",
          borderRadius: 8,
          padding: "2px",
          marginBottom: 12,
        }}
      >
        <input
          type="text"
          placeholder="Buscar produto..."
          value={filtroProduto}
          onChange={(e) => setFiltroProduto(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.boxShadow = "0 0 0 2px #d1fae5";
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = "#f3f4f6";
            e.currentTarget.style.boxShadow = "none";
          }}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            borderRadius: 7,
            border: "1px solid transparent",
            outline: "none",
            background: "#f3f4f6",
            color: "#111827",
            fontSize: 13,
            cursor: "text",
            position: "relative",
            zIndex: 2,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {categoriasUnicas.map((cat) => {
          const ativo = categoriaSelecionada === cat;

          return (
            <button
              key={cat}
              onClick={() => setCategoriaSelecionada(cat)}
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                border: ativo ? "1px solid #10b981" : "1px solid #e5e7eb",
                background: ativo ? "#ecfdf5" : "#fff",
                color: ativo ? "#059669" : "#6b7280",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: ativo ? 600 : 500,
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {cat === "todas" ? "Todos" : cat}
            </button>
          );
        })}
      </div>
    </div>
  );

  // =========================
  // DESKTOP
  // =========================

  if (!isMobile) {
    return (
      <>
        <Toast />

        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            color: "#111827",
          }}
        >
          {filtros}

          {/* TABELA */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              background: "#fff",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead
                style={{
                  background: "#f9fafb",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "11px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Código
                  </th>

                  <th
                    style={{
                      padding: "11px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Produto
                  </th>

                  <th
                    style={{
                      padding: "11px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Categoria
                  </th>

                  <th
                    style={{
                      padding: "11px 14px",
                      textAlign: "right",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Preço
                  </th>

                  <th
                    style={{
                      padding: "11px 14px",
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody>
                {produtosFiltradosPorCategoria.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom:
                        i < produtosFiltradosPorCategoria.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      {p.product_code || "-"}
                    </td>

                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#111827",
                      }}
                    >
                      {p.name}
                    </td>

                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      {categorias.find((c) => c.id === p.category?.id)?.name ||
                        "-"}
                    </td>

                    <td
                      style={{
                        padding: "12px 14px",
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
                        padding: "12px 14px",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() => handleAddClick(p)}
                        disabled={disabled}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 6,
                          border: "none",
                          background: disabled ? "#d1d5db" : "#10b981",
                          color: "#fff",
                          cursor: disabled ? "not-allowed" : "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!disabled) {
                            e.currentTarget.style.background = "#059669";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!disabled) {
                            e.currentTarget.style.background = "#10b981";
                          }
                        }}
                      >
                        Adicionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {produtosFiltradosPorCategoria.length === 0 && (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: 13,
                }}
              >
                Nenhum produto encontrado.
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div
            style={{
              marginTop: 10,
              padding: "9px 12px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              textAlign: "center",
              fontSize: 11,
              color: "#6b7280",
            }}
          >
            Total:{" "}
            <strong style={{ color: "#374151" }}>
              {produtosFiltradosPorCategoria.length}
            </strong>{" "}
            produtos
          </div>

          {modalVisible && (
            <ModalConfigProduto
              produtoSelecionado={produtoSelecionado}
              vendasAbertas={vendasAbertas}
              vendaSelecionadaId={vendaSelecionadaId}
              setVendaSelecionadaId={setVendaSelecionadaId}
              quantidade={quantidade}
              setQuantidade={setQuantidade}
              precoPersonalizado={precoPersonalizado}
              setPrecoPersonalizado={setPrecoPersonalizado}
              usarPrecoPersonalizado={usarPrecoPersonalizado}
              setUsarPrecoPersonalizado={setUsarPrecoPersonalizado}
              closeModal={closeModal}
              handleConfirmAdd={handleConfirmAdd}
              getNomePontoVenda={getNomePontoVenda}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      </>
    );
  }

  // =========================
  // MOBILE
  // =========================

  return (
    <>
      <Toast />

      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          color: "#111827",
        }}
      >
        {filtros}

        {/* CARDS */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
          }}
        >
          {produtosFiltradosPorCategoria.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: 14,
                marginBottom: 8,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {p.name}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: "#9ca3af",
                      marginTop: 3,
                    }}
                  >
                    Cód: {p.product_code || "-"}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#059669",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(p.price)}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #f3f4f6",
                  paddingTop: 9,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                  }}
                >
                  {categorias.find((c) => c.id === p.category?.id)?.name || "-"}
                </span>

                <button
                  onClick={() => handleAddClick(p)}
                  disabled={disabled}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 6,
                    border: "none",
                    background: disabled ? "#d1d5db" : "#10b981",
                    color: "#fff",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          ))}

          {produtosFiltradosPorCategoria.length === 0 && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              Nenhum produto encontrado.
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: 10,
            padding: 9,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            textAlign: "center",
            fontSize: 11,
            color: "#6b7280",
          }}
        >
          Total:{" "}
          <strong style={{ color: "#374151" }}>
            {produtosFiltradosPorCategoria.length}
          </strong>{" "}
          produtos
        </div>

        {modalVisible && (
          <ModalConfigProduto
            produtoSelecionado={produtoSelecionado}
            vendasAbertas={vendasAbertas}
            vendaSelecionadaId={vendaSelecionadaId}
            setVendaSelecionadaId={setVendaSelecionadaId}
            quantidade={quantidade}
            setQuantidade={setQuantidade}
            precoPersonalizado={precoPersonalizado}
            setPrecoPersonalizado={setPrecoPersonalizado}
            usarPrecoPersonalizado={usarPrecoPersonalizado}
            setUsarPrecoPersonalizado={setUsarPrecoPersonalizado}
            closeModal={closeModal}
            handleConfirmAdd={handleConfirmAdd}
            getNomePontoVenda={getNomePontoVenda}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </>
  );
};

export default TabelaProdutosPdv;
