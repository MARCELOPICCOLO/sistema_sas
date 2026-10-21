import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faTags,
  faFileImport,
  faFileExport,
  faWallet,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

interface SidebarCaixaProps {
  setShowModalSaida: (show: boolean) => void;
  setShowModalGerenciar: (show: boolean) => void;
  setShowModalImportarGastos: (show: boolean) => void;
  setShowModalImportarVendas: (show: boolean) => void;
}

export const SidebarCaixa: React.FC<SidebarCaixaProps> = ({
  setShowModalSaida,
  setShowModalGerenciar,
  setShowModalImportarGastos,
  setShowModalImportarVendas,
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
      className="sidebar-dark"
      style={{
        background: "var(--sidebar-bg)",
        color: "var(--sidebar-text)",
        height: "var(--page-h)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
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
              background: "var(--primary-soft)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faWallet}
              style={{
                fontSize: "var(--fs-2xl)",
                color: "var(--primary)",
              }}
            />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "var(--fs-xl)",
                fontWeight: 600,
                color: "var(--sidebar-text)",
              }}
            >
              Caixa
            </h2>

            <p
              style={{
                margin: "2px 0 0",
                fontSize: "var(--fs-xs)",
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
                    fontSize: "var(--fs-md)",
                    color: "var(--primary)",
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
                    fontSize: "var(--fs-md)",
                    fontWeight: 500,
                    color: "var(--sidebar-text)",
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    fontSize: "var(--fs-2xs)",
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
                  fontSize: "var(--fs-xs)",
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
