import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface Category {
  id: number;
  name: string;
  restaurant_id: number;
}

interface FormData {
  id?: number;
  name: string;
  product_code: string;
  price: number;
  quantity: number;
  category_id: number;
}

interface ModalProdutoProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  editando: boolean;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  categorias: Category[];
  salvarProduto: () => void;
  produtosExistentes?: Array<{
    id: number;
    product_code: string;
  }>;
}

export const ModalProduto: React.FC<ModalProdutoProps> = ({
  showModal,
  setShowModal,
  editando,
  formData,
  setFormData,
  categorias,
  salvarProduto,
  produtosExistentes = [],
}) => {
  const [priceInput, setPriceInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [codigoError, setCodigoError] = useState("");

  const verificarCodigoDuplicado = (codigo: string) => {
    if (!codigo || codigo.trim() === "") {
      setCodigoError("");
      return true;
    }

    const existe = produtosExistentes.some(
      (p) => p.product_code === codigo && (!editando || p.id !== formData.id),
    );

    if (existe) {
      setCodigoError("Este código já está em uso.");
      return false;
    }

    setCodigoError("");
    return true;
  };

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();

    setFormData({
      ...formData,
      product_code: value,
    });

    verificarCodigoDuplicado(value);
  };

  useEffect(() => {
    if (formData.price === 0) {
      setPriceInput("");
    } else {
      setPriceInput(formData.price.toString());
    }

    setQuantityInput(formData.quantity.toString());
    setCodigoError("");
  }, [formData.price, formData.quantity, showModal, formData.id]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    value = value.replace(/[^\d,.]/g, "");
    value = value.replace(",", ".");

    const parts = value.split(".");

    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }

    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + "." + parts[1].substring(0, 2);
    }

    setPriceInput(value);

    const numValue = parseFloat(value);

    if (!isNaN(numValue)) {
      setFormData({
        ...formData,
        price: numValue,
      });
    } else if (value === "") {
      setFormData({
        ...formData,
        price: 0,
      });
    }
  };

  const handlePriceBlur = () => {
    if (priceInput === "") {
      setPriceInput("");

      setFormData({
        ...formData,
        price: 0,
      });

      return;
    }

    const numValue = parseFloat(priceInput);

    if (!isNaN(numValue)) {
      const formatted = numValue.toFixed(2);

      setPriceInput(formatted);

      setFormData({
        ...formData,
        price: numValue,
      });
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    value = value.replace(/\D/g, "");

    if (value.length > 1 && value.startsWith("0")) {
      value = value.replace(/^0+/, "");
    }

    if (value === "") {
      value = "0";
    }

    setQuantityInput(value);

    const numValue = Math.max(0, parseInt(value, 10) || 0);

    setFormData({
      ...formData,
      quantity: numValue,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.product_code && formData.product_code.trim() !== "") {
      const existe = produtosExistentes.some(
        (p) =>
          p.product_code === formData.product_code &&
          (!editando || p.id !== formData.id),
      );

      if (existe) {
        setCodigoError("Este código já está em uso.");
        return;
      }
    }

    salvarProduto();
  };

  if (!showModal) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    height: 42,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "#fff",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 7,
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-secondary)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 500,
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid var(--surface-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {editando ? "Editar produto" : "Novo produto"}
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--text-subtle)",
              }}
            >
              {editando
                ? "Atualize as informações do produto."
                : "Cadastre um novo produto no estoque."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "none",
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: 14 }} />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div
          style={{
            padding: "22px",
          }}
        >
          {/* NOME */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Nome <span style={{ color: "var(--danger)" }}>*</span>
            </label>

            <input
              type="text"
              placeholder="Ex.: X-Burguer"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
              style={inputStyle}
              autoFocus
              required
            />
          </div>

          {/* CÓDIGO + CATEGORIA */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 16,
            }}
          >
            {/* CÓDIGO */}
            <div>
              <label style={labelStyle}>Código</label>

              <input
                type="text"
                placeholder="Ex.: BURG001"
                value={formData.product_code}
                onChange={handleCodigoChange}
                style={{
                  ...inputStyle,
                  border: codigoError
                    ? "1px solid var(--danger)"
                    : "1px solid var(--border)",
                }}
              />

              {codigoError ? (
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 11,
                    color: "var(--danger)",
                  }}
                >
                  {codigoError}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 10,
                    color: "var(--text-subtle)",
                  }}
                >
                  Opcional
                </div>
              )}
            </div>

            {/* CATEGORIA */}
            <div>
              <label style={labelStyle}>
                Categoria <span style={{ color: "var(--danger)" }}>*</span>
              </label>

              <select
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category_id: Number(e.target.value),
                  })
                }
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                }}
                required
              >
                <option value={0}>Selecione</option>

                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PREÇO + ESTOQUE */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {/* PREÇO */}
            <div>
              <label style={labelStyle}>
                Preço <span style={{ color: "var(--danger)" }}>*</span>
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 12,
                    color: "var(--text-subtle)",
                    pointerEvents: "none",
                  }}
                >
                  R$
                </span>

                <input
                  type="text"
                  placeholder="0,00"
                  value={priceInput}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  style={{
                    ...inputStyle,
                    paddingLeft: 34,
                  }}
                  required
                />
              </div>
            </div>

            {/* ESTOQUE */}
            <div>
              <label style={labelStyle}>Estoque</label>

              <input
                type="text"
                placeholder="0"
                value={quantityInput}
                onChange={handleQuantityChange}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--surface-3)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => setShowModal(false)}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "#fff",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              boxShadow: "var(--shadow-card)",
            }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {editando ? "Salvar alterações" : "Criar produto"}
          </button>
        </div>
      </form>
    </div>
  );
};
