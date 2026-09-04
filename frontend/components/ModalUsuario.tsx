// components/ModalUsuario.tsx

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faUserPlus,
  faPenToSquare,
  faEye,
  faEyeSlash,
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

export interface Tela {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
}

export interface FormularioUsuario {
  full_name: string;
  username: string;
  email: string;
  contact: string;
  password: string;
  role: "ADMIN" | "USER";
}

interface ModalUsuarioProps {
  isOpen: boolean;
  usuarioEditando: Usuario | null;
  formulario: FormularioUsuario;
  salvando: boolean;

  // TELAS
  telas: Tela[];
  telasSelecionadas: number[];
  carregandoTelas: boolean;
  onToggleTela: (telaId: number) => void;

  onClose: () => void;

  /**
   * Envia o formulário juntamente com
   * os IDs das telas selecionadas.
   */
  onSubmit: (e: React.FormEvent, telasSelecionadas: number[]) => void;

  onCampoChange: (campo: keyof FormularioUsuario, valor: string) => void;
}

export function ModalUsuario({
  isOpen,
  usuarioEditando,
  formulario,
  salvando,

  // TELAS
  telas,
  telasSelecionadas,
  carregandoTelas,
  onToggleTela,

  onClose,
  onSubmit,
  onCampoChange,
}: ModalUsuarioProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  if (!isOpen) {
    return null;
  }

  /**
   * Verifica se determinada tela está selecionada.
   */
  const telaSelecionada = (telaId: number): boolean => {
    return telasSelecionadas.includes(telaId);
  };

  /**
   * Submete o formulário passando também
   * os IDs das telas selecionadas.
   *
   * IMPORTANTE:
   * É aqui que os IDs das telas são enviados
   * para o componente pai.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("TELAS SELECIONADAS NO MODAL:", telasSelecionadas);

    onSubmit(e, telasSelecionadas);
  };

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
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
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
        onClick={(e) => e.stopPropagation()}
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
                color: "#059669",
              }}
            >
              <FontAwesomeIcon
                icon={usuarioEditando ? faPenToSquare : faUserPlus}
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
                {usuarioEditando ? "Editar colaborador" : "Novo colaborador"}
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

          <button type="button" onClick={onClose} style={closeButtonStyle}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: 22,
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
                value={formulario.full_name}
                onChange={(e) => onCampoChange("full_name", e.target.value)}
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
                value={formulario.username}
                onChange={(e) => onCampoChange("username", e.target.value)}
                required
                autoComplete="username"
                style={inputStyle}
              />
            </div>

            {/* E-MAIL */}
            <div>
              <label style={labelStyle}>E-mail</label>

              <input
                type="email"
                value={formulario.email}
                onChange={(e) => onCampoChange("email", e.target.value)}
                required
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            {/* TELEFONE */}
            <div>
              <label style={labelStyle}>Telefone</label>

              <input
                type="text"
                value={formulario.contact}
                onChange={(e) => onCampoChange("contact", e.target.value)}
                autoComplete="tel"
                style={inputStyle}
              />
            </div>

            {/* SENHA */}
            <div>
              <label style={labelStyle}>Senha</label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={formulario.password}
                  onChange={(e) => onCampoChange("password", e.target.value)}
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
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  style={passwordButtonStyle}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  <FontAwesomeIcon icon={mostrarSenha ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* PERFIL */}
            <div>
              <label style={labelStyle}>Perfil de acesso</label>

              <select
                value={formulario.role}
                onChange={(e) => onCampoChange("role", e.target.value)}
                style={inputStyle}
              >
                <option value="USER">Usuário</option>

                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {/* ================================================= */}
            {/* TELAS DO SISTEMA */}
            {/* ================================================= */}

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    ...labelStyle,
                    marginBottom: 0,
                  }}
                >
                  Acesso às telas
                </label>

                {telas.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    {telasSelecionadas.length} de {telas.length} selecionadas
                  </span>
                )}
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#ffffff",
                }}
              >
                {/* CARREGANDO */}
                {carregandoTelas && (
                  <div
                    style={{
                      padding: 18,
                      textAlign: "center",
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Carregando telas...
                  </div>
                )}

                {/* NENHUMA TELA */}
                {!carregandoTelas && telas.length === 0 && (
                  <div
                    style={{
                      padding: 18,
                      textAlign: "center",
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Nenhuma tela disponível.
                  </div>
                )}

                {/* LISTA DE TELAS */}
                {!carregandoTelas &&
                  telas.map((tela, index) => {
                    const selecionada = telaSelecionada(tela.id);

                    return (
                      <div
                        key={tela.id}
                        style={{
                          minHeight: 54,
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderBottom:
                            index < telas.length - 1
                              ? "1px solid #f1f5f9"
                              : "none",
                          background: selecionada ? "#f0fdf4" : "#ffffff",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* INFORMAÇÕES */}
                        <div
                          style={{
                            minWidth: 0,
                            paddingRight: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "#374151",
                            }}
                          >
                            {tela.nome}
                          </div>

                          {tela.descricao && (
                            <div
                              style={{
                                marginTop: 2,
                                fontSize: 11,
                                color: "#9ca3af",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {tela.descricao}
                            </div>
                          )}
                        </div>

                        {/* TOGGLE */}
                        <button
                          type="button"
                          onClick={() => onToggleTela(tela.id)}
                          disabled={salvando}
                          aria-label={
                            selecionada
                              ? `Desativar acesso à tela ${tela.nome}`
                              : `Ativar acesso à tela ${tela.nome}`
                          }
                          aria-pressed={selecionada}
                          style={{
                            position: "relative",
                            flexShrink: 0,
                            width: 42,
                            height: 23,
                            border: "none",
                            borderRadius: 20,
                            background: selecionada ? "#059669" : "#d1d5db",
                            cursor: salvando ? "not-allowed" : "pointer",
                            transition: "background 0.2s ease",
                            padding: 0,
                            opacity: salvando ? 0.6 : 1,
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: 3,
                              left: selecionada ? 22 : 3,
                              width: 17,
                              height: 17,
                              borderRadius: "50%",
                              background: "#ffffff",
                              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                              transition: "left 0.2s ease",
                            }}
                          />
                        </button>
                      </div>
                    );
                  })}
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
              onClick={onClose}
              disabled={salvando}
              style={secondaryButtonStyle}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              style={primaryButtonStyle}
            >
              <FontAwesomeIcon
                icon={usuarioEditando ? faPenToSquare : faUserPlus}
                style={{
                  marginRight: 7,
                }}
              />

              {salvando
                ? "Salvando..."
                : usuarioEditando
                  ? "Salvar alterações"
                  : "Cadastrar colaborador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================
// ESTILOS
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
