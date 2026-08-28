// pages/NovaVenda.tsx

import React, { useEffect, useMemo, useState, useRef } from "react";
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
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { ModalFinalizarVenda } from "../components/ModalFinalizarVenda";

const API_URL = import.meta.env.VITE_API_URL;

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
  id?: number;
  quantidade_original?: number;
  modificado?: boolean;
}

export interface Comanda {
  id: number;
  numero: number;
  cliente: string;
  mesa: number | null;
  status:
    | "aberta"
    | "fechado"
    | "cancelada"
    | "cancelado"
    | "finalizado"
    | "pendente";
  itens: ItemCarrinho[];
  total: number;
}

interface NovaVendaProps {
  comanda: Comanda;
  onVoltar?: () => void;
  onAtualizarComanda?: (dados: Partial<Comanda>) => void;
  onFinalizar?: () => void;
}

interface VendaModal {
  id: number;
  customer_name: string;
  status: string;
  total: number;
  table_id?: number;
  items: {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    product?: {
      name: string;
      product_code?: string;
    };
  }[];
}

interface ProductApi {
  id: number;
  name: string;
  product_code: string | null;
  description: string | null;
  price: number | string;
  quantity: number | null;
  category: {
    id: number;
    name: string;
  } | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// ============================================================
// 🔧 FUNÇÃO PARA EXIBIR NOME DO PONTO DE VENDA
// ============================================================

const getNomePontoVenda = (numero: number | null): string => {
  if (numero === null) return "Sem ponto";
  return `Ponto ${numero}`;
};

export default function NovaVenda({
  comanda,
  onVoltar,
  onAtualizarComanda,
  onFinalizar,
}: NovaVendaProps) {
  // ============================================================
  // 📦 ESTADOS DOS PRODUTOS
  // ============================================================

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState("");

  // ============================================================
  // 📦 ESTADOS EXISTENTES
  // ============================================================

  const [categoriaSelecionada, setCategoriaSelecionada] = useState(0);
  const [busca, setBusca] = useState("");

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>(() => {
    return (comanda.itens || []).map((item) => ({
      ...item,
      quantidade_original: item.quantidade,
      modificado: false,
    }));
  });

  const [cliente, setCliente] = useState(comanda.cliente || "Consumidor");
  const [pontoVenda, setPontoVenda] = useState<number | null>(comanda.mesa);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvandoItens, setSalvandoItens] = useState(false);
  const [modalFinalizarAberto, setModalFinalizarAberto] = useState(false);

  const [modalAdicionarItemAberto, setModalAdicionarItemAberto] =
    useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(
    null,
  );
  const [quantidadeItem, setQuantidadeItem] = useState(1);
  const [precoItem, setPrecoItem] = useState(0);
  const [salvandoItem, setSalvandoItem] = useState(false);

  // ============================================================
  // 🔒 REFS PARA PREVENIR CHAMADAS DUPLAS
  // ============================================================

  const isRemovingRef = useRef<{ [key: number]: boolean }>({});
  const isProcessingRef = useRef<{ [key: number]: boolean }>({});

  // ============================================================
  // 🔒 VERIFICA SE A COMANDA É SOMENTE LEITURA
  // ============================================================

  const isComandaFinalizada = useMemo(() => {
    return ["fechado", "cancelada", "cancelado", "finalizado"].includes(
      comanda.status,
    );
  }, [comanda.status]);

  // ============================================================
  // 🏷️ TEXTO DO STATUS
  // ============================================================

  const textoStatusComanda = useMemo(() => {
    switch (comanda.status) {
      case "fechado":
        return "Fechada";

      case "cancelada":
      case "cancelado":
        return "Cancelada";

      case "finalizado":
        return "Finalizada";

      case "pendente":
        return "Pendente";

      case "aberta":
      default:
        return "Aberta";
    }
  }, [comanda.status]);

  // ============================================================
  // 🔄 SINCRONIZA O CARRINHO QUANDO A COMANDA MUDAR
  // ============================================================

  useEffect(() => {
    const novosItens = (comanda.itens || []).map((item) => ({
      ...item,
      quantidade_original: item.quantidade,
      modificado: false,
    }));

    setCarrinho(novosItens);
    setCliente(comanda.cliente || "Consumidor");
    setPontoVenda(comanda.mesa);
    setModoEdicao(false);
  }, [comanda.id, comanda.itens, comanda.cliente, comanda.mesa]);

