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
import { notify, confirmar } from "../src/feedback";

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
      notify("Selecione uma forma de pagamento");
      return;
    }

    if (formaPagamento === "dinheiro") {
      const recebido = parseFloat(valorRecebido) || 0;

      if (recebido < total) {
        notify(`Valor insuficiente. Total da venda: ${formatCurrency(total)}`);
        return;
      }

      onConfirm(formaPagamento, recebido, false);
    } else {
      onConfirm(formaPagamento, undefined, false);
    }

    resetEstados();
  };

  const handleComandaNaoPaga = async () => {
    if (await confirmar("Confirmar que este pedido não será pago agora?")) {
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
        background: "var(--overlay)",
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
          background: "var(--surface)",
          borderRadius: 14,
          boxShadow: "var(--shadow-modal)",
          color: "var(--text)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================
            HEADER
        ========================= */}

        <div
          style={{
            padding: "18px 20px",
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
                fontSize: "var(--fs-xl)",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              Finalizar venda
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
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
              borderRadius: 8,
              border: "none",
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-3)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: "var(--fs-sm)" }} />
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
              background: "var(--surface-2)",
              border: "1px solid var(--surface-3)",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Total da venda
            </span>

            <strong
              style={{
                fontSize: "var(--fs-2xl)",
                color: "var(--primary)",
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
                fontSize: "var(--fs-xs)",
                fontWeight: 600,
                color: "var(--text-secondary)",
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
                      borderRadius: 10,
                      border: selecionado
                        ? "1px solid var(--primary)"
                        : "1px solid var(--border)",
                      background: selecionado ? "var(--primary-soft)" : "var(--surface)",
                      color: selecionado ? "var(--primary-hover)" : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!selecionado) {
                        e.currentTarget.style.background = "var(--surface-2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selecionado) {
                        e.currentTarget.style.background = "var(--surface)";
                      }
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: "var(--fs-xs)",
                        fontWeight: selecionado ? 600 : 500,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={opcao.icon}
                        style={{
                          fontSize: "var(--fs-sm)",
                          color: selecionado ? "var(--primary)" : "var(--text-subtle)",
                        }}
                      />

                      {opcao.label}
                    </span>

                    {selecionado && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        style={{
                          fontSize: "var(--fs-2xs)",
                          color: "var(--primary)",
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
                background: "var(--surface-2)",
                border: "1px solid var(--surface-3)",
                borderRadius: 12,
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: 7,
                  fontSize: "var(--fs-xs)",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
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
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-muted)",
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
                    borderRadius: 8,
                    border: "1px solid var(--border-strong)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "var(--fs-sm)",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px var(--primary-ring)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-strong)";
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
                    background: "var(--primary-soft)",
                    borderRadius: 8,
                    color: "var(--primary-hover)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--fs-2xs)",
                      fontWeight: 500,
                    }}
                  >
                    Troco
                  </span>

                  <strong
                    style={{
                      fontSize: "var(--fs-sm)",
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
                    background: "var(--danger-soft)",
                    borderRadius: 8,
                    color: "var(--danger-hover)",
                    fontSize: "var(--fs-2xs)",
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
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "var(--fs-2xs)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.borderColor = "var(--border-strong)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <FontAwesomeIcon icon={faClock} style={{ fontSize: "var(--fs-2xs)" }} />
            Marcar pedido como não pago
          </button>
        </div>

        {/* =========================
            FOOTER
        ========================= */}

        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--surface-3)",
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
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "var(--fs-xs)",
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
              borderRadius: 8,
              border: "none",
              background: pagamentoValido ? "var(--primary)" : "var(--border)",
              color: pagamentoValido ? "#fff" : "var(--text-subtle)",
              cursor: pagamentoValido ? "pointer" : "not-allowed",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (pagamentoValido) {
                e.currentTarget.style.background = "var(--primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (pagamentoValido) {
                e.currentTarget.style.background = "var(--primary)";
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
