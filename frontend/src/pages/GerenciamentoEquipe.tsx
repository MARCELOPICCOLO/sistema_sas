// pages/GerenciamentoEquipe.tsx

import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlus,
  faPenToSquare,
  faUserCheck,
  faUserSlash,
  faTimes,
  faArrowLeft,
  faBars,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { SidebarEquipe } from "../../components/SidebarEquipe";
import TabelaGestaoEquipe from "../../components/TabelaGestaoEquipe";
import { ModalUsuario } from "../../components/ModalUsuario";
import { CabecalhoEquipe } from "../../components/CabecalhoEquipe";
import { ResumoEquipe } from "../../components/ResumoEquipe";
import { FiltrosEquipe } from "../../components/FiltrosEquipe";

const API_URL = import.meta.env.VITE_API_URL;

// =========================================================
// TIPOS
// =========================================================

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

interface GerenciamentoEquipeProps {
  setTela?: (tela: string) => void;
  usuarios?: Usuario[];
  onEditarUsuario?: (usuario: Usuario) => void;
  onAlterarStatus?: (usuario: Usuario) => void;
}

// =========================================================
// FORMULÁRIO INICIAL
// =========================================================

const formularioInicial: FormularioUsuario = {
  full_name: "",
  username: "",
  email: "",
  contact: "",
  password: "",
  role: "USER",
};

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

