import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faChevronDown,
  faChevronRight,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  expense_category_id?: number;
  category_id?: number;
  type: "entrada" | "saida";

  category?: {
    id: number;
    name: string;
    icon: string;
    color: string;
  };

  source?: "pdv" | "manual";
}

interface ResumoDiario {
  date: string;
  total_vendas: number;
  total_entradas: number;
}

interface TabelaGastosProps {
  transacoesPorData: { [key: string]: Transaction[] };

  resumoDiario: ResumoDiario[];

  diasExpandidos: { [key: string]: boolean };

  totalEntradasPorData: { [key: string]: number };
  totalSaidasPorData: { [key: string]: number };
  saldoPorData: { [key: string]: number };

  loading: boolean;

  /**
   * Indica quais dias estão carregando os detalhes.
   */
  diasCarregando?: { [key: string]: boolean };

  formatDate: (dateString: string) => string;
  formatCurrency: (value: any) => string;

  toggleDia: (data: string) => void;

  removerTransacao: (id: number, type: string, source?: string) => void;

  editarTransacao?: (transacao: Transaction) => void;
}

export const TabelaGastos: React.FC<TabelaGastosProps> = ({
  transacoesPorData,
  resumoDiario,
  diasExpandidos,
  totalEntradasPorData,
  totalSaidasPorData,
  saldoPorData,
  loading,
  diasCarregando = {},
  formatDate,
  formatCurrency,
  toggleDia,
  removerTransacao,
  editarTransacao,
}) => {
  /*
   * =========================================================
   * LOADING DO RESUMO
   * =========================================================
   */

  if (loading) {
    return (
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "40px",
          textAlign: "center",
          color: "#6b7280",
          fontSize: 13,
        }}
      >
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          style={{
            marginRight: 8,
          }}
        />
        Carregando...
      </div>
    );
  }

  /*
   * =========================================================
   * NENHUM DIA NO RESUMO
   * =========================================================
   */

  if (!resumoDiario || resumoDiario.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 20px",
          background: "#ffffff",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            margin: "0 auto 14px",
            borderRadius: 10,
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: 20,
          }}
        >
          —
        </div>

        <p
          style={{
            fontSize: 14,
            color: "#6b7280",
            margin: 0,
          }}
        >
          Nenhuma transação registrada neste mês
        </p>
      </div>
    );
  }

  /*
   * =========================================================
   * TABELA
   * =========================================================
   */

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {resumoDiario
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((resumo) => {
          const data = resumo.date;

          const estaExpandido = diasExpandidos[data] === true;

          const transacoesDoDia = transacoesPorData[data] || [];

          const carregandoDia = diasCarregando[data] === true;

          /*
           * O resumo da API representa as entradas do dia.
           * Caso os detalhes ainda não tenham sido carregados,
           * usamos o resumo para mostrar o valor da entrada.
           */
          const totalEntradasDia =
            totalEntradasPorData[data] ?? Number(resumo.total_entradas) ?? 0;

          const totalSaidasDia = totalSaidasPorData[data] ?? 0;

          const saldoDia =
            saldoPorData[data] ?? totalEntradasDia - totalSaidasDia;

          /*
           * Quantidade mostrada inicialmente vem do resumo.
           *
           * Quando os detalhes forem carregados, usamos a
           * quantidade real de transações.
           */
          const quantidade =
            transacoesPorData[data] !== undefined
              ? transacoesDoDia.length
              : Number(resumo.total_vendas) || 0;

          return (
            <div
              key={data}
              style={{
                background: "#ffffff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              {/* =====================================================
                  CABEÇALHO DO DIA
              ====================================================== */}

              <div
                onClick={() => toggleDia(data)}
                style={{
                  background: estaExpandido ? "#f9fafb" : "#ffffff",
                  padding: "14px 18px",
                  cursor: "pointer",

                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",

                  flexWrap: "wrap",
                  gap: 12,

                  borderBottom: estaExpandido ? "1px solid #e5e7eb" : "none",

                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = estaExpandido
                    ? "#f9fafb"
                    : "#ffffff";
                }}
              >
                {/* =================================================
                    DATA
                ================================================== */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <FontAwesomeIcon
                    icon={estaExpandido ? faChevronDown : faChevronRight}
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      width: 12,
                    }}
                  />

                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    {formatDate(data)}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      background: "#f3f4f6",
                      padding: "3px 8px",
                      borderRadius: 6,
                    }}
                  >
                    {quantidade} {quantidade === 1 ? "item" : "itens"}
                  </span>

                  {carregandoDia && (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                      }}
                    />
                  )}
                </div>

                {/* =================================================
                    RESUMO DO DIA
                ================================================== */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    flexWrap: "wrap",
                  }}
                >
                  {/* ENTRADAS */}

                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Entradas{" "}
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#059669",
                      }}
                    >
                      {formatCurrency(totalEntradasDia)}
                    </span>
                  </div>

                  {/* SAÍDAS */}

                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Saídas{" "}
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      {formatCurrency(totalSaidasDia)}
                    </span>
                  </div>

                  {/* SALDO */}

                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Saldo{" "}
                    <span
                      style={{
                        fontWeight: 600,
                        color: saldoDia >= 0 ? "#059669" : "#374151",
                      }}
                    >
                      {formatCurrency(saldoDia)}
                    </span>
                  </div>
                </div>
              </div>

              {/* =====================================================
                  DETALHES DO DIA
              ====================================================== */}

              {estaExpandido && (
                <>
                  {carregandoDia ? (
                    <div
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: 13,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        style={{
                          marginRight: 8,
                        }}
                      />
                      Carregando transações...
                    </div>
                  ) : transacoesDoDia.length === 0 ? (
                    <div
                      style={{
                        padding: "28px",
                        textAlign: "center",
                        color: "#9ca3af",
                        fontSize: 13,
                      }}
                    >
                      Nenhuma transação detalhada encontrada.
                    </div>
                  ) : (
                    <div
                      style={{
                        overflowX: "auto",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 13,
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
                                padding: "11px 16px",
                                textAlign: "left",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                              }}
                            >
                              Descrição
                            </th>

                            <th
                              style={{
                                padding: "11px 16px",
                                textAlign: "left",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                              }}
                            >
                              Categoria
                            </th>

                            <th
                              style={{
                                padding: "11px 16px",
                                textAlign: "left",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                              }}
                            >
                              Tipo
                            </th>

                            <th
                              style={{
                                padding: "11px 16px",
                                textAlign: "right",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                              }}
                            >
                              Valor
                            </th>

                            <th
                              style={{
                                padding: "11px 16px",
                                textAlign: "center",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                              }}
                            >
                              Ações
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {transacoesDoDia.map(
                            (t: Transaction, index: number) => (
                              <tr
                                key={`${t.type}-${t.id}`}
                                style={{
                                  borderBottom:
                                    index < transacoesDoDia.length - 1
                                      ? "1px solid #f0f1f3"
                                      : "none",

                                  background: "#ffffff",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#fafafa";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#ffffff";
                                }}
                              >
                                {/* DESCRIÇÃO */}

                                <td
                                  style={{
                                    padding: "13px 16px",
                                    fontSize: 13,
                                    color: "#1f2937",
                                    fontWeight: 400,
                                  }}
                                  title={t.description}
                                >
                                  {t.description.length > 50
                                    ? t.description.substring(0, 50) + "..."
                                    : t.description}
                                </td>

                                {/* CATEGORIA */}

                                <td
                                  style={{
                                    padding: "13px 16px",
                                  }}
                                >
                                  {t.type === "entrada" ? (
                                    <span
                                      style={{
                                        fontSize: 12,
                                        color: "#6b7280",
                                      }}
                                    >
                                      PDV
                                    </span>
                                  ) : t.category ? (
                                    <span
                                      style={{
                                        fontSize: 12,
                                        color: "#4b5563",
                                      }}
                                    >
                                      {t.category.name}
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 12,
                                        color: "#9ca3af",
                                      }}
                                    >
                                      Sem categoria
                                    </span>
                                  )}
                                </td>

                                {/* TIPO */}

                                <td
                                  style={{
                                    padding: "13px 16px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color:
                                        t.type === "entrada"
                                          ? "#059669"
                                          : "#6b7280",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {t.type === "entrada" ? "Entrada" : "Saída"}
                                  </span>
                                </td>

                                {/* VALOR */}

                                <td
                                  style={{
                                    padding: "13px 16px",
                                    textAlign: "right",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color:
                                      t.type === "entrada"
                                        ? "#059669"
                                        : "#374151",
                                  }}
                                >
                                  {formatCurrency(t.amount)}
                                </td>

                                {/* AÇÕES */}

                                <td
                                  style={{
                                    padding: "13px 16px",
                                    textAlign: "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 10,
                                      justifyContent: "center",
                                      alignItems: "center",
                                    }}
                                  >
                                    {t.type === "saida" && editarTransacao && (
                                      <button
                                        onClick={() => editarTransacao(t)}
                                        style={{
                                          width: 30,
                                          height: 30,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          background: "transparent",
                                          border: "1px solid transparent",
                                          borderRadius: 6,
                                          cursor: "pointer",
                                          color: "#9ca3af",
                                          transition: "all 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#f3f4f6";
                                          e.currentTarget.style.color =
                                            "#374151";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                          e.currentTarget.style.color =
                                            "#9ca3af";
                                        }}
                                        title="Editar"
                                      >
                                        <FontAwesomeIcon
                                          icon={faEdit}
                                          style={{
                                            fontSize: 13,
                                          }}
                                        />
                                      </button>
                                    )}

                                    {t.type === "saida" && (
                                      <button
                                        onClick={() =>
                                          removerTransacao(
                                            t.id,
                                            t.type,
                                            t.source,
                                          )
                                        }
                                        style={{
                                          width: 30,
                                          height: 30,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          background: "transparent",
                                          border: "1px solid transparent",
                                          borderRadius: 6,
                                          cursor: "pointer",
                                          color: "#9ca3af",
                                          transition: "all 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#fef2f2";
                                          e.currentTarget.style.color =
                                            "#dc2626";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                          e.currentTarget.style.color =
                                            "#9ca3af";
                                        }}
                                        title="Remover"
                                      >
                                        <FontAwesomeIcon
                                          icon={faTrash}
                                          style={{
                                            fontSize: 13,
                                          }}
                                        />
                                      </button>
                                    )}

                                    {t.type === "entrada" && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          color: "#9ca3af",
                                        }}
                                      >
                                        PDV
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
    </div>
  );
};
