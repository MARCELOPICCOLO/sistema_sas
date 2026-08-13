// components/SidebarVendas.tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faCashRegister,
  faBoxes,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";

interface SidebarVendasProps {
  abaAtiva: "produtos" | "comandas";
  onAbaChange: (aba: "produtos" | "comandas") => void;
  onNovaVenda: () => void;
  onVoltarDashboard: () => void;
}

export const SidebarVendas: React.FC<SidebarVendasProps> = ({
  abaAtiva,
  onAbaChange,
  onNovaVenda,
  onVoltarDashboard,
}) => {
  return (
    <div
      style={{
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      {/* Botão Voltar ao Dashboard */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <button
          onClick={onVoltarDashboard}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "9px 12px",
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.2s",
            color: "#6b7280",
            fontSize: 13,
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
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar ao Dashboard
        </button>
      </div>

      {/* Cabeçalho */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              background: "#ecfdf5",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faCashRegister}
              style={{
                fontSize: 19,
                color: "#059669",
              }}
            />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Gestão de Vendas
            </h2>

            <p
              style={{
                margin: "3px 0 0",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Gerenciar vendas
            </p>
          </div>
        </div>
      </div>

      {/* Botão Nova Venda */}
      <div style={{ padding: "20px" }}>
        <button
          onClick={onNovaVenda}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "11px 12px",
            background: "transparent",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.2s",
            color: "#374151",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f8fafc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "#ecfdf5",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faPlus}
              style={{
                fontSize: 13,
                color: "#059669",
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Nova Venda
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                marginTop: 2,
              }}
            >
              Iniciar atendimento
            </div>
          </div>
        </button>
      </div>

      {/* Navegação por Abas */}
      <div style={{ padding: "0 20px 20px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <button
            onClick={() => onAbaChange("produtos")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "11px 12px",
              background: abaAtiva === "produtos" ? "#ecfdf5" : "transparent",
              border:
                abaAtiva === "produtos"
                  ? "1px solid #a7f3d0"
                  : "1px solid transparent",
              borderRadius: 8,
              cursor: "pointer",
              color: abaAtiva === "produtos" ? "#047857" : "#374151",
              fontSize: 13,
              fontWeight: 500,
              transition: "all 0.2s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              if (abaAtiva !== "produtos") {
                e.currentTarget.style.background = "#f8fafc";
              }
            }}
            onMouseLeave={(e) => {
              if (abaAtiva !== "produtos") {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: abaAtiva === "produtos" ? "#d1fae5" : "#f3f4f6",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon
                icon={faBoxes}
                style={{
                  fontSize: 13,
                  color: abaAtiva === "produtos" ? "#059669" : "#6b7280",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: abaAtiva === "produtos" ? "#047857" : "#374151",
                }}
              >
                Produtos
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 2,
                }}
              >
                Produtos da venda
              </div>
            </div>
          </button>

          <button
            onClick={() => onAbaChange("comandas")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "11px 12px",
              background: abaAtiva === "comandas" ? "#ecfdf5" : "transparent",
              border:
                abaAtiva === "comandas"
                  ? "1px solid #a7f3d0"
                  : "1px solid transparent",
              borderRadius: 8,
              cursor: "pointer",
              color: abaAtiva === "comandas" ? "#047857" : "#374151",
              fontSize: 13,
              fontWeight: 500,
              transition: "all 0.2s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              if (abaAtiva !== "comandas") {
                e.currentTarget.style.background = "#f8fafc";
              }
            }}
            onMouseLeave={(e) => {
              if (abaAtiva !== "comandas") {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: abaAtiva === "comandas" ? "#d1fae5" : "#f3f4f6",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon
                icon={faClipboardList}
                style={{
                  fontSize: 13,
                  color: abaAtiva === "comandas" ? "#059669" : "#6b7280",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: abaAtiva === "comandas" ? "#047857" : "#374151",
                }}
              >
                Comandas
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 2,
                }}
              >
                Gerenciar comandas
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
