// pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxes,
  faCashRegister,
  faChartLine,
  faUsers,
  faArrowRight,
  faThLarge,
  faSignOutAlt,
  faUserCircle,
  faShoppingCart,
} from "@fortawesome/free-solid-svg-icons";

interface CardProps {
  id: string;
  titulo: string;
  descricao: string;
  icon: any;
  cor: string;
  tela: string;
}

interface DashboardProps {
  setTela: (tela: string) => void;
  user?: { id: number; login: string; email: string } | null;
  onLogout?: () => void;
}

export default function Dashboard({ setTela, user, onLogout }: DashboardProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cards: CardProps[] = [
    {
      id: "estoque",
      titulo: "Gestão de Estoque",
      descricao:
        "Controle de entradas, saídas, níveis de estoque e movimentações",
      icon: faBoxes,
      cor: "#059669",
      tela: "produtos",
    },
    {
      id: "vendas",
      titulo: "Gestão de Vendas",
      descricao: "Realize vendas, gerencie pedidos e atendimentos",
      icon: faShoppingCart,
      cor: "#059669",
      tela: "vendas",
    },
    {
      id: "caixa",
      titulo: "Gestão de Caixa",
      descricao:
        "Controle financeiro, abertura/fechamento e movimentações diárias",
      icon: faCashRegister,
      cor: "#059669",
      tela: "caixa",
    },
    {
      id: "relatorios",
      titulo: "Relatórios",
      descricao:
        "Análises de vendas, produtos, performance e métricas do negócio",
      icon: faChartLine,
      cor: "#059669",
      tela: "gestao_relatorios",
    },
    {
      id: "equipe",
      titulo: "Gestão de Equipe",
      descricao:
        "Gerencie colaboradores, permissões e controle de acesso ao sistema",
      icon: faUsers,
      cor: "#059669",
      tela: "gestao_equipe",
    },
  ];

  const handleCardClick = (tela: string) => {
    setTela(tela);
  };

  const getCardsPerRow = () => {
    if (isMobile) return "1fr";
    if (isTablet) return "repeat(2, 1fr)";
    return "repeat(auto-fill, minmax(320px, 1fr))";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: isMobile ? "16px" : "24px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Cabeçalho com Usuário e Logout */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: isMobile ? "18px" : "20px 24px",
          marginBottom: "24px",
          border: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
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
              width: 44,
              height: 44,
              background: "#ecfdf5",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faThLarge}
              style={{
                fontSize: 20,
                color: "#059669",
              }}
            />
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? "20px" : "22px",
                fontWeight: 600,
                color: "#111827",
                letterSpacing: "-0.3px",
              }}
            >
              Dashboard
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              Visão geral do sistema e acesso rápido aos módulos
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#374151",
            }}
          >
            <FontAwesomeIcon
              icon={faUserCircle}
              style={{
                fontSize: 20,
                color: "#9ca3af",
              }}
            />

            <span
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
              }}
            >
              {user?.login || "Usuário"}
            </span>
          </div>

          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "7px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef2f2";
              e.currentTarget.style.borderColor = "#fecaca";
              e.currentTarget.style.color = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            Sair
          </button>
        </div>
      </div>

      {/* Título da seção */}
      <div
        style={{
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Módulos do sistema
        </h2>

        <p
          style={{
            margin: "4px 0 0",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Acesse rapidamente as principais funcionalidades.
        </p>
      </div>

      {/* Grid de Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: getCardsPerRow(),
          gap: "16px",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.tela)}
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              padding: "22px",
              cursor: "pointer",
              transition: "all 0.2s",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.025)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 18px rgba(15, 23, 42, 0.07)";
              e.currentTarget.style.borderColor = "#a7f3d0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(15, 23, 42, 0.025)";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            {/* Ícone */}
            <div
              style={{
                width: 46,
                height: 46,
                background: "#ecfdf5",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "18px",
              }}
            >
              <FontAwesomeIcon
                icon={card.icon}
                style={{
                  fontSize: 19,
                  color: "#059669",
                }}
              />
            </div>

            {/* Título */}
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "15px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {card.titulo}
            </h3>

            {/* Descrição */}
            <p
              style={{
                margin: "0 0 20px 0",
                fontSize: "13px",
                color: "#6b7280",
                lineHeight: "1.5",
                minHeight: "39px",
              }}
            >
              {card.descricao}
            </p>

            {/* Link de acesso */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                color: "#059669",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <span>Acessar módulo</span>

              <FontAwesomeIcon
                icon={faArrowRight}
                style={{
                  fontSize: 11,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé com estatísticas */}
      <div
        style={{
          marginTop: "24px",
          background: "#ffffff",
          borderRadius: "10px",
          padding: isMobile ? "18px" : "20px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.025)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
            gap: isMobile ? "20px" : "12px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "4px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {cards.length}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "4px",
              }}
            >
              Módulos Disponíveis
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "4px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#059669",
              }}
            >
              ✓
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "4px",
              }}
            >
              Sistema Integrado
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "4px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              24/7
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "4px",
              }}
            >
              Disponibilidade
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "4px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#059669",
              }}
            >
              🔒
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "4px",
              }}
            >
              Dados Seguros
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
