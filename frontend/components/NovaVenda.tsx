// pages/NovaVenda.tsx

import React, { useMemo, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCartShopping,
  faMagnifyingGlass,
  faMinus,
  faPlus,
  faTrash,
  faXmark,
  faCheck,
  faUser,
  faStore,
  faPenToSquare,
  faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";

interface Produto {
  id: number;
  name: string;
  product_code?: string;
  price: number;
  category_id: number;
}

interface Categoria {
  id: number;
  name: string;
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface Comanda {
  id: number;
  numero: number;
  cliente: string;
  mesa: number | null;
  status: "aberta" | "fechada" | "cancelada";
  itens: ItemCarrinho[];
  total: number;
}

interface NovaVendaProps {
  comanda: Comanda;
  onVoltar?: () => void;
  onAtualizarComanda?: (dados: Partial<Comanda>) => void;
  onFinalizar?: () => void;
}

const categoriasIniciais: Categoria[] = [
  {
    id: 0,
    name: "Todos",
  },
  {
    id: 1,
    name: "Comidas",
  },
  {
    id: 2,
    name: "Bebidas",
  },
  {
    id: 3,
    name: "Porções",
  },
];

const produtosIniciais: Produto[] = [
  {
    id: 1,
    name: "Batata Frita",
    product_code: "001",
    price: 18,
    category_id: 3,
  },
  {
    id: 2,
    name: "Batata com Cheddar",
    product_code: "002",
    price: 24,
    category_id: 3,
  },
  {
    id: 3,
    name: "Hambúrguer Artesanal",
    product_code: "003",
    price: 28,
    category_id: 1,
  },
  {
    id: 4,
    name: "X-Bacon",
    product_code: "004",
    price: 30,
    category_id: 1,
  },
  {
    id: 5,
    name: "X-Salada",
    product_code: "005",
    price: 25,
    category_id: 1,
  },
  {
    id: 6,
    name: "Cerveja",
    product_code: "006",
    price: 8,
    category_id: 2,
  },
  {
    id: 7,
    name: "Chopp",
    product_code: "007",
    price: 10,
    category_id: 2,
  },
  {
    id: 8,
    name: "Refrigerante",
    product_code: "008",
    price: 6,
    category_id: 2,
  },
  {
    id: 9,
    name: "Suco Natural",
    product_code: "009",
    price: 9,
    category_id: 2,
  },
  {
    id: 10,
    name: "Calabresa Acebolada",
    product_code: "010",
    price: 32,
    category_id: 3,
  },
  {
    id: 11,
    name: "Frango à Passarinho",
    product_code: "011",
    price: 35,
    category_id: 3,
  },
  {
    id: 12,
    name: "Isca de Carne",
    product_code: "012",
    price: 38,
    category_id: 3,
  },
];

const pontosVenda = [
  {
    id: 0,
    number: 0,
    name: "Balcão",
  },
  {
    id: 1,
    number: 1,
    name: "Ponto 01",
  },
  {
    id: 2,
    number: 2,
    name: "Ponto 02",
  },
  {
    id: 3,
    number: 3,
    name: "Ponto 03",
  },
  {
    id: 4,
    number: 4,
    name: "Ponto 04",
  },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function NovaVenda({
  comanda,
  onVoltar,
  onAtualizarComanda,
  onFinalizar,
}: NovaVendaProps) {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(0);
  const [busca, setBusca] = useState("");

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>(comanda.itens || []);

  const [cliente, setCliente] = useState(comanda.cliente || "Consumidor");

  const [pontoVenda, setPontoVenda] = useState<number | null>(comanda.mesa);

  const [modoEdicao, setModoEdicao] = useState(false);

  const [salvando, setSalvando] = useState(false);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtosIniciais.filter((produto) => {
      const pertenceCategoria =
        categoriaSelecionada === 0 ||
        produto.category_id === categoriaSelecionada;

      const correspondeBusca =
        !termo ||
        produto.name.toLowerCase().includes(termo) ||
        produto.product_code?.toLowerCase().includes(termo);

      return pertenceCategoria && correspondeBusca;
    });
  }, [busca, categoriaSelecionada]);

  const totalItens = useMemo(() => {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
  }, [carrinho]);

  const totalVenda = useMemo(() => {
    return carrinho.reduce(
      (total, item) => total + item.produto.price * item.quantidade,
      0,
    );
  }, [carrinho]);

  const sincronizarComanda = (
    itens: ItemCarrinho[],
    novoCliente = cliente,
    novaMesa = pontoVenda,
  ) => {
    const total = itens.reduce(
      (sum, item) => sum + item.produto.price * item.quantidade,
      0,
    );

    setCarrinho(itens);

    onAtualizarComanda?.({
      itens,
      total,
      cliente: novoCliente,
      mesa: novaMesa,
    });
  };

  const adicionarProduto = (produto: Produto) => {
    const atual = carrinho.map((item) => ({
      ...item,
    }));

    const existente = atual.find((item) => item.produto.id === produto.id);

    if (existente) {
      existente.quantidade += 1;
    } else {
      atual.push({
        produto,
        quantidade: 1,
      });
    }

    sincronizarComanda(atual);
  };

  const aumentarQuantidade = (produtoId: number) => {
    const atual = carrinho.map((item) =>
      item.produto.id === produtoId
        ? {
            ...item,
            quantidade: item.quantidade + 1,
          }
        : item,
    );

    sincronizarComanda(atual);
  };

  const diminuirQuantidade = (produtoId: number) => {
    const atual = carrinho
      .map((item) =>
        item.produto.id === produtoId
          ? {
              ...item,
              quantidade: item.quantidade - 1,
            }
          : item,
      )
      .filter((item) => item.quantidade > 0);

    sincronizarComanda(atual);
  };

  const removerProduto = (produtoId: number) => {
    const atual = carrinho.filter((item) => item.produto.id !== produtoId);

    sincronizarComanda(atual);
  };

  const limparCarrinho = () => {
    sincronizarComanda([]);
  };

  const alterarCliente = (valor: string) => {
    setCliente(valor);

    onAtualizarComanda?.({
      cliente: valor.trim() || "Consumidor",
    });
  };

  const alterarPontoVenda = (valor: string) => {
    const mesa = valor === "" ? null : Number(valor);

    setPontoVenda(mesa);

    onAtualizarComanda?.({
      mesa,
    });
  };

  const ativarEdicao = () => {
    setModoEdicao(true);
  };

  const cancelarEdicao = () => {
    setCliente(comanda.cliente || "Consumidor");
    setPontoVenda(comanda.mesa);
    setModoEdicao(false);
  };

  const salvarAlteracoes = async () => {
    try {
      setSalvando(true);

      const token = localStorage.getItem("auth_token");

      const clienteAtualizado = cliente.trim() || "Consumidor";

      const response = await axios.put(
        `/api/orders/${comanda.id}`,
        {
          customer_name: clienteAtualizado,
          total: totalVenda,
          status: "aberto",
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      const orderAtualizada = response.data?.order;

      setCliente(orderAtualizada?.customer_name || clienteAtualizado);

      onAtualizarComanda?.({
        cliente: orderAtualizada?.customer_name || clienteAtualizado,
        mesa: pontoVenda,
        total: totalVenda,
      });

      setModoEdicao(false);
    } catch (error: any) {
      console.error("Erro ao atualizar comanda:", error);

      const mensagem =
        error?.response?.data?.message ||
        "Não foi possível atualizar a comanda.";

      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      return;
    }

    try {
      setSalvando(true);

      const token = localStorage.getItem("auth_token");

      const clienteAtualizado = cliente.trim() || "Consumidor";

      await axios.put(
        `/api/orders/${comanda.id}`,
        {
          customer_name: clienteAtualizado,
          total: totalVenda,
          status: "fechado",
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      onAtualizarComanda?.({
        itens: carrinho,
        total: totalVenda,
        cliente: clienteAtualizado,
        mesa: pontoVenda,
        status: "fechada",
      });

      onFinalizar?.();
    } catch (error: any) {
      console.error("Erro ao finalizar venda:", error);

      const mensagem =
        error?.response?.data?.message || "Não foi possível finalizar a venda.";

      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  };

  const voltar = () => {
    onAtualizarComanda?.({
      itens: carrinho,
      total: totalVenda,
      cliente: cliente.trim() || "Consumidor",
      mesa: pontoVenda,
    });

    if (onVoltar) {
      onVoltar();
    } else {
      window.history.back();
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        width: "100%",
        background: "#f8fafc",
        color: "#111827",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        className="nova-venda-container"
        style={{
          width: "100%",
          maxWidth: 1600,
          margin: "0 auto",
          padding: "18px 20px 24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 16,
            marginBottom: 18,
          }}
        >
          <div
            className="nova-venda-header-top"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                minWidth: 0,
              }}
            >
              <button
                type="button"
                onClick={voltar}
                style={{
                  height: 36,
                  padding: "0 12px",
                  flexShrink: 0,
                  borderRadius: 7,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  fontSize: 12,
                  fontWeight: 500,
                }}
                title="Voltar"
              >
                <FontAwesomeIcon
                  icon={faArrowLeft}
                  style={{
                    fontSize: 11,
                  }}
                />
                Voltar
              </button>

              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                    flexWrap: "wrap",
                  }}
                >
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 21,
                      lineHeight: 1.2,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Comanda #{comanda.numero}
                  </h1>

                  <span
                    style={{
                      padding: "5px 9px",
                      borderRadius: 20,
                      background: "#ecfdf5",
                      color: "#047857",
                      fontSize: 10,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Aberta
                  </span>
                </div>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: 14,
                    color: "#6b7280",
                  }}
                >
                  Adicione produtos à comanda
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              {!modoEdicao ? (
                <button
                  type="button"
                  onClick={ativarEdicao}
                  style={{
                    height: 36,
                    padding: "0 12px",
                    borderRadius: 7,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#374151",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faPenToSquare}
                    style={{
                      fontSize: 11,
                    }}
                  />
                  Editar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={cancelarEdicao}
                    disabled={salvando}
                    style={{
                      height: 36,
                      padding: "0 12px",
                      borderRadius: 7,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#6b7280",
                      cursor: salvando ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={salvarAlteracoes}
                    disabled={salvando}
                    style={{
                      height: 36,
                      padding: "0 13px",
                      borderRadius: 7,
                      border: "1px solid #059669",
                      background: "#059669",
                      color: "#fff",
                      cursor: salvando ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      opacity: salvando ? 0.7 : 1,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faFloppyDisk}
                      style={{
                        fontSize: 11,
                      }}
                    />

                    {salvando ? "Salvando..." : "Salvar alterações"}
                  </button>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 11px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 7,
                  background: "#fff",
                  color: "#6b7280",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <FontAwesomeIcon
                  icon={faCartShopping}
                  style={{
                    color: "#059669",
                    fontSize: 14,
                  }}
                />
                {totalItens} {totalItens === 1 ? "item" : "itens"}
              </div>
            </div>
          </div>

          <div
            className="nova-venda-header-fields"
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(180px, 1fr) minmax(160px, 220px) minmax(240px, 1.5fr)",
              gap: 10,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#6b7280",
                }}
              >
                Cliente
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <FontAwesomeIcon
                  icon={faUser}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    fontSize: 11,
                    zIndex: 1,
                  }}
                />

                <input
                  type="text"
                  value={cliente}
                  disabled={!modoEdicao}
                  onChange={(e) => alterarCliente(e.target.value)}
                  placeholder="Nome do cliente"
                  style={{
                    width: "100%",
                    height: 40,
                    boxSizing: "border-box",
                    padding: "0 10px 0 30px",
                    borderRadius: 7,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                    fontSize: 12,
                    color: modoEdicao ? "#111827" : "#6b7280",
                    background: modoEdicao ? "#fff" : "#f8fafc",
                    cursor: modoEdicao ? "text" : "not-allowed",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#6b7280",
                }}
              >
                Ponto de atendimento
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <FontAwesomeIcon
                  icon={faStore}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    fontSize: 11,
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />

                <select
                  value={pontoVenda ?? ""}
                  disabled={!modoEdicao}
                  onChange={(e) => alterarPontoVenda(e.target.value)}
                  style={{
                    width: "100%",
                    height: 40,
                    boxSizing: "border-box",
                    padding: "0 10px 0 30px",
                    borderRadius: 7,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                    fontSize: 12,
                    color: modoEdicao ? "#111827" : "#6b7280",
                    background: modoEdicao ? "#fff" : "#f8fafc",
                    cursor: modoEdicao ? "pointer" : "not-allowed",
                  }}
                >
                  <option value="">Sem ponto</option>

                  {pontosVenda.map((ponto) => (
                    <option key={ponto.id} value={ponto.id}>
                      {ponto.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#6b7280",
                }}
              >
                Buscar produto
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    fontSize: 11,
                  }}
                />

                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou código..."
                  style={{
                    width: "100%",
                    height: 40,
                    boxSizing: "border-box",
                    padding: "0 36px 0 30px",
                    borderRadius: 7,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                    background: "#fff",
                    color: "#111827",
                    fontSize: 12,
                  }}
                />

                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    style={{
                      position: "absolute",
                      right: 6,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 26,
                      height: 26,
                      border: "none",
                      background: "transparent",
                      color: "#9ca3af",
                      cursor: "pointer",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faXmark}
                      style={{
                        fontSize: 14,
                      }}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginTop: 12,
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {categoriasIniciais.map((categoria) => {
              const ativa = categoriaSelecionada === categoria.id;

              return (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() => setCategoriaSelecionada(categoria.id)}
                  style={{
                    flexShrink: 0,
                    padding: "7px 13px",
                    borderRadius: 20,
                    border: ativa ? "1px solid #10b981" : "1px solid #e5e7eb",
                    background: ativa ? "#ecfdf5" : "#fff",
                    color: ativa ? "#059669" : "#6b7280",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: ativa ? 600 : 500,
                  }}
                >
                  {categoria.name}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="nova-venda-main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              minWidth: 0,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Produtos
                </strong>

                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    color: "#9ca3af",
                  }}
                >
                  {produtosFiltrados.length} encontrados
                </span>
              </div>
            </div>

            <div
              style={{
                padding: 14,
              }}
            >
              {produtosFiltrados.length === 0 ? (
                <div
                  style={{
                    minHeight: 260,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#9ca3af",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    style={{
                      fontSize: 24,
                      marginBottom: 10,
                    }}
                  />

                  <span
                    style={{
                      fontSize: 13,
                    }}
                  >
                    Nenhum produto encontrado.
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #eef2f7",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="nova-venda-produto-header"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) 80px 100px 120px",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #eef2f7",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    <div>Produto</div>

                    <div
                      style={{
                        textAlign: "center",
                      }}
                    >
                      Código
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      Preço
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      Ação
                    </div>
                  </div>

                  {produtosFiltrados.map((produto, index) => {
                    const quantidade =
                      carrinho.find((item) => item.produto.id === produto.id)
                        ?.quantidade || 0;

                    return (
                      <div
                        className="nova-venda-produto-row"
                        key={produto.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(0, 1fr) 80px 100px 120px",
                          alignItems: "center",
                          gap: 8,
                          padding: "11px 12px",
                          borderBottom:
                            index < produtosFiltrados.length - 1
                              ? "1px solid #f1f5f9"
                              : "none",
                          background: quantidade > 0 ? "#fcfffd" : "#fff",
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "#1f2937",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={produto.name}
                          >
                            {produto.name}
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: "center",
                            fontSize: 11,
                            color: "#9ca3af",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {produto.product_code || "-"}
                        </div>

                        <div
                          style={{
                            textAlign: "right",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#059669",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatCurrency(produto.price)}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => adicionarProduto(produto)}
                            style={{
                              height: 31,
                              padding: "0 12px",
                              borderRadius: 6,
                              border: "1px solid #a7f3d0",
                              background: "#ecfdf5",
                              color: "#047857",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 5,
                              fontSize: 11,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faPlus}
                              style={{
                                fontSize: 9,
                              }}
                            />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div
            className="nova-venda-comanda"
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              overflow: "hidden",
              minWidth: 0,
              height: "min(760px, calc(100vh - 140px))",
              minHeight: 450,
              display: "flex",
              flexDirection: "column",
              position: "sticky",
              top: 18,
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    flexWrap: "wrap",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCartShopping}
                    style={{
                      color: "#059669",
                      fontSize: 14,
                    }}
                  />

                  <strong
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Comanda #{comanda.numero}
                  </strong>

                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 20,
                      background: "#ecfdf5",
                      color: "#047857",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Aberta
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      style={{
                        fontSize: 10,
                      }}
                    />

                    {cliente || "Consumidor"}
                  </span>

                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faStore}
                      style={{
                        fontSize: 10,
                      }}
                    />

                    {pontoVenda !== null
                      ? pontosVenda.find((ponto) => ponto.id === pontoVenda)
                          ?.name || "Sem ponto"
                      : "Sem ponto"}
                  </span>
                </div>
              </div>

              {carrinho.length > 0 && (
                <button
                  type="button"
                  onClick={limparCarrinho}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#9ca3af",
                    cursor: "pointer",
                    fontSize: 11,
                    padding: "5px",
                    flexShrink: 0,
                  }}
                >
                  Limpar
                </button>
              )}
            </div>

            {carrinho.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 24,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    flexShrink: 0,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCartShopping}
                    style={{
                      fontSize: 21,
                    }}
                  />
                </div>

                <strong
                  style={{
                    fontSize: 14,
                    color: "#374151",
                    fontWeight: 500,
                  }}
                >
                  Comanda vazia
                </strong>

                <span
                  style={{
                    marginTop: 5,
                    fontSize: 11,
                    color: "#9ca3af",
                    lineHeight: 1.5,
                  }}
                >
                  Clique em um produto para adicioná-lo à comanda.
                </span>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  minHeight: 0,
                }}
              >
                {carrinho.map((item) => {
                  const subtotal = item.produto.price * item.quantidade;

                  return (
                    <div
                      key={item.produto.id}
                      style={{
                        padding: "13px 14px",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: "#1f2937",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.produto.name}
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 14,
                              color: "#9ca3af",
                            }}
                          >
                            {item.quantidade} ×{" "}
                            {formatCurrency(item.produto.price)}
                          </div>
                        </div>

                        <strong
                          style={{
                            fontSize: 14,
                            color: "#059669",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatCurrency(subtotal)}
                        </strong>
                      </div>

                      <div
                        style={{
                          marginTop: 9,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => removerProduto(item.produto.id)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#dc2626",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="Remover produto"
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            style={{
                              fontSize: 10,
                            }}
                          />
                        </button>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            border: "1px solid #e5e7eb",
                            borderRadius: 7,
                            overflow: "hidden",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => diminuirQuantidade(item.produto.id)}
                            style={{
                              width: 30,
                              height: 28,
                              border: "none",
                              background: "#fff",
                              color: "#6b7280",
                              cursor: "pointer",
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faMinus}
                              style={{
                                fontSize: 9,
                              }}
                            />
                          </button>

                          <span
                            style={{
                              minWidth: 30,
                              textAlign: "center",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {item.quantidade}
                          </span>

                          <button
                            type="button"
                            onClick={() => aumentarQuantidade(item.produto.id)}
                            style={{
                              width: 30,
                              height: 28,
                              border: "none",
                              background: "#fff",
                              color: "#059669",
                              cursor: "pointer",
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faPlus}
                              style={{
                                fontSize: 9,
                              }}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                padding: 15,
                background: "#fafafa",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  Total
                </span>

                <strong
                  style={{
                    fontSize: 21,
                    color: "#059669",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(totalVenda)}
                </strong>
              </div>

              <button
                type="button"
                onClick={finalizarVenda}
                disabled={carrinho.length === 0 || salvando}
                style={{
                  width: "100%",
                  marginTop: 11,
                  padding: "12px 14px",
                  borderRadius: 7,
                  border: "none",
                  background:
                    carrinho.length > 0 && !salvando ? "#059669" : "#e5e7eb",
                  color: carrinho.length > 0 && !salvando ? "#fff" : "#9ca3af",
                  cursor:
                    carrinho.length > 0 && !salvando
                      ? "pointer"
                      : "not-allowed",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                }}
              >
                <FontAwesomeIcon
                  icon={faCheck}
                  style={{
                    fontSize: 11,
                  }}
                />

                {salvando ? "Finalizando..." : "Finalizar venda"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .nova-venda-page input:focus,
          .nova-venda-page select:focus {
            border-color: #10b981 !important;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
          }

          input:disabled,
          select:disabled {
            opacity: 1;
          }

          @media (max-width: 1050px) {
            .nova-venda-main-grid {
              grid-template-columns:
                minmax(0, 1fr) 320px !important;
            }

            .nova-venda-header-fields {
              grid-template-columns:
                minmax(160px, 1fr)
                minmax(150px, 190px)
                minmax(200px, 1.3fr) !important;
            }
          }

          @media (max-width: 850px) {
            .nova-venda-main-grid {
              grid-template-columns: 1fr !important;
            }

            .nova-venda-comanda {
              position: static !important;
              height: auto !important;
              min-height: 0 !important;
            }

            .nova-venda-header-fields {
              grid-template-columns: 1fr 1fr !important;
            }

            .nova-venda-header-fields > div:last-child {
              grid-column: 1 / -1;
            }
          }

          @media (max-width: 700px) {
            .nova-venda-produto-header,
            .nova-venda-produto-row {
              grid-template-columns:
                minmax(0, 1fr) 95px !important;
            }

            .nova-venda-produto-header > div:nth-child(2),
            .nova-venda-produto-row > div:nth-child(2) {
              display: none;
            }

            .nova-venda-header-top {
              align-items: flex-start !important;
            }

            .nova-venda-header-fields {
              grid-template-columns: 1fr !important;
            }

            .nova-venda-header-fields > div:last-child {
              grid-column: auto !important;
            }
          }

          @media (max-width: 520px) {
            .nova-venda-produto-header {
              padding: 9px 10px !important;
            }

            .nova-venda-produto-row {
              padding: 10px !important;
              gap: 5px !important;
            }

            .nova-venda-produto-header > div:nth-child(3),
            .nova-venda-produto-row > div:nth-child(3) {
              display: none;
            }

            .nova-venda-produto-header,
            .nova-venda-produto-row {
              grid-template-columns:
                minmax(0, 1fr) 105px !important;
            }
          }

          @media (max-width: 400px) {
            .nova-venda-container {
              padding-left: 10px !important;
              padding-right: 10px !important;
            }

            .nova-venda-produto-row > div:first-child {
              min-width: 0;
            }

            .nova-venda-produto-row > div:first-child > div:first-child {
              white-space: normal !important;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
          }
        `}
      </style>
    </div>
  );
}
