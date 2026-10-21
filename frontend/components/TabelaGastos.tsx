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
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "40px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "var(--fs-sm)",
          boxShadow: "var(--shadow-card)",
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
          background: "var(--surface)",
          borderRadius: 12,
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            margin: "0 auto 14px",
            borderRadius: 12,
            background: "var(--surface-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-subtle)",
            fontSize: "var(--fs-2xl)",
          }}
        >
          —
        </div>

        <p
          style={{
            fontSize: "var(--fs-md)",
            color: "var(--text-muted)",
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
            totalEntradasPorData[data] ?? (Number(resumo.total_entradas) || 0);

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
                background: "var(--surface)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                overflow: "hidden",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {/* =====================================================
                  CABEÇALHO DO DIA
              ====================================================== */}

              <div
                onClick={() => toggleDia(data)}
                style={{
                  background: estaExpandido ? "var(--surface-2)" : "var(--surface)",
                  padding: "14px 18px",
                  cursor: "pointer",

                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",

                  flexWrap: "wrap",
                  gap: 12,

                  borderBottom: estaExpandido ? "1px solid var(--border)" : "none",

                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = estaExpandido
                    ? "var(--surface-2)"
                    : "var(--surface)";
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
                      fontSize: "var(--fs-2xs)",
                      color: "var(--text-subtle)",
                      width: 12,
                    }}
                  />

                  <span
                    style={{
                      fontSize: "var(--fs-md)",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {formatDate(data)}
                  </span>

                  <span
                    style={{
                      fontSize: "var(--fs-2xs)",
                      color: "var(--text-muted)",
                      background: "var(--surface-3)",
                      padding: "3px 8px",
                      borderRadius: 8,
                    }}
                  >
                    {quantidade} {quantidade === 1 ? "item" : "itens"}
                  </span>

                  {carregandoDia && (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      style={{
                        fontSize: "var(--fs-2xs)",
                        color: "var(--text-subtle)",
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
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Entradas{" "}
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--primary)",
                      }}
                    >
                      {formatCurrency(totalEntradasDia)}
                    </span>
                  </div>

                  {/* SAÍDAS */}

                  <div
                    style={{
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Saídas{" "}
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {formatCurrency(totalSaidasDia)}
                    </span>
                  </div>

                  {/* SALDO */}

                  <div
                    style={{
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Saldo{" "}
                    <span
                      style={{
                        fontWeight: 600,
                        color: saldoDia >= 0 ? "var(--primary)" : "var(--text-secondary)",
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
                        color: "var(--text-muted)",
                        fontSize: "var(--fs-sm)",
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
                        color: "var(--text-subtle)",
                        fontSize: "var(--fs-sm)",
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
                          fontSize: "var(--fs-sm)",
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
                                padding: "11px 16px",
                                textAlign: "left",
                                fontSize: "var(--fs-2xs)",
                                fontWeight: 600,
                                color: "var(--text-muted)",
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
                                fontSize: "var(--fs-2xs)",
                                fontWeight: 600,
                                color: "var(--text-muted)",
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
                                fontSize: "var(--fs-2xs)",
                                fontWeight: 600,
                                color: "var(--text-muted)",
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
                                fontSize: "var(--fs-2xs)",
                                fontWeight: 600,
                                color: "var(--text-muted)",
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
                                fontSize: "var(--fs-2xs)",
                                fontWeight: 600,
                                color: "var(--text-muted)",
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
                                      ? "1px solid var(--surface-3)"
                                      : "none",

                                  background: "var(--surface)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "var(--surface-2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "var(--surface)";
                                }}
                              >
                                {/* DESCRIÇÃO */}

                                <td
                                  style={{
                                    padding: "13px 16px",
                                    fontSize: "var(--fs-sm)",
                                    color: "var(--text)",
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
                                        fontSize: "var(--fs-xs)",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      PDV
                                    </span>
                                  ) : t.category ? (
                                    <span
                                      style={{
                                        fontSize: "var(--fs-xs)",
                                        color: "var(--text-secondary)",
                                      }}
                                    >
                                      {t.category.name}
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: "var(--fs-xs)",
                                        color: "var(--text-subtle)",
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
                                      fontSize: "var(--fs-xs)",
                                      color:
                                        t.type === "entrada"
                                          ? "var(--primary)"
                                          : "var(--text-muted)",
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
                                    fontSize: "var(--fs-sm)",
                                    fontWeight: 600,
                                    color:
                                      t.type === "entrada"
                                        ? "var(--primary)"
                                        : "var(--text-secondary)",
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
                                          borderRadius: 8,
                                          cursor: "pointer",
                                          color: "var(--text-subtle)",
                                          transition: "all 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "var(--surface-3)";
                                          e.currentTarget.style.color =
                                            "var(--text-secondary)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                          e.currentTarget.style.color =
                                            "var(--text-subtle)";
                                        }}
                                        title="Editar"
                                      >
                                        <FontAwesomeIcon
                                          icon={faEdit}
                                          style={{
                                            fontSize: "var(--fs-sm)",
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
                                          borderRadius: 8,
                                          cursor: "pointer",
                                          color: "var(--text-subtle)",
                                          transition: "all 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "var(--danger-soft)";
                                          e.currentTarget.style.color =
                                            "var(--danger)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                          e.currentTarget.style.color =
                                            "var(--text-subtle)";
                                        }}
                                        title="Remover"
                                      >
                                        <FontAwesomeIcon
                                          icon={faTrash}
                                          style={{
                                            fontSize: "var(--fs-sm)",
                                          }}
                                        />
                                      </button>
                                    )}

                                    {t.type === "entrada" && (
                                      <span
                                        style={{
                                          fontSize: "var(--fs-2xs)",
                                          color: "var(--text-subtle)",
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
