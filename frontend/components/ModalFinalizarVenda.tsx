// components/ModalFinalizarVenda.tsx

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faClock,
  faMoneyBillWave,
  faMobileScreenButton,
  faCreditCard,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

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
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    ) || 0;

  const opcoesPagamento = [
    {
      value: "dinheiro",
      label: "Dinheiro",
      icon: faMoneyBillWave,
    },
    {
      value: "pix",
      label: "PIX",
      icon: faMobileScreenButton,
    },
    {
      value: "credito",
      label: "Crédito",
      icon: faCreditCard,
    },
    {
      value: "debito",
      label: "Débito",
      icon: faCreditCard,
    },
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

  const pagamentoValido =
    formaPagamento &&
    (formaPagamento !== "dinheiro" ||
      (valorRecebido && parseFloat(valorRecebido) >= total));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
          color: "#111827",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================
            HEADER
        ========================= */}

        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #f1f5f9",
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
                color: "#111827",
              }}
            >
              Finalizar venda
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Venda #{venda.id} • {venda.customer_name}
            </p>
          </div>

          <button
            onClick={handleClose}
            title="Fechar"
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              border: "none",
              background: "#f9fafb",
              color: "#6b7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: 13 }} />
          </button>
        </div>

        {/* =========================
            CONTEÚDO
        ========================= */}

        <div
          style={{
            padding: "18px 20px",
          }}
        >
          {/* TOTAL */}

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #eef2f7",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              Total da venda
            </span>

            <strong
              style={{
                fontSize: 21,
                color: "#059669",
                fontWeight: 700,
              }}
            >
              {formatCurrency(total)}
            </strong>
          </div>

          {/* FORMA DE PAGAMENTO */}

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                marginBottom: 9,
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Forma de pagamento
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {opcoesPagamento.map((opcao) => {
                const selecionado = formaPagamento === opcao.value;

                return (
                  <button
                    key={opcao.value}
                    type="button"
                    onClick={() => handleFormaPagamentoChange(opcao.value)}
                    style={{
                      minHeight: 48,
                      padding: "9px 11px",
                      borderRadius: 8,
                      border: selecionado
                        ? "1px solid #10b981"
                        : "1px solid #e5e7eb",
                      background: selecionado ? "#ecfdf5" : "#fff",
                      color: selecionado ? "#047857" : "#374151",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!selecionado) {
                        e.currentTarget.style.background = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selecionado) {
                        e.currentTarget.style.background = "#fff";
                      }
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: selecionado ? 600 : 500,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={opcao.icon}
                        style={{
                          fontSize: 13,
                          color: selecionado ? "#059669" : "#9ca3af",
                        }}
                      />

                      {opcao.label}
                    </span>

                    {selecionado && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        style={{
                          fontSize: 11,
                          color: "#059669",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DINHEIRO */}

          {formaPagamento === "dinheiro" && (
            <div
              style={{
                marginBottom: 18,
                padding: 14,
                background: "#fafafa",
                border: "1px solid #eef2f7",
                borderRadius: 9,
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Valor recebido
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 12,
                    color: "#6b7280",
                    pointerEvents: "none",
                  }}
                >
                  R$
                </span>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorRecebido}
                  onChange={handleValorRecebidoChange}
                  placeholder="0,00"
                  autoFocus
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px 10px 34px",
                    borderRadius: 7,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    color: "#111827",
                    fontSize: 13,
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(16,185,129,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {troco > 0 && (
                <div
                  style={{
                    marginTop: 9,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 11px",
                    background: "#ecfdf5",
                    borderRadius: 7,
                    color: "#047857",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    Troco
                  </span>

                  <strong
                    style={{
                      fontSize: 13,
                    }}
                  >
                    {formatCurrency(troco)}
                  </strong>
                </div>
              )}

              {valorRecebido && parseFloat(valorRecebido) < total && (
                <div
                  style={{
                    marginTop: 9,
                    padding: "8px 10px",
                    background: "#fef2f2",
                    borderRadius: 7,
                    color: "#b91c1c",
                    fontSize: 11,
                  }}
                >
                  Valor insuficiente. Faltam{" "}
                  <strong>
                    {formatCurrency(total - parseFloat(valorRecebido))}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* PAGAMENTO POSTERIOR */}

          <button
            type="button"
            onClick={handleComandaNaoPaga}
            style={{
              width: "100%",
              padding: "9px 12px",
              marginBottom: 18,
              borderRadius: 7,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.color = "#374151";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#6b7280";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <FontAwesomeIcon icon={faClock} style={{ fontSize: 11 }} />
            Marcar comanda como não paga
          </button>
        </div>

        {/* =========================
            FOOTER
        ========================= */}

        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            gap: 9,
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 7,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!pagamentoValido}
            style={{
              flex: 1.5,
              padding: "10px 14px",
              borderRadius: 7,
              border: "none",
              background: pagamentoValido ? "#10b981" : "#e5e7eb",
              color: pagamentoValido ? "#fff" : "#9ca3af",
              cursor: pagamentoValido ? "pointer" : "not-allowed",
              fontSize: 12,
              fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (pagamentoValido) {
                e.currentTarget.style.background = "#059669";
              }
            }}
            onMouseLeave={(e) => {
              if (pagamentoValido) {
                e.currentTarget.style.background = "#10b981";
              }
            }}
          >
            Finalizar venda
          </button>
        </div>
      </div>
    </div>
  );
};
