import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCartShopping,
  faTableCells,
  faUser,
  faArrowRight,
  faArrowLeft,
  faFilter,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import NovaVenda from "../../components/NovaVenda";
import { ModalAbrirComanda } from "../../components/ModalAbrirComanda";

const API_URL = import.meta.env.VITE_API_URL;

interface Produto {
  id: number;
  name: string;
  product_code?: string;
  price: number;
  category_id: number;
}

interface ItemCarrinho {
  id: number;
  produto: Produto;
  quantidade: number;
  preco: number;
}

export interface Comanda {
  id: number;
  numero: number;
  cliente: string;
  mesa: number | null;
  status: "aberta" | "fechado" | "pendente" | "cancelada";
  payment_method?: string | null;
  itens: ItemCarrinho[];
  total: number;
  order_date?: string;
  closed_at?: string | null;
}

interface OrderApi {
  id: number;
  command_number: number;
  sales_point_id?: number | null;
  customer_name?: string | null;
  status: string;
  payment_method?: string | null;
  total?: number | string | null;
  order_date?: string;
  closed_at?: string | null;
  items?: Array<{
    id: number;
    order_id?: number;
    product_id: number;
    quantity: number;
    price: number | string;
    note?: string | null;
    created_at?: string;
    updated_at?: string;
    product?: {
      id: number;
      name: string;
      product_code?: string;
      price?: number | string;
      category_id?: number;
    };
  }>;
}

type FiltroStatus =
  | "todas"
  | "abertas"
  | "fechadas"
  | "pendentes"
  | "nao_pagas";

