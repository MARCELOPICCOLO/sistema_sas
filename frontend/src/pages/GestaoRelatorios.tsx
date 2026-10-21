// pages/GestaoRelatorios.tsx

import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faArrowTrendUp,
  faArrowTrendDown,
  faWallet,
  faReceipt,
  faPercent,
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faCrown,
  faMedal,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = import.meta.env.VITE_API_URL;

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

interface Despesa {
  id: number;
  description: string;
  expense_date: string;
  amount: number | string;
  expense_category_id: number;
  category?: {
    id: number;
    name: string;
    description?: string;
  } | null;
  payment_method?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

interface DespesaAgrupada {
  categoria: string;
  valor: number;
}

interface ProdutoVendido {
  product: string;
  quantity: number;
  value: number;
}

export default function GestaoRelatorios() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loadingEntradas, setLoadingEntradas] = useState(true);
  const [erroEntradas, setErroEntradas] = useState("");

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loadingDespesas, setLoadingDespesas] = useState(true);
  const [erroDespesas, setErroDespesas] = useState("");

  const [produtosVendidos, setProdutosVendidos] = useState<ProdutoVendido[]>(
    [],
  );
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState("");

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
  // CARREGAR DESPESAS
  // =========================

  useEffect(() => {
    carregarDespesas();
  }, [anoSelecionado]);

  const carregarDespesas = async () => {
    try {
      setLoadingDespesas(true);
      setErroDespesas("");

      const token = localStorage.getItem("auth_token");

      const startDate = `${anoSelecionado}-01-01`;
      const endDate = `${anoSelecionado}-12-31`;

      const response = await fetch(
        `${API_URL}/expenses?start_date=${startDate}&end_date=${endDate}`,
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
          data?.message || "Erro ao buscar despesas do relatório.",
        );
      }

      const data: Despesa[] = await response.json();
      setDespesas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar despesas:", error);
      setErroDespesas(
        error instanceof Error ? error.message : "Erro ao carregar despesas.",
      );
      setDespesas([]);
    } finally {
      setLoadingDespesas(false);
    }
  };

  // =========================
  // CARREGAR PRODUTOS MAIS VENDIDOS
  // =========================

  useEffect(() => {
    carregarProdutosVendidos();
  }, [anoSelecionado]);

  const carregarProdutosVendidos = async () => {
    try {
      setLoadingProdutos(true);
      setErroProdutos("");

      const token = localStorage.getItem("auth_token");

      const response = await fetch(
        `${API_URL}/order-items/products-summary?year=${anoSelecionado}`,
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
          data?.message || "Erro ao buscar produtos mais vendidos.",
        );
      }

      const data = await response.json();
      setProdutosVendidos(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setErroProdutos(
        error instanceof Error ? error.message : "Erro ao carregar produtos.",
      );
      setProdutosVendidos([]);
    } finally {
      setLoadingProdutos(false);
    }
  };

  // =========================
  // NAVEGAÇÃO DO ANO
  // =========================

  const handleAnoAnterior = () => {
    setAnoSelecionado(anoSelecionado - 1);
  };

  const handleProximoAno = () => {
    setAnoSelecionado(anoSelecionado + 1);
  };

  const handleAnoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = parseInt(e.target.value);
    if (!isNaN(valor) && valor > 0) {
      setAnoSelecionado(valor);
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
  // DESPESAS POR CATEGORIA
  // =========================

  const despesasPorCategoria = useMemo<DespesaAgrupada[]>(() => {
    const agrupado: Record<string, number> = {};

    despesas.forEach((despesa) => {
      const categoria =
        despesa.category?.name ||
        `Categoria ${despesa.expense_category_id}` ||
        "Sem categoria";
      agrupado[categoria] =
        (agrupado[categoria] || 0) + Number(despesa.amount || 0);
    });

    return Object.entries(agrupado)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [despesas]);

  // =========================
  // TOTAL DE DESPESAS
  // =========================

  const totalDespesas = useMemo(() => {
    return despesas.reduce((total, despesa) => {
      return total + Number(despesa.amount || 0);
    }, 0);
  }, [despesas]);

  // =========================
  // LUCRO E MARGEM
  // =========================

  const lucroAtual = faturamentoAtual - totalDespesas;
  const margem =
    faturamentoAtual > 0 ? (lucroAtual / faturamentoAtual) * 100 : 0;

  // =========================
  // MÁXIMO FATURAMENTO
  // =========================

  const maxFaturamento =
    faturamentoMensal.length > 0
      ? Math.max(...faturamentoMensal.map((item) => item.valor))
      : 0;

  // =========================
  // TOTAL PRODUTOS
  // =========================

  const totalProdutos = useMemo(() => {
    return produtosVendidos.reduce((total, item) => {
      return total + item.value;
    }, 0);
  }, [produtosVendidos]);

  // =========================
  // FORMATAR MOEDA
  // =========================

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div
      className="relatorios-page"
      style={{
        height: "var(--page-h)",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <RelatoriosResponsiveStyles />

      {/* Conteúdo */}
      <div
        className="relatorios-content"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "var(--surface-2)",
        }}
      >
        <div
          className="relatorios-container"
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
                  fontSize: "var(--fs-3xl)",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                Gestão de Relatórios
              </h1>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-muted)",
                }}
              >
                Acompanhe os principais indicadores financeiros da empresa.
              </p>
            </div>

            {/* Seleção do ano - EDITÁVEL */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--surface)",
              }}
            >
              <FontAwesomeIcon
                icon={faCalendarDays}
                style={{
                  color: "var(--text-muted)",
                  fontSize: "var(--fs-sm)",
                }}
              />

              <button
                onClick={handleAnoAnterior}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px 6px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} size="xs" />
              </button>

              <input
                type="number"
                value={anoSelecionado}
                onChange={handleAnoChange}
                min="2000"
                max="2099"
                style={{
                  width: 70,
                  border: "none",
                  outline: "none",
                  background: "var(--surface)",
                  color: "var(--text-secondary)",
                  fontSize: "var(--fs-md)",
                  fontWeight: 600,
                  textAlign: "center",
                  padding: "4px 0",
                }}
                onFocus={(e) => e.target.select()}
              />

              <button
                onClick={handleProximoAno}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px 6px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <FontAwesomeIcon icon={faChevronRight} size="xs" />
              </button>
            </div>
          </div>

          {/* Erros */}
          {erroEntradas && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--danger-border)",
                background: "var(--danger-soft)",
                color: "var(--danger-hover)",
                fontSize: "var(--fs-sm)",
              }}
            >
              {erroEntradas}
            </div>
          )}

          {erroDespesas && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--danger-border)",
                background: "var(--danger-soft)",
                color: "var(--danger-hover)",
                fontSize: "var(--fs-sm)",
              }}
            >
              {erroDespesas}
            </div>
          )}

          {erroProdutos && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--danger-border)",
                background: "var(--danger-soft)",
                color: "var(--danger-hover)",
                fontSize: "var(--fs-sm)",
              }}
            >
              {erroProdutos}
            </div>
          )}

          {/* Indicadores */}
          <div
            className="indicadores-grid"
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
              iconBackground="var(--primary-soft)"
              iconColor="var(--primary)"
            />

            <Indicador
              titulo="Despesas"
              valor={
                loadingDespesas ? "Carregando..." : formatarMoeda(totalDespesas)
              }
              variacao=""
              positivo={false}
              icon={faArrowTrendDown}
              iconBackground="var(--danger-soft)"
              iconColor="var(--danger)"
            />

            <Indicador
              titulo="Lucro"
              valor={formatarMoeda(lucroAtual)}
              variacao=""
              positivo={lucroAtual >= 0}
              icon={faArrowTrendUp}
              iconBackground="var(--primary-soft)"
              iconColor="var(--primary)"
            />

            <Indicador
              titulo="Ticket Médio"
              valor={
                loadingEntradas ? "Carregando..." : formatarMoeda(ticketMedio)
              }
              variacao=""
              positivo
              icon={faReceipt}
              iconBackground="var(--info-soft)"
              iconColor="var(--info)"
            />

            <Indicador
              titulo="Margem"
              valor={`${margem.toFixed(1).replace(".", ",")}%`}
              variacao=""
              positivo={margem >= 0}
              icon={faPercent}
              iconBackground="var(--primary-soft)"
              iconColor="#7c3aed"
            />
          </div>

          {/* Linha principal */}
          <div
            className="relatorios-grid-principal"
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
                    fontSize: "var(--fs-2xs)",
                    color: "var(--primary)",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--primary)",
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
                  borderBottom: "1px solid var(--border)",
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
                      color: "var(--text-subtle)",
                      fontSize: "var(--fs-sm)",
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
                      color: "var(--text-subtle)",
                      fontSize: "var(--fs-sm)",
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
                            fontSize: "var(--fs-2xs)",
                            color: "var(--text-muted)",
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
                            background: "var(--primary)",
                            borderRadius: "5px 5px 0 0",
                          }}
                        />

                        <span
                          style={{
                            fontSize: "var(--fs-2xs)",
                            color: "var(--text-muted)",
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

            {/* Produtos Mais Vendidos - Curva ABC */}
            <div style={cardStyle}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={cardTitleStyle}>Produtos Mais Vendidos</h2>

                <p style={cardSubtitleStyle}>
                  Ranking dos produtos com maior faturamento em {anoSelecionado}
                  .
                </p>
              </div>

              <div className="pizza-section">
                {loadingProdutos ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 250,
                      color: "var(--text-subtle)",
                      fontSize: "var(--fs-sm)",
                    }}
                  >
                    Carregando produtos...
                  </div>
                ) : produtosVendidos.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 250,
                      color: "var(--text-subtle)",
                      fontSize: "var(--fs-sm)",
                      textAlign: "center",
                    }}
                  >
                    Nenhum produto vendido encontrado em {anoSelecionado}.
                  </div>
                ) : (
                  <ProdutosRanking
                    data={produtosVendidos}
                    total={totalProdutos}
                    formatarMoeda={formatarMoeda}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Linha inferior */}
          <div
            className="relatorios-grid-inferior"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 20,
            }}
          >
            {/* Despesas por categoria */}
            <div style={cardStyle}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={cardTitleStyle}>Despesas por Categoria</h2>

                <p style={cardSubtitleStyle}>
                  Principais grupos de despesas do período.
                </p>
              </div>

              <div className="pizza-section">
                {loadingDespesas ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 250,
                      color: "var(--text-subtle)",
                      fontSize: "var(--fs-sm)",
                    }}
                  >
                    Carregando despesas...
                  </div>
                ) : despesasPorCategoria.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 250,
                      color: "var(--text-subtle)",
                      fontSize: "var(--fs-sm)",
                    }}
                  >
                    Nenhuma despesa encontrada em {anoSelecionado}.
                  </div>
                ) : (
                  <PieChart
                    data={despesasPorCategoria}
                    total={totalDespesas}
                    formatarMoeda={formatarMoeda}
                    cores={[
                      "#dc2626",
                      "#f97316",
                      "#eab308",
                      "#8b5cf6",
                      "#64748b",
                      "#06b6d4",
                      "#ec4899",
                      "#14b8a6",
                    ]}
                  />
                )}
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
                    color: "var(--text-muted)",
                    fontSize: "var(--fs-md)",
                  }}
                />
              </div>

              {/* GRÁFICO VERTICAL */}
              <ResultadoFinanceiro
                faturamento={faturamentoAtual}
                despesas={totalDespesas}
                lucro={lucroAtual}
                formatarMoeda={formatarMoeda}
              />

              {/* Resumo */}
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
                      fontSize: "var(--fs-xl)",
                      fontWeight: 600,
                      color: lucroAtual >= 0 ? "var(--primary)" : "var(--danger)",
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
                      fontSize: "var(--fs-xl)",
                      fontWeight: 600,
                      color: "var(--text)",
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

