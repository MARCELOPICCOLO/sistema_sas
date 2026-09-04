// pages/Dashboard.tsx

import React, { useState, useEffect, useMemo } from "react";
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

interface Tela {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  ativo: boolean;
}

interface UsuarioLocal {
  id: number;
  full_name?: string;
  username?: string;
  email?: string;
  contact?: string | null;
  active?: boolean;
  is_master?: boolean;
  created_at?: string;
  updated_at?: string;
  telas?: Tela[];
  tela_ids?: number[];
}

interface DashboardProps {
  setTela: (tela: string) => void;
  user?: {
    id: number;
    login: string;
    email: string;
  } | null;
  onLogout?: () => void;
}

interface MeResponse {
  user: UsuarioLocal;
  company_id: number | null;
  tela_ids?: number[];
  telas?: Tela[];
}

const USER_STORAGE_KEY = "user";

export default function Dashboard({ setTela, user, onLogout }: DashboardProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024,
  );

  const [telasUsuario, setTelasUsuario] = useState<Tela[]>([]);

  const [carregandoTelas, setCarregandoTelas] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);

      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /**
   * Carrega o usuário e suas permissões.
   *
   * Regra:
   *
   * 1. Primeiro verifica o usuário no localStorage.
   * 2. Se existir, utiliza os dados locais e NÃO chama /auth/me.
   * 3. Se não existir, chama /auth/me, salva o usuário no
   *    localStorage e utiliza as telas retornadas.
   */
  useEffect(() => {
    let componenteMontado = true;

    const carregarTelasUsuario = async () => {
      try {
        setCarregandoTelas(true);

        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:8000/api";

        /**
         * ============================================================
         * 1. PRIMEIRO: verifica o usuário no localStorage
         * ============================================================
         */
        const usuarioSalvo = localStorage.getItem(USER_STORAGE_KEY);

        if (usuarioSalvo) {
          try {
            const usuarioLocal: UsuarioLocal = JSON.parse(usuarioSalvo);

            /**
             * Se o usuário possui "telas" salvas, usamos diretamente.
             *
             * Isso evita completamente uma chamada ao /auth/me.
             */
            if (Array.isArray(usuarioLocal.telas)) {
              if (componenteMontado) {
                setTelasUsuario(
                  usuarioLocal.telas.filter((tela) => tela.ativo !== false),
                );
              }

              return;
            }

            /**
             * Caso exista usuário no localStorage, mas ele não tenha
             * o array "telas", verificamos se existem tela_ids.
             *
             * Importante:
             * NÃO chamamos /auth/me neste caso.
             */
            if (
              Array.isArray(usuarioLocal.tela_ids) &&
              usuarioLocal.tela_ids.length > 0
            ) {
              const token = localStorage.getItem("auth_token");

              if (!token) {
                if (componenteMontado) {
                  setTelasUsuario([]);
                }

                return;
              }

              const telasResponse = await fetch(`${API_URL}/telas`, {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!telasResponse.ok) {
                throw new Error(
                  `Erro ao carregar telas: ${telasResponse.status}`,
                );
              }

              const telasDados = await telasResponse.json();

              const todasTelas: Tela[] = Array.isArray(telasDados.data)
                ? telasDados.data
                : [];

              const idsPermitidos = new Set(usuarioLocal.tela_ids);

              const telasPermitidas = todasTelas.filter(
                (tela) => idsPermitidos.has(tela.id) && tela.ativo !== false,
              );

              if (componenteMontado) {
                setTelasUsuario(telasPermitidas);
              }

              return;
            }

            /**
             * Usuário existe no localStorage, mas não possui telas
             * nem tela_ids.
             *
             * Não chamamos /auth/me.
             */
            if (componenteMontado) {
              setTelasUsuario([]);
            }

            return;
          } catch (erro) {
            /**
             * O conteúdo salvo não é um JSON válido.
             *
             * Removemos somente o registro inválido para permitir
             * que o fluxo abaixo faça uma nova chamada ao /auth/me.
             */
            console.error(
              "Usuário salvo no localStorage possui formato inválido:",
              erro,
            );

            localStorage.removeItem(USER_STORAGE_KEY);
          }
        }

        /**
         * ============================================================
         * 2. USUÁRIO NÃO EXISTE NO localStorage
         * ============================================================
         *
         * Somente neste caso chamamos /auth/me.
         */
        const token = localStorage.getItem("auth_token");

        if (!token) {
          if (componenteMontado) {
            setTelasUsuario([]);
          }

          return;
        }

        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao carregar usuário: ${response.status}`);
        }

        const dados: MeResponse = await response.json();

        if (!dados?.user?.id) {
          throw new Error("A API /auth/me não retornou um usuário válido.");
        }

        /**
         * ============================================================
         * 3. MONTA O USUÁRIO QUE SERÁ SALVO NO localStorage
         * ============================================================
         *
         * Mantemos as informações do usuário e suas permissões.
         */
        const telasRecebidas: Tela[] = Array.isArray(dados.user.telas)
          ? dados.user.telas
          : Array.isArray(dados.telas)
            ? dados.telas
            : [];

        const telaIdsRecebidos: number[] = Array.isArray(dados.tela_ids)
          ? dados.tela_ids
          : telasRecebidas.map((tela) => tela.id);

        const usuarioParaSalvar: UsuarioLocal = {
          ...dados.user,
          telas: telasRecebidas,
          tela_ids: telaIdsRecebidos,
        };

        /**
         * Salva o usuário completo no localStorage.
         */
        localStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(usuarioParaSalvar),
        );

        /**
         * ============================================================
         * 4. CARREGA AS TELAS DO USUÁRIO
         * ============================================================
         */
        if (componenteMontado) {
          setTelasUsuario(
            telasRecebidas.filter((tela) => tela.ativo !== false),
          );
        }
      } catch (erro) {
        console.error("Erro ao carregar usuário/telas:", erro);

        if (componenteMontado) {
          setTelasUsuario([]);
        }
      } finally {
        if (componenteMontado) {
          setCarregandoTelas(false);
        }
      }
    };

    carregarTelasUsuario();

    return () => {
      componenteMontado = false;
    };
  }, []);

  /**
   * Todos os cards disponíveis no sistema.
   *
   * Os nomes dos cards permanecem exatamente como estavam.
   *
   * A propriedade "tela" corresponde ao slug cadastrado
   * na tabela "telas".
   */
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
      tela: "gestao_relatorio",
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

  /**
   * Filtra os cards de acordo com as telas liberadas
   * para o usuário.
   */
  const cardsPermitidos = useMemo(() => {
    if (carregandoTelas) {
      return [];
    }

    const slugsPermitidos = new Set(telasUsuario.map((tela) => tela.slug));

    return cards.filter((card) => slugsPermitidos.has(card.tela));
  }, [telasUsuario, carregandoTelas]);

  const handleCardClick = (tela: string) => {
    setTela(tela);
  };

  const getCardsPerRow = () => {
    if (isMobile) return "1fr";

    if (isTablet) return "repeat(2, 1fr)";

    return "repeat(auto-fill, minmax(320px, 1fr))";
  };

  /**
   * Remove o usuário local antes de executar o logout.
   *
   * Isso evita que outro usuário que faça login posteriormente
   * herde os dados do usuário anterior.
   */
  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);

    if (onLogout) {
      onLogout();
    }
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
      {/* Cabeçalho */}
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
            onClick={handleLogout}
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

      {/* Carregando permissões */}
      {carregandoTelas && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "40px 20px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "13px",
          }}
        >
          Carregando módulos disponíveis...
        </div>
      )}

      {/* Nenhum módulo */}
      {!carregandoTelas && cardsPermitidos.length === 0 && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "40px 20px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "13px",
          }}
        >
          Você não possui módulos liberados para acesso.
        </div>
      )}

      {/* Grid de Cards */}
      {!carregandoTelas && cardsPermitidos.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: getCardsPerRow(),
            gap: "16px",
          }}
        >
          {cardsPermitidos.map((card) => (
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

              {/* Link */}
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
      )}

      {/* Rodapé */}
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
              {cardsPermitidos.length}
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