interface GestaoComandasProps {
  setTela?: (tela: string) => void;
  onAbrirComanda?: (comanda: Comanda) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const normalizarComanda = (order: OrderApi): Comanda => {
  const itens: ItemCarrinho[] = (order.items || []).map((item) => ({
    id: Number(item.id),
    produto: {
      id: item.product?.id ?? item.product_id,
      name: item.product?.name ?? `Produto ${item.product_id}`,
      product_code: item.product?.product_code,
      price: Number(item.product?.price ?? item.price),
      category_id: item.product?.category_id ?? 0,
    },
    quantidade: Number(item.quantity),
    preco: Number(item.price),
  }));

  let status: Comanda["status"] = "aberta";

  if (order.status === "fechado") {
    status = "fechado";
  } else if (order.status === "pendente") {
    status = "pendente";
  } else if (order.status === "cancelado") {
    status = "cancelada";
  }

  return {
    id: order.id,
    numero: Number(order.command_number),
    cliente: order.customer_name || "Consumidor",
    mesa: order.sales_point_id ?? null,
    status,
    payment_method: order.payment_method ?? null,
    itens,
    total: Number(order.total || 0),
    order_date: order.order_date,
    closed_at: order.closed_at ?? null,
  };
};

export default function GestaoComandas({
  setTela,
  onAbrirComanda,
}: GestaoComandasProps) {
  const [comandas, setComandas] = useState<Comanda[]>([]);

  const [comandaSelecionada, setComandaSelecionada] = useState<Comanda | null>(
    null,
  );

  const [mostrarNovaVenda, setMostrarNovaVenda] = useState(false);

  const [mostrarModalAbrirComanda, setMostrarModalAbrirComanda] =
    useState(false);

  const [filtro, setFiltro] = useState<FiltroStatus>("abertas");

  const [loading, setLoading] = useState(true);

  const [erro, setErro] = useState("");

  const carregarComandas = async () => {
    try {
      setLoading(true);
      setErro("");

      const token = localStorage.getItem("auth_token");

      const response = await axios.get(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const orders: OrderApi[] = Array.isArray(response.data)
        ? response.data
        : response.data?.orders || [];

      const comandasApi = orders.map(normalizarComanda);

      setComandas(comandasApi);

      setComandaSelecionada((atual) => {
        if (!atual) {
          return null;
        }

        const atualizada = comandasApi.find(
          (comanda) => comanda.id === atual.id,
        );

        return atualizada || atual;
      });
    } catch (error) {
      console.error("Erro ao carregar comandas:", error);
      setErro("Não foi possível carregar as comandas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarComandas();
  }, []);

  const comandasFiltradas = useMemo(() => {
    return comandas.filter((comanda) => {
      switch (filtro) {
        case "abertas":
          return comanda.status === "aberta";

        case "fechadas":
          return (
            comanda.status === "fechado" &&
            comanda.payment_method !== "pendente"
          );

        case "pendentes":
          return comanda.status === "pendente";

        case "nao_pagas":
          return comanda.payment_method === "pendente";

        default:
          return true;
      }
    });
  }, [comandas, filtro]);

  const quantidadeAbertas = useMemo(() => {
    return comandas.filter((comanda) => comanda.status === "aberta").length;
  }, [comandas]);

  const quantidadeFechadas = useMemo(() => {
    return comandas.filter(
      (comanda) =>
        comanda.status === "fechado" && comanda.payment_method !== "pendente",
    ).length;
  }, [comandas]);

  const quantidadePendentes = useMemo(() => {
    return comandas.filter((comanda) => comanda.status === "pendente").length;
  }, [comandas]);

  const quantidadeNaoPagas = useMemo(() => {
    return comandas.filter((comanda) => comanda.payment_method === "pendente")
      .length;
  }, [comandas]);

  const abrirModalNovaComanda = () => {
    setMostrarModalAbrirComanda(true);
  };

  const fecharModalNovaComanda = () => {
    setMostrarModalAbrirComanda(false);
  };

  const criarComanda = async (
    numeroComanda: number,
    nomeCliente: string,
    dataComanda: string,
  ) => {
    try {
      const token = localStorage.getItem("auth_token");

      const response = await axios.post(
        `${API_URL}/orders`,
        {
          sales_point_id: numeroComanda,
          order_date: dataComanda,
          customer_name: nomeCliente,
          status: "aberto",
          total: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const order: OrderApi = response.data.order;

      const novaComanda = normalizarComanda(order);

      setComandas((atual) => [...atual, novaComanda]);

      setComandaSelecionada(novaComanda);
      setMostrarNovaVenda(true);
      setMostrarModalAbrirComanda(false);

      onAbrirComanda?.(novaComanda);
    } catch (error) {
      console.error("Erro ao criar comanda:", error);
      setErro("Não foi possível criar a comanda.");
    }
  };

  const abrirComandaExistente = (comanda: Comanda) => {
    setComandaSelecionada(comanda);
    setMostrarNovaVenda(true);

    onAbrirComanda?.(comanda);
  };

  const voltarParaComandas = async () => {
    setMostrarNovaVenda(false);
    setComandaSelecionada(null);

    await carregarComandas();
  };

  const atualizarComanda = (comandaId: number, dados: Partial<Comanda>) => {
    setComandas((atual) =>
      atual.map((comanda) =>
        comanda.id === comandaId
          ? {
              ...comanda,
              ...dados,
            }
          : comanda,
      ),
    );

    setComandaSelecionada((atual) => {
      if (!atual || atual.id !== comandaId) {
        return atual;
      }

      return {
        ...atual,
        ...dados,
      };
    });
  };

  const getStatusInfo = (comanda: Comanda) => {
    if (comanda.payment_method === "pendente") {
      return {
        label: "Não paga",
        background: "#fef2f2",
        color: "#dc2626",
      };
    }

    if (comanda.status === "aberta") {
      return {
        label: "Aberta",
        background: "#ecfdf5",
        color: "#059669",
      };
    }

    if (comanda.status === "pendente") {
      return {
        label: "Pendente",
        background: "#fffbeb",
        color: "#d97706",
      };
    }

    if (comanda.status === "fechado") {
      return {
        label: "Fechada",
        background: "#f3f4f6",
        color: "#6b7280",
      };
    }

    return {
      label: "Cancelada",
      background: "#f3f4f6",
      color: "#6b7280",
    };
  };

  const getQuantidadeItens = (comanda: Comanda) => {
    return comanda.itens.reduce((total, item) => total + item.quantidade, 0);
  };

  if (mostrarNovaVenda && comandaSelecionada) {
    const somenteLeitura = comandaSelecionada.status === "fechado";

    return (
      <NovaVenda
        comanda={comandaSelecionada}
        somenteLeitura={somenteLeitura}
        onVoltar={voltarParaComandas}
        onAtualizarComanda={(dados) => {
          if (somenteLeitura) {
            return;
          }

          atualizarComanda(comandaSelecionada.id, dados);
        }}
        onFinalizar={() => {
          if (somenteLeitura) {
            return;
          }

          atualizarComanda(comandaSelecionada.id, {
            status: "fechado",
          });

          voltarParaComandas();
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100%",
        width: "100%",
        background: "#f8fafc",
        color: "#111827",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1600,
          margin: "0 auto",
          padding: "18px 20px 24px",
          boxSizing: "border-box",
        }}
      >
        {setTela && (
          <div
            style={{
              marginBottom: 14,
            }}
          >
            <button
              type="button"
              onClick={() => setTela("dashboard")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "7px 10px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 7,
                cursor: "pointer",
                color: "#6b7280",
                fontSize: 11,
                fontWeight: 500,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ecfdf5";
                e.currentTarget.style.borderColor = "#a7f3d0";
                e.currentTarget.style.color = "#059669";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#6b7280";
              }}
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                style={{
                  fontSize: 10,
                }}
              />
              Voltar ao Dashboard
            </button>
          </div>
        )}

        <div
          className="gestao-comandas-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Gestão de Comandas
            </h1>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Controle das comandas abertas e mesas em atendimento
            </p>
          </div>

          <button
            type="button"
            onClick={abrirModalNovaComanda}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              height: 34,
              padding: "0 11px",
              borderRadius: 7,
              border: "1px solid #d1fae5",
              background: "#ecfdf5",
              color: "#047857",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <FontAwesomeIcon
              icon={faPlus}
              style={{
                fontSize: 10,
              }}
            />
            Abrir comanda
          </button>
        </div>

        <div
          className="gestao-comandas-filtros"
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 10,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 7,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginRight: 4,
              color: "#6b7280",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            <FontAwesomeIcon
              icon={faFilter}
              style={{
                fontSize: 10,
              }}
            />
            Filtros
          </div>

          <button
            type="button"
            onClick={() => setFiltro("todas")}
            style={filtroButtonStyle(filtro === "todas")}
          >
            Todas
            <span>{comandas.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro("abertas")}
            style={filtroButtonStyle(filtro === "abertas")}
          >
            Abertas
            <span>{quantidadeAbertas}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro("fechadas")}
            style={filtroButtonStyle(filtro === "fechadas")}
          >
            Fechadas
            <span>{quantidadeFechadas}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro("pendentes")}
            style={filtroButtonStyle(filtro === "pendentes", "orange")}
          >
            Pendentes
            <span>{quantidadePendentes}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro("nao_pagas")}
            style={filtroButtonStyle(filtro === "nao_pagas", "red")}
          >
            Não pagas
            <span>{quantidadeNaoPagas}</span>
          </button>

          <div
            style={{
              marginLeft: "auto",
            }}
          >
            <button
              type="button"
              onClick={carregarComandas}
              disabled={loading}
              title="Atualizar comandas"
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#6b7280",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <FontAwesomeIcon
                icon={faRotate}
                spin={loading}
                style={{
                  fontSize: 11,
                }}
              />
            </button>
          </div>
        </div>

        <div
          className="gestao-comandas-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FontAwesomeIcon
                icon={faTableCells}
                style={{
                  color: "#059669",
                  fontSize: 13,
                }}
              />

              <strong
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Comandas
              </strong>

              <span
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                {comandasFiltradas.length} encontradas
              </span>
            </div>

            <div
              style={{
                padding: 18,
              }}
            >
              {loading ? (
                <div
                  style={{
                    minHeight: 250,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    fontSize: 12,
                  }}
                >
                  Carregando comandas...
                </div>
              ) : erro ? (
                <div
                  style={{
                    minHeight: 250,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#dc2626",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                    }}
                  >
                    {erro}
                  </span>

                  <button
                    type="button"
                    onClick={carregarComandas}
                    style={{
                      marginTop: 10,
                      padding: "7px 12px",
                      borderRadius: 7,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#374151",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : comandasFiltradas.length === 0 ? (
                <div
                  style={{
                    minHeight: 150,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#9ca3af",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCartShopping}
                    style={{
                      fontSize: 14,
                      marginBottom: 12,
                    }}
                  />

                  <strong
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Nenhuma comanda encontrada
                  </strong>

                  <span
                    style={{
                      marginTop: 5,
                      fontSize: 11,
                    }}
                  >
                    Não existem comandas para esse filtro.
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(190px, 1fr))",
                    gap: 12,
                  }}
                >
                  {comandasFiltradas.map((comanda) => {
                    const status = getStatusInfo(comanda);

                    return (
                      <button
                        key={comanda.id}
                        type="button"
                        onClick={() => abrirComandaExistente(comanda)}
                        style={{
                          textAlign: "left",
                          border: "1px solid #e5e7eb",
                          borderRadius: 9,
                          background: "#fff",
                          padding: 14,
                          cursor: "pointer",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <strong
                            style={{
                              fontSize: 13,
                              color: "#111827",
                              minWidth: 0,
                            }}
                          >
                            Comanda #{comanda.numero}
                          </strong>

                          <FontAwesomeIcon
                            icon={faArrowRight}
                            style={{
                              color: "#9ca3af",
                              fontSize: 11,
                              flexShrink: 0,
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 10,
                            fontSize: 11,
                            color: "#6b7280",
                            minWidth: 0,
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faUser}
                            style={{
                              fontSize: 10,
                              flexShrink: 0,
                            }}
                          />

                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {comanda.cliente || "Consumidor"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            marginTop: 12,
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 7px",
                              borderRadius: 20,
                              background: status.background,
                              color: status.color,
                              fontSize: 9,
                              fontWeight: 600,
                            }}
                          >
                            {status.label}
                          </span>

                          <span
                            style={{
                              fontSize: 10,
                              color: "#9ca3af",
                            }}
                          >
                            {getQuantidadeItens(comanda)} itens
                          </span>

                          <strong
                            style={{
                              fontSize: 13,
                              color: "#059669",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatCurrency(comanda.total)}
                          </strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <strong
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Comandas abertas
                </strong>

                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    padding: "0 6px",
                    borderRadius: 20,
                    background: "#ecfdf5",
                    color: "#059669",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {quantidadeAbertas}
                </span>
              </div>
            </div>

            <div>
              {comandas
                .filter((comanda) => comanda.status === "aberta")
                .map((comanda) => (
                  <button
                    key={comanda.id}
                    type="button"
                    onClick={() => abrirComandaExistente(comanda)}
                    style={{
                      width: "100%",
                      padding: "13px 16px",
                      border: "none",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 12,
                          color: "#374151",
                        }}
                      >
                        Comanda #{comanda.numero}
                      </strong>

                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#059669",
                        }}
                      >
                        {formatCurrency(comanda.total)}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 10,
                        color: "#9ca3af",
                      }}
                    >
                      {comanda.mesa ? `Mesa ${comanda.mesa}` : "Sem mesa"} •{" "}
                      {comanda.cliente || "Consumidor"}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      <ModalAbrirComanda
        showModal={mostrarModalAbrirComanda}
        onClose={fecharModalNovaComanda}
        onConfirm={criarComanda}
      />

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          @media (max-width: 900px) {
            .gestao-comandas-layout {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 600px) {
            .gestao-comandas-header {
              align-items: flex-start !important;
            }

            .gestao-comandas-filtros {
              align-items: flex-start !important;
            }
          }
        `}
      </style>
    </div>
  );
}

const filtroButtonStyle = (
  ativo: boolean,
  tipo: "green" | "orange" | "red" = "green",
): React.CSSProperties => {
  const cores = {
    green: {
      border: "#a7f3d0",
      background: "#ecfdf5",
      color: "#059669",
    },
    orange: {
      border: "#fde68a",
      background: "#fffbeb",
      color: "#d97706",
    },
    red: {
      border: "#fecaca",
      background: "#fef2f2",
      color: "#dc2626",
    },
  };

  const cor = cores[tipo];

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 32,
    padding: "0 10px",
    borderRadius: 20,
    border: ativo ? `1px solid ${cor.border}` : "1px solid #e5e7eb",
    background: ativo ? cor.background : "#fff",
    color: ativo ? cor.color : "#6b7280",
    cursor: "pointer",
    fontSize: 10,
    fontWeight: ativo ? 600 : 500,
    whiteSpace: "nowrap",
  };
};