// =====================================================
// PRODUTOS RANKING - CURVA ABC
// =====================================================

function ProdutosRanking({
  data,
  total,
  formatarMoeda,
}: {
  data: ProdutoVendido[];
  total: number;
  formatarMoeda: (valor: number) => string;
}) {
  // Calcular percentual acumulado para classificação ABC
  let acumulado = 0;

  const produtosClassificados = data.map((item) => {
    const percentual = total > 0 ? (item.value / total) * 100 : 0;
    // Curva ABC: a classe é definida pelo acumulado ANTES do item,
    // assim o produto que sozinho passa de 80% continua sendo classe A.
    const acumuladoAnterior = acumulado;
    acumulado += percentual;

    let classificacao: string;
    let icon: typeof faMedal;
    let cor: string;
    let bgCor: string;

    if (acumuladoAnterior < 80) {
      classificacao = "A";
      icon = faCrown;
      cor = "var(--primary)";
      bgCor = "var(--primary-soft)";
    } else if (acumuladoAnterior < 95) {
      classificacao = "B";
      icon = faTrophy;
      cor = "var(--info)";
      bgCor = "var(--info-soft)";
    } else {
      classificacao = "C";
      icon = faMedal;
      cor = "var(--text-subtle)";
      bgCor = "var(--surface-3)";
    }

    return {
      ...item,
      percentual,
      percentualAcumulado: acumulado,
      classificacao,
      icon,
      cor,
      bgCor,
    };
  });

  return (
    <div className="produtos-ranking">
      {/* Gráfico de barras horizontais */}
      <div className="ranking-barras">
        {produtosClassificados.slice(0, 10).map((item, index) => {
          const largura = total > 0 ? (item.value / total) * 100 : 0;

          return (
            <div key={item.product} className="ranking-item">
              <div className="ranking-posicao">
                <span className="ranking-numero">{index + 1}</span>
                <span
                  className="ranking-classificacao"
                  style={{
                    background: item.bgCor,
                    color: item.cor,
                  }}
                >
                  {item.classificacao}
                </span>
              </div>

              <div className="ranking-info">
                <div className="ranking-nome">{item.product}</div>
                <div className="ranking-barra-container">
                  <div
                    className="ranking-barra"
                    style={{
                      width: `${Math.max(largura, 2)}%`,
                      background: item.cor,
                    }}
                  />
                </div>
              </div>

              <div className="ranking-valores">
                <span className="ranking-quantidade">{item.quantity} un</span>
                <span className="ranking-valor">
                  {formatarMoeda(item.value)}
                </span>
                <span className="ranking-percentual">
                  {item.percentual.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda da Curva ABC */}
      <div className="ranking-legenda">
        <div className="legenda-item">
          <span className="legenda-cor" style={{ background: "var(--primary)" }} />
          <span className="legenda-texto">Classe A (80% do faturamento)</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-cor" style={{ background: "var(--info)" }} />
          <span className="legenda-texto">Classe B (15% do faturamento)</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-cor" style={{ background: "var(--text-subtle)" }} />
          <span className="legenda-texto">Classe C (5% do faturamento)</span>
        </div>
      </div>

      <style>{`
        .produtos-ranking {
          width: 100%;
        }

        .ranking-barras {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 320px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .ranking-barras::-webkit-scrollbar {
          width: 4px;
        }

        .ranking-barras::-webkit-scrollbar-track {
          background: var(--surface-3);
          border-radius: 4px;
        }

        .ranking-barras::-webkit-scrollbar-thumb {
          background: var(--border-strong);
          border-radius: 4px;
        }

        .ranking-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .ranking-item:hover {
          background: var(--surface-2);
        }

        .ranking-posicao {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 50px;
        }

        .ranking-numero {
          font-size: var(--fs-2xs);
          font-weight: 600;
          color: var(--text-subtle);
          min-width: 20px;
          text-align: center;
        }

        .ranking-classificacao {
          font-size: var(--fs-2xs);
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
          min-width: 18px;
          text-align: center;
        }

        .ranking-info {
          flex: 1;
          min-width: 0;
        }

        .ranking-nome {
          font-size: var(--fs-xs);
          color: var(--text-secondary);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 3px;
        }

        .ranking-barra-container {
          width: 100%;
          height: 6px;
          background: var(--surface-3);
          border-radius: 4px;
          overflow: hidden;
        }

        .ranking-barra {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s ease;
          min-width: 2px;
        }

        .ranking-valores {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 140px;
          justify-content: flex-end;
        }

        .ranking-quantidade {
          font-size: var(--fs-2xs);
          color: var(--text-subtle);
          min-width: 40px;
          text-align: right;
        }

        .ranking-valor {
          font-size: var(--fs-xs);
          font-weight: 600;
          color: var(--text);
          min-width: 80px;
          text-align: right;
        }

        .ranking-percentual {
          font-size: var(--fs-2xs);
          color: var(--text-subtle);
          min-width: 45px;
          text-align: right;
        }

        .ranking-legenda {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }

        .legenda-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legenda-cor {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .legenda-texto {
          font-size: var(--fs-2xs);
          color: var(--text-muted);
        }

        @media (max-width: 700px) {
          .ranking-item {
            flex-wrap: wrap;
            gap: 6px;
          }

          .ranking-valores {
            min-width: 100%;
            justify-content: flex-start;
            padding-left: 50px;
            gap: 16px;
          }

          .ranking-posicao {
            min-width: 40px;
          }
        }
      `}</style>
    </div>
  );
}

// =====================================================
// GRÁFICO DE PIZZA
// =====================================================

function PieChart({
  data,
  total,
  formatarMoeda,
  cores,
}: {
  data: { categoria: string; valor: number }[];
  total: number;
  formatarMoeda: (valor: number) => string;
  cores: string[];
}) {
  let acumulado = 0;

  const segmentos = data.map((item, index) => {
    const percentual = total > 0 ? (item.valor / total) * 100 : 0;
    const inicio = acumulado;
    acumulado += percentual;

    return {
      ...item,
      percentual,
      inicio,
      fim: acumulado,
      cor: cores[index % cores.length],
    };
  });

  const gradient =
    segmentos.length > 0 && total > 0
      ? `conic-gradient(${segmentos
          .map((item) => `${item.cor} ${item.inicio}% ${item.fim}%`)
          .join(", ")})`
      : "var(--border)";

  return (
    <div className="pizza-chart">
      <div
        className="pizza"
        style={{ background: gradient }}
        aria-label="Gráfico de pizza"
      >
        <div className="pizza-center">
          <span>Total</span>
          <strong>{formatarMoeda(total)}</strong>
        </div>
      </div>

      <div className="pizza-legenda">
        {segmentos.map((item) => (
          <div className="pizza-legenda-item" key={item.categoria}>
            <div className="pizza-legenda-top">
              <div className="pizza-legenda-nome">
                <span className="pizza-dot" style={{ background: item.cor }} />
                <span>{item.categoria}</span>
              </div>
              <strong>{item.percentual.toFixed(0)}%</strong>
            </div>
            <span className="pizza-legenda-valor">
              {formatarMoeda(item.valor)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// GRÁFICO DE RESULTADO FINANCEIRO - BARRAS VERTICAIS
// =====================================================

function ResultadoFinanceiro({
  faturamento,
  despesas,
  lucro,
  formatarMoeda,
}: {
  faturamento: number;
  despesas: number;
  lucro: number;
  formatarMoeda: (valor: number) => string;
}) {
  const dados = [
    {
      titulo: "Faturamento",
      valor: faturamento,
      cor: "var(--primary)",
    },
    {
      titulo: "Despesas",
      valor: despesas,
      cor: "var(--danger)",
    },
    {
      titulo: "Lucro",
      valor: lucro,
      cor: lucro >= 0 ? "var(--info)" : "var(--danger)",
    },
  ];

  const maiorValor = Math.max(...dados.map((item) => Math.abs(item.valor)), 1);

  return (
    <div className="resultado-financeiro-chart">
      {dados.map((item) => {
        const altura = (Math.abs(item.valor) / maiorValor) * 100;
        const percentual =
          faturamento > 0 ? (item.valor / faturamento) * 100 : 0;

        return (
          <div key={item.titulo} className="resultado-barra-coluna">
            <span className="resultado-valor">{formatarMoeda(item.valor)}</span>
            <div className="resultado-barra-area">
              <div
                className="resultado-barra"
                style={{
                  height: `${Math.max(altura, 4)}%`,
                  background: item.cor,
                }}
                title={`${item.titulo}: ${formatarMoeda(item.valor)}`}
              />
            </div>
            <span className="resultado-titulo">{item.titulo}</span>
            <span className="resultado-percentual">
              {percentual.toFixed(1).replace(".", ",")}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// ESTILOS RESPONSIVOS
// =====================================================

function RelatoriosResponsiveStyles() {
  return (
    <style>{`
      .relatorios-page {
        min-width: 0;
      }

      .relatorios-content {
        min-width: 0;
      }

      .relatorios-container {
        width: 100%;
        box-sizing: border-box;
      }

      .pizza-section {
        width: 100%;
      }

      /* =============================================
         GRÁFICO DE PIZZA
         ============================================= */

      .pizza-chart {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 28px;
        min-height: 250px;
      }

      .pizza {
        width: 190px;
        height: 190px;
        min-width: 190px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
          inset 0 0 0 1px rgba(17, 24, 39, 0.04);
      }

      .pizza-center {
        width: 94px;
        height: 94px;
        border-radius: 50%;
        background: var(--surface);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        box-shadow:
          0 1px 3px rgba(0, 0, 0, 0.06);
      }

      .pizza-center span {
        color: var(--text-subtle);
        font-size: var(--fs-2xs);
        margin-bottom: 4px;
      }

      .pizza-center strong {
        color: var(--text);
        font-size: var(--fs-xs);
        font-weight: 600;
        max-width: 82px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pizza-legenda {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 13px;
      }

      .pizza-legenda-item {
        min-width: 0;
      }

      .pizza-legenda-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: var(--fs-xs);
        color: var(--text-secondary);
      }

      .pizza-legenda-nome {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .pizza-legenda-nome > span:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pizza-legenda-top strong {
        flex-shrink: 0;
        color: var(--text);
        font-size: var(--fs-xs);
      }

      .pizza-dot {
        width: 9px;
        height: 9px;
        min-width: 9px;
        border-radius: 50%;
      }

      .pizza-legenda-valor {
        display: block;
        margin: 4px 0 0 17px;
        color: var(--text-subtle);
        font-size: var(--fs-2xs);
      }

      /* =============================================
         RESULTADO FINANCEIRO
         BARRAS VERTICAIS
         ============================================= */

      .resultado-financeiro-chart {
        width: 100%;
        height: 285px;
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        gap: 16px;
        padding: 10px 12px 0;
        box-sizing: border-box;
        border-bottom: 1px solid var(--border);
      }

      .resultado-barra-coluna {
        flex: 1;
        min-width: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
      }

      .resultado-valor {
        display: block;
        min-height: 18px;
        margin-bottom: 6px;
        font-size: var(--fs-2xs);
        font-weight: 600;
        color: var(--text);
        text-align: center;
        white-space: nowrap;
      }

      .resultado-barra-area {
        width: 100%;
        max-width: 72px;
        height: 190px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .resultado-barra {
        width: 58px;
        max-width: 100%;
        min-height: 7px;
        border-radius: 6px 6px 0 0;
        transition:
          height 0.3s ease,
          opacity 0.2s ease;
      }

      .resultado-barra:hover {
        opacity: 0.85;
      }

      .resultado-titulo {
        margin-top: 9px;
        font-size: var(--fs-xs);
        font-weight: 500;
        color: var(--text-secondary);
        text-align: center;
        white-space: nowrap;
      }

      .resultado-percentual {
        margin-top: 3px;
        font-size: var(--fs-2xs);
        color: var(--text-subtle);
        text-align: center;
        white-space: nowrap;
      }

      /* =============================================
         RESPONSIVIDADE
         ============================================= */

      @media (max-width: 1100px) {
        .relatorios-grid-principal {
          grid-template-columns:
            minmax(0, 1fr) !important;
        }

        .relatorios-grid-inferior {
          grid-template-columns:
            minmax(0, 1fr) !important;
        }
      }

      @media (max-width: 700px) {
        .relatorios-content {
          padding: 16px !important;
        }

        .relatorios-container {
          max-width: 100% !important;
        }

        .indicadores-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr)) !important;
          gap: 10px !important;
        }

        .pizza-chart {
          flex-direction: column;
          gap: 22px;
          padding: 4px 0;
        }

        .pizza {
          width: 180px;
          height: 180px;
          min-width: 180px;
        }

        .resultado-financeiro-chart {
          height: 270px;
          gap: 10px;
          padding-left: 4px;
          padding-right: 4px;
        }

        .resultado-barra-area {
          height: 175px;
        }

        .resultado-barra {
          width: 48px;
        }

        .resultado-valor {
          font-size: var(--fs-2xs);
        }

        .resultado-titulo {
          font-size: var(--fs-2xs);
        }
      }

      @media (max-width: 480px) {
        .relatorios-content {
          padding: 12px !important;
        }

        .indicadores-grid {
          grid-template-columns:
            minmax(0, 1fr) !important;
        }

        .pizza {
          width: 165px;
          height: 165px;
          min-width: 165px;
        }

        .resultado-financeiro-chart {
          height: 255px;
        }

        .resultado-barra-area {
          height: 160px;
        }

        .resultado-barra {
          width: 42px;
        }

        .resultado-valor {
          font-size: var(--fs-2xs);
        }

        .resultado-titulo {
          font-size: var(--fs-2xs);
        }

        .resultado-percentual {
          font-size: var(--fs-2xs);
        }
      }
    `}</style>
  );
}

// =====================================================
// INDICADOR
// =====================================================

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
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
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
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            {titulo}
          </p>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: "var(--fs-xl)",
              color: "var(--text)",
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
            borderRadius: 10,
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
              fontSize: "var(--fs-2xs)",
              fontWeight: 600,
              color: positivo ? "var(--primary)" : "var(--danger)",
            }}
          >
            {variacao}
          </span>

          <span
            style={{
              fontSize: "var(--fs-2xs)",
              color: "var(--text-subtle)",
            }}
          >
            vs. período anterior
          </span>
        </div>
      )}
    </div>
  );
}

// =====================================================
// ESTILOS DOS CARDS
// =====================================================

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
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
  fontSize: "var(--fs-md)",
  fontWeight: 600,
  color: "var(--text)",
};

const cardSubtitleStyle = {
  margin: "5px 0 0",
  fontSize: "var(--fs-xs)",
  color: "var(--text-muted)",
};

const summaryBoxStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: 14,
};

const summaryLabelStyle = {
  margin: 0,
  fontSize: "var(--fs-2xs)",
  color: "var(--text-muted)",
};
