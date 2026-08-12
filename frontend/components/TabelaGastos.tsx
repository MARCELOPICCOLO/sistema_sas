import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";

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

interface TabelaGastosProps {
  transacoesPorData: { [key: string]: Transaction[] };
  diasExpandidos: { [key: string]: boolean };
  totalEntradasPorData: { [key: string]: number };
  totalSaidasPorData: { [key: string]: number };
  saldoPorData: { [key: string]: number };
  loading: boolean;
  formatDate: (dateString: string) => string;
  formatCurrency: (value: any) => string;
  toggleDia: (data: string) => void;
  removerTransacao: (id: number, type: string, source?: string) => void;
  editarTransacao?: (transacao: Transaction) => void;
}

export const TabelaGastos: React.FC<TabelaGastosProps> = ({
  transacoesPorData,
  diasExpandidos,
  totalEntradasPorData,
  totalSaidasPorData,
  saldoPorData,
  loading,
  formatDate,
  formatCurrency,
  toggleDia,
  removerTransacao,
  editarTransacao,
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>Carregando...</div>
    );
  }

  if (Object.keys(transacoesPorData).length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {Object.keys(transacoesPorData)
        .sort((a, b) => b.localeCompare(a))
        .map((data) => {
          const estaExpandido = diasExpandidos[data] === true;
          const transacoesDoDia = transacoesPorData[data];

          const totalEntradasDia = totalEntradasPorData[data] || 0;

          const totalSaidasDia = totalSaidasPorData[data] || 0;

          const saldoDia = saldoPorData[data] || 0;

          return (
            <div
              key={data}
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              {/* CABEÇALHO DO DIA */}
              <div
                onClick={() => toggleDia(data)}
                style={{
                  background: estaExpandido ? "#f9fafb" : "#fff",
                  padding: "14px 20px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  borderBottom: estaExpandido ? "1px solid #e5e7eb" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: "#6b7280",
                    }}
                  >
                    {estaExpandido ? "▼" : "▶"}
                  </span>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    📅 {formatDate(data)}
                  </h3>

                  <span
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      background: "#f3f4f6",
                      padding: "2px 8px",
                      borderRadius: 12,
                    }}
                  >
                    {transacoesDoDia.length}{" "}
                    {transacoesDoDia.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#10b981",
                    }}
                  >
                    Entradas: {formatCurrency(totalEntradasDia)}
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#dc2626",
                    }}
                  >
                    Saídas: {formatCurrency(totalSaidasDia)}
                  </span>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: saldoDia >= 0 ? "#f0fdf4" : "#fee2e2",
                      color: saldoDia >= 0 ? "#059669" : "#dc2626",
                    }}
                  >
                    Saldo: {formatCurrency(saldoDia)}
                  </span>
                </div>
              </div>

              {/* TABELA DO DIA */}
              {estaExpandido && (
                <div style={{ overflowX: "auto" }}>
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
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Descrição
                        </th>

                        <th
                          style={{
                            padding: "12px 16px",
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
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Tipo
                        </th>

                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "right",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Valor
                        </th>

                        <th
                          style={{
                            padding: "12px 16px",
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
                      {transacoesDoDia.map((t: Transaction, index: number) => (
                        <tr
                          key={`${t.type}-${t.id}`}
                          style={{
                            borderBottom:
                              index < transacoesDoDia.length - 1
                                ? "1px solid #e5e7eb"
                                : "none",
                            backgroundColor:
                              index % 2 === 0 ? "#fff" : "#fafafa",
                          }}
                        >
                          {/* DESCRIÇÃO */}
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#1f2937",
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
                              padding: "12px 16px",
                            }}
                          >
                            {t.type === "entrada" ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "4px 12px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  background: "#d1fae5",
                                  color: "#059669",
                                }}
                              >
                                PDV
                              </span>
                            ) : t.category ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "4px 12px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  background: `${t.category.color}15`,
                                  color: t.category.color,
                                }}
                              >
                                <span>{t.category.name}</span>
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
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#6b7280",
                            }}
                          >
                            {t.type === "entrada" ? "Entrada" : "Saída"}
                          </td>

                          {/* VALOR */}
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "right",
                              fontSize: 14,
                              fontWeight: 600,
                              color:
                                t.type === "entrada" ? "#10b981" : "#dc2626",
                            }}
                          >
                            {formatCurrency(t.amount)}
                          </td>

                          {/* AÇÕES */}
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {t.type === "saida" && editarTransacao && (
                                <button
                                  onClick={() => editarTransacao(t)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#9ca3af",
                                    fontSize: 16,
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#10b981";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#9ca3af";
                                  }}
                                  title="Editar"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                              )}

                              {t.type === "saida" && (
                                <button
                                  onClick={() =>
                                    removerTransacao(t.id, t.type, t.source)
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#9ca3af",
                                    fontSize: 16,
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#dc2626";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#9ca3af";
                                  }}
                                  title="Remover"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}

                              {t.type === "entrada" && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#9ca3af",
                                    background: "#f3f4f6",
                                    padding: "4px 8px",
                                    borderRadius: 12,
                                  }}
                                >
                                  PDV
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};
