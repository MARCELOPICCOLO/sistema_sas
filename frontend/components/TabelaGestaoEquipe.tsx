// components/TabelaGestaoEquipe.tsx

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPenToSquare,
  faShieldHalved,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

export interface Usuario {
  id: number;
  full_name: string;
  username: string;
  email: string;
  contact?: string;
  active: boolean;
  role: "MASTER" | "ADMIN" | "USER";
  created_at?: string;
}

interface TabelaGestaoEquipeProps {
  usuarios: Usuario[];
  carregando: boolean;
  busca: string;
  isMobile?: boolean;
  onEditar: (usuario: Usuario) => void;
  onAlterarStatus: (usuario: Usuario) => void;
}

const TabelaGestaoEquipe: React.FC<TabelaGestaoEquipeProps> = ({
  usuarios,
  carregando,
  busca,
  isMobile = false,
  onEditar,
  onAlterarStatus,
}) => {
  // =========================================================
  // PERFIL
  // =========================================================

  const getRoleLabel = (role: Usuario["role"]) => {
    switch (role) {
      case "MASTER":
        return "Master";
      case "ADMIN":
        return "Administrador";
      default:
        return "Usuário";
    }
  };

  const getRoleStyle = (role: Usuario["role"]) => {
    switch (role) {
      case "MASTER":
        return {
          background: "#ecfdf5",
          color: "#047857",
          border: "#a7f3d0",
        };
      case "ADMIN":
        return {
          background: "#f0fdf4",
          color: "#15803d",
          border: "#bbf7d0",
        };
      default:
        return {
          background: "#f3f4f6",
          color: "#4b5563",
          border: "#e5e7eb",
        };
    }
  };

  // =========================================================
  // COMPONENTE DE ESTADO VAZIO
  // =========================================================

  const EmptyState = () => (
    <div
      style={{
        padding: "48px 20px",
        textAlign: "center",
        color: "#9ca3af",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          margin: "0 auto 12px",
          borderRadius: 10,
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          fontSize: 18,
        }}
      >
        <FontAwesomeIcon icon={faUsers} />
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
        }}
      >
        {busca
          ? "Nenhum colaborador encontrado."
          : "Nenhum colaborador cadastrado."}
      </div>
    </div>
  );

  // =========================================================
  // RENDER - MOBILE (CARDS)
  // =========================================================

  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {carregando ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            Carregando colaboradores...
          </div>
        ) : usuarios.length === 0 ? (
          <EmptyState />
        ) : (
          usuarios.map((usuario) => {
            const roleStyle = getRoleStyle(usuario.role);
            const iniciais = usuario.full_name
              ? usuario.full_name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((nome) => nome.charAt(0))
                  .join("")
                  .toUpperCase()
              : "?";

            return (
              <div
                key={usuario.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* CABEÇALHO DO CARD */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {/* AVATAR */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: "#ecfdf5",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {iniciais}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1f2937",
                        }}
                      >
                        {usuario.full_name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        @{usuario.username}
                      </div>
                    </div>
                  </div>

                  {/* STATUS */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 500,
                      color: usuario.active ? "#059669" : "#9ca3af",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCircle}
                      style={{
                        fontSize: 8,
                        color: usuario.active ? "#10b981" : "#d1d5db",
                      }}
                    />
                    {usuario.active ? "Ativo" : "Inativo"}
                  </div>
                </div>

                {/* INFORMAÇÕES DO CARD */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    paddingTop: 8,
                    borderTop: "1px solid #f3f4f6",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      E-mail
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#1f2937",
                      }}
                    >
                      {usuario.email}
                    </span>
                  </div>

                  {usuario.contact && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        Telefone
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: "#1f2937",
                        }}
                      >
                        {usuario.contact}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      Perfil
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: roleStyle.background,
                        color: roleStyle.color,
                        border: `1px solid ${roleStyle.border}`,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {usuario.role !== "USER" && (
                        <FontAwesomeIcon icon={faShieldHalved} />
                      )}
                      {getRoleLabel(usuario.role)}
                    </span>
                  </div>
                </div>

                {/* AÇÕES */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    paddingTop: 8,
                    borderTop: "1px solid #f3f4f6",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onEditar(usuario)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      background: "#ffffff",
                      color: "#374151",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                    }}
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                    Editar
                  </button>

                  {/* TOGGLE SWITCH MOBILE */}
                  <button
                    type="button"
                    title={
                      usuario.active ? "Desativar usuário" : "Ativar usuário"
                    }
                    aria-label={
                      usuario.active ? "Desativar usuário" : "Ativar usuário"
                    }
                    onClick={() => onAlterarStatus(usuario)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: 6,
                      background: usuario.active ? "#059669" : "#6b7280",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = usuario.active
                        ? "#047857"
                        : "#4b5563";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = usuario.active
                        ? "#059669"
                        : "#6b7280";
                    }}
                  >
                    {usuario.active ? "Ativo" : "Inativo"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // =========================================================
  // RENDER - DESKTOP (TABELA)
  // =========================================================

  return (
    <div
      style={{
        overflowX: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr
            style={{
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <th style={thStyle}>Colaborador</th>
            <th style={thStyle}>Usuário</th>
            <th style={thStyle}>E-mail</th>
            <th style={thStyle}>Perfil</th>
            <th style={thCenterStyle}>Status</th>
            <th style={thCenterStyle}>Ações</th>
          </tr>
        </thead>

        <tbody>
          {carregando ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "48px 20px",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                Carregando colaboradores...
              </td>
            </tr>
          ) : usuarios.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState />
              </td>
            </tr>
          ) : (
            usuarios.map((usuario, index) => {
              const roleStyle = getRoleStyle(usuario.role);
              const iniciais = usuario.full_name
                ? usuario.full_name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((nome) => nome.charAt(0))
                    .join("")
                    .toUpperCase()
                : "?";

              return (
                <tr
                  key={usuario.id}
                  style={{
                    borderBottom:
                      index < usuarios.length - 1
                        ? "1px solid #f0f1f3"
                        : "none",
                    background: "#ffffff",
                  }}
                >
                  {/* COLABORADOR */}
                  <td
                    style={{
                      padding: "13px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: "#ecfdf5",
                          color: "#059669",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {iniciais}
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1f2937",
                          }}
                        >
                          {usuario.full_name}
                        </div>
                        {usuario.contact && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "#9ca3af",
                              marginTop: 2,
                            }}
                          >
                            {usuario.contact}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* USUÁRIO */}
                  <td
                    style={{
                      padding: "13px 16px",
                      color: "#4b5563",
                    }}
                  >
                    {usuario.username}
                  </td>

                  {/* E-MAIL */}
                  <td
                    style={{
                      padding: "13px 16px",
                      color: "#4b5563",
                    }}
                  >
                    {usuario.email}
                  </td>

                  {/* PERFIL */}
                  <td
                    style={{
                      padding: "13px 16px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: roleStyle.background,
                        color: roleStyle.color,
                        border: `1px solid ${roleStyle.border}`,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {usuario.role !== "USER" && (
                        <FontAwesomeIcon icon={faShieldHalved} />
                      )}
                      {getRoleLabel(usuario.role)}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td
                    style={{
                      padding: "13px 16px",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 500,
                        color: usuario.active ? "#059669" : "#9ca3af",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: usuario.active ? "#10b981" : "#d1d5db",
                        }}
                      />
                      {usuario.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>

                  {/* AÇÕES */}
                  <td
                    style={{
                      padding: "13px 16px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {/* EDITAR */}
                      <button
                        type="button"
                        title="Editar usuário"
                        aria-label="Editar usuário"
                        onClick={() => onEditar(usuario)}
                        style={actionButtonStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#eff6ff";
                          e.currentTarget.style.color = "#2563eb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#6b7280";
                        }}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>

                      {/* TOGGLE SWITCH - LIGA/DESLIGA */}
                      <button
                        type="button"
                        title={
                          usuario.active
                            ? "Desativar usuário"
                            : "Ativar usuário"
                        }
                        aria-label={
                          usuario.active
                            ? "Desativar usuário"
                            : "Ativar usuário"
                        }
                        onClick={() => onAlterarStatus(usuario)}
                        style={{
                          ...actionButtonStyle,
                          background: usuario.active ? "#059669" : "#6b7280",
                          color: "#ffffff",
                          width: 40,
                          borderRadius: 20,
                          padding: "0 4px",
                          justifyContent: usuario.active
                            ? "flex-end"
                            : "flex-start",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = usuario.active
                            ? "#047857"
                            : "#4b5563";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = usuario.active
                            ? "#059669"
                            : "#6b7280";
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "#ffffff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            transition: "all 0.2s ease",
                          }}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

// =========================================================
// ESTILOS
// =========================================================

const thStyle: React.CSSProperties = {
  padding: "11px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
};

const thCenterStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: "center",
};

const actionButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: "none",
  background: "transparent",
  borderRadius: 6,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  fontSize: 14,
  color: "#6b7280",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

export default TabelaGestaoEquipe;
