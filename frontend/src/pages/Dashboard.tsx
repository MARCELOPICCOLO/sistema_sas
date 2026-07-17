// pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faBoxes,
  faClipboardList,
  faCashRegister,
  faChartLine,
  faUsers,
  faConciergeBell,
  faArrowRight,
  faThLarge,
  faSignOutAlt,
  faUserCircle,
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
      cor: "#3b82f6",
      tela: "produtos",
    },
    {
      id: "vendas",
      titulo: "Gestão de Vendas",
      descricao: "Realize vendas, gerencie pedidos e atendimentos",
      icon: faCashRegister,
      cor: "#eab308",
      tela: "vendas",
    },
    {
      id: "caixa",
      titulo: "Gestão de Caixa",
      descricao:
        "Controle financeiro, abertura/fechamento e movimentações diárias",
      icon: faCashRegister,
      cor: "#ef4444",
      tela: "caixa",
    },
    {
      id: "relatorios",
      titulo: "Relatórios",
      descricao:
        "Análises de vendas, produtos, performance e métricas do negócio",
      icon: faChartLine,
      cor: "#f59e0b",
      tela: "relatorio",
    },
    {
      id: "equipe",
      titulo: "Gestão de Equipe",
      descricao:
        "Gerencie colaboradores, permissões e controle de acesso ao sistema",
      icon: faUsers,
      cor: "#ec4899",
      tela: "equipe",
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
        background: "#f3f4f6",
        minHeight: "100vh",
        padding: isMobile ? "16px" : "24px",
      }}
    >
      {/* Cabeçalho com Usuário e Logout */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "24px",
          border: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: "#10b981",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faThLarge}
              style={{ fontSize: 24, color: "#fff" }}
            />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? "20px" : "24px",
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              Dashboard
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "14px",
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
              style={{ fontSize: 20, color: "#6b7280" }}
            />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>
              {user?.login || "Usuário"}
            </span>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#dc2626",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.borderColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            Sair
          </button>
        </div>
      </div>

      {/* Grid de Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: getCardsPerRow(),
          gap: "20px",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.tela)}
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
              e.currentTarget.style.borderColor = card.cor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            {/* Ícone */}
            <div
              style={{
                width: 48,
                height: 48,
                background: `${card.cor}10`,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <FontAwesomeIcon
                icon={card.icon}
                style={{ fontSize: 24, color: card.cor }}
              />
            </div>

            {/* Título e Descrição */}
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "16px",
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              {card.titulo}
            </h3>
            <p
              style={{
                margin: "0 0 20px 0",
                fontSize: "13px",
                color: "#6b7280",
                lineHeight: "1.4",
              }}
            >
              {card.descricao}
            </p>

            {/* Link de acesso */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: card.cor,
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <span>Acessar módulo</span>
              <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 12 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé com estatísticas */}
      <div
        style={{
          marginTop: "32px",
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
            gap: "20px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#10b981" }}
            >
              {cards.length}
            </div>
            <div
              style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}
            >
              Módulos Disponíveis
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#3b82f6" }}
            >
              ✓
            </div>
            <div
              style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}
            >
              Sistema Integrado
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#8b5cf6" }}
            >
              24/7
            </div>
            <div
              style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}
            >
              Disponibilidade
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#ef4444" }}
            >
              🔒
            </div>
            <div
              style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}
            >
              Dados Seguros
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