  // ============================================================
  // 🔄 CARREGAR PRODUTOS DA API
  // ============================================================

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setLoadingProdutos(true);
        setErroProdutos("");

        const token = localStorage.getItem("auth_token");

        const response = await axios.get(`${API_URL}/products`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        const data: ProductApi[] = Array.isArray(response.data)
          ? response.data
          : [];

        if (data.length === 0) {
          setProdutos([]);
          setCategorias([{ id: 0, name: "Todos" }]);
          return;
        }

        const categoryMap = new Map<number, string>();

        data.forEach((product) => {
          if (product.category) {
            categoryMap.set(product.category.id, product.category.name);
          }
        });

        const categoriasApi: Categoria[] = Array.from(
          categoryMap.entries(),
        ).map(([id, name]) => ({
          id,
          name,
        }));

        categoriasApi.sort((a, b) => a.name.localeCompare(b.name));

        setCategorias([{ id: 0, name: "Todos" }, ...categoriasApi]);

        const produtosNormalizados: Produto[] = data.map((product) => ({
          id: product.id,
          name: product.name,
          product_code: product.product_code ?? undefined,
          price: Number(product.price),
          category_id: product.category?.id ?? 0,
        }));

        setProdutos(produtosNormalizados);
      } catch (error: any) {
        console.error("Erro ao carregar produtos:", error);

        setErroProdutos(
          error?.response?.data?.message ||
            "Não foi possível carregar os produtos.",
        );

        setProdutos([]);
        setCategorias([{ id: 0, name: "Todos" }]);
      } finally {
        setLoadingProdutos(false);
      }
    };

    carregarProdutos();
  }, []);

  // ============================================================
  // 🔍 FILTRO DE PRODUTOS
  // ============================================================

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      const pertenceCategoria =
        categoriaSelecionada === 0 ||
        produto.category_id === categoriaSelecionada;

      const correspondeBusca =
        !termo ||
        produto.name.toLowerCase().includes(termo) ||
        produto.product_code?.toLowerCase().includes(termo);

      return pertenceCategoria && correspondeBusca;
    });
  }, [busca, categoriaSelecionada, produtos]);

  // ============================================================
  // 🧮 CÁLCULOS
  // ============================================================

  const totalItens = useMemo(() => {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
  }, [carrinho]);

  const totalVenda = useMemo(() => {
    return carrinho.reduce(
      (total, item) => total + item.produto.price * item.quantidade,
      0,
    );
  }, [carrinho]);

  const temItensModificados = useMemo(() => {
    return carrinho.some((item) => item.modificado === true);
  }, [carrinho]);

  const itensModificados = useMemo(() => {
    return carrinho.filter((item) => item.modificado === true);
  }, [carrinho]);

  // ============================================================
  // 💰 DADOS PARA O MODAL
  // ============================================================

  const vendaParaModal = useMemo<VendaModal>(() => {
    return {
      id: comanda.id,
      customer_name: cliente || "Consumidor",
      status: comanda.status,
      total: totalVenda,
      table_id: pontoVenda ?? undefined,
      items: carrinho.map((item, index) => ({
        id: item.id || index + 1,
        product_id: item.produto.id,
        quantity: item.quantidade,
        price: item.produto.price,
        product: {
          name: item.produto.name,
          product_code: item.produto.product_code,
        },
      })),
    };
  }, [comanda.id, comanda.status, cliente, pontoVenda, carrinho, totalVenda]);

  // ============================================================
  // ❌ REMOVER PRODUTO
  // ============================================================

  const removerProduto = async (produtoId: number) => {
    if (isComandaFinalizada) {
      console.warn("Comanda somente leitura.");
      return;
    }

    if (isRemovingRef.current[produtoId]) {
      return;
    }

    const itemIndex = carrinho.findIndex((i) => i.produto.id === produtoId);

    if (itemIndex === -1) {
      return;
    }

    const item = carrinho[itemIndex];

    isRemovingRef.current[produtoId] = true;

    try {
      const itemId = item.id;

      if (itemId) {
        try {
          const token = localStorage.getItem("auth_token");

          await axios.delete(`${API_URL}/order-items/${itemId}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });

          const novosItens = [...carrinho];

          novosItens.splice(itemIndex, 1);

          const novoTotal = novosItens.reduce(
            (sum, i) => sum + i.produto.price * i.quantidade,
            0,
          );

          await axios.put(
            `${API_URL}/orders/${comanda.id}`,
            {
              total: novoTotal,
            },
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            },
          );

          setCarrinho(novosItens);

          onAtualizarComanda?.({
            itens: novosItens,
            total: novoTotal,
          });

          return;
        } catch (error: any) {
          if (error?.response?.status === 404) {
            const novosItens = [...carrinho];

            novosItens.splice(itemIndex, 1);

            const novoTotal = novosItens.reduce(
              (sum, i) => sum + i.produto.price * i.quantidade,
              0,
            );

            setCarrinho(novosItens);

            onAtualizarComanda?.({
              itens: novosItens,
              total: novoTotal,
            });

            return;
          }

          console.error("Erro ao remover item:", error);

          alert(
            `Erro ao remover item do banco.\n${
              error?.response?.data?.message || error.message
            }`,
          );

          return;
        }
      }

      const novosItens = [...carrinho];

      novosItens.splice(itemIndex, 1);

      const novoTotal = novosItens.reduce(
        (sum, i) => sum + i.produto.price * i.quantidade,
        0,
      );

      setCarrinho(novosItens);

      onAtualizarComanda?.({
        itens: novosItens,
        total: novoTotal,
      });
    } finally {
      isRemovingRef.current[produtoId] = false;
    }
  };

  // ============================================================
  // 🗑️ LIMPAR CARRINHO
  // ============================================================

  const limparCarrinho = async () => {
    if (isComandaFinalizada) {
      return;
    }

    if (
      !window.confirm(
        "Tem certeza que deseja remover todos os itens da comanda?",
      )
    ) {
      return;
    }

    const itensComId = carrinho.filter((item) => item.id);

    if (itensComId.length > 0) {
      try {
        const token = localStorage.getItem("auth_token");

        for (const item of itensComId) {
          if (!item.id) continue;

          await axios.delete(`${API_URL}/order-items/${item.id}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });
        }

        await axios.put(
          `${API_URL}/orders/${comanda.id}`,
          {
            total: 0,
          },
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        );
      } catch (error: any) {
        console.error("Erro ao limpar carrinho:", error);

        alert(
          `Erro ao remover alguns itens do banco.\n${
            error?.response?.data?.message || error.message
          }`,
        );
      }
    }

    setCarrinho([]);

    onAtualizarComanda?.({
      itens: [],
      total: 0,
    });
  };

  // ============================================================
  // ➕ AUMENTAR QUANTIDADE
  // ============================================================

  const aumentarQuantidade = (produtoId: number) => {
    if (isComandaFinalizada) {
      return;
    }

    if (isProcessingRef.current[produtoId]) {
      return;
    }

    isProcessingRef.current[produtoId] = true;

    setCarrinho((prev) =>
      prev.map((item) => {
        if (item.produto.id === produtoId) {
          const novaQuantidade = item.quantidade + 1;

          return {
            ...item,
            quantidade: novaQuantidade,
            modificado: novaQuantidade !== item.quantidade_original,
          };
        }

        return item;
      }),
    );

    setTimeout(() => {
      isProcessingRef.current[produtoId] = false;
    }, 100);
  };

  // ============================================================
  // ➖ DIMINUIR QUANTIDADE
  // ============================================================

  const diminuirQuantidade = (produtoId: number) => {
    if (isComandaFinalizada) {
      return;
    }

    if (isProcessingRef.current[produtoId]) {
      return;
    }

    const itemExistente = carrinho.find((i) => i.produto.id === produtoId);

    if (!itemExistente) {
      return;
    }

    isProcessingRef.current[produtoId] = true;

    if (itemExistente.quantidade <= 1) {
      removerProduto(produtoId).finally(() => {
        isProcessingRef.current[produtoId] = false;
      });

      return;
    }

    setCarrinho((prev) =>
      prev.map((item) => {
        if (item.produto.id === produtoId) {
          const novaQuantidade = item.quantidade - 1;

          return {
            ...item,
            quantidade: novaQuantidade,
            modificado: novaQuantidade !== item.quantidade_original,
          };
        }

        return item;
      }),
    );

    setTimeout(() => {
      isProcessingRef.current[produtoId] = false;
    }, 100);
  };

  // ============================================================
  // 💾 SALVAR ALTERAÇÕES DOS ITENS
  // ============================================================

  const salvarAlteracoesItens = async () => {
    if (isComandaFinalizada) {
      return;
    }

    const itensParaSalvar = carrinho.filter(
      (item) => item.modificado === true && item.id,
    );

    if (itensParaSalvar.length === 0) {
      setCarrinho((prev) =>
        prev.map((item) => ({
          ...item,
          quantidade_original: item.quantidade,
          modificado: false,
        })),
      );

      return;
    }

    try {
      setSalvandoItens(true);

      const token = localStorage.getItem("auth_token");

      for (const item of itensParaSalvar) {
        if (!item.id) continue;

        await axios.put(
          `${API_URL}/order-items/${item.id}`,
          {
            quantity: item.quantidade,
          },
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        );
      }

      const novoTotal = carrinho.reduce(
        (sum, item) => sum + item.produto.price * item.quantidade,
        0,
      );

      await axios.put(
        `${API_URL}/orders/${comanda.id}`,
        {
          total: novoTotal,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      const itensAtualizados = carrinho.map((item) => ({
        ...item,
        quantidade_original: item.quantidade,
        modificado: false,
      }));

      setCarrinho(itensAtualizados);

      onAtualizarComanda?.({
        itens: itensAtualizados,
        total: novoTotal,
      });
    } catch (error: any) {
      console.error("Erro ao salvar alterações:", error);

      alert(
        error?.response?.data?.message ||
          "Não foi possível salvar as alterações.",
      );
    } finally {
      setSalvandoItens(false);
    }
  };

  // ============================================================
  // ➕ ADICIONAR PRODUTO
  // ============================================================

  const adicionarProduto = (produto: Produto) => {
    if (isComandaFinalizada) {
      return;
    }

    const existente = carrinho.find((item) => item.produto.id === produto.id);

    if (existente) {
      alert(
        "Este produto já está na comanda. Altere a quantidade pelos controles do carrinho.",
      );

      return;
    }

    setProdutoSelecionado(produto);

    setQuantidadeItem(1);
    setPrecoItem(Number(produto.price));

    setModalAdicionarItemAberto(true);
  };

  const fecharModalAdicionarItem = () => {
    if (salvandoItem) return;

    setModalAdicionarItemAberto(false);

    setProdutoSelecionado(null);

    setQuantidadeItem(1);
    setPrecoItem(0);
  };

  // ============================================================
  // 💾 SALVAR NOVO ITEM
  // ============================================================

  const salvarItem = async () => {
    if (!produtoSelecionado || isComandaFinalizada) {
      return;
    }

    const quantidade = Number(quantidadeItem);

    const preco = Number(precoItem);

    if (!Number.isInteger(quantidade) || quantidade < 1) {
      alert("Informe uma quantidade válida.");

      return;
    }

    if (!Number.isFinite(preco) || preco < 0) {
      alert("Informe um valor válido para o item.");

      return;
    }

    try {
      setSalvandoItem(true);

      const token = localStorage.getItem("auth_token");

      const response = await axios.post(
        `${API_URL}/order-items/order/${comanda.id}/item`,
        {
          product_id: produtoSelecionado.id,
          quantity: quantidade,
          price: preco,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      const itemCriado = response.data?.item || response.data;

      const itemId = itemCriado?.id;

      const novoItem: ItemCarrinho = {
        produto: {
          ...produtoSelecionado,
          price: preco,
        },
        quantidade,
        id: itemId,
        quantidade_original: quantidade,
        modificado: false,
      };

      const novosItens = [...carrinho, novoItem];

      const novoTotal = novosItens.reduce(
        (total, item) => total + item.produto.price * item.quantidade,
        0,
      );

      setCarrinho(novosItens);

      onAtualizarComanda?.({
        itens: novosItens,
        total: novoTotal,
      });

      await axios.put(
        `${API_URL}/orders/${comanda.id}`,
        {
          total: novoTotal,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      setModalAdicionarItemAberto(false);

      setProdutoSelecionado(null);

      setQuantidadeItem(1);
      setPrecoItem(0);
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);

      alert(
        error?.response?.data?.message || "Não foi possível adicionar o item.",
      );
    } finally {
      setSalvandoItem(false);
    }
  };

  // ============================================================
  // ✏️ ALTERAR CLIENTE
  // ============================================================

  const alterarCliente = (valor: string) => {
    if (isComandaFinalizada) {
      return;
    }

    setCliente(valor);

    onAtualizarComanda?.({
      cliente: valor.trim() || "Consumidor",
    });
  };

  // ============================================================
  // ✏️ ALTERAR PONTO DE VENDA
  // ============================================================

  const alterarPontoVenda = (valor: string) => {
    if (isComandaFinalizada) {
      return;
    }

    const mesa = valor === "" ? null : Number(valor);

    setPontoVenda(mesa);

    onAtualizarComanda?.({
      mesa,
    });
  };

  // ============================================================
  // ✏️ ATIVAR EDIÇÃO
  // ============================================================

  const ativarEdicao = () => {
    if (isComandaFinalizada) {
      return;
    }

    setModoEdicao(true);
  };

  // ============================================================
  // ❌ CANCELAR EDIÇÃO
  // ============================================================

  const cancelarEdicao = () => {
    setCliente(comanda.cliente || "Consumidor");

    setPontoVenda(comanda.mesa);

    setModoEdicao(false);
  };

  // ============================================================
  // 💾 SALVAR ALTERAÇÕES DA COMANDA
  // ============================================================

  const salvarAlteracoesComanda = async () => {
    if (isComandaFinalizada) {
      return;
    }

    try {
      setSalvando(true);

      const token = localStorage.getItem("auth_token");

      const clienteAtualizado = cliente.trim() || "Consumidor";

      const response = await axios.put(
        `${API_URL}/orders/${comanda.id}`,
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

      alert(error?.response?.data?.message || "Não foi possível atualizar.");
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // 💰 ABRIR MODAL FINALIZAR
  // ============================================================

  const abrirModalFinalizar = () => {
    if (isComandaFinalizada) {
      return;
    }

    if (carrinho.length === 0) {
      alert("Adicione pelo menos um produto à comanda.");

      return;
    }

    if (temItensModificados) {
      if (
        !window.confirm(
          "Existem alterações não salvas no carrinho. Deseja salvar antes de finalizar?",
        )
      ) {
        return;
      }

      salvarAlteracoesItens();
    }

    setModalFinalizarAberto(true);
  };

  const fecharModalFinalizar = () => {
    if (salvando) return;

    setModalFinalizarAberto(false);
  };

  // ============================================================
  // 💰 CONFIRMAR FINALIZAÇÃO
  // ============================================================

  const confirmarFinalizacao = async (
    formaPagamento: string,
    valorRecebido?: number,
    comandaNaoPaga?: boolean,
  ) => {
    if (carrinho.length === 0 || isComandaFinalizada) {
      return;
    }

    try {
      setSalvando(true);

      if (temItensModificados) {
        await salvarAlteracoesItens();
      }

      const token = localStorage.getItem("auth_token");

      const clienteAtualizado = cliente.trim() || "Consumidor";

      const statusFinal = comandaNaoPaga ? "pendente" : "fechado";

      await axios.post(
        `${API_URL}/orders/${comanda.id}/close`,
        {
          customer_name: clienteAtualizado,
          total: totalVenda,
          status: statusFinal,
          payment_method: formaPagamento,
          payment_received: valorRecebido ?? null,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      setModalFinalizarAberto(false);

      onAtualizarComanda?.({
        itens: carrinho,
        total: totalVenda,
        cliente: clienteAtualizado,
        mesa: pontoVenda,
        status: comandaNaoPaga ? "pendente" : "fechado",
      });

      onFinalizar?.();
    } catch (error: any) {
      console.error("Erro ao finalizar venda:", error);

      alert(error?.response?.data?.message || "Não foi possível finalizar.");
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // ↩️ VOLTAR
  // ============================================================

  const voltar = () => {
    if (temItensModificados && !isComandaFinalizada) {
      if (
        !window.confirm(
          "Existem alterações não salvas. Deseja voltar sem salvar?",
        )
      ) {
        return;
      }
    }

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

  // ============================================================
  // 🎨 RENDER
  // ============================================================

  return (
    <div
      className="nova-venda-page"
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
        {/* ============================================================
            HEADER
        ============================================================ */}

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
                      background: isComandaFinalizada ? "#f3f4f6" : "#ecfdf5",
                      color: isComandaFinalizada ? "#6b7280" : "#047857",
                      fontSize: 10,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {textoStatusComanda}
                  </span>

                  {temItensModificados &&
                    carrinho.length > 0 &&
                    !isComandaFinalizada && (
                      <span
                        style={{
                          padding: "5px 9px",
                          borderRadius: 20,
                          background: "#fef3c7",
                          color: "#d97706",
                          fontSize: 10,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {itensModificados.length} alterado(s)
                      </span>
                    )}
                </div>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: 14,
                    color: "#6b7280",
                  }}
                >
                  {isComandaFinalizada
                    ? "Comanda finalizada - Visualização apenas"
                    : "Adicione produtos à comanda"}
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
              {temItensModificados &&
                carrinho.length > 0 &&
                !isComandaFinalizada && (
                  <button
                    type="button"
                    onClick={salvarAlteracoesItens}
                    disabled={salvandoItens}
                    style={{
                      height: 36,
                      padding: "0 14px",
                      borderRadius: 7,
                      border: "1px solid #f59e0b",
                      background: "#fef3c7",
                      color: "#d97706",
                      cursor: salvandoItens ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      opacity: salvandoItens ? 0.7 : 1,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faSave}
                      style={{
                        fontSize: 11,
                      }}
                    />

                    {salvandoItens
                      ? "Salvando..."
                      : `Salvar (${itensModificados.length})`}
                  </button>
                )}

              {!isComandaFinalizada && !modoEdicao ? (
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
              ) : !isComandaFinalizada && modoEdicao ? (
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
                    onClick={salvarAlteracoesComanda}
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
              ) : null}

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

          {/* ============================================================
    CAMPOS DO HEADER
============================================================ */}

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
                  disabled={!modoEdicao || isComandaFinalizada}
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
                    color:
                      modoEdicao && !isComandaFinalizada
                        ? "#111827"
                        : "#6b7280",
                    background:
                      modoEdicao && !isComandaFinalizada ? "#fff" : "#f8fafc",
                    cursor:
                      modoEdicao && !isComandaFinalizada
                        ? "text"
                        : "not-allowed",
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

                <input
                  type="number"
                  min={0}
                  step={1}
                  value={pontoVenda !== null ? pontoVenda : ""}
                  disabled={!modoEdicao || isComandaFinalizada}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permite valores vazios (para limpar o campo)
                    if (value === "") {
                      alterarPontoVenda("");
                      return;
                    }
                    const numero = Number(value);
                    // Aceita apenas números inteiros maiores ou iguais a 0
                    if (Number.isInteger(numero) && numero >= 0) {
                      alterarPontoVenda(value);
                    }
                  }}
                  placeholder="Número do ponto"
                  style={{
                    width: "100%",
                    height: 40,
                    boxSizing: "border-box",
                    padding: "0 10px 0 30px",
                    borderRadius: 7,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                    fontSize: 12,
                    color:
                      modoEdicao && !isComandaFinalizada
                        ? "#111827"
                        : "#6b7280",
                    background:
                      modoEdicao && !isComandaFinalizada ? "#fff" : "#f8fafc",
                    cursor:
                      modoEdicao && !isComandaFinalizada
                        ? "text"
                        : "not-allowed",
                    MozAppearance: "textfield",
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

          {/* ============================================================
              CATEGORIAS
          ============================================================ */}

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
            {categorias.map((categoria) => {
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

        {/* ============================================================
            MAIN GRID
        ============================================================ */}

        <div
          className="nova-venda-main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          {/* ============================================================
              LISTA DE PRODUTOS
          ============================================================ */}

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
                  {loadingProdutos
                    ? "carregando..."
                    : erroProdutos
                      ? "erro ao carregar"
                      : `${produtosFiltrados.length} encontrados`}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: 14,
              }}
            >
              {loadingProdutos && (
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
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: "3px solid #e5e7eb",
                      borderTopColor: "#059669",
                      animation: "spin 0.8s linear infinite",
                      marginBottom: 12,
                    }}
                  />

                  <span
                    style={{
                      fontSize: 13,
                    }}
                  >
                    Carregando produtos...
                  </span>

                  <style>
                    {`
                      @keyframes spin {
                        to {
                          transform: rotate(360deg);
                        }
                      }
                    `}
                  </style>
                </div>
              )}

              {!loadingProdutos && erroProdutos && (
                <div
                  style={{
                    minHeight: 260,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#dc2626",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                    }}
                  >
                    {erroProdutos}
                  </span>

                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    style={{
                      marginTop: 12,
                      padding: "8px 16px",
                      borderRadius: 7,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#374151",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {!loadingProdutos && !erroProdutos && (
                <>
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
                        {busca || categoriaSelecionada !== 0
                          ? "Nenhum produto encontrado para esta busca."
                          : "Nenhum produto cadastrado."}
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
                          gridTemplateColumns:
                            "minmax(0, 1fr) 80px 100px 120px",
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
                        const itemNoCarrinho = carrinho.find(
                          (item) => item.produto.id === produto.id,
                        );

                        const quantidade = itemNoCarrinho?.quantidade || 0;

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
                                disabled={isComandaFinalizada}
                                style={{
                                  height: 31,
                                  padding: "0 12px",
                                  borderRadius: 6,
                                  border: isComandaFinalizada
                                    ? "1px solid #e5e7eb"
                                    : "1px solid #a7f3d0",
                                  background: isComandaFinalizada
                                    ? "#f3f4f6"
                                    : "#ecfdf5",
                                  color: isComandaFinalizada
                                    ? "#9ca3af"
                                    : "#047857",
                                  cursor: isComandaFinalizada
                                    ? "not-allowed"
                                    : "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 5,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                  opacity: isComandaFinalizada ? 0.6 : 1,
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
                </>
              )}
            </div>
          </div>

          {/* ============================================================
              CARRINHO / COMANDA
          ============================================================ */}

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
                      background: isComandaFinalizada ? "#f3f4f6" : "#ecfdf5",
                      color: isComandaFinalizada ? "#6b7280" : "#047857",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {textoStatusComanda}
                  </span>

                  {temItensModificados &&
                    carrinho.length > 0 &&
                    !isComandaFinalizada && (
                      <span
                        style={{
                          padding: "3px 7px",
                          borderRadius: 20,
                          background: "#fef3c7",
                          color: "#d97706",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {itensModificados.length} pendente(s)
                      </span>
                    )}
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

                    {/* ✅ CORRIGIDO: usa a função getNomePontoVenda */}
                    {getNomePontoVenda(pontoVenda)}
                  </span>
                </div>
              </div>

              {carrinho.length > 0 && !isComandaFinalizada && (
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
                  {isComandaFinalizada
                    ? "Esta comanda foi finalizada sem itens."
                    : "Clique em um produto para adicioná-lo à comanda."}
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

                  const estaModificado = item.modificado === true;

                  return (
                    <div
                      key={item.produto.id}
                      style={{
                        padding: "13px 14px",
                        borderBottom: "1px solid #f1f5f9",
                        background:
                          estaModificado && !isComandaFinalizada
                            ? "#fffbeb"
                            : isComandaFinalizada
                              ? "#f8fafc"
                              : "#fff",
                        borderLeft:
                          estaModificado && !isComandaFinalizada
                            ? "3px solid #f59e0b"
                            : "3px solid transparent",
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

                            {estaModificado && !isComandaFinalizada && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10,
                                  color: "#d97706",
                                  fontWeight: 600,
                                }}
                              >
                                ● modificado
                              </span>
                            )}
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

                      {/* ====================================================
                            CONTROLES DO ITEM
                            
                            IMPORTANTE:
                            Para comanda fechada, cancelada ou finalizada,
                            estes controles NÃO SÃO RENDERIZADOS.
                        ==================================================== */}

                      {!isComandaFinalizada && (
                        <div
                          style={{
                            marginTop: 9,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          {/* LIXEIRA */}

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

                          {/* CONTROLE DE QUANTIDADE */}

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              border: estaModificado
                                ? "1px solid #f59e0b"
                                : "1px solid #e5e7eb",
                              borderRadius: 7,
                              overflow: "hidden",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                diminuirQuantidade(item.produto.id)
                              }
                              style={{
                                width: 30,
                                height: 28,
                                border: "none",
                                background: "#fff",
                                color: "#6b7280",
                                cursor: "pointer",
                              }}
                              title="Diminuir quantidade"
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
                                color: estaModificado ? "#d97706" : "#374151",
                              }}
                            >
                              {item.quantidade}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                aumentarQuantidade(item.produto.id)
                              }
                              style={{
                                width: 30,
                                height: 28,
                                border: "none",
                                background: "#fff",
                                color: "#059669",
                                cursor: "pointer",
                              }}
                              title="Aumentar quantidade"
                            >
                              <FontAwesomeIcon
                                icon={faPlus}
                                style={{
                                  fontSize: 9,
                                }}
                              />
                            </button>
                          </div>

                          {/* SALVAR ALTERAÇÃO */}

                          {estaModificado && (
                            <button
                              type="button"
                              onClick={salvarAlteracoesItens}
                              disabled={salvandoItens}
                              style={{
                                height: 28,
                                padding: "0 10px",
                                borderRadius: 6,
                                border: "1px solid #f59e0b",
                                background: "#fef3c7",
                                color: "#d97706",
                                cursor: salvandoItens
                                  ? "not-allowed"
                                  : "pointer",
                                fontSize: 10,
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                opacity: salvandoItens ? 0.7 : 1,
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faSave}
                                style={{
                                  fontSize: 9,
                                }}
                              />

                              {salvandoItens ? "Salvando..." : "Salvar"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ============================================================
                TOTAL
            ============================================================ */}

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
                onClick={abrirModalFinalizar}
                disabled={
                  carrinho.length === 0 || salvando || isComandaFinalizada
                }
                style={{
                  width: "100%",
                  marginTop: 11,
                  padding: "12px 14px",
                  borderRadius: 7,
                  border: "none",
                  background:
                    carrinho.length > 0 && !salvando && !isComandaFinalizada
                      ? "#059669"
                      : "#e5e7eb",
                  color:
                    carrinho.length > 0 && !salvando && !isComandaFinalizada
                      ? "#fff"
                      : "#9ca3af",
                  cursor:
                    carrinho.length > 0 && !salvando && !isComandaFinalizada
                      ? "pointer"
                      : "not-allowed",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  opacity:
                    carrinho.length > 0 && !salvando && !isComandaFinalizada
                      ? 1
                      : 0.6,
                }}
              >
                <FontAwesomeIcon
                  icon={faCheck}
                  style={{
                    fontSize: 11,
                  }}
                />

                {isComandaFinalizada
                  ? "Comanda finalizada"
                  : salvando
                    ? "Finalizando..."
                    : "Finalizar venda"}
              </button>

              {isComandaFinalizada && (
                <div
                  style={{
                    marginTop: 8,
                    textAlign: "center",
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  Esta comanda já foi{" "}
                  {comanda.status === "fechado"
                    ? "finalizada"
                    : comanda.status === "finalizado"
                      ? "finalizada"
                      : "cancelada"}
                  .
                  {comanda.status !== "cancelada" &&
                    comanda.status !== "cancelado" &&
                    " Não é possível alterar itens."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MODAL ADICIONAR ITEM
      ============================================================ */}

      {modalAdicionarItemAberto &&
        produtoSelecionado &&
        !isComandaFinalizada && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(17, 24, 39, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                fecharModalAdicionarItem();
              }
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 420,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: 14,
                      color: "#111827",
                      fontWeight: 600,
                    }}
                  >
                    Adicionar item
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: 4,
                      fontSize: 11,
                      color: "#6b7280",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {produtoSelecionado.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fecharModalAdicionarItem}
                  disabled={salvandoItem}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#6b7280",
                    cursor: salvandoItem ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    style={{
                      fontSize: 11,
                    }}
                  />
                </button>
              </div>

              <div
                style={{
                  padding: 18,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      Quantidade
                    </label>

                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={quantidadeItem}
                      onChange={(e) =>
                        setQuantidadeItem(Number(e.target.value))
                      }
                      disabled={salvandoItem}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 7,
                        outline: "none",
                        fontSize: 12,
                        color: "#111827",
                        background: "#fff",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      Valor unitário
                    </label>

                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={precoItem}
                      onChange={(e) => setPrecoItem(Number(e.target.value))}
                      disabled={salvandoItem}
                      style={{
                        width: "100%",
                        height: 38,
                        padding: "0 10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 7,
                        outline: "none",
                        fontSize: 12,
                        color: "#111827",
                        background: "#fff",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    padding: "11px 12px",
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    Total do item
                  </span>

                  <strong
                    style={{
                      fontSize: 15,
                      color: "#059669",
                    }}
                  >
                    {formatCurrency(
                      (Number(precoItem) || 0) * (Number(quantidadeItem) || 0),
                    )}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  padding: "0 18px 18px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={fecharModalAdicionarItem}
                  disabled={salvandoItem}
                  style={{
                    height: 36,
                    padding: "0 13px",
                    borderRadius: 7,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#6b7280",
                    cursor: salvandoItem ? "not-allowed" : "pointer",
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={salvarItem}
                  disabled={salvandoItem}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 7,
                    border: "1px solid #059669",
                    background: salvandoItem ? "#a7f3d0" : "#059669",
                    color: "#fff",
                    cursor: salvandoItem ? "not-allowed" : "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFloppyDisk}
                    style={{
                      fontSize: 10,
                    }}
                  />

                  {salvandoItem ? "Salvando..." : "Salvar item"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ============================================================
          MODAL FINALIZAR VENDA
      ============================================================ */}

      <ModalFinalizarVenda
        isOpen={modalFinalizarAberto}
        venda={vendaParaModal}
        onClose={fecharModalFinalizar}
        onConfirm={confirmarFinalizacao}
        formatCurrency={formatCurrency}
      />

      {/* ============================================================
          ESTILOS
      ============================================================ */}

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
