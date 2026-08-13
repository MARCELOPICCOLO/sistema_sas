import React from "react";
import { FiltrosCaixa } from "./FiltrosCaixa";

interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface HeaderCaixaProps {
  mesSelecionado: number;
  setMesSelecionado: (mes: number) => void;
  anoSelecionado: number;
  setAnoSelecionado: (ano: number) => void;

  showEntradas: boolean;
  setShowEntradas: (show: boolean) => void;

  showSaidas: boolean;
  setShowSaidas: (show: boolean) => void;

  totalEntradas: number;
  totalSaidas: number;
  saldoGeral: number;

  formatCurrency: (value: any) => string;

  anos: number[];
  meses: { value: number; label: string }[];

  categorias: ExpenseCategory[];
  filtroCategoria: number | null;
  setFiltroCategoria: (id: number | null) => void;
}

export const HeaderCaixa: React.FC<HeaderCaixaProps> = ({
  mesSelecionado,
  setMesSelecionado,
  anoSelecionado,
  setAnoSelecionado,
  showEntradas,
  setShowEntradas,
  showSaidas,
  setShowSaidas,
  totalEntradas,
  totalSaidas,
  saldoGeral,
  formatCurrency,
  anos,
  meses,
  categorias,
  filtroCategoria,
  setFiltroCategoria,
}) => {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 10,
        marginBottom: 20,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "18px 20px",
        }}
      >
        {/* TÍTULO + PERÍODO */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "#1f2937",
            }}
          >
            Fluxo de Caixa
          </h2>

          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(Number(e.target.value))}
              style={{
                padding: "7px 10px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#374151",
                fontSize: 12,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {meses.map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>

            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              style={{
                padding: "7px 10px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#374151",
                fontSize: 12,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {anos.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RESUMO */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #f0f1f3",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            {/* VALORES */}
            <div
              style={{
                display: "flex",
                gap: 32,
                flexWrap: "wrap",
              }}
            >
              {/* ENTRADAS */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    marginBottom: 3,
                  }}
                >
                  Entradas
                </div>

                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: "#059669",
                  }}
                >
                  {formatCurrency(totalEntradas)}
                </div>
              </div>

              {/* SAÍDAS */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    marginBottom: 3,
                  }}
                >
                  Saídas
                </div>

                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {formatCurrency(totalSaidas)}
                </div>
              </div>

              {/* SALDO */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    marginBottom: 3,
                  }}
                >
                  Saldo
                </div>

                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: saldoGeral >= 0 ? "#059669" : "#374151",
                  }}
                >
                  {formatCurrency(saldoGeral)}
                </div>
              </div>
            </div>

            {/* FILTRO ENTRADAS / SAÍDAS */}
            <div
              style={{
                display: "flex",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setShowEntradas(!showEntradas)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: showEntradas ? "#f3f4f6" : "#ffffff",
                  color: showEntradas ? "#374151" : "#6b7280",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Entradas
              </button>

              <button
                onClick={() => setShowSaidas(!showSaidas)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: showSaidas ? "#f3f4f6" : "#ffffff",
                  color: showSaidas ? "#374151" : "#6b7280",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Saídas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTRO DE CATEGORIAS */}
      {categorias.length > 0 && (
        <div
          style={{
            borderTop: "1px solid #f0f1f3",
            padding: "12px 20px",
          }}
        >
          <FiltrosCaixa
            categorias={categorias}
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
          />
        </div>
      )}
    </div>
  );
};
