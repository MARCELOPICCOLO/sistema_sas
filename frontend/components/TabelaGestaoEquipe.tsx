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
          background: "var(--primary-soft)",
          color: "var(--primary-hover)",
          border: "var(--primary-border)",
        };
      case "ADMIN":
        return {
          background: "var(--primary-soft)",
          color: "#15803d",
          border: "var(--primary-border)",
        };
      default:
        return {
          background: "var(--surface-3)",
          color: "var(--text-secondary)",
          border: "var(--border)",
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
        color: "var(--text-subtle)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          margin: "0 auto 12px",
          borderRadius: 12,
          background: "var(--surface-3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-subtle)",
          fontSize: 18,
        }}
      >
        <FontAwesomeIcon icon={faUsers} />
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
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
              color: "var(--text-subtle)",
            }}
          >
            Carregando colaboradores...
          </div>
        ) : usuarios.length === 0 ? (
          EmptyState()
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
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "var(--shadow-card)",
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
                        borderRadius: 10,
                        background: "var(--primary-soft)",
                        color: "var(--primary)",
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
                          color: "var(--text)",
                        }}
                      >
                        {usuario.full_name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
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
                      color: usuario.active ? "var(--primary)" : "var(--text-subtle)",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCircle}
                      style={{
                        fontSize: 8,
                        color: usuario.active ? "var(--primary)" : "var(--border-strong)",
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
                    borderTop: "1px solid var(--surface-3)",
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
                        color: "var(--text-muted)",
                      }}
                    >
                      E-mail
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text)",
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
                          color: "var(--text-muted)",
                        }}
                      >
                        Telefone
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--text)",
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
                        color: "var(--text-muted)",
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
                        borderRadius: 8,
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
                    borderTop: "1px solid var(--surface-3)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onEditar(usuario)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                      color: "var(--text-secondary)",
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
                      e.currentTarget.style.background = "var(--surface-3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface)";
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
                      borderRadius: 8,
                      background: usuario.active ? "var(--primary)" : "var(--text-muted)",
                      color: "var(--surface)",
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
                        ? "var(--primary-hover)"
                        : "var(--text-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = usuario.active
                        ? "var(--primary)"
                        : "var(--text-muted)";
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
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border)",
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
                  color: "var(--text-subtle)",
                }}
              >
                Carregando colaboradores...
              </td>
            </tr>
          ) : usuarios.length === 0 ? (
            <tr>
              <td colSpan={6}>
                {EmptyState()}
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
                        ? "1px solid var(--surface-3)"
                        : "none",
                    background: "var(--surface)",
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
                          borderRadius: 10,
                          background: "var(--primary-soft)",
                          color: "var(--primary)",
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
                            color: "var(--text)",
                          }}
                        >
                          {usuario.full_name}
                        </div>
                        {usuario.contact && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-subtle)",
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
                      color: "var(--text-secondary)",
                    }}
                  >
                    {usuario.username}
                  </td>

                  {/* E-MAIL */}
                  <td
                    style={{
                      padding: "13px 16px",
                      color: "var(--text-secondary)",
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
                        borderRadius: 8,
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
                        color: usuario.active ? "var(--primary)" : "var(--text-subtle)",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: usuario.active ? "var(--primary)" : "var(--border-strong)",
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
                          e.currentTarget.style.background = "var(--info-soft)";
                          e.currentTarget.style.color = "var(--info)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-muted)";
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
                          background: usuario.active ? "var(--primary)" : "var(--text-muted)",
                          color: "var(--surface)",
                          width: 40,
                          borderRadius: 20,
                          padding: "0 4px",
                          justifyContent: usuario.active
                            ? "flex-end"
                            : "flex-start",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = usuario.active
                            ? "var(--primary-hover)"
                            : "var(--text-secondary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = usuario.active
                            ? "var(--primary)"
                            : "var(--text-muted)";
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "var(--surface)",
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
  color: "var(--text-muted)",
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
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  fontSize: 14,
  color: "var(--text-muted)",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

export default TabelaGestaoEquipe;
