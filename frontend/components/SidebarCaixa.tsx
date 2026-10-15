import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faTags,
  faFileImport,
  faFileExport,
  faWallet,
  faChevronRight,
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
        background: "var(--sidebar-bg)",
        color: "var(--sidebar-text)",
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* BOTÃO VOLTAR AO DASHBOARD */}
      {onVoltarDashboard && (
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--sidebar-border)",
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
              background: "transparent",
              border: "1px solid var(--sidebar-border)",
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.2s",
              color: "var(--sidebar-text-muted)",
              fontSize: 13,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--sidebar-hover)";
              e.currentTarget.style.color = "var(--sidebar-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--sidebar-text-muted)";
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Voltar ao início
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid var(--sidebar-border)",
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
              background: "#fff",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faWallet}
              style={{
                fontSize: 20,
                color: "var(--primary)",
              }}
            />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "var(--sidebar-text)",
              }}
            >
              Caixa
            </h2>

            <p
              style={{
                margin: "2px 0 0",
                fontSize: 12,
                color: "var(--sidebar-text-muted)",
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
                borderRadius: 10,
                cursor: "pointer",
                transition: "all 0.2s",
                color: "var(--sidebar-text)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--sidebar-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--sidebar-hover)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  style={{
                    fontSize: 14,
                    color: "var(--sidebar-text)",
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
                    color: "var(--sidebar-text)",
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "var(--sidebar-text-muted)",
                    marginTop: 2,
                  }}
                >
                  {item.description}
                </div>
              </div>

              <FontAwesomeIcon
                icon={faChevronRight}
                style={{
                  fontSize: 12,
                  color: "var(--sidebar-text-muted)",
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
          borderTop: "1px solid var(--sidebar-border)",
          background: "transparent",
        }}
      />
    </div>
  );
};
