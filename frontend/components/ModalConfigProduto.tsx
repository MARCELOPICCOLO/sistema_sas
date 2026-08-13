import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface Produto {
  id: number;
  name: string;
  price: number;
}

interface Venda {
  id: number;
  customer_name: string;
  table_id?: number;
}

interface Props {
  produtoSelecionado: Produto | null;

  vendasAbertas: Venda[];

  vendaSelecionadaId: number | null;

  setVendaSelecionadaId: (value: number | null) => void;

  quantidade: number;

  setQuantidade: (value: number) => void;

  precoPersonalizado: string;

  setPrecoPersonalizado: (value: string) => void;

  usarPrecoPersonalizado: boolean;

  setUsarPrecoPersonalizado: (value: boolean) => void;

  closeModal: () => void;

  handleConfirmAdd: () => void;

  getNomePontoVenda: (tableId?: number) => string;

  formatCurrency: (value: number) => string;
}

const ModalConfigProduto: React.FC<Props> = ({
  produtoSelecionado,
  vendasAbertas,
  vendaSelecionadaId,
  setVendaSelecionadaId,
  quantidade,
  setQuantidade,
  precoPersonalizado,
  setPrecoPersonalizado,
  usarPrecoPersonalizado,
  setUsarPrecoPersonalizado,
  closeModal,
  handleConfirmAdd,
  getNomePontoVenda,
  formatCurrency,
}) => {
  if (!produtoSelecionado) return null;

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
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          width: "90%",
          maxWidth: 450,
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
            }}
          >
            Adicionar {produtoSelecionado.name}
          </h2>

          <button
            onClick={closeModal}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* VENDA */}

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
            }}
          >
            Selecionar Venda
          </label>

          {vendasAbertas.length === 1 ? (
            <div
              style={{
                padding: 10,
                background: "#f0fdf4",
                borderRadius: 6,
              }}
            >
              {vendasAbertas[0].customer_name}
            </div>
          ) : (
            <select
              value={vendaSelecionadaId || ""}
              onChange={(e) =>
                setVendaSelecionadaId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="">Selecione</option>

              {vendasAbertas.map((venda) => (
                <option key={venda.id} value={venda.id}>
                  {getNomePontoVenda(venda.table_id)} - {venda.customer_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* PREÇO + QUANTIDADE */}

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
            }}
          >
            {/* PREÇO */}

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Preço do Produto
              </label>

              <div
                style={{
                  padding: "10px",
                  borderRadius: 6,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  fontWeight: 600,
                  color: "#059669",
                }}
              >
                {formatCurrency(produtoSelecionado.price)}
              </div>
            </div>

            {/* QUANTIDADE */}

            <div style={{ width: 100 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Quantidade
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={quantidade === 0 ? "" : quantidade}
                onChange={(e) => {
                  const value = e.target.value;

                  // Permite apagar o campo temporariamente
                  if (value === "") {
                    setQuantidade(0);
                    return;
                  }

                  const numero = Number(value);

                  if (Number.isInteger(numero) && numero >= 1) {
                    setQuantidade(numero);
                  }
                }}
                onBlur={() => {
                  // Se deixar vazio, volta para 1
                  if (quantidade < 1) {
                    setQuantidade(1);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* PREÇO PERSONALIZADO */}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              marginBottom: 12,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={usarPrecoPersonalizado}
              onChange={(e) => setUsarPrecoPersonalizado(e.target.checked)}
            />
            Aplicar desconto / preço personalizado
          </label>

          {usarPrecoPersonalizado && (
            <input
              type="tel"
              placeholder="Novo preço"
              value={precoPersonalizado}
              onChange={(e) => {
                const value = e.target.value;

                if (/^[0-9]*[.,]?[0-9]*$/.test(value)) {
                  setPrecoPersonalizado(value);
                }
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          )}
        </div>

        {/* BOTÕES */}

        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >
          <button
            onClick={closeModal}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmAdd}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 6,
              border: "none",
              background: "#10b981",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ModalConfigProduto);
