// pages/Produtos.tsx
import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBoxes,
  faEdit,
  faPlus,
  faSearch,
  faTag,
  faTimes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { TabelaProdutos } from "../../components/TabelaProdutos";
import { ModalProduto } from "../../components/ModalProduto";
import { ModalCategorias } from "../../components/ModalCategorias";

import api from "../api/axios";
import { notify, confirmar } from "../feedback";
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

export default function Produtos() {
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
      notify(
        `✅ ${sucesso} produto(s) atualizado(s) com sucesso!${erros > 0 ? `\n❌ ${erros} erro(s)` : ""}`,
      );
      fetchProdutos();
    } else if (erros > 0) {
      notify("❌ Erro ao atualizar os produtos. Tente novamente.");
    }
  };

  const salvarProduto = async () => {
    if (!formData.name || !formData.category_id) {
      notify("Preencha nome e categoria");
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

      notify(editando ? "Produto atualizado!" : "Produto adicionado!");
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);

      if (error.response) {
        notify(error.response.data.message || "Erro ao salvar produto");
      } else {
        notify("Erro ao conectar com o servidor");
      }
    }
  };

  const adicionarCategoria = async () => {
    if (!novaCategoria.name.trim()) {
      notify("Digite o nome da categoria");
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
        notify(error.message || "Erro ao criar categoria");
        return;
      }

      await fetchCategorias();
      setShowModalCategoria(false);
      setNovaCategoria({ name: "" });

      notify("Categoria adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      notify("Erro ao conectar com o servidor");
    }
  };

  const editarCategoria = async () => {
    if (!editandoCategoria) return;

    if (!editandoCategoria.name.trim()) {
      notify("Digite o nome da categoria");
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
        notify(error.message || "Erro ao editar categoria");
        return;
      }

      await fetchCategorias();
      setEditandoCategoria(null);

      notify("Categoria atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao editar categoria:", error);
      notify("Erro ao conectar com o servidor");
    }
  };

  const excluirCategoria = async (id: number, name: string) => {
    const temProdutos = produtos.some((p) => p.category_id === id);

    if (temProdutos) {
      if (
        !(await confirmar(
          `A categoria "${name}" possui produtos associados. Excluir mesmo assim?`,
        ))
      )
        return;
    } else {
      if (!(await confirmar(`Tem certeza que deseja excluir a categoria "${name}"?`)))
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
        notify(error.message || "Erro ao excluir categoria");
        return;
      }

      await fetchCategorias();

      if (categoriaFiltro === id) {
        setCategoriaFiltro(null);
      }

      notify("Categoria excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      notify("Erro ao conectar com o servidor");
    }
  };

  const removerProduto = async (id: number, name: string) => {
    if (!(await confirmar(`Tem certeza que deseja excluir "${name}"?`))) return;

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
        notify(error.message || "Erro ao excluir produto");
        return;
      }

      await fetchProdutos();
      notify("Produto excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      notify("Erro ao conectar com o servidor");
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

  // Sidebar para Desktop - NOVO VISUAL CLEAN
  const SidebarProdutos = () => (
    <div
      className="sidebar-dark"
      style={{
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid var(--surface-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              background: "var(--primary-soft)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faBoxes}
              style={{ fontSize: "var(--fs-xl)", color: "var(--primary)" }}
            />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "var(--fs-xl)",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              Produtos
            </h2>

            <p
              style={{
                margin: "3px 0 0",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
            >
              Gerenciamento de estoque
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding: "20px", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
              gap: 12,
              width: "100%",
              padding: "11px 12px",
              background: "transparent",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "all 0.2s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: "var(--surface-3)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon
                icon={faPlus}
                style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "var(--fs-sm)",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                Novo Produto
              </div>

              <div
                style={{
                  fontSize: "var(--fs-2xs)",
                  color: "var(--text-subtle)",
                  marginTop: 2,
                }}
              >
                Adicionar ao catálogo
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowModalCategoria(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "11px 12px",
              background: "transparent",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "all 0.2s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: "var(--surface-3)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon
                icon={faTag}
                style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "var(--fs-sm)",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                Categorias
              </div>

              <div
                style={{
                  fontSize: "var(--fs-2xs)",
                  color: "var(--text-subtle)",
                  marginTop: 2,
                }}
              >
                Gerenciar categorias
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Rodapé */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--surface-3)",
          background: "var(--surface-2)",
        }}
      >
        <div
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--text-subtle)",
            textAlign: "center",
          }}
        >
          Total: {produtos.length} produtos
        </div>
      </div>
    </div>
  );

  // Desktop
  if (!isMobile) {
    return (
      <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            height: "100%",
            background: "var(--surface-2)",
          }}
        >
          {SidebarProdutos()}

          <div
            style={{
              padding: "24px",
              overflowY: "auto",
              height: "var(--page-h)",
            }}
          >
            <div
              style={{
                background: "var(--surface)",
                padding: "18px 20px",
                borderRadius: 12,
                marginBottom: 20,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "var(--fs-xl)",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    Lista de Produtos
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "var(--fs-sm)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Gerencie seus produtos e níveis de estoque
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <FontAwesomeIcon
                      icon={faSearch}
                      style={{
                        position: "absolute",
                        left: 11,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-subtle)",
                      }}
                    />

                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        padding: "9px 12px 9px 32px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        fontSize: "var(--fs-sm)",
                        width: 220,
                        outline: "none",
                        background: "var(--surface)",
                        color: "var(--text)",
                        boxShadow: "var(--shadow-card)",
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
                      width: 190,
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text-secondary)",
                      fontSize: "var(--fs-sm)",
                      cursor: "pointer",
                      outline: "none",
                      boxShadow: "var(--shadow-card)",
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

  // Mobile
  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "var(--page-h)",
      }}
    >
      {/* Header Mobile */}
      <div
        style={{
          padding: "16px",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
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
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "var(--primary-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faBoxes}
              style={{
                fontSize: "var(--fs-xl)",
                color: "var(--primary)",
              }}
            />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "var(--fs-xl)",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Produtos
          </h1>
        </div>

        <button
          onClick={() => setShowMobileMenu(true)}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "8px 11px",
            cursor: "pointer",
            color: "var(--text-secondary)",
          }}
        >
          <FontAwesomeIcon icon={faBars} style={{ fontSize: "var(--fs-lg)" }} />
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
              background: "rgba(15, 23, 42, 0.25)",
              zIndex: 1000,
            }}
            onClick={() => setShowMobileMenu(false)}
          />

          <div
            className="sidebar-dark"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "280px",
              background: "var(--surface)",
              zIndex: 1001,
              padding: "20px",
              overflowY: "auto",
              boxShadow: "4px 0 20px rgba(15, 23, 42, 0.08)",
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
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  width: 34,
                  height: 34,
                  cursor: "pointer",
                  color: "var(--text-muted)",
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
                padding: "12px",
                background: "transparent",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                color: "var(--text-secondary)",
                marginBottom: 6,
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--primary-soft)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  style={{
                    fontSize: "var(--fs-sm)",
                    color: "var(--primary)",
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: "var(--fs-sm)",
                  fontWeight: 500,
                }}
              >
                Novo Produto
              </span>
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
                padding: "12px",
                background: "transparent",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                color: "var(--text-secondary)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--surface-3)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={faTag}
                  style={{
                    fontSize: "var(--fs-sm)",
                    color: "var(--text-muted)",
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: "var(--fs-sm)",
                  fontWeight: 500,
                }}
              >
                Categorias
              </span>
            </button>
          </div>
        </>
      )}

      {/* Conteúdo Mobile */}
      <div style={{ padding: "16px" }}>
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            padding: "12px",
            marginBottom: 16,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              position: "relative",
              marginBottom: 10,
            }}
          >
            <FontAwesomeIcon
              icon={faSearch}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-subtle)",
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
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: "var(--fs-md)",
                outline: "none",
                color: "var(--text)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-card)",
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
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-secondary)",
              fontSize: "var(--fs-md)",
              cursor: "pointer",
              outline: "none",
              boxShadow: "var(--shadow-card)",
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
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "var(--text-muted)",
                fontSize: "var(--fs-sm)",
              }}
            >
              Carregando...
            </div>
          ) : (
            produtosFiltrados.map((produto) => (
              <div
                key={produto.id}
                style={{
                  background: "var(--surface)",
                  borderRadius: 12,
                  padding: "14px",
                  marginBottom: 8,
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-card)",
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
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "var(--fs-md)",
                        color: "var(--text)",
                      }}
                    >
                      {produto.name}
                    </div>

                    <div
                      style={{
                        fontSize: "var(--fs-2xs)",
                        color: "var(--text-muted)",
                        marginTop: 3,
                      }}
                    >
                      Cód: {produto.product_code || "-"}
                    </div>

                    <div
                      style={{
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-subtle)",
                        marginTop: 2,
                      }}
                    >
                      {produto.category?.name || "Sem categoria"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "var(--fs-md)",
                        color: "var(--primary)",
                      }}
                    >
                      {formatCurrency(produto.price)}
                    </div>

                    <div
                      style={{
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-secondary)",
                        marginTop: 2,
                      }}
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
                    borderTop: "1px solid var(--surface-3)",
                  }}
                >
                  <button
                    onClick={() => abrirModalEditar(produto)}
                    style={{
                      flex: 1,
                      padding: "7px",
                      borderRadius: 8,
                      border: "1px solid var(--primary-border)",
                      background: "var(--primary-soft)",
                      color: "var(--primary-hover)",
                      fontSize: "var(--fs-xs)",
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
                      padding: "7px",
                      borderRadius: 8,
                      border: "1px solid var(--danger-border)",
                      background: "var(--surface-2)",
                      color: "var(--danger)",
                      fontSize: "var(--fs-xs)",
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
