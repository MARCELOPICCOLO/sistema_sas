// pages/GestaoRelatorios.tsx

import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChartLine,
  faArrowTrendUp,
  faArrowTrendDown,
  faWallet,
  faReceipt,
  faPercent,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = import.meta.env.VITE_API_URL;

interface GestaoRelatoriosProps {
  setTela: (tela: string) => void;
}

interface Entrada {
  id: number;
  partner_company_id: number;
  sales_point_id: number | null;
  command_number: number | null;
  order_date: string;
  customer_name: string | null;
  status: string;
  total: number | string;
  payment_method: string | null;
  closed_at: string;
}

interface FaturamentoMensal {
  mes: string;
  valor: number;
}

export default function GestaoRelatorios({ setTela }: GestaoRelatoriosProps) {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loadingEntradas, setLoadingEntradas] = useState(true);
  const [erroEntradas, setErroEntradas] = useState("");

  const anoAtual = new Date().getFullYear();

  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);

  // =========================
  // CARREGAR ENTRADAS
  // =========================

  useEffect(() => {
    carregarEntradas();
  }, [anoSelecionado]);

  const carregarEntradas = async () => {
    try {
      setLoadingEntradas(true);
      setErroEntradas("");

      const token = localStorage.getItem("auth_token");

      const response = await fetch(
        `${API_URL}/orders/reports/entries?year=${anoSelecionado}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || "Erro ao buscar entradas do relatório.",
        );
      }

      const data: Entrada[] = await response.json();

      setEntradas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar entradas:", error);

      setErroEntradas(
        error instanceof Error ? error.message : "Erro ao carregar entradas.",
      );

      setEntradas([]);
    } finally {
      setLoadingEntradas(false);
    }
  };

  // =========================
  // FATURAMENTO ATUAL
  // =========================

  const faturamentoAtual = useMemo(() => {
    return entradas.reduce((total, entrada) => {
      return total + Number(entrada.total || 0);
    }, 0);
  }, [entradas]);

  // =========================
  // TICKET MÉDIO
  // =========================

  const ticketMedio = useMemo(() => {
    if (entradas.length === 0) {
      return 0;
    }

    return faturamentoAtual / entradas.length;
  }, [entradas, faturamentoAtual]);

  // =========================
  // EVOLUÇÃO MENSAL
  // =========================

  const faturamentoMensal = useMemo<FaturamentoMensal[]>(() => {
    const agrupado: Record<string, number> = {};

    entradas.forEach((entrada) => {
      if (!entrada.closed_at) {
        return;
      }

      const data = new Date(entrada.closed_at.replace(" ", "T"));

      if (Number.isNaN(data.getTime())) {
        return;
      }

      const chave = `${data.getFullYear()}-${String(
        data.getMonth() + 1,
      ).padStart(2, "0")}`;

      agrupado[chave] = (agrupado[chave] || 0) + Number(entrada.total || 0);
    });

    const meses = Object.entries(agrupado)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);

    return meses.map(([chave, valor]) => {
      const [ano, mes] = chave.split("-");

      const data = new Date(Number(ano), Number(mes) - 1, 1);

      const nomeMes = data.toLocaleDateString("pt-BR", {
        month: "short",
      });

      return {
        mes:
          nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1).replace(".", ""),
        valor,
      };
    });
  }, [entradas]);

  // =========================
  // DESPESAS TEMPORÁRIAS
  // =========================

  const despesas = [
    { categoria: "Pessoal", valor: 12400 },
    { categoria: "Mercadorias", valor: 9800 },
    { categoria: "Aluguel", valor: 4200 },
    { categoria: "Operacionais", valor: 3100 },
    { categoria: "Impostos", valor: 2800 },
  ];

  // =========================
  // VENDAS POR CATEGORIA
  // =========================

  const vendasPorCategoria = [
    { categoria: "Produtos", valor: 18500 },
    { categoria: "Serviços", valor: 12600 },
    { categoria: "Outros", valor: 10500 },
  ];

  const despesasAtual = 22300;

  const lucroAtual = faturamentoAtual - despesasAtual;

  const margem =
    faturamentoAtual > 0 ? (lucroAtual / faturamentoAtual) * 100 : 0;

  const maxFaturamento =
    faturamentoMensal.length > 0
      ? Math.max(...faturamentoMensal.map((item) => item.valor))
      : 0;

  const maxDespesas = Math.max(...despesas.map((item) => item.valor));

  const totalCategorias = vendasPorCategoria.reduce(
    (total, item) => total + item.valor,
    0,
  );

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Botão Voltar ao Dashboard */}
      <div
        style={{
          padding: "10px 20px",
          background: "#f8fafc",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setTela("dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            padding: "4px 0",
            fontSize: 12,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#111827";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} size="sm" />
          Voltar ao Dashboard
        </button>
      </div>

      {/* Conteúdo */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          {/* Cabeçalho */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Gestão de Relatórios
              </h1>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                Acompanhe os principais indicadores financeiros da empresa.
              </p>
            </div>

            {/* Seleção do ano */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 14px",
                border: "1px solid #e5e7eb",
                borderRadius: 7,
                background: "#ffffff",
              }}
            >
              <FontAwesomeIcon
                icon={faCalendarDays}
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                }}
              />

              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                style={{
                  border: "none",
                  outline: "none",
                  background: "#ffffff",
                  color: "#374151",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {Array.from({ length: 6 }, (_, index) => {
                  const ano = anoAtual - index;

                  return (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Erro */}
          {erroEntradas && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: 13,
              }}
            >
              {erroEntradas}
            </div>
          )}

          {/* Indicadores */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <Indicador
              titulo="Faturamento"
              valor={
                loadingEntradas
                  ? "Carregando..."
                  : formatarMoeda(faturamentoAtual)
              }
              variacao=""
              positivo
              icon={faWallet}
              iconBackground="#ecfdf5"
              iconColor="#059669"
            />

            <Indicador
              titulo="Despesas"
              valor={formatarMoeda(despesasAtual)}
              variacao=""
              positivo={false}
              icon={faArrowTrendDown}
              iconBackground="#fef2f2"
              iconColor="#dc2626"
            />

            <Indicador
              titulo="Lucro"
              valor={formatarMoeda(lucroAtual)}
              variacao=""
              positivo={lucroAtual >= 0}
              icon={faArrowTrendUp}
              iconBackground="#ecfdf5"
              iconColor="#059669"
            />

            <Indicador
              titulo="Ticket Médio"
              valor={
                loadingEntradas ? "Carregando..." : formatarMoeda(ticketMedio)
              }
              variacao=""
              positivo
              icon={faReceipt}
              iconBackground="#eff6ff"
              iconColor="#2563eb"
            />

            <Indicador
              titulo="Margem"
              valor={`${margem.toFixed(1).replace(".", ",")}%`}
              variacao=""
              positivo={margem >= 0}
              icon={faPercent}
              iconBackground="#f5f3ff"
              iconColor="#7c3aed"
            />
          </div>

          {/* Linha principal */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(300px, 1fr)",
              gap: 20,
              marginBottom: 20,
            }}
          >
            {/* Evolução do faturamento */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <h2 style={cardTitleStyle}>Evolução do Faturamento</h2>

                  <p style={cardSubtitleStyle}>
                    Comparativo mensal do faturamento de {anoSelecionado}.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: "#059669",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#059669",
                    }}
                  />
                  Faturamento
                </div>
              </div>

              <div
                style={{
                  height: 280,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 14,
                  padding: "0 8px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {loadingEntradas ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af",
                      fontSize: 13,
                    }}
                  >
                    Carregando faturamento...
                  </div>
                ) : faturamentoMensal.length === 0 ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af",
                      fontSize: 13,
                    }}
                  >
                    Nenhuma entrada encontrada em {anoSelecionado}.
                  </div>
                ) : (
                  faturamentoMensal.map((item) => {
                    const altura =
                      maxFaturamento > 0
                        ? (item.valor / maxFaturamento) * 75
                        : 0;

                    return (
                      <div
                        key={item.mes}
                        style={{
                          flex: 1,
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 7,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: "#6b7280",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatarMoeda(item.valor)
                            .replace("R$", "")
                            .trim()
                            .replace(",00", "")}
                        </span>

                        <div
                          style={{
                            width: "100%",
                            maxWidth: 50,
                            height: `${altura}%`,
                            minHeight: 10,
                            background: "#059669",
                            borderRadius: "5px 5px 0 0",
                          }}
                        />

                        <span
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            paddingBottom: 8,
                          }}
                        >
                          {item.mes}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Vendas por categoria */}
            <div style={cardStyle}>
              <div
                style={{
                  marginBottom: 24,
                }}
              >
                <h2 style={cardTitleStyle}>Vendas por Categoria</h2>

                <p style={cardSubtitleStyle}>
                  Distribuição do faturamento atual.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                {vendasPorCategoria.map((item, index) => {
                  const percentual =
                    totalCategorias > 0
                      ? (item.valor / totalCategorias) * 100
                      : 0;

                  const cores = ["#059669", "#2563eb", "#7c3aed"];

                  return (
                    <div key={item.categoria}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            color: "#374151",
                          }}
                        >
                          {item.categoria}
                        </span>

                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {percentual.toFixed(0)}%
                        </span>
                      </div>

                      <div
                        style={{
                          width: "100%",
                          height: 8,
                          background: "#f1f5f9",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percentual}%`,
                            height: "100%",
                            background: cores[index],
                            borderRadius: 999,
                          }}
                        />
                      </div>

                      <p
                        style={{
                          margin: "5px 0 0",
                          fontSize: 11,
                          color: "#9ca3af",
                        }}
                      >
                        {formatarMoeda(item.valor)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Linha inferior */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 20,
            }}
          >
            {/* Despesas por categoria */}
            <div style={cardStyle}>
              <div
                style={{
                  marginBottom: 24,
                }}
              >
                <h2 style={cardTitleStyle}>Despesas por Categoria</h2>

                <p style={cardSubtitleStyle}>
                  Principais grupos de despesas do período.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                {despesas.map((item) => (
                  <div key={item.categoria}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        {item.categoria}
                      </span>

                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {formatarMoeda(item.valor)}
                      </span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: 8,
                        background: "#f1f5f9",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(item.valor / maxDespesas) * 100}%`,
                          height: "100%",
                          background: "#dc2626",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resultado financeiro */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <h2 style={cardTitleStyle}>Resultado Financeiro</h2>

                  <p style={cardSubtitleStyle}>
                    Comparativo entre faturamento, despesas e lucro.
                  </p>
                </div>

                <FontAwesomeIcon
                  icon={faChartLine}
                  style={{
                    color: "#6b7280",
                    fontSize: 15,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                }}
              >
                <Resultado
                  titulo="Faturamento"
                  valor={faturamentoAtual}
                  percentual={100}
                  cor="#059669"
                />

                <Resultado
                  titulo="Despesas"
                  valor={despesasAtual}
                  percentual={
                    faturamentoAtual > 0
                      ? (despesasAtual / faturamentoAtual) * 100
                      : 0
                  }
                  cor="#dc2626"
                />

                <Resultado
                  titulo="Lucro"
                  valor={lucroAtual}
                  percentual={
                    faturamentoAtual > 0
                      ? (lucroAtual / faturamentoAtual) * 100
                      : 0
                  }
                  cor="#2563eb"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginTop: 28,
                }}
              >
                <div style={summaryBoxStyle}>
                  <p style={summaryLabelStyle}>Resultado líquido</p>

                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: 17,
                      fontWeight: 600,
                      color: lucroAtual >= 0 ? "#059669" : "#dc2626",
                    }}
                  >
                    {formatarMoeda(lucroAtual)}
                  </p>
                </div>

                <div style={summaryBoxStyle}>
                  <p style={summaryLabelStyle}>Margem líquida</p>

                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {margem.toFixed(1).replace(".", ",")}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Indicador({
  titulo,
  valor,
  variacao,
  positivo,
  icon,
  iconBackground,
  iconColor,
}: {
  titulo: string;
  valor: string;
  variacao: string;
  positivo: boolean;
  icon: any;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 18,
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 500,
            }}
          >
            {titulo}
          </p>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: 19,
              color: "#111827",
              fontWeight: 600,
            }}
          >
            {valor}
          </p>
        </div>

        <div
          style={{
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            background: iconBackground,
            color: iconColor,
          }}
        >
          <FontAwesomeIcon icon={icon} />
        </div>
      </div>

      {variacao && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginTop: 14,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: positivo ? "#059669" : "#dc2626",
            }}
          >
            {variacao}
          </span>

          <span
            style={{
              fontSize: 10,
              color: "#9ca3af",
            }}
          >
            vs. período anterior
          </span>
        </div>
      )}
    </div>
  );
}

function Resultado({
  titulo,
  valor,
  percentual,
  cor,
}: {
  titulo: string;
  valor: number;
  percentual: number;
  cor: string;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#374151",
          }}
        >
          {titulo}
        </span>

        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          {valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: 9,
          background: "#f1f5f9",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(Math.max(percentual, 0), 100)}%`,
            height: "100%",
            background: cor,
            borderRadius: 999,
          }}
        />
      </div>

      <p
        style={{
          margin: "5px 0 0",
          fontSize: 10,
          color: "#9ca3af",
        }}
      >
        {percentual.toFixed(1).replace(".", ",")}%{" do faturamento"}
      </p>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 22,
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  marginBottom: 22,
};

const cardTitleStyle = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
};

const cardSubtitleStyle = {
  margin: "5px 0 0",
  fontSize: 12,
  color: "#6b7280",
};

const summaryBoxStyle = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 14,
};

const summaryLabelStyle = {
  margin: 0,
  fontSize: 11,
  color: "#6b7280",
};
