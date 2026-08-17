// pages/GerenciamentoEquipe.tsx

import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlus,
  faSearch,
  faPenToSquare,
  faUserCheck,
  faUserSlash,
  faShieldHalved,
  faTimes,
  faUserPlus,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = import.meta.env.VITE_API_URL;

interface Usuario {
  id: number;
  full_name: string;
  username: string;
  email: string;
  contact?: string;
  active: boolean;
  role: "MASTER" | "ADMIN" | "USER";
  created_at?: string;
}

interface GerenciamentoEquipeProps {
  usuarios?: Usuario[];
  onEditarUsuario?: (usuario: Usuario) => void;
  onAlterarStatus?: (usuario: Usuario) => void;
}

interface FormularioUsuario {
  full_name: string;
  username: string;
  email: string;
  contact: string;
  password: string;
  role: "ADMIN" | "USER";
}

const formularioInicial: FormularioUsuario = {
  full_name: "",
  username: "",
  email: "",
  contact: "",
  password: "",
  role: "USER",
};

const GerenciamentoEquipe: React.FC<GerenciamentoEquipeProps> = ({
  usuarios = [],
  onEditarUsuario,
  onAlterarStatus,
}) => {
  const [busca, setBusca] = useState("");

  const [filtroRole, setFiltroRole] = useState<
    "TODOS" | "MASTER" | "ADMIN" | "USER"
  >("TODOS");

  // =========================================================
  // USUÁRIOS
  // =========================================================

  const [usuariosLista, setUsuariosLista] = useState<Usuario[]>(usuarios);

  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);

  // =========================================================
  // MODAL USUÁRIO
  // =========================================================

  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);

  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [salvandoUsuario, setSalvandoUsuario] = useState(false);

  const [formularioUsuario, setFormularioUsuario] =
    useState<FormularioUsuario>(formularioInicial);

  // =========================================================
  // MODAL TOGGLE STATUS
  // =========================================================

  const [modalToggleStatus, setModalToggleStatus] = useState<Usuario | null>(
    null,
  );
  const [togglingStatus, setTogglingStatus] = useState(false);

  // =========================================================
  // CARREGAR USUÁRIOS
  // =========================================================

  const carregarUsuarios = async () => {
    try {
      setCarregandoUsuarios(true);

      const token = localStorage.getItem("auth_token");

      if (!token) {
        alert("Sua sessão expirou. Faça login novamente.");
        return;
      }

      const response = await fetch(`${API_URL}/users`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const dados = await response.json();

      if (!response.ok) {
        console.error("Erro ao carregar usuários:", dados);

        alert(dados?.message || "Não foi possível carregar os colaboradores.");

        return;
      }

      const listaUsuarios = Array.isArray(dados)
        ? dados
        : Array.isArray(dados?.users)
          ? dados.users
          : [];

      setUsuariosLista(listaUsuarios);
    } catch (erro) {
      console.error("Erro na requisição:", erro);

      alert(
        "Não foi possível conectar ao servidor. Verifique se a API está disponível.",
      );
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  // =========================================================
  // CARREGAR USUÁRIOS AO ABRIR A PÁGINA
  // =========================================================

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // =========================================================
  // SINCRONIZAR PROPS
  // =========================================================

  useEffect(() => {
    if (usuarios.length > 0) {
      setUsuariosLista(usuarios);
    }
  }, [usuarios]);

  // =========================================================
  // FILTROS
  // =========================================================

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return usuariosLista.filter((usuario) => {
      const correspondeBusca =
        !termo ||
        usuario.full_name.toLowerCase().includes(termo) ||
        usuario.username.toLowerCase().includes(termo) ||
        usuario.email.toLowerCase().includes(termo);

      const correspondeRole =
        filtroRole === "TODOS" || usuario.role === filtroRole;

      return correspondeBusca && correspondeRole;
    });
  }, [usuariosLista, busca, filtroRole]);

  // =========================================================
  // FUNÇÕES DE PERFIL
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
  // MODAL - ALTERAR CAMPO
  // =========================================================

  const alterarCampoUsuario = (
    campo: keyof FormularioUsuario,
    valor: string,
  ) => {
    setFormularioUsuario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  // =========================================================
  // MODAL - LIMPAR
  // =========================================================

  const limparFormularioUsuario = () => {
    setFormularioUsuario({
      ...formularioInicial,
    });

    setUsuarioEditando(null);
    setMostrarSenha(false);
    setSalvandoUsuario(false);
  };

  // =========================================================
  // MODAL - ABRIR NOVO USUÁRIO
  // =========================================================

  const abrirModalNovoUsuario = () => {
    limparFormularioUsuario();

    setModalNovoUsuario(true);
  };

  // =========================================================
  // MODAL - ABRIR EDIÇÃO
  // =========================================================

  const abrirModalEditarUsuario = (usuario: Usuario) => {
    setUsuarioEditando(usuario);

    setFormularioUsuario({
      full_name: usuario.full_name || "",
      username: usuario.username || "",
      email: usuario.email || "",
      contact: usuario.contact || "",
      password: "",
      role: usuario.role === "ADMIN" ? "ADMIN" : "USER",
    });

    setMostrarSenha(false);
    setModalNovoUsuario(true);

    onEditarUsuario?.(usuario);
  };

  // =========================================================
  // MODAL - FECHAR
  // =========================================================

  const fecharModalUsuario = () => {
    limparFormularioUsuario();
    setModalNovoUsuario(false);
  };

  // =========================================================
  // CADASTRAR NOVO USUÁRIO
  // =========================================================

  const salvarNovoUsuario = async () => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      alert("Sua sessão expirou. Faça login novamente.");
      return;
    }

    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        full_name: formularioUsuario.full_name,
        username: formularioUsuario.username,
        email: formularioUsuario.email,
        contact: formularioUsuario.contact,
        password: formularioUsuario.password,
        role: formularioUsuario.role,
      }),
    });

    const dados = await response.json();

    if (!response.ok) {
      console.error("Erro ao cadastrar usuário:", dados);

      alert(dados?.message || "Não foi possível cadastrar o colaborador.");

      return;
    }

    console.log("Usuário cadastrado:", dados);

    alert("Colaborador cadastrado com sucesso!");

    await carregarUsuarios();

    fecharModalUsuario();
  };

  // =========================================================
  // ATUALIZAR USUÁRIO
  // =========================================================

  const atualizarUsuario = async () => {
    if (!usuarioEditando) {
      return;
    }

    const token = localStorage.getItem("auth_token");

    if (!token) {
      alert("Sua sessão expirou. Faça login novamente.");
      return;
    }

    const corpo: Record<string, string> = {
      full_name: formularioUsuario.full_name,
      username: formularioUsuario.username,
      email: formularioUsuario.email,
      contact: formularioUsuario.contact,
      role: formularioUsuario.role,
    };

    /*
     * A senha é opcional na edição.
     *
     * Quando o campo estiver vazio, não enviamos
     * password para o backend, mantendo a senha atual.
     */
    if (formularioUsuario.password.trim() !== "") {
      corpo.password = formularioUsuario.password;
    }

    try {
      const response = await fetch(`${API_URL}/users/${usuarioEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(corpo),
      });

      const dados = await response.json();

      if (!response.ok) {
        console.error("Erro ao atualizar usuário:", dados);

        alert(dados?.message || "Não foi possível atualizar o colaborador.");

        return;
      }

      console.log("Usuário atualizado:", dados);

      alert("Colaborador atualizado com sucesso!");

      await carregarUsuarios();

      fecharModalUsuario();
    } catch (erro) {
      console.error("Erro na requisição:", erro);

      alert(
        "Não foi possível conectar ao servidor. Verifique se a API está disponível.",
      );
    }
  };

  // =========================================================
  // SALVAR FORMULÁRIO
  // =========================================================

  const salvarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSalvandoUsuario(true);

      if (usuarioEditando) {
        await atualizarUsuario();
      } else {
        await salvarNovoUsuario();
      }
    } catch (erro) {
      console.error("Erro na requisição:", erro);

      alert(
        "Não foi possível conectar ao servidor. Verifique se a API está disponível.",
      );
    } finally {
      setSalvandoUsuario(false);
    }
  };

  // =========================================================
  // ABRIR MODAL TOGGLE STATUS
  // =========================================================

  const abrirModalToggleStatus = (usuario: Usuario) => {
    setModalToggleStatus(usuario);
  };

  // =========================================================
  // FECHAR MODAL TOGGLE STATUS
  // =========================================================

  const fecharModalToggleStatus = () => {
    if (togglingStatus) {
      return;
    }

    setModalToggleStatus(null);
  };

  // =========================================================
  // TOGGLE STATUS DO USUÁRIO (ATIVAR/DESATIVAR)
  // =========================================================

  const toggleUsuarioStatus = async () => {
    if (!modalToggleStatus) {
      return;
    }

    const token = localStorage.getItem("auth_token");

    if (!token) {
      alert("Sua sessão expirou. Faça login novamente.");
      return;
    }

    try {
      setTogglingStatus(true);

      const acao = modalToggleStatus.active ? "desativar" : "ativar";
      const endpoint = `${API_URL}/partner-company-users/${modalToggleStatus.id}/deactivate`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const dados = await response.json();

      if (!response.ok) {
        console.error(`Erro ao ${acao} usuário:`, dados);

        alert(dados?.message || `Não foi possível ${acao} o colaborador.`);

        return;
      }

      console.log(`Usuário ${acao}do:`, dados);

      alert(
        `Colaborador ${modalToggleStatus.active ? "desativado" : "ativado"} com sucesso.`,
      );

      await carregarUsuarios();

      fecharModalToggleStatus();
    } catch (erro) {
      console.error("Erro na requisição:", erro);

      alert(
        "Não foi possível conectar ao servidor. Verifique se a API está disponível.",
      );
    } finally {
      setTogglingStatus(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f8fafc",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 19,
                flexShrink: 0,
              }}
            >
              <FontAwesomeIcon icon={faUsers} />
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#111827",
                  lineHeight: 1.3,
                }}
              >
                Gerenciamento de equipe
              </h1>

              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                Gerencie os usuários e os acessos da sua empresa.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirModalNovoUsuario}
            style={{
              height: 38,
              padding: "0 15px",
              border: "none",
              borderRadius: 7,
              background: "#059669",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#047857";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#059669";
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
            Novo colaborador
          </button>
        </div>

        {/* =====================================================
            RESUMO
        ====================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Total de usuários</div>

            <div style={summaryValueStyle}>{usuariosLista.length}</div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Usuários ativos</div>

            <div
              style={{
                ...summaryValueStyle,
                color: "#059669",
              }}
            >
              {usuariosLista.filter((usuario) => usuario.active).length}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Administradores</div>

            <div style={summaryValueStyle}>
              {
                usuariosLista.filter(
                  (usuario) =>
                    usuario.role === "MASTER" || usuario.role === "ADMIN",
                ).length
              }
            </div>
          </div>
        </div>

        {/* =====================================================
            TABELA
        ====================================================== */}

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {/* FILTROS */}

          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                position: "relative",
                flex: 1,
                minWidth: 220,
              }}
            >
              <FontAwesomeIcon
                icon={faSearch}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                  fontSize: 12,
                }}
              />

              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar colaborador..."
                style={{
                  width: "100%",
                  height: 36,
                  boxSizing: "border-box",
                  border: "1px solid #e5e7eb",
                  borderRadius: 7,
                  padding: "0 12px 0 34px",
                  fontSize: 13,
                  color: "#374151",
                  outline: "none",
                  background: "#ffffff",
                }}
              />
            </div>

            <select
              value={filtroRole}
              onChange={(e) =>
                setFiltroRole(
                  e.target.value as "TODOS" | "MASTER" | "ADMIN" | "USER",
                )
              }
              style={{
                height: 36,
                minWidth: 150,
                border: "1px solid #e5e7eb",
                borderRadius: 7,
                padding: "0 10px",
                fontSize: 13,
                color: "#374151",
                background: "#ffffff",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="TODOS">Todos os perfis</option>
              <option value="MASTER">Master</option>
              <option value="ADMIN">Administrador</option>
              <option value="USER">Usuário</option>
            </select>
          </div>

          {/* TABELA */}

          <div style={{ overflowX: "auto" }}>
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
                {carregandoUsuarios ? (
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
                ) : usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
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
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario, index) => {
                    const roleStyle = getRoleStyle(usuario.role);

                    return (
                      <tr
                        key={usuario.id}
                        style={{
                          borderBottom:
                            index < usuariosFiltrados.length - 1
                              ? "1px solid #f0f1f3"
                              : "none",
                          background: "#ffffff",
                        }}
                      >
                        {/* COLABORADOR */}

                        <td style={{ padding: "13px 16px" }}>
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
                              }}
                            >
                              {usuario.full_name
                                .split(" ")
                                .slice(0, 2)
                                .map((nome) => nome.charAt(0))
                                .join("")
                                .toUpperCase()}
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

                        <td style={{ padding: "13px 16px" }}>
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
                                background: usuario.active
                                  ? "#10b981"
                                  : "#d1d5db",
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
                              onClick={() => abrirModalEditarUsuario(usuario)}
                              style={actionButtonStyle}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#eff6ff";
                                e.currentTarget.style.color = "#2563eb";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                                e.currentTarget.style.color = "#6b7280";
                              }}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>

                            {/* TOGGLE STATUS - BOTÃO LIGA/DESLIGA */}

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
                              onClick={() => abrirModalToggleStatus(usuario)}
                              style={{
                                ...actionButtonStyle,
                                background: usuario.active
                                  ? "#059669"
                                  : "#6b7280",
                                color: "#ffffff",
                                width: 40,
                                borderRadius: 20,
                                padding: "0 4px",
                                justifyContent: usuario.active
                                  ? "flex-end"
                                  : "flex-start",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  usuario.active ? "#047857" : "#4b5563";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  usuario.active ? "#059669" : "#6b7280";
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
        </div>

        {/* RODAPÉ */}

        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          {usuariosFiltrados.length}{" "}
          {usuariosFiltrados.length === 1
            ? "colaborador encontrado"
            : "colaboradores encontrados"}
        </div>
      </div>

      {/* =====================================================
          MODAL NOVO / EDITAR USUÁRIO
      ====================================================== */}

      {modalNovoUsuario && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 9999,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="usuario-modal-titulo"
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
            }}
          >
            {/* CABEÇALHO */}

            <div
              style={{
                padding: "20px 22px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
                    borderRadius: 9,
                    background: "#ecfdf5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FontAwesomeIcon
                    icon={usuarioEditando ? faPenToSquare : faUserPlus}
                    style={{
                      fontSize: 17,
                      color: "#059669",
                    }}
                  />
                </div>

                <div>
                  <h2
                    id="usuario-modal-titulo"
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {usuarioEditando
                      ? "Editar colaborador"
                      : "Novo colaborador"}
                  </h2>

                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    {usuarioEditando
                      ? "Atualize os dados do colaborador"
                      : "Cadastre um novo usuário no sistema"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={fecharModalUsuario}
                style={closeButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.color = "#374151";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#9ca3af";
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* FORMULÁRIO */}

            <form onSubmit={salvarUsuario}>
              <div
                style={{
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* NOME */}

                <div>
                  <label style={labelStyle}>Nome completo</label>

                  <input
                    type="text"
                    value={formularioUsuario.full_name}
                    onChange={(e) =>
                      alterarCampoUsuario("full_name", e.target.value)
                    }
                    placeholder="Ex.: João da Silva"
                    required
                    autoComplete="name"
                    style={inputStyle}
                  />
                </div>

                {/* USUÁRIO */}

                <div>
                  <label style={labelStyle}>Usuário</label>

                  <input
                    type="text"
                    value={formularioUsuario.username}
                    onChange={(e) =>
                      alterarCampoUsuario("username", e.target.value)
                    }
                    placeholder="Ex.: joao.silva"
                    required
                    autoComplete="username"
                    style={inputStyle}
                  />

                  <small style={helpStyle}>
                    Será utilizado para acessar o sistema.
                  </small>
                </div>

                {/* E-MAIL */}

                <div>
                  <label style={labelStyle}>E-mail</label>

                  <input
                    type="email"
                    value={formularioUsuario.email}
                    onChange={(e) =>
                      alterarCampoUsuario("email", e.target.value)
                    }
                    placeholder="joao@email.com"
                    required
                    autoComplete="email"
                    style={inputStyle}
                  />
                </div>

                {/* TELEFONE */}

                <div>
                  <label style={labelStyle}>
                    Telefone
                    <span
                      style={{
                        marginLeft: 5,
                        fontWeight: 400,
                        color: "#9ca3af",
                      }}
                    >
                      (opcional)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={formularioUsuario.contact}
                    onChange={(e) =>
                      alterarCampoUsuario("contact", e.target.value)
                    }
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                    style={inputStyle}
                  />
                </div>

                {/* SENHA */}

                <div>
                  <label style={labelStyle}>
                    Senha
                    {usuarioEditando && (
                      <span
                        style={{
                          marginLeft: 5,
                          fontWeight: 400,
                          color: "#9ca3af",
                        }}
                      >
                        (deixe em branco para manter a atual)
                      </span>
                    )}
                  </label>

                  <div
                    style={{
                      position: "relative",
                    }}
                  >
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={formularioUsuario.password}
                      onChange={(e) =>
                        alterarCampoUsuario("password", e.target.value)
                      }
                      placeholder={
                        usuarioEditando
                          ? "Digite uma nova senha"
                          : "Digite uma senha"
                      }
                      required={!usuarioEditando}
                      minLength={6}
                      autoComplete="new-password"
                      style={{
                        ...inputStyle,
                        paddingRight: 44,
                      }}
                    />

                    <button
                      type="button"
                      aria-label={
                        mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                      }
                      onClick={() => setMostrarSenha((valor) => !valor)}
                      style={passwordButtonStyle}
                    >
                      <FontAwesomeIcon
                        icon={mostrarSenha ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>

                  <small style={helpStyle}>
                    A senha deve possuir pelo menos 6 caracteres.
                  </small>
                </div>

                {/* PERFIL */}

                <div>
                  <label style={labelStyle}>Perfil de acesso</label>

                  <select
                    value={formularioUsuario.role}
                    onChange={(e) =>
                      alterarCampoUsuario(
                        "role",
                        e.target.value as "ADMIN" | "USER",
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="USER">Usuário</option>

                    <option value="ADMIN">Administrador</option>
                  </select>

                  <small style={helpStyle}>
                    As permissões de acesso aos módulos poderão ser configuradas
                    posteriormente.
                  </small>
                </div>
              </div>

              {/* RODAPÉ */}

              <div
                style={{
                  padding: "16px 22px",
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  background: "#fafafa",
                  borderRadius: "0 0 12px 12px",
                }}
              >
                <button
                  type="button"
                  onClick={fecharModalUsuario}
                  style={secondaryButtonStyle}
                  disabled={salvandoUsuario}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    ...primaryButtonStyle,
                    opacity: salvandoUsuario ? 0.7 : 1,
                    cursor: salvandoUsuario ? "not-allowed" : "pointer",
                  }}
                  disabled={salvandoUsuario}
                >
                  <FontAwesomeIcon
                    icon={usuarioEditando ? faPenToSquare : faUserPlus}
                    style={{
                      marginRight: 7,
                    }}
                  />

                  {salvandoUsuario
                    ? "Salvando..."
                    : usuarioEditando
                      ? "Salvar alterações"
                      : "Cadastrar colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL TOGGLE STATUS
      ====================================================== */}

      {modalToggleStatus && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 10000,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="toggle-status-modal-titulo"
            style={{
              width: "100%",
              maxWidth: 430,
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
            }}
          >
            {/* CABEÇALHO */}

            <div
              style={{
                padding: "20px 22px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
                    borderRadius: 9,
                    background: modalToggleStatus.active
                      ? "#fef2f2"
                      : "#ecfdf5",
                    color: modalToggleStatus.active ? "#dc2626" : "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                  }}
                >
                  <FontAwesomeIcon
                    icon={modalToggleStatus.active ? faUserSlash : faUserCheck}
                  />
                </div>

                <div>
                  <h2
                    id="toggle-status-modal-titulo"
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {modalToggleStatus.active ? "Desativar" : "Ativar"}{" "}
                    colaborador
                  </h2>

                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Confirme a{" "}
                    {modalToggleStatus.active ? "desativação" : "ativação"} do
                    acesso
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={fecharModalToggleStatus}
                disabled={togglingStatus}
                style={{
                  ...closeButtonStyle,
                  opacity: togglingStatus ? 0.5 : 1,
                  cursor: togglingStatus ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!togglingStatus) {
                    e.currentTarget.style.background = "#f3f4f6";
                    e.currentTarget.style.color = "#374151";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!togglingStatus) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#9ca3af";
                  }
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* CONTEÚDO */}

            <div
              style={{
                padding: "22px",
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  marginBottom: 18,
                  background: modalToggleStatus.active ? "#fffbeb" : "#ecfdf5",
                  border: `1px solid ${modalToggleStatus.active ? "#fde68a" : "#a7f3d0"}`,
                  borderRadius: 8,
                  color: modalToggleStatus.active ? "#92400e" : "#065f46",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                <strong>Atenção:</strong> você está prestes a{" "}
                <strong>
                  {modalToggleStatus.active ? "desativar" : "ativar"}
                </strong>{" "}
                o colaborador <strong>{modalToggleStatus.full_name}</strong>.
                <br />
                {modalToggleStatus.active
                  ? "O usuário perderá o acesso à sua empresa, mas não será excluído do sistema."
                  : "O usuário poderá acessar novamente a sua empresa."}
              </div>

              {/* USUÁRIO */}

              <div
                style={{
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Colaborador
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {modalToggleStatus.full_name}
                </div>

                <div
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  {modalToggleStatus.username}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: modalToggleStatus.active ? "#059669" : "#9ca3af",
                  }}
                >
                  Status atual: {modalToggleStatus.active ? "Ativo" : "Inativo"}
                </div>
              </div>
            </div>

            {/* RODAPÉ */}

            <div
              style={{
                padding: "16px 22px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                background: "#fafafa",
                borderRadius: "0 0 12px 12px",
              }}
            >
              <button
                type="button"
                onClick={fecharModalToggleStatus}
                disabled={togglingStatus}
                style={{
                  ...secondaryButtonStyle,
                  opacity: togglingStatus ? 0.6 : 1,
                  cursor: togglingStatus ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={toggleUsuarioStatus}
                disabled={togglingStatus}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 7,
                  border: `1px solid ${modalToggleStatus.active ? "#dc2626" : "#059669"}`,
                  background: modalToggleStatus.active ? "#dc2626" : "#059669",
                  color: "#ffffff",
                  cursor: togglingStatus ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  opacity: togglingStatus ? 0.55 : 1,
                }}
              >
                <FontAwesomeIcon
                  icon={modalToggleStatus.active ? faUserSlash : faUserCheck}
                  style={{
                    marginRight: 7,
                  }}
                />

                {togglingStatus
                  ? "Processando..."
                  : modalToggleStatus.active
                    ? "Desativar colaborador"
                    : "Ativar colaborador"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESPONSIVIDADE */}

      <style>
        {`
          @media (max-width: 768px) {
            .equipe-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

// =========================================================
// ESTILOS DA TABELA
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

// =========================================================
// ÍCONES DAS AÇÕES
// =========================================================

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

// =========================================================
// ESTILOS DO RESUMO
// =========================================================

const summaryCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "16px 18px",
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 6,
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: "#111827",
};

// =========================================================
// ESTILOS DO MODAL
// =========================================================

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 7,
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  border: "1px solid #d1d5db",
  borderRadius: 7,
  background: "#ffffff",
  color: "#111827",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const helpStyle: React.CSSProperties = {
  display: "block",
  marginTop: 5,
  fontSize: 11,
  color: "#9ca3af",
};

const closeButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: "none",
  background: "transparent",
  borderRadius: 6,
  color: "#9ca3af",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 15,
};

const passwordButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: 8,
  top: "50%",
  transform: "translateY(-50%)",
  width: 30,
  height: 30,
  border: "none",
  background: "transparent",
  color: "#9ca3af",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const secondaryButtonStyle: React.CSSProperties = {
  height: 38,
  padding: "0 15px",
  borderRadius: 7,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#6b7280",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

const primaryButtonStyle: React.CSSProperties = {
  height: 38,
  padding: "0 16px",
  borderRadius: 7,
  border: "1px solid #059669",
  background: "#059669",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

export default GerenciamentoEquipe;
