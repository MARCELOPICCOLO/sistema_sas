import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faTags,
  faFileImport,
  faFileExport,
  faWallet,
  faChartLine,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

interface SidebarCaixaProps {
  setShowModalSaida: (show: boolean) => void;
  setShowModalGerenciar: (show: boolean) => void;
  setShowModalImportarGastos: (show: boolean) => void;
  setShowModalImportarVendas: (show: boolean) => void;
  onVoltarDashboard?: () => void;
}

export const SidebarCaixa: React.FC<SidebarCaixaProps> = ({
  setShowModalSaida,
  setShowModalGerenciar,
  setShowModalImportarGastos,
  setShowModalImportarVendas,
  onVoltarDashboard,
}) => {
  const menuItems = [
    {
      id: "saida",
      icon: faArrowUp,
      label: "Nova Saída",
      description: "Registrar gasto",
      action: () => setShowModalSaida(true),
    },
    {
      id: "categorias",
      icon: faTags,
      label: "Categorias",
      description: "Gerenciar categorias",
      action: () => setShowModalGerenciar(true),
    },
    {
      id: "importarGastos",
      icon: faFileImport,
      label: "Importar Gastos",
      description: "CSV ou Excel",
      action: () => setShowModalImportarGastos(true),
    },
    {
      id: "importarVendas",
      icon: faFileExport,
      label: "Importar Vendas",
      description: "CSV ou Excel",
      action: () => setShowModalImportarVendas(true),
    },
  ];

  return (
    <div
      style={{
        background: "#ffffff",
        color: "#1f2937",
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      {/* BOTÃO VOLTAR AO DASHBOARD */}
      {onVoltarDashboard && (
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={onVoltarDashboard}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "10px 16px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.2s",
              color: "#4b5563",
              fontSize: 13,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#4b5563";
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Voltar ao Dashboard
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid #e5e7eb",
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
              width: 40,
              height: 40,
              background: "#ecfdf5",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faWallet}
              style={{
                fontSize: 20,
                color: "#10b981",
              }}
            />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Caixa
            </h2>

            <p
              style={{
                margin: "2px 0 0",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Gestão financeira
            </p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <div
        style={{
          padding: "20px",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s",
                color: "#1f2937",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#f3f4f6",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                  }}
                />
              </div>

              <div
                style={{
                  flex: 1,
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#1f2937",
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  {item.description}
                </div>
              </div>

              <FontAwesomeIcon
                icon={faChartLine}
                style={{
                  fontSize: 12,
                  color: "#d1d5db",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* RODAPÉ */}
      <div
        style={{
          marginTop: "auto",
          padding: "20px",
          borderTop: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      />
    </div>
  );
};
