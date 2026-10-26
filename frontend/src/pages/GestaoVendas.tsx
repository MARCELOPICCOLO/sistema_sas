import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCartShopping,
  faTableCells,
  faUser,
  faArrowRight,
  faFilter,
  faRotate,
  faCalendarDays,
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
  onAbrirComanda?: (comanda: Comanda) => void;
}

/**
 * Retorna a data atual no formato YYYY-MM-DD.
 *
 * Não usamos toISOString() porque ele trabalha em UTC
 * e pode causar mudança de dia dependendo do fuso horário.
 */
const getDataAtual = (): string => {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatarData = (date: string) => {
  if (!date) {
    return "";
  }

  const [ano, mes, dia] = date.split("-");

  if (!ano || !mes || !dia) {
    return date;
  }

  return `${dia}/${mes}/${ano}`;
};

const normalizarStatus = (
  status: string | undefined,
): Comanda["status"] | undefined => {
  switch (status) {
    case undefined:
      return undefined;
    case "fechado":
    case "finalizado":
      return "fechado";
    case "pendente":
      return "pendente";
    case "cancelado":
    case "cancelada":
      return "cancelada";
    default:
      return "aberta";
  }
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

  const status = normalizarStatus(order.status) ?? "aberta";

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

  /**
   * Data selecionada no filtro.
   *
   * Por padrão:
   * data atual do computador do usuário.
   */
  const [dataFiltro, setDataFiltro] = useState<string>(getDataAtual());

  const [loading, setLoading] = useState(true);

  const [erro, setErro] = useState("");

  /**
   * Carrega as comandas somente da data selecionada.
   *
   * GET /orders/by-date/YYYY-MM-DD
   */
  const carregarComandas = async (data = dataFiltro) => {
    try {
      setLoading(true);
      setErro("");

      const token = localStorage.getItem("auth_token");

      const response = await axios.get(`${API_URL}/orders/by-date/${data}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const orders: OrderApi[] = Array.isArray(response.data)
        ? response.data
        : response.data?.orders || [];

      const comandasApi = orders.map(normalizarComanda);

      setComandas(comandasApi);

      /**
       * Mantém a comanda selecionada atualizada.
       *
       * Se ela não existir mais no resultado da nova data,
       * limpamos a seleção.
       */
      setComandaSelecionada((atual) => {
        if (!atual) {
          return null;
        }

        const atualizada = comandasApi.find(
          (comanda) => comanda.id === atual.id,
        );

        return atualizada || null;
      });
    } catch (error) {
      console.error("Erro ao carregar comandas:", error);

      setComandas([]);

      setComandaSelecionada(null);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          setErro("Empresa não identificada.");
        } else if (error.response?.status === 422) {
          setErro(
            error.response?.data?.message || "Data inválida para consulta.",
          );
        } else {
          setErro(
            error.response?.data?.message ||
              "Não foi possível carregar os pedidos.",
          );
        }
      } else {
        setErro("Não foi possível carregar os pedidos.");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega automaticamente as vendas da data atual
   * quando a tela é aberta.
   */
  useEffect(() => {
    carregarComandas(dataFiltro);
  }, []);

  /**
   * Quando o usuário altera a data, fazemos uma nova
   * requisição diretamente ao backend.
   */
  const handleDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const novaData = event.target.value;

    if (!novaData) {
      return;
    }

    setDataFiltro(novaData);

    carregarComandas(novaData);
  };

  /**
   * Volta rapidamente para o dia atual.
   */
  const selecionarHoje = () => {
    const hoje = getDataAtual();

    setDataFiltro(hoje);

    carregarComandas(hoje);
  };

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

      /**
       * Só adiciona localmente se pertence ao dia selecionado.
       */
      if (dataComanda === dataFiltro) {
        setComandas((atual) => [...atual, novaComanda]);
      }

      setComandaSelecionada(novaComanda);

      setMostrarNovaVenda(true);

      setMostrarModalAbrirComanda(false);

      onAbrirComanda?.(novaComanda);
    } catch (error) {
      console.error("Erro ao criar comanda:", error);

      setErro("Não foi possível criar o pedido.");
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

    await carregarComandas(dataFiltro);
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
        background: "var(--danger-soft)",
        color: "var(--danger)",
      };
    }

    if (comanda.status === "aberta") {
      return {
        label: "Aberta",
        background: "var(--primary-soft)",
        color: "var(--primary)",
      };
    }

    if (comanda.status === "pendente") {
      return {
        label: "Pendente",
        background: "var(--warning-soft)",
        color: "var(--warning)",
      };
    }

    if (comanda.status === "fechado") {
      return {
        label: "Fechada",
        background: "var(--surface-3)",
        color: "var(--text-muted)",
      };
    }

    return {
      label: "Cancelada",
      background: "var(--surface-3)",
      color: "var(--text-muted)",
    };
  };

  const getQuantidadeItens = (comanda: Comanda) => {
    return comanda.itens.reduce((total, item) => total + item.quantidade, 0);
  };

  /**
   * Quando uma venda está aberta, entramos na NovaVenda.
   */
  if (mostrarNovaVenda && comandaSelecionada) {
    const somenteLeitura =
      comandaSelecionada.status === "fechado" ||
      comandaSelecionada.status === "cancelada";

    return (
      <NovaVenda
        comanda={comandaSelecionada}
        somenteLeitura={somenteLeitura}
        onVoltar={voltarParaComandas}
        onAtualizarComanda={(dados) => {
          if (somenteLeitura) {
            return;
          }

          atualizarComanda(comandaSelecionada.id, {
            ...dados,
            status: normalizarStatus(dados.status) ?? comandaSelecionada.status,
          } as Partial<Comanda>);
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
        minHeight: "var(--page-h)",
        width: "100%",
        background: "var(--bg)",
        color: "var(--text)",
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
        {/* ============================================================
            HEADER
        ============================================================ */}
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
          <div
            className="gestao-comandas-titulo"
            style={{
              minWidth: 0,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "var(--fs-2xl)",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              Pedidos
            </h1>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
            >
              Acompanhe pedidos abertos e vendas em andamento
            </p>
          </div>

          {/* ========================================================
              BOTÃO ABRIR COMANDA
          ======================================================== */}
          <button
            type="button"
            onClick={abrirModalNovaComanda}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              height: 40,
              padding: "0 18px",
              borderRadius: 10,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              boxShadow: "0 4px 12px -6px rgba(15, 23, 42, 0.45)",
              cursor: "pointer",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <FontAwesomeIcon
              icon={faPlus}
              style={{
                fontSize: "var(--fs-xs)",
              }}
            />
            Novo pedido
          </button>
        </div>

        {/* ============================================================
            FILTROS DE STATUS + DATA
        ============================================================ */}
        <div
          className="gestao-comandas-filtros"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 10,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 7,
            flexWrap: "wrap",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* ========================================================
              IDENTIFICAÇÃO DOS FILTROS
          ======================================================== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginRight: 4,
              color: "var(--text-muted)",
              fontSize: "var(--fs-2xs)",
              fontWeight: 500,
            }}
          >
            <FontAwesomeIcon
              icon={faFilter}
              style={{
                fontSize: "var(--fs-2xs)",
              }}
            />
            Filtros
          </div>

          {/* ========================================================
              PRIMEIRO FILTRO: DATA
          ======================================================== */}
          <div
            className="gestao-data-filtro"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            {/* FILTRO DE DATA */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                height: 32,
                padding: "0 9px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <FontAwesomeIcon
                icon={faCalendarDays}
                style={{
                  color: "var(--primary)",
                  fontSize: "var(--fs-2xs)",
                }}
              />

              <input
                type="date"
                value={dataFiltro}
                onChange={handleDataChange}
                disabled={loading}
                aria-label="Filtrar vendas por data"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: "var(--fs-2xs)",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              />
            </div>

            {/* BOTÃO HOJE */}
            {dataFiltro !== getDataAtual() && (
              <button
                type="button"
                onClick={selecionarHoje}
                disabled={loading}
                style={{
                  height: 32,
                  padding: "0 9px",
                  borderRadius: 8,
                  border: "1px solid var(--primary-soft)",
                  background: "var(--primary-soft)",
                  color: "var(--primary-hover)",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "var(--fs-2xs)",
                  fontWeight: 600,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Hoje
              </button>
            )}

            {/* ATUALIZAR */}
            <button
              type="button"
              onClick={() => carregarComandas(dataFiltro)}
              disabled={loading}
              title={`Atualizar vendas de ${formatarData(dataFiltro)}`}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-muted)",
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
                  fontSize: "var(--fs-2xs)",
                }}
              />
            </button>
          </div>

          {/* ========================================================
              FILTROS DE STATUS
          ======================================================== */}
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
        </div>

        {/* ============================================================
            LAYOUT PRINCIPAL
        ============================================================ */}
        <div
          className="gestao-comandas-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 18,
            alignItems: "start",
          }}
        >
          {/* ==========================================================
              LISTA DE COMANDAS
          ========================================================== */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
              minWidth: 0,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid var(--surface-3)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FontAwesomeIcon
                icon={faTableCells}
                style={{
                  color: "var(--primary)",
                  fontSize: "var(--fs-sm)",
                }}
              />

              <strong
                style={{
                  fontSize: "var(--fs-sm)",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Pedidos
              </strong>

              <span
                style={{
                  fontSize: "var(--fs-2xs)",
                  color: "var(--text-subtle)",
                }}
              >
                {comandasFiltradas.length} encontradas
              </span>

              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "var(--fs-2xs)",
                  color: "var(--text-subtle)",
                }}
              >
                {formatarData(dataFiltro)}
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
                    color: "var(--text-subtle)",
                    fontSize: "var(--fs-xs)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faRotate}
                    spin
                    style={{
                      marginRight: 8,
                    }}
                  />
                  Carregando vendas...
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
                    color: "var(--danger)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--fs-xs)",
                    }}
                  >
                    {erro}
                  </span>

                  <button
                    type="button"
                    onClick={() => carregarComandas(dataFiltro)}
                    style={{
                      marginTop: 10,
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: "var(--fs-2xs)",
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
                    color: "var(--text-subtle)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCartShopping}
                    style={{
                      fontSize: "var(--fs-md)",
                      marginBottom: 12,
                    }}
                  />

                  <strong
                    style={{
                      fontSize: "var(--fs-sm)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Nenhum pedido encontrado
                  </strong>

                  <span
                    style={{
                      marginTop: 5,
                      fontSize: "var(--fs-2xs)",
                    }}
                  >
                    Não existem pedidos para esse filtro em{" "}
                    {formatarData(dataFiltro)}.
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
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          background: "var(--surface)",
                          padding: 14,
                          cursor: "pointer",
                          minWidth: 0,
                          boxShadow: "var(--shadow-card)",
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
                              fontSize: "var(--fs-sm)",
                              color: "var(--text)",
                              minWidth: 0,
                            }}
                          >
                            Pedido #{comanda.numero}
                          </strong>

                          <FontAwesomeIcon
                            icon={faArrowRight}
                            style={{
                              color: "var(--text-subtle)",
                              fontSize: "var(--fs-2xs)",
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
                            fontSize: "var(--fs-2xs)",
                            color: "var(--text-muted)",
                            minWidth: 0,
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faUser}
                            style={{
                              fontSize: "var(--fs-2xs)",
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
                              fontSize: "var(--fs-2xs)",
                              fontWeight: 600,
                            }}
                          >
                            {status.label}
                          </span>

                          <span
                            style={{
                              fontSize: "var(--fs-2xs)",
                              color: "var(--text-subtle)",
                            }}
                          >
                            {getQuantidadeItens(comanda)} itens
                          </span>

                          <strong
                            style={{
                              fontSize: "var(--fs-sm)",
                              color: "var(--primary)",
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

          {/* ==========================================================
              COMANDAS ABERTAS
          ========================================================== */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
              minWidth: 0,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid var(--surface-3)",
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
                    fontSize: "var(--fs-sm)",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Pedidos abertos
                </strong>

                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    padding: "0 6px",
                    borderRadius: 20,
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "var(--fs-2xs)",
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
                      borderBottom: "1px solid var(--surface-3)",
                      background: "var(--surface)",
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
                          fontSize: "var(--fs-xs)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Pedido #{comanda.numero}
                      </strong>

                      <span
                        style={{
                          fontSize: "var(--fs-xs)",
                          fontWeight: 600,
                          color: "var(--primary)",
                        }}
                      >
                        {formatCurrency(comanda.total)}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        fontSize: "var(--fs-2xs)",
                        color: "var(--text-subtle)",
                      }}
                    >
                      {comanda.mesa ? `Ponto ${comanda.mesa}` : "Sem ponto"} •{" "}
                      {comanda.cliente || "Consumidor"}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          MODAL ABRIR COMANDA
      ============================================================== */}
      <ModalAbrirComanda
        showModal={mostrarModalAbrirComanda}
        onClose={fecharModalNovaComanda}
        onConfirm={criarComanda}
      />

      {/* ==============================================================
          RESPONSIVIDADE
      ============================================================== */}
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          @media (max-width: 1100px) {
            .gestao-comandas-header {
              flex-wrap: wrap;
            }

            .gestao-data-filtro {
              margin-left: 0;
            }
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

            .gestao-comandas-titulo {
              width: 100%;
            }

            .gestao-data-filtro {
              width: 100%;
              margin-left: 0;
            }

            .gestao-data-filtro > div:first-child {
              flex: 1;
            }

            .gestao-data-filtro input {
              width: 100%;
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
      border: "var(--primary-border)",
      background: "var(--primary-soft)",
      color: "var(--primary)",
    },

    orange: {
      border: "var(--warning-border)",
      background: "var(--warning-soft)",
      color: "var(--warning)",
    },

    red: {
      border: "var(--danger-border)",
      background: "var(--danger-soft)",
      color: "var(--danger)",
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
    border: ativo ? `1px solid ${cor.border}` : "1px solid var(--border)",
    background: ativo ? cor.background : "var(--surface)",
    color: ativo ? cor.color : "var(--text-muted)",
    cursor: "pointer",
    fontSize: "var(--fs-2xs)",
    fontWeight: ativo ? 600 : 500,
    whiteSpace: "nowrap",
  };
};