const GerenciamentoEquipe: React.FC<GerenciamentoEquipeProps> = ({
  setTela,
  usuarios = [],
  onEditarUsuario,
  onAlterarStatus,
}) => {
  // =========================================================
  // RESPONSIVIDADE
  // =========================================================

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // =========================================================
  // TOAST
  // =========================================================

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 900);
  };

  const ToastComponent = () => {
    if (!toast.show) return null;
    return (
      <div
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100000,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: 14,
          fontWeight: 500,
          animation: "slideDown 0.3s ease-out",
          minWidth: 200,
          textAlign: "center",
        }}
      >
        <FontAwesomeIcon icon={faCheck} style={{ marginRight: 8 }} />
        {toast.message}
        <style>
          {`
            @keyframes slideDown {
              from {
                transform: translateX(-50%) translateY(-20px);
                opacity: 0;
              }
              to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
              }
            }
          `}
        </style>
      </div>
    );
  };

  // =========================================================
  // ESTADOS
  // =========================================================

  const [busca, setBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState<
    "TODOS" | "MASTER" | "ADMIN" | "USER"
  >("TODOS");

  const [usuariosLista, setUsuariosLista] = useState<Usuario[]>(usuarios);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);

  // =========================================================
  // MODAL USUÁRIO
  // =========================================================

  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);
  const [formularioUsuario, setFormularioUsuario] =
    useState<FormularioUsuario>(formularioInicial);

  // =========================================================
  // MODAL STATUS
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
        showToast("Sessão expirada. Faça login novamente.", "error");
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
        showToast(
          dados?.message || "Não foi possível carregar os colaboradores.",
          "error",
        );
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
      showToast("Não foi possível conectar ao servidor.", "error");
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

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
        (usuario.full_name || "").toLowerCase().includes(termo) ||
        (usuario.username || "").toLowerCase().includes(termo) ||
        (usuario.email || "").toLowerCase().includes(termo);

      const correspondeRole =
        filtroRole === "TODOS" || usuario.role === filtroRole;

      return correspondeBusca && correspondeRole;
    });
  }, [usuariosLista, busca, filtroRole]);

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
  // LIMPAR FORMULÁRIO
  // =========================================================

  const limparFormularioUsuario = () => {
    setFormularioUsuario({ ...formularioInicial });
    setUsuarioEditando(null);
    setSalvandoUsuario(false);
  };

  // =========================================================
  // NOVO USUÁRIO
  // =========================================================

  const abrirModalNovoUsuario = () => {
    limparFormularioUsuario();
    setModalNovoUsuario(true);
  };

  // =========================================================
  // EDITAR USUÁRIO
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
    setModalNovoUsuario(true);
    onEditarUsuario?.(usuario);
  };

  // =========================================================
  // FECHAR MODAL
  // =========================================================

  const fecharModalUsuario = () => {
    limparFormularioUsuario();
    setModalNovoUsuario(false);
  };

  // =========================================================
  // CADASTRAR
  // =========================================================

  const salvarNovoUsuario = async () => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      showToast("Sessão expirada. Faça login novamente.", "error");
      return;
    }

    try {
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
        showToast(
          dados?.message || "Não foi possível cadastrar o colaborador.",
          "error",
        );
        return;
      }

      showToast("Colaborador cadastrado com sucesso!", "success");
      await carregarUsuarios();
      fecharModalUsuario();
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      showToast("Não foi possível conectar ao servidor.", "error");
    }
  };

  // =========================================================
  // ATUALIZAR
  // =========================================================

  const atualizarUsuario = async () => {
    if (!usuarioEditando) return;

    const token = localStorage.getItem("auth_token");

    if (!token) {
      showToast("Sessão expirada. Faça login novamente.", "error");
      return;
    }

    const corpo: Record<string, string> = {
      full_name: formularioUsuario.full_name,
      username: formularioUsuario.username,
      email: formularioUsuario.email,
      contact: formularioUsuario.contact,
      role: formularioUsuario.role,
    };

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
        showToast(
          dados?.message || "Não foi possível atualizar o colaborador.",
          "error",
        );
        return;
      }

      showToast("Colaborador atualizado com sucesso!", "success");
      await carregarUsuarios();
      fecharModalUsuario();
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      showToast("Não foi possível conectar ao servidor.", "error");
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
      showToast("Não foi possível conectar ao servidor.", "error");
    } finally {
      setSalvandoUsuario(false);
    }
  };

  // =========================================================
  // STATUS
  // =========================================================

  const abrirModalToggleStatus = (usuario: Usuario) => {
    setModalToggleStatus(usuario);
  };

  const fecharModalToggleStatus = () => {
    if (togglingStatus) return;
    setModalToggleStatus(null);
  };

  const toggleUsuarioStatus = async () => {
    if (!modalToggleStatus) return;

    const token = localStorage.getItem("auth_token");

    if (!token) {
      showToast("Sessão expirada. Faça login novamente.", "error");
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
        showToast(
          dados?.message || `Não foi possível ${acao} o colaborador.`,
          "error",
        );
        return;
      }

      showToast(
        `Colaborador ${modalToggleStatus.active ? "desativado" : "ativado"} com sucesso!`,
        "success",
      );

      await carregarUsuarios();
      fecharModalToggleStatus();
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      showToast("Não foi possível conectar ao servidor.", "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  // =========================================================
  // FUNÇÃO PARA RENDERIZAR MODAL STATUS
  // =========================================================

  function renderModalStatus() {
    if (!modalToggleStatus) return null;

    return (
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
                  background: modalToggleStatus.active ? "#fef2f2" : "#ecfdf5",
                  color: modalToggleStatus.active ? "#dc2626" : "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={modalToggleStatus.active ? faUserSlash : faUserCheck}
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
                  Confirme a operação
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fecharModalToggleStatus}
              disabled={togglingStatus}
              style={{
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
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* CONTEÚDO */}
          <div style={{ padding: 22 }}>
            <div
              style={{
                padding: "12px 14px",
                marginBottom: 18,
                background: modalToggleStatus.active ? "#fffbeb" : "#ecfdf5",
                border: `1px solid ${
                  modalToggleStatus.active ? "#fde68a" : "#a7f3d0"
                }`,
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

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                Usuário
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {modalToggleStatus.full_name}
              </div>
              <div
                style={{
                  marginTop: 3,
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                {modalToggleStatus.username}
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
            }}
          >
            <button
              type="button"
              onClick={fecharModalToggleStatus}
              disabled={togglingStatus}
              style={{
                height: 38,
                padding: "0 15px",
                borderRadius: 7,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#6b7280",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
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
                border: "none",
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
                style={{ marginRight: 7 }}
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
    );
  }

  // =========================================================
  // RENDER - DESKTOP
  // =========================================================

  if (!isMobile) {
    return (
      <>
        <ToastComponent />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            height: "100vh",
            background: "#f8fafc",
          }}
        >
          <SidebarEquipe
            onNovoColaborador={abrirModalNovoUsuario}
            onVoltarDashboard={() => setTela && setTela("dashboard")}
          />

          <div
            style={{
              padding: "24px",
              overflowY: "auto",
              height: "100vh",
            }}
          >
            <div
              style={{
                maxWidth: 1400,
                margin: "0 auto",
              }}
            >
              <CabecalhoEquipe />
              <ResumoEquipe usuarios={usuariosLista} />
              <FiltrosEquipe
                busca={busca}
                onBuscaChange={setBusca}
                filtroRole={filtroRole}
                onFiltroRoleChange={setFiltroRole}
                isMobile={isMobile}
              />
              <TabelaGestaoEquipe
                usuarios={usuariosFiltrados}
                carregando={carregandoUsuarios}
                busca={busca}
                isMobile={isMobile}
                onEditar={abrirModalEditarUsuario}
                onAlterarStatus={abrirModalToggleStatus}
              />
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
          </div>
        </div>

        <ModalUsuario
          isOpen={modalNovoUsuario}
          usuarioEditando={usuarioEditando}
          formulario={formularioUsuario}
          salvando={salvandoUsuario}
          onClose={fecharModalUsuario}
          onSubmit={salvarUsuario}
          onCampoChange={alterarCampoUsuario}
        />

        {renderModalStatus()}
      </>
    );
  }

  // =========================================================
  // RENDER - MOBILE
  // =========================================================

  return (
    <>
      <ToastComponent />
      <div
        style={{
          background: "#f8fafc",
          minHeight: "100vh",
          padding: "16px",
        }}
      >
        <div
          style={{
            padding: "16px",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e5e7eb",
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: "#ecfdf5",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon
                icon={faUsers}
                style={{ fontSize: 18, color: "#10b981" }}
              />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Gerenciamento de equipe
            </h1>
          </div>
          <button
            onClick={() => setShowMobileMenu(true)}
            style={{
              background: "#f3f4f6",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              color: "#374151",
            }}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>

        {showMobileMenu && (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 1000,
              }}
              onClick={() => setShowMobileMenu(false)}
            />
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "280px",
                background: "#ffffff",
                zIndex: 1001,
                padding: "20px",
                overflowY: "auto",
                borderRight: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 20,
                }}
              >
                <button
                  onClick={() => setShowMobileMenu(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 20,
                    cursor: "pointer",
                    color: "#374151",
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <button
                onClick={() => {
                  abrirModalNovoUsuario();
                  setShowMobileMenu(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "12px 16px",
                  background: "#10b981",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "#fff",
                  marginBottom: 12,
                }}
              >
                <FontAwesomeIcon icon={faPlus} /> <span>Novo colaborador</span>
              </button>
            </div>
          </>
        )}

        <ResumoEquipe usuarios={usuariosLista} />
        <FiltrosEquipe
          busca={busca}
          onBuscaChange={setBusca}
          filtroRole={filtroRole}
          onFiltroRoleChange={setFiltroRole}
          isMobile={isMobile}
        />
        <TabelaGestaoEquipe
          usuarios={usuariosFiltrados}
          carregando={carregandoUsuarios}
          busca={busca}
          isMobile={isMobile}
          onEditar={abrirModalEditarUsuario}
          onAlterarStatus={abrirModalToggleStatus}
        />
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          {usuariosFiltrados.length}{" "}
          {usuariosFiltrados.length === 1
            ? "colaborador encontrado"
            : "colaboradores encontrados"}
        </div>

        <ModalUsuario
          isOpen={modalNovoUsuario}
          usuarioEditando={usuarioEditando}
          formulario={formularioUsuario}
          salvando={salvandoUsuario}
          onClose={fecharModalUsuario}
          onSubmit={salvarUsuario}
          onCampoChange={alterarCampoUsuario}
        />

        {renderModalStatus()}
      </div>
    </>
  );
};

export default GerenciamentoEquipe;
