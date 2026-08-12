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
  // Data atual no formato YYYY-MM-DD
  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  const [filtroVenda, setFiltroVenda] = useState<
    "todas" | "abertas" | "fechadas" | "pendentes"
  >("todas");
  const [dataInicio, setDataInicio] = useState(hojeStr);
  const [dataFim, setDataFim] = useState(hojeStr);
  const [showFiltroData, setShowFiltroData] = useState(false);

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

  // Filtrar vendas
  const vendasFiltradas = vendas.filter((venda) => {
    // Filtro por status
    if (filtroVenda === "abertas" && venda.status !== "aberto") return false;
    if (
      filtroVenda === "fechadas" &&
      (venda.status !== "fechado" || venda.payment_method === "pendente")
    )
      return false;
    if (filtroVenda === "pendentes" && venda.payment_method !== "pendente")
      return false;

    // Filtro por data (usa order_date diretamente)
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

  const getStatusVenda = (venda: Venda) => {
    if (venda.status === "aberto") {
      return { label: "Em andamento", background: "#d1fae5", color: "#059669" };
    }
    if (venda.payment_method === "pendente") {
      return { label: "Pendente", background: "#fef3c7", color: "#d97706" };
    }
    return { label: "Finalizada", background: "#fee2e2", color: "#dc2626" };
  };

  // Componente de filtros
  const Filtros = () => (
    <div
      style={{
        background: "#fff",
        padding: isMobile ? "12px 16px" : "16px 20px",
        borderRadius: 8,
        marginBottom: 20,
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setFiltroVenda("abertas")}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border:
                filtroVenda === "abertas"
                  ? "1px solid #10b981"
                  : "1px solid #e5e7eb",
              background: filtroVenda === "abertas" ? "#f0fdf4" : "#fff",
              color: filtroVenda === "abertas" ? "#059669" : "#6b7280",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Abertas
          </button>

          <button
            onClick={() => setFiltroVenda("fechadas")}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border:
                filtroVenda === "fechadas"
                  ? "1px solid #10b981"
                  : "1px solid #e5e7eb",
              background: filtroVenda === "fechadas" ? "#f0fdf4" : "#fff",
              color: filtroVenda === "fechadas" ? "#059669" : "#6b7280",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Fechadas
          </button>

          <button
            onClick={() => setFiltroVenda("pendentes")}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border:
                filtroVenda === "pendentes"
                  ? "1px solid #f59e0b"
                  : "1px solid #e5e7eb",
              background: filtroVenda === "pendentes" ? "#fffbeb" : "#fff",
              color: filtroVenda === "pendentes" ? "#d97706" : "#6b7280",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Pendentes
          </button>

          <button
            onClick={() => setFiltroVenda("todas")}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border:
                filtroVenda === "todas"
                  ? "1px solid #10b981"
                  : "1px solid #e5e7eb",
              background: filtroVenda === "todas" ? "#f0fdf4" : "#fff",
              color: filtroVenda === "todas" ? "#059669" : "#6b7280",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Todas
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowFiltroData(!showFiltroData)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            fontSize: 12,
            width: isMobile ? "100%" : "auto",
            justifyContent: isMobile ? "center" : "flex-start",
          }}
        >
          <FontAwesomeIcon icon={faFilter} />
          Filtrar por Data
        </button>

        {(dataInicio !== hojeStr || dataFim !== hojeStr) && (
          <button
            onClick={limparFiltroData}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: "#fee2e2",
              color: "#dc2626",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {showFiltroData && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{
                fontSize: 11,
                color: "#6b7280",
                display: "block",
                marginBottom: 4,
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
                padding: "8px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                fontSize: 11,
                color: "#6b7280",
                display: "block",
                marginBottom: 4,
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
                padding: "8px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                fontSize: 13,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  // Tabela Desktop
  const TabelaDesktop = () => (
    <div
      style={{
        flex: 1,
        overflowX: "auto",
        overflowY: "auto",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        backgroundColor: "#fff",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 600,
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <thead
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            zIndex: 1,
          }}
        >
          <tr>
            <th style={thStyle}>Data</th>
            <th style={thStyle}>Ponto de Atendimento</th>
            <th style={thStyle}>Cliente</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Valor</th>
            <th style={{ padding: "12px", textAlign: "center" }}>Status</th>
          </tr>
        </thead>

        <tbody>
          {vendasFiltradas.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "#9ca3af",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faClipboardList}
                    style={{ fontSize: 48, marginBottom: 12 }}
                  />
                  <p>Nenhuma venda encontrada</p>
                </div>
              </td>
            </tr>
          ) : (
            vendasFiltradas.map((venda, index) => {
              const status = getStatusVenda(venda);
              const dataVenda = getDataVenda(venda);

              return (
                <tr
                  key={venda.id}
                  onClick={() => onVendaClick(venda)}
                  style={{
                    cursor: "pointer",
                    borderBottom:
                      index < vendasFiltradas.length - 1
                        ? "1px solid #e5e7eb"
                        : "none",
                    backgroundColor:
                      vendaSelecionada?.id === venda.id
                        ? "#f0fdf4"
                        : index % 2 === 0
                          ? "#fff"
                          : "#fafafa",
                  }}
                >
                  <td style={tdStyle}>{formatDate(dataVenda)}</td>
                  <td style={tdStyle}>{getNomePontoVenda(venda.table_id)}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{venda.customer_name}</div>
                    <div
                      style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}
                    >
                      #{venda.order_number || venda.id}
                    </div>
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      fontWeight: 600,
                      color: "#059669",
                    }}
                  >
                    {formatCurrency(venda.total || 0)}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 500,
                        background: status.background,
                        color: status.color,
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

  // Mobile
  const TabelaMobile = () => (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: 500,
          borderCollapse: "collapse",
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <thead
          style={{
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <tr>
            <th style={mobileThStyle}>Data</th>
            <th style={mobileThStyle}>Ponto</th>
            <th style={mobileThStyle}>Cliente</th>
            <th style={{ ...mobileThStyle, textAlign: "right" }}>Valor</th>
            <th style={{ ...mobileThStyle, textAlign: "center" }}>Status</th>
          </tr>
        </thead>

        <tbody>
          {vendasFiltradas.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#9ca3af",
                  }}
                >
                  <p style={{ fontSize: 14 }}>Nenhuma venda encontrada</p>
                </div>
              </td>
            </tr>
          ) : (
            vendasFiltradas.map((venda, index) => {
              const status = getStatusVenda(venda);
              const dataVenda = getDataVenda(venda);

              return (
                <tr
                  key={venda.id}
                  onClick={() => onVendaClick(venda)}
                  style={{
                    cursor: "pointer",
                    borderBottom:
                      index < vendasFiltradas.length - 1
                        ? "1px solid #e5e7eb"
                        : "none",
                    backgroundColor:
                      vendaSelecionada?.id === venda.id
                        ? "#f0fdf4"
                        : index % 2 === 0
                          ? "#fff"
                          : "#fafafa",
                  }}
                >
                  <td style={mobileTdStyle}>{formatDate(dataVenda)}</td>
                  <td style={mobileTdStyle}>
                    {getNomePontoVenda(venda.table_id)}
                  </td>
                  <td style={mobileTdStyle}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>
                      {venda.customer_name}
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>
                      #{venda.order_number || venda.id}
                    </div>
                  </td>
                  <td
                    style={{
                      ...mobileTdStyle,
                      textAlign: "right",
                      fontWeight: 600,
                      color: "#059669",
                    }}
                  >
                    {formatCurrency(venda.total || 0)}
                  </td>
                  <td style={{ ...mobileTdStyle, textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontSize: 10,
                        background: status.background,
                        color: status.color,
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

  const thStyle: React.CSSProperties = {
    padding: "12px",
    textAlign: "left",
    fontWeight: 600,
    color: "#374151",
    borderRight: "1px solid #e5e7eb",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px",
    borderRight: "1px solid #e5e7eb",
  };

  const mobileThStyle: React.CSSProperties = {
    padding: "10px 8px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
  };

  const mobileTdStyle: React.CSSProperties = {
    padding: "10px 8px",
    fontSize: 12,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Filtros />
      {isMobile ? <TabelaMobile /> : <TabelaDesktop />}
    </div>
  );
};
