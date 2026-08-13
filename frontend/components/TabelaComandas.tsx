// components/TabelaComandas.tsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faClipboardList } from "@fortawesome/free-solid-svg-icons";

interface PontoVenda {
  id: number;
  number: number;
  restaurant_id: number;
}

interface VendaItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: {
    name: string;
    product_code?: string;
  };
}

interface Venda {
  id: number;
  order_number?: string;
  order_date?: string;
  customer_name: string;
  status: string;
  payment_method?: string;
  total?: number;
  items?: VendaItem[];
  created_at?: string;
  closed_at?: string;
  table_id?: number;
}

interface TabelaComandasProps {
  vendas: Venda[];
  pontosVenda: PontoVenda[];
  vendaSelecionada: Venda | null;
  onVendaClick: (venda: Venda) => void;
  isMobile?: boolean;
  formatCurrency: (value: any) => string;
}

export const TabelaComandas: React.FC<TabelaComandasProps> = ({
  vendas,
  pontosVenda,
  vendaSelecionada,
  onVendaClick,
  isMobile = false,
  formatCurrency,
}) => {
  // =========================
  // DATA
  // =========================

  const hoje = new Date();

  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(hoje.getDate()).padStart(2, "0")}`;

  const [filtroVenda, setFiltroVenda] = useState<
    "todas" | "abertas" | "fechadas" | "pendentes"
  >("todas");

  const [dataInicio, setDataInicio] = useState(hojeStr);
  const [dataFim, setDataFim] = useState(hojeStr);
  const [showFiltroData, setShowFiltroData] = useState(false);

  // =========================
  // AUXILIARES
  // =========================

  const getNomePontoVenda = (tableId?: number) => {
    if (!tableId) return "-";

    const ponto = pontosVenda.find((p) => p.id === tableId);

    if (!ponto) return "-";

    return ponto.number === 0
      ? "Balcão"
      : `Ponto ${ponto.number.toString().padStart(2, "0")}`;
  };

  const getDataVenda = (venda: Venda): string => {
    const data = venda.order_date || venda.closed_at || venda.created_at;

    if (!data) return "";

    return data.substring(0, 10);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "-";

    const parts = dateString.split("-");

    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return dateString;
  };

  const getStatusVenda = (venda: Venda) => {
    if (venda.status === "aberto") {
      return {
        label: "Em andamento",
        background: "#ecfdf5",
        color: "#059669",
        border: "#a7f3d0",
      };
    }

    if (venda.payment_method === "pendente") {
      return {
        label: "Pendente",
        background: "#fffbeb",
        color: "#d97706",
        border: "#fde68a",
      };
    }

    return {
      label: "Finalizada",
      background: "#fef2f2",
      color: "#dc2626",
      border: "#fecaca",
    };
  };

  // =========================
  // FILTROS
  // =========================

  const vendasFiltradas = vendas.filter((venda) => {
    if (filtroVenda === "abertas" && venda.status !== "aberto") {
      return false;
    }

    if (
      filtroVenda === "fechadas" &&
      (venda.status !== "fechado" || venda.payment_method === "pendente")
    ) {
      return false;
    }

    if (filtroVenda === "pendentes" && venda.payment_method !== "pendente") {
      return false;
    }

    const dataVenda = getDataVenda(venda);

    if (!dataVenda) return true;

    if (dataInicio && dataVenda < dataInicio) return false;
    if (dataFim && dataVenda > dataFim) return false;

    return true;
  });

  const limparFiltroData = () => {
    setDataInicio(hojeStr);
    setDataFim(hojeStr);
    setShowFiltroData(false);
  };

  // =========================
  // FILTROS UI
  // =========================

  const Filtros = () => (
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
          flexWrap: "wrap",
        }}
      >
        {/* FILTROS DE STATUS */}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setFiltroVenda("todas")}
            style={filtroButtonStyle(filtroVenda === "todas", "green")}
          >
            Todas
          </button>

          <button
            onClick={() => setFiltroVenda("abertas")}
            style={filtroButtonStyle(filtroVenda === "abertas", "green")}
          >
            Abertas
          </button>

          <button
            onClick={() => setFiltroVenda("fechadas")}
            style={filtroButtonStyle(filtroVenda === "fechadas", "green")}
          >
            Fechadas
          </button>

          <button
            onClick={() => setFiltroVenda("pendentes")}
            style={filtroButtonStyle(filtroVenda === "pendentes", "orange")}
          >
            Pendentes
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* FILTRO DE DATA */}

        <button
          onClick={() => setShowFiltroData(!showFiltroData)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "7px 14px",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            width: isMobile ? "100%" : "auto",
            transition: "all 0.15s",
          }}
        >
          <FontAwesomeIcon icon={faFilter} />
          Filtrar por Data
        </button>

        {(dataInicio !== hojeStr || dataFim !== hojeStr) && (
          <button
            onClick={limparFiltroData}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#dc2626",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* FILTRO DE DATA ABERTO */}

      {showFiltroData && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 12,
            padding: 12,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{
                fontSize: 11,
                color: "#6b7280",
                display: "block",
                marginBottom: 5,
                fontWeight: 500,
              }}
            >
              Data Início
            </label>

            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 10px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                outline: "none",
                background: "#fff",
                color: "#111827",
                fontSize: 12,
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                fontSize: 11,
                color: "#6b7280",
                display: "block",
                marginBottom: 5,
                fontWeight: 500,
              }}
            >
              Data Fim
            </label>

            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 10px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                outline: "none",
                background: "#fff",
                color: "#111827",
                fontSize: 12,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  // =========================
  // DESKTOP
  // =========================

  const TabelaDesktop = () => (
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
            <th style={thStyle}>Data</th>

            <th style={thStyle}>Ponto de Atendimento</th>

            <th style={thStyle}>Cliente</th>

            <th
              style={{
                ...thStyle,
                textAlign: "right",
              }}
            >
              Valor
            </th>

            <th
              style={{
                ...thStyle,
                textAlign: "center",
              }}
            >
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {vendasFiltradas.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#9ca3af",
                    fontSize: 13,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faClipboardList}
                    style={{
                      fontSize: 32,
                      marginBottom: 10,
                    }}
                  />

                  <div>Nenhuma venda encontrada.</div>
                </div>
              </td>
            </tr>
          ) : (
            vendasFiltradas.map((venda, index) => {
              const status = getStatusVenda(venda);
              const dataVenda = getDataVenda(venda);
              const selecionada = vendaSelecionada?.id === venda.id;

              return (
                <tr
                  key={venda.id}
                  onClick={() => onVendaClick(venda)}
                  style={{
                    cursor: "pointer",
                    borderBottom:
                      index < vendasFiltradas.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                    background: selecionada ? "#ecfdf5" : "#fff",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!selecionada) {
                      e.currentTarget.style.background = "#f9fafb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selecionada) {
                      e.currentTarget.style.background = "#fff";
                    }
                  }}
                >
                  <td style={tdStyle}>{formatDate(dataVenda)}</td>

                  <td style={tdStyle}>{getNomePontoVenda(venda.table_id)}</td>

                  <td style={tdStyle}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#111827",
                      }}
                    >
                      {venda.customer_name}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: "#9ca3af",
                        marginTop: 3,
                      }}
                    >
                      #{venda.order_number || venda.id}
                    </div>
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#059669",
                    }}
                  >
                    {formatCurrency(venda.total || 0)}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: `1px solid ${status.border}`,
                        background: status.background,
                        color: status.color,
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  // =========================
  // MOBILE
  // =========================

  const TabelaMobile = () => (
    <div
      style={{
        flex: 1,
        overflow: "auto",
      }}
    >
      {vendasFiltradas.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
          }}
        >
          <FontAwesomeIcon
            icon={faClipboardList}
            style={{
              fontSize: 32,
              marginBottom: 10,
            }}
          />

          <div>Nenhuma venda encontrada.</div>
        </div>
      ) : (
        vendasFiltradas.map((venda) => {
          const status = getStatusVenda(venda);
          const dataVenda = getDataVenda(venda);
          const selecionada = vendaSelecionada?.id === venda.id;

          return (
            <div
              key={venda.id}
              onClick={() => onVendaClick(venda)}
              style={{
                background: selecionada ? "#ecfdf5" : "#fff",
                borderRadius: 10,
                padding: 14,
                marginBottom: 8,
                border: selecionada ? "1px solid #a7f3d0" : "1px solid #e5e7eb",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                cursor: "pointer",
              }}
            >
              {/* CABEÇALHO */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 10,
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
                    {venda.customer_name}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: "#9ca3af",
                      marginTop: 3,
                    }}
                  >
                    #{venda.order_number || venda.id}
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
                  {formatCurrency(venda.total || 0)}
                </span>
              </div>

              {/* INFORMAÇÕES */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #f3f4f6",
                  paddingTop: 9,
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    {formatDate(dataVenda)}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    {getNomePontoVenda(venda.table_id)}
                  </span>
                </div>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "5px 9px",
                    borderRadius: 6,
                    border: `1px solid ${status.border}`,
                    background: status.background,
                    color: status.color,
                    fontSize: 10,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {status.label}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // =========================
  // ESTILOS
  // =========================

  const thStyle: React.CSSProperties = {
    padding: "11px 14px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    borderBottom: "1px solid #e5e7eb",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 14px",
    fontSize: 12,
    color: "#374151",
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "#111827",
      }}
    >
      <Filtros />

      {isMobile ? <TabelaMobile /> : <TabelaDesktop />}

      {!isMobile && (
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
          <strong
            style={{
              color: "#374151",
            }}
          >
            {vendasFiltradas.length}
          </strong>{" "}
          vendas
        </div>
      )}
    </div>
  );
};

// =========================
// ESTILO DOS FILTROS
// =========================

const filtroButtonStyle = (
  ativo: boolean,
  tipo: "green" | "orange",
): React.CSSProperties => {
  const verde = tipo === "green";

  return {
    padding: "7px 14px",
    borderRadius: 20,
    border: ativo
      ? `1px solid ${verde ? "#10b981" : "#f59e0b"}`
      : "1px solid #e5e7eb",
    background: ativo ? (verde ? "#ecfdf5" : "#fffbeb") : "#fff",
    color: ativo ? (verde ? "#059669" : "#d97706") : "#6b7280",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: ativo ? 600 : 500,
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  };
};
