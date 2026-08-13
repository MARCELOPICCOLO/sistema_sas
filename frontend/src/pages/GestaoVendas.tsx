// pages/GestaoVendas.tsx
import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SidebarVendas } from "../../components/SidebarVendas";
import TabelaProdutosPdv from "../../components/TabelaProdutosPdv";
import { DetalhesVenda } from "../../components/DetalheVenda";
import { TabelaComandas } from "../../components/TabelaComandas";
import { ModalFinalizarVenda } from "../../components/ModalFinalizarVenda";
import { ModalAbrirComanda } from "../../components/ModalAbrirComanda";
import {
  faArrowLeft,
  faPlus,
  faTimes,
  faCashRegister,
  faBars,
  faBoxes,
  faClipboardList,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = import.meta.env.VITE_API_URL;

interface Product {
  id: number;
  name: string;
  product_code: string;
  price: number;
  quantity: number;
  category_id: number;
  category?: {
    id: number;
    name: string;
  };
  active: boolean;
}

interface Category {
  id: number;
  name: string;
  restaurant_id: number;
}

interface PontoVenda {
  id: number;
  number: number;
  restaurant_id: number;
}

interface VendaItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: {
    name: string;
    product_code?: string;
  };
}

interface Venda {
  id: number;
  order_number?: string;
  customer_name: string;
  status: string;
  total?: number;
  items?: VendaItem[];
  created_at?: string;
  closed_at?: string;
  table_id?: number;
}

interface GestaoVendasProps {
  setTela?: (tela: string) => void;
}

