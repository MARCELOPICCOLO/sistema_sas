// components/pdv/SidebarPdv.tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faPlus,
  faTrash,
  faUser,
  faUsers,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";

interface PontoVenda {
  id: number;
  number: number;
  restaurant_id: number;
}

interface SidebarPdvProps {
  pontos: PontoVenda[];
  pontoAtual: string;
  novoPontoCodigo: string;
  onNovoPontoCodigoChange: (value: string) => void;
  onAdicionarPonto: () => void;
  onPontoClick: (ponto: string, comandasDoPonto: any[]) => void;
  onMenuClick: (event: React.MouseEvent<HTMLDivElement>, ponto: string) => void;
}

const SidebarPdv: React.FC<SidebarPdvProps> = ({
  pontos,
  pontoAtual,
  novoPontoCodigo,
  onNovoPontoCodigoChange,
  onAdicionarPonto,
  onPontoClick,
  onMenuClick,
}) => {
  return (
    <div
      style={{
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        color: "#111827",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      {/* CABEÇALHO */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
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
              icon={faStore}
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
              Pontos de Venda
            </h2>

            <p
              style={{
                margin: "3px 0 0",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Gerencie seus pontos
            </p>
          </div>
        </div>

        {/* Input de adicionar compacto */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#f3f4f6",
              borderRadius: 8,
              padding: "3px",
              width: "100%",
            }}
          >
            <input
              type="number"
              value={novoPontoCodigo}
              onChange={(e) => onNovoPontoCodigoChange(e.target.value)}
              placeholder="Número"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 7,
                border: "1px solid #e5e7eb",
                fontSize: 12,
                outline: "none",
                background: "#ffffff",
                color: "#111827",
              }}
              onKeyPress={(e) => e.key === "Enter" && onAdicionarPonto()}
            />

            <button
              onClick={onAdicionarPonto}
              style={{
                padding: "8px 12px",
                borderRadius: 7,
                border: "none",
                background: "#10b981",
                color: "#fff",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#059669";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#10b981";
              }}
            >
              <FontAwesomeIcon icon={faPlus} size="xs" />
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* LISTA DE PONTOS */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: 10,
          }}
        >
          {pontos
            .sort((a, b) => a.number - b.number)
            .map((ponto) => {
              const isActive = pontoAtual === `ponto-${ponto.number}`;
              const isBalcao = ponto.number === 0;

              return (
                <div
                  key={ponto.id}
                  onClick={() => onPontoClick(`ponto-${ponto.number}`, [])}
                  style={{
                    position: "relative",
                    background: isBalcao
                      ? "#10b981"
                      : isActive
                        ? "#ecfdf5"
                        : "#ffffff",
                    borderRadius: 10,
                    padding: "14px 8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: isActive
                      ? "1px solid #a7f3d0"
                      : "1px solid #e5e7eb",
                    textAlign: "center",
                    boxShadow: isActive
                      ? "0 1px 3px rgba(0,0,0,0.06)"
                      : "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(15,23,42,0.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isActive
                      ? "0 1px 3px rgba(0,0,0,0.06)"
                      : "0 1px 2px rgba(0,0,0,0.04)";
                  }}
                >
                  {/* Ícone estilizado */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: isBalcao
                        ? "rgba(255,255,255,0.2)"
                        : "#f3f4f6",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 8px auto",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={isBalcao ? faUsers : faUser}
                      style={{
                        fontSize: 18,
                        color: isBalcao ? "#fff" : "#6b7280",
                      }}
                    />
                  </div>

                  {/* Texto */}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isBalcao ? "#fff" : "#111827",
                      marginBottom: 3,
                    }}
                  >
                    {isBalcao
                      ? "Balcão"
                      : `Ponto ${ponto.number.toString().padStart(2, "0")}`}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: isBalcao ? "rgba(255,255,255,0.85)" : "#6b7280",
                    }}
                  >
                    {isBalcao ? "Atendimento geral" : "Ponto de venda"}
                  </div>

                  {/* Botão de menu (3 pontinhos) */}
                  {!isBalcao && (
                    <div
                      onClick={(e) => onMenuClick(e, `ponto-${ponto.number}`)}
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        background: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                        borderRadius: 5,
                        width: 22,
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#ecfdf5";
                        e.currentTarget.style.borderColor = "#a7f3d0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f3f4f6";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faEllipsisV}
                        style={{
                          fontSize: 10,
                          color: "#6b7280",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* RODAPÉ */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #f1f5f9",
          background: "#fafafa",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Total: {pontos.length} pontos
        </div>
      </div>
    </div>
  );
};

export default SidebarPdv;
