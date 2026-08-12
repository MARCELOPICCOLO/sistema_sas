// pages/Produtos.tsx
import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faArrowLeft,
  faPlus,
  faTimes,
  faBoxes,
  faTag,
  faEdit,
  faTrash,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { TabelaProdutos } from "../../components/TabelaProdutos";
import { ModalProduto } from "../../components/ModalProduto";
import { ModalCategorias } from "../../components/ModalCategorias";

import api from "../api/axios";
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

interface FormData {
  id?: number;
  name: string;
  product_code: string;
  price: number;
  quantity: number;
  category_id: number;
}

interface Category {
  id: number;
  name: string;
  restaurant_id: number;
}

interface ProdutosProps {
  setTela: (tela: string) => void;
}

export default function Produtos({ setTela }: ProdutosProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showModalCategoria, setShowModalCategoria] = useState(false);
  const [editando, setEditando] = useState<Product | null>(null);
  const [editandoCategoria, setEditandoCategoria] = useState<Category | null>(
    null,
  );

  const [formData, setFormData] = useState<FormData>({
    name: "",
    product_code: "",
    price: 0,
    quantity: 0,
    category_id: 0,
  });

  const [novaCategoria, setNovaCategoria] = useState({ name: "" });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("/products");

      const produtosFormatados = response.data.map((p: any) => ({
        ...p,
        price: Number(p.price),
        quantity: Number(p.quantity),
      }));

      setProdutos(produtosFormatados);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategorias = async () => {
    try {
      const response = await api.get("/categories");

      setCategorias(response.data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    fetchProdutos();
    fetchCategorias();
  }, [fetchProdutos]);

  const formatCurrency = (value: any): string => {
    const num = typeof value === "number" ? value : Number(value);
    if (isNaN(num)) return "R$ 0,00";
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  const salvarAlteracoesEstoque = async (
    alteracoes: { id: number; quantity: number }[],
  ) => {
    setLoading(true);
    let sucesso = 0;
    let erros = 0;

    for (const alteracao of alteracoes) {
      try {
        const produto = produtos.find((p) => p.id === alteracao.id);
        if (!produto) continue;

        const response = await fetch(`${API_URL}/products/${alteracao.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            restaurant_id: 1,
            name: produto.name,
            product_code: produto.product_code,
            price: produto.price,
            quantity: alteracao.quantity,
            category_id: produto.category_id,
            active: produto.active,
          }),
        });

        if (response.ok) {
          sucesso++;
        } else {
          erros++;
        }
      } catch (error) {
        erros++;
        console.error("Erro ao atualizar estoque:", error);
      }
    }

    setLoading(false);

    if (sucesso > 0) {
      alert(
        `✅ ${sucesso} produto(s) atualizado(s) com sucesso!${erros > 0 ? `\n❌ ${erros} erro(s)` : ""}`,
      );
      fetchProdutos();
    } else if (erros > 0) {
      alert("❌ Erro ao atualizar os produtos. Tente novamente.");
    }
  };

  const salvarProduto = async () => {
    if (!formData.name || !formData.category_id) {
      alert("Preencha nome e categoria");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        product_code: formData.product_code || null,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        category_id: Number(formData.category_id),
        active: true,
      };

      if (editando) {
        await api.put(`/products/${formData.id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setShowModal(false);
      setEditando(null);

      setFormData({
        name: "",
        product_code: "",
        price: 0,
        quantity: 0,
        category_id: 0,
      });

      fetchProdutos();

      alert(editando ? "Produto atualizado!" : "Produto adicionado!");
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);

      if (error.response) {
        alert(error.response.data.message || "Erro ao salvar produto");
      } else {
        alert("Erro ao conectar com o servidor");
      }
    }
  };

  const adicionarCategoria = async () => {
    if (!novaCategoria.name.trim()) {
      alert("Digite o nome da categoria");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");

      const response = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: novaCategoria.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Erro ao criar categoria");
        return;
      }

      await fetchCategorias();
      setShowModalCategoria(false);
      setNovaCategoria({ name: "" });

      alert("Categoria adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const editarCategoria = async () => {
    if (!editandoCategoria) return;

    if (!editandoCategoria.name.trim()) {
      alert("Digite o nome da categoria");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");

      const response = await fetch(
        `${API_URL}/categories/${editandoCategoria.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editandoCategoria.name,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Erro ao editar categoria");
        return;
      }

      await fetchCategorias();
      setEditandoCategoria(null);

      alert("Categoria atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao editar categoria:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const excluirCategoria = async (id: number, name: string) => {
    const temProdutos = produtos.some((p) => p.category_id === id);

    if (temProdutos) {
      if (
        !confirm(
          `A categoria "${name}" possui produtos associados. Excluir mesmo assim?`,
        )
      )
        return;
    } else {
      if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?`))
        return;
    }

    try {
      const token = localStorage.getItem("auth_token");

      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Erro ao excluir categoria");
        return;
      }

      await fetchCategorias();

      if (categoriaFiltro === id) {
        setCategoriaFiltro(null);
      }

      alert("Categoria excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const removerProduto = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;

    const token = localStorage.getItem("auth_token");

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Erro ao excluir produto");
        return;
      }

      await fetchProdutos();
      alert("Produto excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const abrirModalEditar = (produto: Product) => {
    setEditando(produto);
    setFormData({
      id: produto.id,
      name: produto.name,
      product_code: produto.product_code || "",
      price: produto.price,
      quantity: produto.quantity,
      category_id: produto.category_id,
    });
    setShowModal(true);
  };

  const produtosFiltrados = produtos.filter((produto) => {
    if (categoriaFiltro === null) {
      return true;
    }

    return produto.category?.id === categoriaFiltro;
  });

  // Sidebar para Desktop - PADRÃO CORRETO
  const SidebarProdutos = () => (
    <div
      style={{
        background: "#1f2937",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Botão Voltar ao Dashboard */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #374151" }}>
        <button
          onClick={() => setTela && setTela("dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "10px 16px",
            background: "transparent",
            border: "1px solid #374151",
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.2s",
            color: "#9ca3af",
            fontSize: 13,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#374151";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#9ca3af";
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar ao Dashboard
        </button>
      </div>

      {/* Cabeçalho */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #374151" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: "#374151",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faBoxes}
              style={{ fontSize: 20, color: "#10b981" }}
            />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#fff",
              }}
            >
              Produtos
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>
              Gerenciamento de estoque
            </p>
          </div>
        </div>
      </div>

      {/* MENU - PADRÃO COM ÍCONE FA_CHART_LINE NO FINAL */}
      <div style={{ padding: "20px", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Botão Novo Produto */}
          <button
            onClick={() => {
              setEditando(null);
              setFormData({
                name: "",
                product_code: "",
                price: 0,
                quantity: 0,
                category_id: 0,
              });
              setShowModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: "12px 16px",
              background: "transparent",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.2s",
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: "#374151",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon
                icon={faPlus}
                style={{ fontSize: 14, color: "#9ca3af" }}
              />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Novo Produto</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                Adicionar ao catálogo
              </div>
            </div>
            <FontAwesomeIcon
              icon={faChartLine}
              style={{ fontSize: 12, color: "#4b5563" }}
            />
          </button>

          {/* Botão Categorias */}
          <button
            onClick={() => setShowModalCategoria(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: "12px 16px",
              background: "transparent",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.2s",
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: "#374151",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon
                icon={faTag}
                style={{ fontSize: 14, color: "#9ca3af" }}
              />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Categorias</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                Gerenciar categorias
              </div>
            </div>
            <FontAwesomeIcon
              icon={faChartLine}
              style={{ fontSize: 12, color: "#4b5563" }}
            />
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Rodapé */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #374151",
          background: "#111827",
        }}
      >
        <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
          Total: {produtos.length} produtos
        </div>
      </div>
    </div>
  );

  // Versão Desktop
  if (!isMobile) {
    return (
      <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            height: "100%",
            background: "#FAFAFA",
          }}
        >
          <SidebarProdutos />

          <div style={{ padding: "20px", overflowY: "auto", height: "100vh" }}>
            <div
              style={{
                background: "#fff",
                padding: "16px 20px",
                borderRadius: 8,
                marginBottom: 20,
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  Lista de Produtos
                </h2>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <FontAwesomeIcon
                      icon={faSearch}
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 12,
                        color: "#9ca3af",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        padding: "8px 12px 8px 32px",
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                        fontSize: 13,
                        width: 220,
                        outline: "none",
                      }}
                    />
                  </div>

                  <select
                    value={categoriaFiltro ?? ""}
                    onChange={(e) => {
                      const valor = e.target.value;

                      setCategoriaFiltro(valor === "" ? null : Number(valor));
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Todas categorias</option>

                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <TabelaProdutos
              produtos={produtosFiltrados}
              loading={loading}
              formatCurrency={formatCurrency}
              abrirModalEditar={abrirModalEditar}
              removerProduto={removerProduto}
              salvarAlteracoesEstoque={salvarAlteracoesEstoque}
            />
          </div>
        </div>

        {/* Modais */}
        <ModalProduto
          showModal={showModal}
          setShowModal={setShowModal}
          editando={!!editando}
          formData={formData}
          setFormData={setFormData}
          categorias={categorias}
          salvarProduto={salvarProduto}
          produtosExistentes={produtos.map((p) => ({
            id: p.id,
            product_code: p.product_code,
          }))}
        />

        <ModalCategorias
          showModalCategoria={showModalCategoria}
          setShowModalCategoria={setShowModalCategoria}
          categorias={categorias}
          editandoCategoria={editandoCategoria}
          setEditandoCategoria={setEditandoCategoria}
          novaCategoria={novaCategoria}
          setNovaCategoria={setNovaCategoria}
          adicionarCategoria={adicionarCategoria}
          editarCategoria={editarCategoria}
          excluirCategoria={excluirCategoria}
        />
      </>
    );
  }

  // Versão Mobile (mantém a mesma)
  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh" }}>
      {/* Header Mobile */}
      <div
        style={{
          padding: "16px",
          background: "#1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FontAwesomeIcon
            icon={faBoxes}
            style={{ fontSize: 24, color: "#10b981" }}
          />
          <h1
            style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#fff" }}
          >
            Produtos
          </h1>
        </div>
        <button
          onClick={() => setShowMobileMenu(true)}
          style={{
            background: "#374151",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <span style={{ fontSize: 16 }}>☰</span>
        </button>
      </div>

      {/* Botão Voltar ao Dashboard - Mobile */}
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
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar ao Dashboard
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
              background: "#1f2937",
              zIndex: 1001,
              padding: "20px",
              overflowY: "auto",
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
                  color: "#fff",
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <button
              onClick={() => {
                setEditando(null);
                setFormData({
                  name: "",
                  product_code: "",
                  price: 0,
                  quantity: 0,
                  category_id: 0,
                });
                setShowModal(true);
                setShowMobileMenu(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                color: "#fff",
                marginBottom: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#374151";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#374151",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  style={{ fontSize: 14, color: "#9ca3af" }}
                />
              </div>
              <span>Novo Produto</span>
              <FontAwesomeIcon
                icon={faChartLine}
                style={{ fontSize: 12, color: "#4b5563", marginLeft: "auto" }}
              />
            </button>

            <button
              onClick={() => {
                setShowModalCategoria(true);
                setShowMobileMenu(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                color: "#fff",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#374151";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#374151",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={faTag}
                  style={{ fontSize: 14, color: "#9ca3af" }}
                />
              </div>
              <span>Categorias</span>
              <FontAwesomeIcon
                icon={faChartLine}
                style={{ fontSize: 12, color: "#4b5563", marginLeft: "auto" }}
              />
            </button>
          </div>
        </>
      )}

      {/* Conteúdo Mobile */}
      <div style={{ padding: "16px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "12px",
            marginBottom: 16,
          }}
        >
          <div style={{ position: "relative", marginBottom: 12 }}>
            <FontAwesomeIcon
              icon={faSearch}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 14,
                color: "#9ca3af",
              }}
            />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <select
            value={categoriaFiltro ?? ""}
            onChange={(e) => {
              const valor = e.target.value;

              setCategoriaFiltro(valor === "" ? null : Number(valor));
            }}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <option value="">Todas categorias</option>

            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              Carregando...
            </div>
          ) : (
            produtosFiltrados.map((produto) => (
              <div
                key={produto.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "12px",
                  marginBottom: 8,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {produto.name}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}
                    >
                      Cód: {produto.product_code || "-"}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}
                    >
                      {produto.category?.name || "Sem categoria"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#059669",
                      }}
                    >
                      {formatCurrency(produto.price)}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#374151", marginTop: 2 }}
                    >
                      Estoque: {produto.quantity}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    onClick={() => abrirModalEditar(produto)}
                    style={{
                      flex: 1,
                      padding: "6px",
                      borderRadius: 6,
                      border: "none",
                      background: "#10b981",
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} size="xs" />
                    Editar
                  </button>
                  <button
                    onClick={() => removerProduto(produto.id, produto.name)}
                    style={{
                      flex: 1,
                      padding: "6px",
                      borderRadius: 6,
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} size="xs" />
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ModalProduto
        showModal={showModal}
        setShowModal={setShowModal}
        editando={!!editando}
        formData={formData}
        setFormData={setFormData}
        categorias={categorias}
        salvarProduto={salvarProduto}
        produtosExistentes={produtos.map((p) => ({
          id: p.id,
          product_code: p.product_code,
        }))}
      />

      <ModalCategorias
        showModalCategoria={showModalCategoria}
        setShowModalCategoria={setShowModalCategoria}
        categorias={categorias}
        editandoCategoria={editandoCategoria}
        setEditandoCategoria={setEditandoCategoria}
        novaCategoria={novaCategoria}
        setNovaCategoria={setNovaCategoria}
        adicionarCategoria={adicionarCategoria}
        editarCategoria={editarCategoria}
        excluirCategoria={excluirCategoria}
      />
    </div>
  );
}