export default function GestaoVendas({ setTela }: GestaoVendasProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"produtos" | "comandas">("produtos");

  // Estados para produtos
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);

  // Estados para vendas
  const [pontosVenda, setPontosVenda] = useState<PontoVenda[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [showModalNovaVenda, setShowModalNovaVenda] = useState(false);
  const [showModalFecharVenda, setShowModalFecharVenda] = useState(false);

  // 🔥 TOAST
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
          zIndex: 10000,
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

  // Detectar mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Buscar produtos
  const fetchProdutos = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      console.log(token);

      if (!token) {
        console.error("JWT não encontrado.");
        return;
      }

      const response = await fetch(`${API_URL}/products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar produtos: ${response.status}`);
      }

      const data = await response.json();

      const produtosFormatados = data.map((p: any) => ({
        ...p,
        price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
        quantity:
          typeof p.quantity === "number" ? p.quantity : Number(p.quantity) || 0,
      }));

      setProdutos(produtosFormatados);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  }, []);

  // Buscar categorias
  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.error("JWT não encontrado.");
        return;
      }

      const response = await fetch(`${API_URL}/categories`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar categorias: ${response.status}`);
      }

      const data = await response.json();

      setCategorias(data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  // Buscar vendas
  const fetchVendas = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.error("JWT não encontrado.");
        return;
      }

      const response = await fetch(`${API_URL}/orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar vendas: ${response.status}`);
      }

      const data = await response.json();

      const vendasComTotal = data.map((venda: any) => ({
        ...venda,
        total:
          venda.items?.reduce(
            (sum: number, item: any) =>
              sum + Number(item.price) * Number(item.quantity),
            0,
          ) || 0,
      }));

      setVendas(vendasComTotal);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
    fetchCategorias();
    fetchVendas();
  }, [fetchProdutos, fetchVendas]);

  // Abrir nova venda
  const abrirVenda = async (
    salesPointId: number,
    nomeCliente: string,
    dataComanda: string,
  ) => {
    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.error("JWT não encontrado.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sales_point_id: salesPointId,
          order_date: dataComanda,
          customer_name: nomeCliente,
          status: "aberto",
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        showToast(error.message || "Erro ao abrir comanda", "error");

        return;
      }

      const data = await response.json();

      const novaVenda = data.order || data;

      await fetchVendas();

      setVendaSelecionada(novaVenda);
      setShowModalNovaVenda(false);

      const mensagem =
        nomeCliente === "Venda Rápida"
          ? `Comanda aberta com sucesso!`
          : `Comanda - ${nomeCliente} aberta com sucesso!`;

      showToast(mensagem, "success");
    } catch (error) {
      console.error("Erro ao abrir comanda:", error);

      showToast("Erro ao conectar com o servidor", "error");
    }
  };

  // Adicionar item à venda
  const addItemToVenda = async (
    produto: Product,
    vendaId: number,
    quantidade: number = 1,
    precoPersonalizado?: number,
  ) => {
    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.error("JWT não encontrado.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const precoFinal = precoPersonalizado ?? produto.price;

      // Adicionar item à venda
      const response = await fetch(`${API_URL}/orders/${vendaId}/items`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          product_id: produto.id,
          quantity: quantidade,
          price: precoFinal,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        showToast(error.message || "Erro ao adicionar item", "error");

        return;
      }

      await fetchVendas();

      // Buscar a venda atualizada
      const updatedResponse = await fetch(`${API_URL}/orders/${vendaId}`, {
        method: "GET",
        headers,
      });

      if (!updatedResponse.ok) {
        throw new Error(
          `Erro ao buscar venda atualizada: ${updatedResponse.status}`,
        );
      }

      const updatedVenda = await updatedResponse.json();

      if (vendaSelecionada?.id === vendaId) {
        setVendaSelecionada({
          ...updatedVenda,
          total:
            updatedVenda.items?.reduce(
              (sum: number, item: any) =>
                sum + Number(item.price) * Number(item.quantity),
              0,
            ) || 0,
        });
      }

      const mensagem = `${quantidade}x ${produto.name} adicionado${
        precoPersonalizado
          ? ` com preço especial de ${formatCurrency(precoPersonalizado)}`
          : ""
      }!`;

      showToast(mensagem, "success");
    } catch (error) {
      console.error("Erro ao adicionar item:", error);

      showToast("Erro ao conectar com o servidor", "error");
    }
  };

  // Remover item da venda
  const removerItem = async (vendaId: number, itemId: number) => {
    if (!confirm("Remover este item da venda?")) return;

    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.error("JWT não encontrado.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Remover item da venda
      const response = await fetch(`${API_URL}/order-items/${itemId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);

        showToast(error?.message || "Erro ao remover item", "error");

        return;
      }

      await fetchVendas();

      // Buscar a venda atualizada
      const updatedResponse = await fetch(`${API_URL}/orders/${vendaId}`, {
        method: "GET",
        headers,
      });

      if (!updatedResponse.ok) {
        throw new Error(
          `Erro ao buscar venda atualizada: ${updatedResponse.status}`,
        );
      }

      const updatedVenda = await updatedResponse.json();

      if (vendaSelecionada?.id === vendaId) {
        setVendaSelecionada({
          ...updatedVenda,
          total:
            updatedVenda.items?.reduce(
              (sum: number, item: any) =>
                sum + Number(item.price) * Number(item.quantity),
              0,
            ) || 0,
        });
      }

      showToast("Item removido!", "success");
    } catch (error) {
      console.error("Erro ao remover item:", error);

      showToast("Erro ao conectar com o servidor", "error");
    }
  };

  const formatCurrency = (value: any): string => {
    const num = typeof value === "number" ? value : Number(value) || 0;
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  const calcularTotal = (items?: VendaItem[]) => {
    if (!items) return 0;
    return items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );
  };

  // Cancelar venda
  const cancelarVenda = async (vendaId: number) => {
    try {
      const response = await fetch(`${API_URL}/orders/${vendaId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.message || "Erro ao cancelar venda", "error");
        return;
      }

      if (vendaSelecionada?.id === vendaId) {
        setVendaSelecionada(null);
      }
      await fetchVendas();
      showToast("Venda cancelada com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao cancelar venda:", error);
      showToast("Erro ao conectar com o servidor", "error");
    }
  };

  // Marcar venda como não paga
  const marcarNaoPaga = async (vendaId: number) => {
    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.error("JWT não encontrado.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Marcar venda como não paga
      const response = await fetch(`${API_URL}/orders/${vendaId}/close`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          payment_method: "pendente",
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);

        showToast(
          error?.message || "Erro ao marcar venda como não paga",
          "error",
        );

        return;
      }

      await fetchVendas();

      // Buscar venda atualizada
      const updatedResponse = await fetch(`${API_URL}/orders/${vendaId}`, {
        method: "GET",
        headers,
      });

      if (!updatedResponse.ok) {
        throw new Error(
          `Erro ao buscar venda atualizada: ${updatedResponse.status}`,
        );
      }

      const updatedVenda = await updatedResponse.json();

      setVendaSelecionada(updatedVenda);

      showToast("Venda marcada como não paga!", "success");
    } catch (error) {
      console.error("Erro ao marcar venda:", error);

      showToast("Erro ao conectar com o servidor", "error");
    }
  };

  // Finalizar venda
  const finalizarVenda = async (
    vendaId: number,
    formaPagamento: string,
    valorRecebido?: number,
  ) => {
    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.error("JWT não encontrado.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const response = await fetch(`${API_URL}/orders/${vendaId}/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_method: formaPagamento,
          ...(valorRecebido !== undefined && {
            valor_recebido: valorRecebido,
          }),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);

        showToast(error?.message || "Erro ao finalizar venda", "error");

        return;
      }

      setVendaSelecionada(null);

      await fetchVendas();

      setShowModalFecharVenda(false);

      showToast("Venda finalizada com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);

      showToast("Erro ao conectar com o servidor", "error");
    }
  };

  const vendasAbertas = vendas.filter((v) => v.status === "aberto");

  // Versão Desktop
  if (!isMobile) {
    return (
      <>
        <ToastComponent />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 380px",
            height: "100%",
            background: "#f8fafc",
          }}
        >
          <SidebarVendas
            abaAtiva={abaAtiva}
            onAbaChange={setAbaAtiva}
            onNovaVenda={() => setShowModalNovaVenda(true)}
            onVoltarDashboard={() => setTela && setTela("dashboard")}
          />

          <div
            style={{
              padding: "20px",
              overflowY: "auto",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {abaAtiva === "produtos" ? (
              <TabelaProdutosPdv
                produtos={produtos}
                categorias={categorias}
                pontosVenda={pontosVenda}
                onProductSelect={(produto, vendaId, precoPersonalizado) =>
                  addItemToVenda(produto, vendaId, 1, precoPersonalizado)
                }
                vendasAbertas={vendasAbertas}
                disabled={false}
                isMobile={false}
              />
            ) : (
              <TabelaComandas
                vendas={vendas}
                pontosVenda={pontosVenda}
                vendaSelecionada={vendaSelecionada}
                onVendaClick={setVendaSelecionada}
                isMobile={false}
                formatCurrency={formatCurrency}
              />
            )}
          </div>

          <DetalhesVenda
            venda={vendaSelecionada}
            pontosVenda={pontosVenda}
            onRemoverItem={removerItem}
            onFinalizarVenda={() => setShowModalFecharVenda(true)}
            onCancelarVenda={cancelarVenda}
            onMarcarNaoPaga={marcarNaoPaga}
            formatCurrency={formatCurrency}
            isMobile={false}
          />
        </div>

        <ModalAbrirComanda
          showModal={showModalNovaVenda}
          onClose={() => setShowModalNovaVenda(false)}
          onConfirm={abrirVenda}
        />

        {showModalFecharVenda && (
          <ModalFinalizarVenda
            isOpen={showModalFecharVenda}
            venda={vendaSelecionada}
            onClose={() => setShowModalFecharVenda(false)}
            onConfirm={async (
              formaPagamento,
              valorRecebido,
              comandaNaoPaga,
            ) => {
              if (!vendaSelecionada) return;

              if (comandaNaoPaga) {
                await marcarNaoPaga(vendaSelecionada.id);
              } else {
                await finalizarVenda(
                  vendaSelecionada.id,
                  formaPagamento,
                  valorRecebido,
                );
              }
            }}
            formatCurrency={formatCurrency}
          />
        )}
      </>
    );
  }

  // Versão Mobile
  return (
    <>
      <ToastComponent />
      <div
        style={{
          background: "#f8fafc",
          minHeight: "100vh",
          paddingBottom:
            vendaSelecionada && vendaSelecionada.status === "aberto"
              ? "80px"
              : "0",
        }}
      >
        {/* Header Mobile */}
        <div
          style={{
            padding: "16px",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e5e7eb",
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
                icon={faCashRegister}
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
              Gestão de Vendas
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

        {/* Botão Voltar ao Dashboard */}
        <div style={{ padding: "12px 16px" }}>
          <button
            onClick={() => setTela && setTela("dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "10px 16px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              color: "#374151",
              fontSize: 14,
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Voltar ao Dashboard
          </button>
        </div>

        {/* Abas Mobile */}
        <div
          style={{
            padding: "0 16px",
            display: "flex",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => setAbaAtiva("produtos")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              border:
                abaAtiva === "produtos"
                  ? "1px solid #10b981"
                  : "1px solid #e5e7eb",
              background: abaAtiva === "produtos" ? "#10b981" : "#fff",
              color: abaAtiva === "produtos" ? "#fff" : "#374151",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <FontAwesomeIcon icon={faBoxes} /> Produtos
          </button>
          <button
            onClick={() => setAbaAtiva("comandas")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              border:
                abaAtiva === "comandas"
                  ? "1px solid #10b981"
                  : "1px solid #e5e7eb",
              background: abaAtiva === "comandas" ? "#10b981" : "#fff",
              color: abaAtiva === "comandas" ? "#fff" : "#374151",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <FontAwesomeIcon icon={faClipboardList} /> Comandas
          </button>
        </div>

        {/* Menu Mobile */}
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
                  setShowModalNovaVenda(true);
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
                <FontAwesomeIcon icon={faPlus} /> <span>Nova Venda</span>
              </button>
            </div>
          </>
        )}

        {/* Conteúdo Mobile */}
        <div style={{ padding: "16px" }}>
          {abaAtiva === "produtos" ? (
            <>
              <TabelaProdutosPdv
                produtos={produtos}
                categorias={categorias}
                pontosVenda={pontosVenda}
                onProductSelect={(produto, vendaId, precoPersonalizado) =>
                  addItemToVenda(produto, vendaId, 1, precoPersonalizado)
                }
                vendasAbertas={vendasAbertas}
                disabled={false}
                isMobile={true}
              />
              {vendaSelecionada && vendaSelecionada.status === "aberto" && (
                <div
                  style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "#fff",
                    borderTop: "1px solid #e5e7eb",
                    padding: "16px",
                    boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span>{vendaSelecionada.customer_name}</span>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#059669",
                        fontSize: 18,
                      }}
                    >
                      {formatCurrency(calcularTotal(vendaSelecionada.items))}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowModalFecharVenda(true)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Finalizar Venda
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <TabelaComandas
                vendas={vendas}
                pontosVenda={pontosVenda}
                vendaSelecionada={vendaSelecionada}
                onVendaClick={setVendaSelecionada}
                isMobile={true}
                formatCurrency={formatCurrency}
              />
              <DetalhesVenda
                venda={vendaSelecionada}
                pontosVenda={pontosVenda}
                onRemoverItem={removerItem}
                onFinalizarVenda={() => setShowModalFecharVenda(true)}
                onCancelarVenda={cancelarVenda}
                onMarcarNaoPaga={marcarNaoPaga}
                formatCurrency={formatCurrency}
                isMobile={true}
              />
            </>
          )}
        </div>

        <ModalAbrirComanda
          showModal={showModalNovaVenda}
          onClose={() => setShowModalNovaVenda(false)}
          onConfirm={abrirVenda}
        />

        {showModalFecharVenda && (
          <ModalFinalizarVenda
            isOpen={showModalFecharVenda}
            venda={vendaSelecionada}
            onClose={() => setShowModalFecharVenda(false)}
            onConfirm={async (
              formaPagamento,
              valorRecebido,
              comandaNaoPaga,
            ) => {
              if (!vendaSelecionada) return;

              if (comandaNaoPaga) {
                await marcarNaoPaga(vendaSelecionada.id);
              } else {
                await finalizarVenda(
                  vendaSelecionada.id,
                  formaPagamento,
                  valorRecebido,
                );
              }
            }}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </>
  );
}
