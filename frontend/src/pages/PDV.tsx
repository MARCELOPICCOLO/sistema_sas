import React, { useState, useEffect } from "react";
import TabelaProdutosPdv from "../../components/TabelaProdutosPdv";
import SidebarPdv from "../../components/SidebarPdv";
import PontoAtendimentoMobile from "../../components/PontoAtendimentoMobile";
import { ModalAbrirComanda } from "../../components/ModalAbrirComanda";

const API_URL = import.meta.env.VITE_API_URL;

interface Produto {
  id: number;
  name: string;
  price: number;
  product_code?: string;
  category?: {
    id: number;
    name: string;
  };
}

interface Categoria {
  id: number;
  name: string;
}

interface PontoVenda {
  id: number;
  number: number;
  restaurant_id: number;
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: {
    name: string;
    product_code?: string;
  };
}

interface Order {
  id: number;
  table_id: number;
  customer_name: string;
  status: string;
  closed_at?: string;
  items?: OrderItem[];
}

interface ComandaItem {
  id: number;
  orderItemId: number;
  name: string;
  product_code?: string;
  price: number;
  qtd: number;
}

interface Comanda {
  orderId: number;
  customerName: string;
  items: ComandaItem[];
}

export default function PDV() {
  const [pontoAtual, setPontoAtual] = useState("");
  const [comandas, setComandas] = useState<Record<string, Comanda[]>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [novoPontoCodigo, setNovoPontoCodigo] = useState("");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pontosVenda, setPontosVenda] = useState<PontoVenda[]>([]);
  const [menuPonto, setMenuPonto] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Estados para múltiplas comandas
  const [comandaSelecionada, setComandaSelecionada] = useState<number | null>(
    null,
  );
  const [modalAbrirComanda, setModalAbrirComanda] = useState<string | null>(
    null,
  );
  const [showSelectComanda, setShowSelectComanda] = useState(false);
  const [produtoPendente, setProdutoPendente] = useState<Produto | null>(null);

  // Estado para modal de finalizar
  const [modalFinalizar, setModalFinalizar] = useState(false);

  // Estado para responsividade
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activePanel, setActivePanel] = useState("pontos");

  // Estado forma de pagamento
  const [formaPagamento, setFormaPagamento] = useState("");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem("auth_token");

        if (!token) {
          console.error("JWT não encontrado.");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Carregar todos os produtos, categorias e pontos de venda
        // da empresa vinculada ao usuário autenticado
        const [resProducts, resCategories, resTables] = await Promise.all([
          fetch(`${API_URL}/products`, {
            method: "GET",
            headers,
          }),

          fetch(`${API_URL}/categories`, {
            method: "GET",
            headers,
          }),

          fetch(`${API_URL}/tables`, {
            method: "GET",
            headers,
          }),
        ]);

        // Verificar erros HTTP
        if (!resProducts.ok) {
          throw new Error(`Erro ao carregar produtos: ${resProducts.status}`);
        }

        if (!resCategories.ok) {
          throw new Error(
            `Erro ao carregar categorias: ${resCategories.status}`,
          );
        }

        if (!resTables.ok) {
          throw new Error(
            `Erro ao carregar pontos de venda: ${resTables.status}`,
          );
        }

        const productsData = await resProducts.json();
        const categoriesData = await resCategories.json();
        const tablesData = await resTables.json();

        setProdutos(productsData);
        setCategorias(categoriesData);
        setPontosVenda(tablesData);

        // Carregar comandas abertas do backend
        const resOrders = await fetch(`${API_URL}/orders`, {
          method: "GET",
          headers,
        });

        if (!resOrders.ok) {
          throw new Error(`Erro ao carregar comandas: ${resOrders.status}`);
        }

        const ordersData = await resOrders.json();

        console.log("Comandas carregadas do backend:", ordersData);

        setOrders(ordersData);

        // Estruturar as comandas por ponto de venda
        const comandasEstruturadas: Record<string, Comanda[]> = {};

        // Inicializar array vazio para cada ponto
        tablesData.forEach((t: PontoVenda) => {
          comandasEstruturadas[`ponto-${t.number}`] = [];
        });

        // Para cada comanda aberta
        ordersData.forEach((order: Order) => {
          if (order.status === "aberto") {
            // Encontrar o ponto pelo table_id
            const ponto = tablesData.find(
              (t: PontoVenda) => t.id === order.table_id,
            );

            if (ponto) {
              const pontoNome = `ponto-${ponto.number}`;

              // Buscar os itens da comanda
              let items: ComandaItem[] = [];

              if (order.items && order.items.length > 0) {
                items = order.items.map((item: OrderItem) => ({
                  id: item.product_id,
                  orderItemId: item.id,
                  name: item.product?.name || `Produto ${item.product_id}`,
                  product_code: item.product?.product_code,
                  price: parseFloat(item.price.toString()),
                  qtd: item.quantity,
                }));
              }

              comandasEstruturadas[pontoNome].push({
                orderId: order.id,
                customerName: order.customer_name || `Comanda ${order.id}`,
                items,
              });
            }
          }
        });

        setComandas(comandasEstruturadas);

        // Selecionar primeiro ponto se houver
        if (tablesData.length > 0) {
          const pontoInicial = `ponto-${tablesData[0].number}`;

          setPontoAtual(pontoInicial);

          // Selecionar primeira comanda do ponto
          if (comandasEstruturadas[pontoInicial].length > 0) {
            setComandaSelecionada(
              comandasEstruturadas[pontoInicial][0].orderId,
            );
          } else {
            setComandaSelecionada(null);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }

    loadData();
  }, []);

  const adicionarPonto = async () => {
    const numeroPonto = Number(novoPontoCodigo);

    if (!Number.isInteger(numeroPonto) || numeroPonto <= 0) {
      return alert("Digite um número válido");
    }

    try {
      const response = await fetch(`${API_URL}/tables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          restaurant_id: 1,
          number: numeroPonto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          alert(data.message);
        } else {
          alert(data.message || "Erro ao criar ponto de venda");
        }
        return;
      }

      const nomePonto = `ponto-${data.number}`;

      setPontosVenda((prev) => [...prev, data]);
      setComandas((prev) => ({ ...prev, [nomePonto]: [] }));
      setPontoAtual(nomePonto);
      setNovoPontoCodigo("");
      setComandaSelecionada(null);
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const removerPonto = async (pontoNome: string) => {
    const ponto = pontosVenda.find((p) => `ponto-${p.number}` === pontoNome);
    if (!ponto) return;

    if (
      window.confirm(
        `Tem certeza que deseja excluir o ponto de venda ${ponto.number}?`,
      )
    ) {
      try {
        // Primeiro, fechar todas as comandas abertas do ponto
        const comandasDoPonto = comandas[pontoNome] || [];
        for (const comanda of comandasDoPonto) {
          await fetch(`${API_URL}/orders/${comanda.orderId}/close`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        }

        const response = await fetch(`${API_URL}/tables/${ponto.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          alert("Erro ao excluir ponto de venda");
          return;
        }

        setPontosVenda((prev) => prev.filter((p) => p.id !== ponto.id));
        setComandas((prev) => {
          const newComandas = { ...prev };
          delete newComandas[pontoNome];
          return newComandas;
        });

        // Atualizar orders removendo as comandas
        setOrders((prev) =>
          prev.filter((o) => !comandasDoPonto.some((c) => c.orderId === o.id)),
        );

        if (pontoAtual === pontoNome) {
          const firstPonto = Object.keys(comandas).find((p) => p !== pontoNome);
          setPontoAtual(firstPonto || "");
          setComandaSelecionada(null);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const getOrderById = (orderId: number) => {
    return orders.find((o) => o.id === orderId);
  };

  const getComandasDoPonto = (pontoNome: string) => {
    return comandas[pontoNome] || [];
  };

  const abrirComanda = async (
    pontoNome: string,
    nomeCliente: string,
    dataComanda: string,
  ) => {
    const ponto = pontosVenda.find((p) => `ponto-${p.number}` === pontoNome);
    if (!ponto) return;

    if (!nomeCliente || nomeCliente.trim() === "") {
      alert("Digite um nome para identificar o atendimento");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          restaurant_id: 1,
          table_id: ponto.id,
          customer_name: nomeCliente,
          closed_at: dataComanda,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Erro ao abrir atendimento");
        return;
      }

      const novaOrder = data.order || data;
      setOrders((prev) => [...prev, novaOrder]);

      setComandas((prev) => ({
        ...prev,
        [pontoNome]: [
          ...(prev[pontoNome] || []),
          { orderId: novaOrder.id, items: [], customerName: nomeCliente },
        ],
      }));

      alert(`Atendimento de ${nomeCliente} aberto no ponto ${ponto.number}!`);
      setModalAbrirComanda(null);
      setMenuPonto(null);

      if (isMobile) {
        setActivePanel("cardapio");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao abrir atendimento");
    }
  };

  const getComandaItems = (pontoNome: string, orderId: number) => {
    const comandaPonto = comandas[pontoNome] || [];
    const comanda = comandaPonto.find((c) => c.orderId === orderId);
    return comanda ? comanda.items : [];
  };

  const addItem = async (produto: Produto, orderId: number) => {
    if (!pontoAtual) {
      alert("Selecione um ponto de venda primeiro");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          product_id: produto.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Erro ao adicionar item");
        return;
      }

      const data = await response.json();
      const novoOrderItem = data.item;

      const comandaPonto = comandas[pontoAtual] || [];
      const comandaIndex = comandaPonto.findIndex((c) => c.orderId === orderId);

      if (comandaIndex === -1) {
        alert("Atendimento não encontrado");
        return;
      }

      const comandaAtual = comandaPonto[comandaIndex];
      const itens = comandaAtual.items || [];
      const existe = itens.find((i) => i.id === produto.id);

      let novosItens: ComandaItem[];

      if (existe) {
        novosItens = itens.map((i) =>
          i.id === produto.id ? { ...i, qtd: i.qtd + 1 } : i,
        );
      } else {
        novosItens = [
          ...itens,
          {
            id: produto.id,
            orderItemId: novoOrderItem?.id,
            name: produto.name,
            product_code: produto.product_code,
            price: Number(produto.price),
            qtd: 1,
          },
        ];
      }

      const novasComandas = [...comandaPonto];
      novasComandas[comandaIndex] = { ...comandaAtual, items: novosItens };

      setComandas((prev) => ({
        ...prev,
        [pontoAtual]: novasComandas,
      }));
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar item");
    }
  };

  const alterarQtd = async (
    orderId: number,
    productId: number,
    delta: number,
    orderItemId: number,
  ) => {
    if (!orderItemId) {
      console.error("orderItemId é undefined!");
      alert("Erro: ID do item não encontrado. Recarregue a página.");
      return;
    }

    const comandaPonto = comandas[pontoAtual] || [];
    const comandaIndex = comandaPonto.findIndex((c) => c.orderId === orderId);

    if (comandaIndex === -1) return;

    const comandaAtual = comandaPonto[comandaIndex];
    const itemEncontrado = comandaAtual.items.find((i) => i.id === productId);

    if (!itemEncontrado) return;

    const novaQuantidade = itemEncontrado.qtd + delta;

    try {
      if (novaQuantidade > 0) {
        const response = await fetch(`${API_URL}/order-items/${orderItemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            quantity: novaQuantidade,
          }),
        });

        if (!response.ok) {
          alert("Erro ao atualizar quantidade");
          return;
        }
      } else {
        const response = await fetch(`${API_URL}/order-items/${orderItemId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Erro detalhado:", errorData);
          alert("Erro ao remover item");
          return;
        }
      }

      const itens = comandaAtual.items || [];
      const novosItens = itens
        .map((item) =>
          item.id === productId ? { ...item, qtd: item.qtd + delta } : item,
        )
        .filter((item) => item.qtd > 0);

      const novasComandas = [...comandaPonto];
      novasComandas[comandaIndex] = { ...comandaAtual, items: novosItens };

      setComandas((prev) => ({
        ...prev,
        [pontoAtual]: novasComandas,
      }));
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar quantidade");
    }
  };

  const finalizarComanda = async (orderId: number, formaPagamento: string) => {
    const order = getOrderById(orderId);
    if (!order) return;

    const comandaPonto = comandas[pontoAtual] || [];
    const comandaIndex = comandaPonto.findIndex((c) => c.orderId === orderId);
    if (comandaIndex === -1) return;

    const comandaAtual = comandaPonto[comandaIndex];
    const totalComanda = comandaAtual.items.reduce(
      (sum, i) => sum + i.price * i.qtd,
      0,
    );

    const temItens = comandaAtual.items.length > 0;

    if (temItens && !formaPagamento) {
      alert("Selecione a forma de pagamento");
      return;
    }

    const isBalcao = comandaAtual.customerName === "Balcão";

    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          payment_method: formaPagamento || null,
          total: totalComanda,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Erro ao finalizar atendimento");
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "fechado" } : o)),
      );

      const novasComandas = comandaPonto.filter((c) => c.orderId !== orderId);
      setComandas((prev) => ({
        ...prev,
        [pontoAtual]: novasComandas,
      }));

      const mensagem = !temItens
        ? `Atendimento de ${comandaAtual.customerName} cancelado (sem consumo)!`
        : `Atendimento de ${comandaAtual.customerName} finalizado!\nTotal: R$ ${totalComanda.toFixed(2)}\nPagamento: ${formaPagamento}`;

      alert(mensagem);

      if (comandaSelecionada === orderId) {
        setComandaSelecionada(
          novasComandas.length > 0 ? novasComandas[0].orderId : null,
        );
      }

      if (isBalcao && isMobile) {
        setActivePanel("pontos");
      }

      setModalFinalizar(false);
      setFormaPagamento("");
    } catch (error) {
      console.error(error);
      alert("Erro ao finalizar atendimento");
    }
  };

  const handleAddItemClick = (produto: Produto) => {
    if (!pontoAtual) {
      alert("Selecione um ponto de venda primeiro");
      return;
    }

    const comandasDoPonto = comandas[pontoAtual] || [];

    if (comandasDoPonto.length === 0) {
      alert(
        "Nenhum atendimento aberto para este ponto. Abra um atendimento primeiro!",
      );
      return;
    }

    if (comandasDoPonto.length === 1) {
      addItem(produto, comandasDoPonto[0].orderId);
    } else {
      setProdutoPendente(produto);
      setShowSelectComanda(true);
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLDivElement>,
    ponto: string,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX - 140,
    });
    setMenuPonto(menuPonto === ponto ? null : ponto);
  };

  const abrirAtendimentoRapido = async () => {
    const pontoBalcao = pontosVenda.find((p) => p.number === 0);

    if (!pontoBalcao) {
      alert("Ponto de balcão não encontrado. Contate o administrador.");
      return;
    }

    const pontoNome = `ponto-${pontoBalcao.number}`;

    const comandasBalcao = comandas[pontoNome] || [];
    const comandaAberta = comandasBalcao.find((c) => {
      const order = orders.find((o) => o.id === c.orderId);
      return order && order.status === "aberto";
    });

    if (comandaAberta) {
      setPontoAtual(pontoNome);
      setComandaSelecionada(comandaAberta.orderId);
      alert("Atendimento de balcão já está aberto! Adicione os itens.");
    } else {
      const hoje = new Date().toISOString().split("T")[0];
      await abrirComanda(pontoNome, "Balcão", hoje);
    }

    if (isMobile) {
      setActivePanel("cardapio");
    }
  };

  const abrirComandaBalcao = async (pontoNome: string) => {
    const ponto = pontosVenda.find((p) => `ponto-${p.number}` === pontoNome);
    if (!ponto) return;

    const hoje = new Date().toISOString().split("T")[0];

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          restaurant_id: 1,
          table_id: ponto.id,
          customer_name: "Balcão",
          closed_at: hoje,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Erro ao abrir atendimento");
        return;
      }

      const novaOrder = data.order || data;
      setOrders((prev) => [...prev, novaOrder]);

      setComandas((prev) => ({
        ...prev,
        [pontoNome]: [
          ...(prev[pontoNome] || []),
          { orderId: novaOrder.id, items: [], customerName: "Balcão" },
        ],
      }));

      setPontoAtual(pontoNome);
      setComandaSelecionada(novaOrder.id);

      alert("Atendimento do balcão aberto com sucesso!");

      if (isMobile) {
        setActivePanel("cardapio");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao abrir atendimento do balcão");
    }
  };

  const comandaSelecionadaItems = comandaSelecionada
    ? getComandaItems(pontoAtual, comandaSelecionada)
    : [];
  const total = comandaSelecionadaItems.reduce(
    (sum, i) => sum + i.price * i.qtd,
    0,
  );

  const comandasDoPontoAtual = comandas[pontoAtual] || [];

  const ModalSelectComanda = ({ onClose }: { onClose: () => void }) => {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            width: "90%",
            maxWidth: 400,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Selecionar Atendimento</h2>
            <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>
              Para qual atendimento deseja adicionar?
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {comandasDoPontoAtual.map((comanda) => (
              <button
                key={comanda.orderId}
                onClick={() => {
                  if (produtoPendente) {
                    addItem(produtoPendente, comanda.orderId);
                  }
                  setShowSelectComanda(false);
                  setProdutoPendente(null);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.borderColor = "#10b981";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 16 }}>
                  {comanda.customerName}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  {comanda.items?.length || 0} itens | R${" "}
                  {(comanda.items || [])
                    .reduce((sum, i) => sum + i.price * i.qtd, 0)
                    .toFixed(2)}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  const ModalFinalizarComanda = ({ onClose }: { onClose: () => void }) => {
    const comandaAtual = comandasDoPontoAtual.find(
      (c) => c.orderId === comandaSelecionada,
    );

    const totalComanda = comandaSelecionadaItems.reduce(
      (sum, i) => sum + i.price * i.qtd,
      0,
    );

    const temItens = comandaSelecionadaItems.length > 0;

    const opcoesPagamento = [
      { value: "dinheiro", label: "Dinheiro", icon: "💰" },
      { value: "pix", label: "PIX", icon: "📱" },
      { value: "credito", label: "Cartão de Crédito", icon: "💳" },
      { value: "debito", label: "Cartão de Débito", icon: "💳" },
    ];

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            width: "90%",
            maxWidth: 450,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 24 }}>
              {temItens ? "Finalizar Atendimento" : "Cancelar Atendimento"}
            </h2>
            <p style={{ margin: "8px 0 0", color: "#6b7280" }}>
              Ponto {pontoAtual?.replace("ponto-", "")} -{" "}
              {comandaAtual?.customerName}
            </p>
          </div>

          <div
            style={{
              background: "#f3f4f6",
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 14 }}>Total de itens:</span>
              <span style={{ fontWeight: "bold" }}>
                {comandaSelecionadaItems.length}
              </span>
            </div>
            {temItens && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14 }}>Valor total:</span>
                <span
                  style={{ fontSize: 18, fontWeight: "bold", color: "#059669" }}
                >
                  R$ {totalComanda.toFixed(2)}
                </span>
              </div>
            )}
            {!temItens && (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  ⚠️ Este atendimento não possui itens. Ele será apenas
                  cancelado.
                </span>
              </div>
            )}
          </div>

          {temItens && (
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Forma de pagamento:
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {opcoesPagamento.map((opcao) => (
                  <button
                    key={opcao.value}
                    onClick={() => setFormaPagamento(opcao.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border:
                        formaPagamento === opcao.value
                          ? "2px solid #10b981"
                          : "1px solid #e5e7eb",
                      background:
                        formaPagamento === opcao.value ? "#f0fdf4" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (formaPagamento !== opcao.value) {
                        e.currentTarget.style.background = "#f9fafb";
                        e.currentTarget.style.borderColor = "#10b981";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (formaPagamento !== opcao.value) {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {opcao.label}
                    </span>
                    {formaPagamento === opcao.value && (
                      <span style={{ color: "#10b981", fontSize: 18 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() =>
                comandaSelecionada &&
                finalizarComanda(comandaSelecionada, formaPagamento)
              }
              disabled={temItens && !formaPagamento}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: temItens && !formaPagamento ? "#9ca3af" : "#10b981",
                color: "#fff",
                fontWeight: "bold",
                cursor: temItens && !formaPagamento ? "not-allowed" : "pointer",
                opacity: temItens && !formaPagamento ? 0.6 : 1,
              }}
            >
              {temItens ? "Finalizar" : "Cancelar"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ComandaItemComponent = ({
    item,
    orderId,
  }: {
    item: ComandaItem;
    orderId: number;
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        marginBottom: 4,
        background: "#f9fafb",
        borderRadius: 6,
        fontSize: isMobile ? 14 : 13,
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <div
        style={{ flex: 2, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <span style={{ fontWeight: 500 }}>{item.name}</span>
        {item.product_code && (
          <span style={{ fontSize: 10, color: "#9ca3af" }}>
            Cód: {item.product_code}
          </span>
        )}
        {item.orderItemId && (
          <span style={{ fontSize: 9, color: "#6b7280" }}>
            ID: {item.orderItemId}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#6b7280", fontSize: isMobile ? 12 : 11 }}>
          R$ {item.price.toFixed(2)}
        </span>
        <span
          style={{
            fontWeight: "bold",
            minWidth: 35,
            textAlign: "center",
            fontSize: isMobile ? 14 : 13,
          }}
        >
          {item.qtd}x
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => alterarQtd(orderId, item.id, -1, item.orderItemId)}
            style={{
              width: isMobile ? 32 : 22,
              height: isMobile ? 32 : 22,
              borderRadius: 6,
              border: "none",
              background: "#fee2e2",
              color: "#dc2626",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: isMobile ? 16 : 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            -
          </button>
          <button
            onClick={() => alterarQtd(orderId, item.id, 1, item.orderItemId)}
            style={{
              width: isMobile ? 32 : 22,
              height: isMobile ? 32 : 22,
              borderRadius: 6,
              border: "none",
              background: "#d1fae5",
              color: "#059669",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: isMobile ? 16 : 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );

  const ComandaSelector = () => (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 4,
          display: "block",
        }}
      >
        Atendimento:
      </label>
      <select
        value={comandaSelecionada || ""}
        onChange={(e) => setComandaSelecionada(Number(e.target.value))}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          fontSize: 13,
          background: "#fff",
          cursor: "pointer",
        }}
      >
        <option value="">Selecione um atendimento</option>
        {comandasDoPontoAtual.map((comanda) => (
          <option key={comanda.orderId} value={comanda.orderId}>
            {comanda.customerName} - {comanda.items?.length || 0} itens
          </option>
        ))}
      </select>
    </div>
  );

  const MobileNav = () => (
    <div
      style={{
        display: "flex",
        background: "#1f2937",
        borderBottom: "1px solid #374151",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <button
        onClick={() => setActivePanel("pontos")}
        style={{
          flex: 1,
          padding: "12px",
          background: activePanel === "pontos" ? "#10b981" : "transparent",
          color: activePanel === "pontos" ? "#fff" : "#9ca3af",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Pontos
      </button>
      <button
        onClick={() => setActivePanel("cardapio")}
        style={{
          flex: 1,
          padding: "12px",
          background: activePanel === "cardapio" ? "#10b981" : "transparent",
          color: activePanel === "cardapio" ? "#fff" : "#9ca3af",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Produtos
      </button>
      <button
        onClick={() => setActivePanel("comanda")}
        style={{
          flex: 1,
          padding: "12px",
          background: activePanel === "comanda" ? "#10b981" : "transparent",
          color: activePanel === "comanda" ? "#fff" : "#9ca3af",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: 14,
          position: "relative",
        }}
      >
        Atendimento
        {comandaSelecionada && comandaSelecionadaItems.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 20,
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              width: 18,
              height: 18,
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {comandaSelecionadaItems.length}
          </span>
        )}
      </button>
    </div>
  );

  const handlePontoClick = async (ponto: string) => {
    const pontoObj = pontosVenda.find((p) => `ponto-${p.number}` === ponto);
    const isBalcao = pontoObj?.number === 0;

    if (isBalcao) {
      const comandasDoPonto = comandas[ponto] || [];
      const comandaAberta = comandasDoPonto.find((c) => {
        const order = orders.find((o) => o.id === c.orderId);
        return order && order.status === "aberto";
      });

      if (comandaAberta) {
        setPontoAtual(ponto);
        setComandaSelecionada(comandaAberta.orderId);
      } else {
        await abrirComandaBalcao(ponto);
      }
    } else {
      setPontoAtual(ponto);
      const comandasDoPonto = comandas[ponto] || [];
      setComandaSelecionada(
        comandasDoPonto.length > 0 ? comandasDoPonto[0].orderId : null,
      );
    }
  };

  const handlePontoSelectMobile = (ponto: string, comandaId: number | null) => {
    setPontoAtual(ponto);
    setComandaSelecionada(comandaId);
  };

  return (
    <>
      {isMobile ? (
        <>
          <MobileNav />
          {activePanel === "pontos" && (
            <PontoAtendimentoMobile
              comandas={comandas}
              pontoAtual={pontoAtual}
              novoPontoCodigo={novoPontoCodigo}
              onNovoPontoCodigoChange={setNovoPontoCodigo}
              onAdicionarPonto={adicionarPonto}
              onPontoSelect={handlePontoSelectMobile}
              onMenuClick={handleMenuClick}
              setActivePanel={setActivePanel}
            />
          )}
          {activePanel === "cardapio" && (
            <div
              style={{
                padding: "12px",
                background: "#FAFAFA",
                minHeight: "100vh",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 18 }}>Produtos</h2>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Ponto: {pontoAtual?.replace("ponto-", "") || "-"}
                </div>
              </div>

              <TabelaProdutosPdv
                produtos={produtos}
                categorias={categorias}
                onProductSelect={handleAddItemClick}
                disabled={comandasDoPontoAtual.length === 0}
                isMobile={true}
              />

              {comandasDoPontoAtual.length === 0 && pontoAtual && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: "#fef3c7",
                    borderRadius: 8,
                    textAlign: "center",
                    fontSize: 13,
                    color: "#92400e",
                  }}
                >
                  Abra um atendimento no menu dos pontos (⋮)
                </div>
              )}
            </div>
          )}
          {activePanel === "comanda" && (
            <div
              style={{
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                height: "100vh",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #e5e7eb",
                  background: "#fff",
                }}
              >
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  Atendimento
                </h2>
                <p
                  style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}
                >
                  Ponto {pontoAtual?.replace("ponto-", "") || "?"}
                </p>
              </div>

              <div style={{ padding: "12px" }}>
                <ComandaSelector />
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "0 12px 12px 12px",
                }}
              >
                {!comandaSelecionada ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#9ca3af",
                      padding: "40px 20px",
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <p style={{ fontSize: 14 }}>Selecione um atendimento</p>
                  </div>
                ) : comandaSelecionadaItems.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#9ca3af",
                      padding: "40px 20px",
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                    <p style={{ fontSize: 14 }}>Nenhum item</p>
                    <p style={{ fontSize: 12 }}>
                      Adicione produtos do catálogo
                    </p>
                  </div>
                ) : (
                  comandaSelecionadaItems.map((item) => (
                    <ComandaItemComponent
                      key={item.id}
                      item={item}
                      orderId={comandaSelecionada}
                    />
                  ))
                )}
              </div>

              <div
                style={{
                  padding: "16px",
                  borderTop: "1px solid #e5e7eb",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 16 }}>Total</span>
                  <span
                    style={{
                      fontWeight: "bold",
                      fontSize: 20,
                      color: "#059669",
                    }}
                  >
                    R$ {total.toFixed(2)}
                  </span>
                </div>
                <button
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: comandaSelecionada ? "#10b981" : "#9ca3af",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: "bold",
                    cursor: comandaSelecionada ? "pointer" : "not-allowed",
                    fontSize: 16,
                  }}
                  onClick={() => comandaSelecionada && setModalFinalizar(true)}
                  disabled={!comandaSelecionada}
                >
                  Finalizar Atendimento
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 320px",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <SidebarPdv
            pontos={pontosVenda}
            pontoAtual={pontoAtual}
            novoPontoCodigo={novoPontoCodigo}
            onNovoPontoCodigoChange={setNovoPontoCodigo}
            onAdicionarPonto={adicionarPonto}
            onPontoClick={handlePontoClick}
            onMenuClick={handleMenuClick}
          />

          {/* Catálogo Desktop */}
          <div
            style={{
              padding: "12px",
              background: "#FAFAFA",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <h2
              style={{
                margin: "0 0 12px 0",
                fontSize: 16,
                fontWeight: 600,
                color: "#333",
                flexShrink: 0,
              }}
            >
              Catálogo de produtos
            </h2>

            <TabelaProdutosPdv
              produtos={produtos}
              categorias={categorias}
              onProductSelect={handleAddItemClick}
              disabled={comandasDoPontoAtual.length === 0}
              isMobile={false}
            />

            {comandasDoPontoAtual.length === 0 && pontoAtual && (
              <div
                style={{
                  marginTop: 12,
                  padding: 8,
                  background: "#fef3c7",
                  borderRadius: 6,
                  textAlign: "center",
                  fontSize: 11,
                  color: "#92400e",
                  flexShrink: 0,
                }}
              >
                Abra um atendimento no menu (⋮)
              </div>
            )}
          </div>

          {/* Atendimento Desktop */}
          <div
            style={{
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              height: "100vh",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e5e7eb",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                Atendimento
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                Ponto: {pontoAtual?.replace("ponto-", "") || "?"}
              </p>
            </div>

            <div style={{ padding: "12px" }}>
              <ComandaSelector />
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 12px 12px 12px",
              }}
            >
              {!comandaSelecionada ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#9ca3af",
                    padding: "30px 12px",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  <p style={{ fontSize: 12 }}>Selecione um atendimento</p>
                </div>
              ) : comandaSelecionadaItems.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#9ca3af",
                    padding: "30px 12px",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
                  <p style={{ fontSize: 12 }}>Nenhum item</p>
                </div>
              ) : (
                comandaSelecionadaItems.map((item) => (
                  <ComandaItemComponent
                    key={item.id}
                    item={item}
                    orderId={comandaSelecionada}
                  />
                ))
              )}
            </div>

            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #e5e7eb",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>Total</span>
                <span
                  style={{ fontWeight: "bold", fontSize: 18, color: "#059669" }}
                >
                  R$ {total.toFixed(2)}
                </span>
              </div>
              <button
                style={{
                  width: "100%",
                  padding: "8px",
                  background: comandaSelecionada ? "#10b981" : "#9ca3af",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: comandaSelecionada ? "pointer" : "not-allowed",
                  fontSize: 13,
                }}
                onClick={() => comandaSelecionada && setModalFinalizar(true)}
                disabled={!comandaSelecionada}
              >
                Finalizar Atendimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {menuPonto && (
        <div
          style={{
            position: "fixed",
            background: "#fff",
            borderRadius: 6,
            padding: "4px 0",
            fontSize: isMobile ? 14 : 13,
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: isMobile ? 150 : 130,
            top: menuPosition.top,
            left: menuPosition.left,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => {
              setModalAbrirComanda(menuPonto);
              setMenuPonto(null);
            }}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Novo Atendimento
          </div>
          <div
            onClick={() => {
              removerPonto(menuPonto);
              setMenuPonto(null);
            }}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              transition: "background 0.2s",
              color: "#dc2626",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Excluir Ponto
          </div>
        </div>
      )}

      {/* Modals */}
      <ModalAbrirComanda
        showModal={!!modalAbrirComanda}
        pontoNome={modalAbrirComanda || ""}
        onClose={() => setModalAbrirComanda(null)}
        onConfirm={abrirComanda}
      />

      {showSelectComanda && (
        <ModalSelectComanda
          onClose={() => {
            setShowSelectComanda(false);
            setProdutoPendente(null);
          }}
        />
      )}
      {modalFinalizar && (
        <ModalFinalizarComanda onClose={() => setModalFinalizar(false)} />
      )}
    </>
  );
}
