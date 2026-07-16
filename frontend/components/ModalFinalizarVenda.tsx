// components/ModalFinalizarVenda.tsx

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faClock } from "@fortawesome/free-solid-svg-icons";

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
  customer_name: string;
  status: string;
  total?: number;
  items?: VendaItem[];
  created_at?: string;
  table_id?: number;
}

interface ModalFinalizarVendaProps {
  isOpen: boolean;
  venda: Venda | null;
  onClose: () => void;
  onConfirm: (
    formaPagamento: string,
    valorRecebido?: number,
    comandaNaoPaga?: boolean,
  ) => void;
  formatCurrency: (value: any) => string;
}

export const ModalFinalizarVenda: React.FC<ModalFinalizarVendaProps> = ({
  isOpen,
  venda,
  onClose,
  onConfirm,
  formatCurrency,
}) => {
  const [formaPagamento, setFormaPagamento] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [troco, setTroco] = useState(0);

  if (!isOpen || !venda) return null;

  const total =
    venda.items?.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    ) || 0;

  const opcoesPagamento = [
    { value: "dinheiro", label: "Dinheiro", icon: "💰" },
    { value: "pix", label: "PIX", icon: "📱" },
    { value: "credito", label: "Cartão de Crédito", icon: "💳" },
    { value: "debito", label: "Cartão de Débito", icon: "💳" },
  ];

  const calcularTroco = (valor: string) => {
    const recebido = parseFloat(valor) || 0;
    const trocoCalculado = recebido - total;
    setTroco(trocoCalculado > 0 ? trocoCalculado : 0);
  };

  const handleValorRecebidoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setValorRecebido(value);
    calcularTroco(value);
  };

  const handleFormaPagamentoChange = (value: string) => {
    setFormaPagamento(value);

    if (value !== "dinheiro") {
      setValorRecebido("");
      setTroco(0);
    }
  };

  const resetEstados = () => {
    setFormaPagamento("");
    setValorRecebido("");
    setTroco(0);
  };

  const handleConfirm = () => {
    if (!formaPagamento) {
      alert("Selecione uma forma de pagamento");
      return;
    }

    if (formaPagamento === "dinheiro") {
      const recebido = parseFloat(valorRecebido) || 0;

      if (recebido < total) {
        alert(`Valor insuficiente. Total da venda: ${formatCurrency(total)}`);
        return;
      }

      onConfirm(formaPagamento, recebido, false);
    } else {
      onConfirm(formaPagamento, undefined, false);
    }

    resetEstados();
  };

  const handleComandaNaoPaga = () => {
    if (window.confirm("Confirmar que esta comanda não será paga agora?")) {
      onConfirm("pendente", undefined, true);
      resetEstados();
    }
  };

  const handleClose = () => {
    resetEstados();
    onClose();
  };

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
      onClick={handleClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          width: "90%",
          maxWidth: 450,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24 }}>Finalizar Venda</h2>

          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <p
          style={{
            margin: "0 0 20px 0",
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          Cliente: <strong>{venda.customer_name}</strong> • Venda #{venda.id}
        </p>

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
            }}
          >
            <span>Total da venda:</span>

            <span
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#059669",
              }}
            >
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Forma de pagamento:
          </label>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {opcoesPagamento.map((opcao) => (
              <button
                key={opcao.value}
                onClick={() => handleFormaPagamentoChange(opcao.value)}
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
              >
                <span>
                  {opcao.icon} {opcao.label}
                </span>

                {formaPagamento === opcao.value && (
                  <span
                    style={{
                      color: "#10b981",
                      fontSize: 18,
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {formaPagamento === "dinheiro" && (
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Valor Recebido (R$):
            </label>

            <input
              type="number"
              step="0.01"
              value={valorRecebido}
              onChange={handleValorRecebidoChange}
              placeholder="Digite o valor recebido"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                outline: "none",
              }}
              autoFocus
            />

            {troco > 0 && (
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  background: "#d1fae5",
                  borderRadius: 6,
                  color: "#059669",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Troco: {formatCurrency(troco)}
              </div>
            )}

            {valorRecebido && parseFloat(valorRecebido) < total && (
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  background: "#fee2e2",
                  borderRadius: 6,
                  color: "#dc2626",
                  fontSize: 12,
                }}
              >
                Valor insuficiente. Faltam{" "}
                {formatCurrency(total - parseFloat(valorRecebido))}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            flexDirection: "column",
          }}
        >
          {/* Botão Comanda Não Paga - DESTAQUE */}
          <button
            onClick={handleComandaNaoPaga}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "2px solid #f59e0b",
              background: "#fffbeb",
              color: "#92400e",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef3c7";
              e.currentTarget.style.borderColor = "#d97706";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fffbeb";
              e.currentTarget.style.borderColor = "#f59e0b";
            }}
          >
            <FontAwesomeIcon icon={faClock} />
            Comanda Não Paga (Pagar Depois)
          </button>

          {/* Botões Inferiores */}
          <div
            style={{
              display: "flex",
              gap: 12,
            }}
          >
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>

            <button
              onClick={handleConfirm}
              disabled={
                !formaPagamento ||
                (formaPagamento === "dinheiro" &&
                  (!valorRecebido || parseFloat(valorRecebido) < total))
              }
              style={{
                flex: 2,
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background:
                  !formaPagamento ||
                  (formaPagamento === "dinheiro" &&
                    (!valorRecebido || parseFloat(valorRecebido) < total))
                    ? "#9ca3af"
                    : "#10b981",
                color: "#fff",
                cursor:
                  !formaPagamento ||
                  (formaPagamento === "dinheiro" &&
                    (!valorRecebido || parseFloat(valorRecebido) < total))
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 500,
              }}
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
