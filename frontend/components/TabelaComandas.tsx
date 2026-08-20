// components/DetalhesVenda.tsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart,
  faTrash,
  faCheck,
  faBan,
  faClock,
  faCalendar,
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
  order_number?: string;
  order_date?: string;
  customer_name: string;
  status: string;
  total?: number;
  items?: VendaItem[];
  created_at?: string;
  closed_at?: string;
  table_id?: number;
}

interface PontoVenda {
  id: number;
  number: number;
  restaurant_id: number;
}

interface DetalhesVendaProps {
  venda: Venda | null;
  pontosVenda: PontoVenda[];
  onRemoverItem: (vendaId: number, itemId: number) => void;
  onFinalizarVenda: () => void;
  onCancelarVenda: (vendaId: number) => Promise<void>;
  onMarcarNaoPaga: (vendaId: number) => Promise<void>;
  formatCurrency: (value: any) => string;
  isMobile?: boolean;
}

export const DetalhesVenda: React.FC<DetalhesVendaProps> = ({
  venda,
  pontosVenda,
  onRemoverItem,
  onFinalizarVenda,
  onCancelarVenda,
  onMarcarNaoPaga,
  formatCurrency,
  isMobile = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");

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
    setToast({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 1000);
  };

  const calcularTotal = (items?: VendaItem[]) => {
    if (!items) return 0;

    return items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );
  };

  const agruparItens = (items?: VendaItem[]) => {
    if (!items) return [];

    const agrupados: VendaItem[] = [];

    items.forEach((item) => {
      const existente = agrupados.find(
        (i) =>
          i.product_id === item.product_id &&
          Number(i.price) === Number(item.price),
      );

      if (existente) {
        existente.quantity += Number(item.quantity);
      } else {
        agrupados.push({
          ...item,
          quantity: Number(item.quantity),
        });
      }
    });

    return agrupados;
  };

  const getNomePontoVenda = (tableId?: number) => {
    if (!tableId) return "-";

    const ponto = pontosVenda.find((p) => p.id === tableId);

    if (!ponto) return "-";

    return ponto.number === 0
      ? "Balcão"
      : `Ponto ${ponto.number.toString().padStart(2, "0")}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "aberto":
        return {
          text: "Em andamento",
          color: "#b45309",
          bg: "#fffbeb",
        };

      case "fechado":
        return {
          text: "Finalizada",
          color: "#047857",
          bg: "#ecfdf5",
        };

      case "pendente":
        return {
          text: "Não paga",
          color: "#b91c1c",
          bg: "#fef2f2",
        };

      case "cancelado":
        return {
          text: "Cancelada",
          color: "#6b7280",
          bg: "#f3f4f6",
        };

      default:
        return {
          text: status,
          color: "#6b7280",
          bg: "#f3f4f6",
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString.substring(0, 10);
    }

    return date.toLocaleDateString("pt-BR");
  };

  const handleCancelarVenda = async () => {
    if (!venda) return;

    if (confirmText !== "CANCELAR") {
      showToast('Digite "CANCELAR" para confirmar o cancelamento', "error");
      return;
    }

    setLoading(true);

    try {
      await onCancelarVenda(venda.id);

      showToast(
        `Venda #${venda.order_number || venda.id} cancelada com sucesso!`,
        "success",
      );

      setShowCancelModal(false);
      setConfirmText("");
    } catch (error) {
      showToast("Erro ao cancelar venda", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarNaoPaga = async () => {
    if (!venda) return;

    if (
      confirm(`Marcar venda #${venda.order_number || venda.id} como não paga?`)
    ) {
      setLoading(true);

      try {
        await onMarcarNaoPaga(venda.id);

        showToast(
          `Venda #${venda.order_number || venda.id} marcada como não paga!`,
          "success",
        );
      } catch (error) {
        showToast("Erro ao marcar venda", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFinalizarVenda = () => {
    onFinalizarVenda();
  };

  const ToastComponent = () => {
    if (!toast.show) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 20,
          right: isMobile ? 10 : 20,
          left: isMobile ? 10 : "auto",
          zIndex: 10000,
        }}
      >
        <div
          style={{
            background: "#fff",
            color: "#374151",
            padding: "12px 16px",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            border: "1px solid #e5e7eb",
            fontSize: 13,
            fontWeight: 500,
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              minWidth: 28,
              borderRadius: "50%",
              background: toast.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: toast.type === "success" ? "#059669" : "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={toast.type === "success" ? faCheck : faBan}
              style={{ fontSize: 13 }}
            />
          </div>

          <span
            style={{
              minWidth: 0,
              overflowWrap: "anywhere",
            }}
          >
            {toast.message}
          </span>
        </div>
      </div>
    );
  };

  const CancelModal = () => {
    if (!showCancelModal || !venda) return null;

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: 16,
          boxSizing: "border-box",
        }}
        onClick={() => {
          setShowCancelModal(false);
          setConfirmText("");
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            width: "100%",
            maxWidth: 420,
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
            boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
            boxSizing: "border-box",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "22px 24px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                minWidth: 42,
                borderRadius: 10,
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <FontAwesomeIcon icon={faBan} style={{ fontSize: 18 }} />
            </div>

            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Cancelar venda
            </h3>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "#6b7280",
                lineHeight: 1.5,
              }}
            >
              Você está prestes a cancelar a venda{" "}
              <strong style={{ color: "#374151" }}>
                #{venda.order_number || venda.id}
              </strong>
              .
            </p>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: 12,
                lineHeight: 1.5,
                marginBottom: 18,
              }}
            >
              Esta ação não poderá ser desfeita.
            </div>

            <label
              style={{
                display: "block",
                marginBottom: 7,
                fontSize: 12,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Digite <strong style={{ color: "#dc2626" }}>CANCELAR</strong> para
              confirmar
            </label>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="CANCELAR"
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                outline: "none",
                color: "#111827",
                background: "#fff",
              }}
            />
          </div>

          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => {
                setShowCancelModal(false);
                setConfirmText("");
              }}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                flex: isMobile ? 1 : "initial",
              }}
            >
              Voltar
            </button>

            <button
              onClick={handleCancelarVenda}
              disabled={confirmText !== "CANCELAR" || loading}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: confirmText === "CANCELAR" ? "#dc2626" : "#e5e7eb",
                color: confirmText === "CANCELAR" ? "#fff" : "#9ca3af",
                cursor: confirmText === "CANCELAR" ? "pointer" : "not-allowed",
                fontSize: 13,
                fontWeight: 500,
                flex: isMobile ? 1 : "initial",
              }}
            >
              {loading ? "Cancelando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!venda) {
    return (
      <div
        style={{
          height: "100%",
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          padding: 40,
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            minWidth: 64,
            borderRadius: "50%",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <FontAwesomeIcon
            icon={faShoppingCart}
            style={{
              fontSize: 26,
              color: "#9ca3af",
            }}
          />
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            color: "#6b7280",
          }}
        >
          Selecione uma venda
        </p>

        <p
          style={{
            margin: "6px 0 0",
            fontSize: 12,
            color: "#9ca3af",
            maxWidth: 320,
          }}
        >
          Escolha uma comanda na lista para visualizar os detalhes.
        </p>
      </div>
    );
  }

  const statusInfo = getStatusText(venda.status);
  const totalVenda = calcularTotal(venda.items);
  const itensAgrupados = agruparItens(venda.items);
  const temItens = Boolean(venda.items && venda.items.length > 0);

  const podeFinalizar =
    (venda.status === "aberto" || venda.status === "pendente") && temItens;

  const podeCancelar = venda.status === "aberto" || venda.status === "pendente";

  const podeMarcarNaoPaga = venda.status === "fechado";

  const AcoesVenda = ({ mobile = false }: { mobile?: boolean }) => {
    return (
      <div
        style={{
          marginTop: mobile ? 14 : 20,
          paddingTop: mobile ? 12 : 14,
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "stretch",
          justifyContent: mobile ? "stretch" : "flex-end",
          gap: 8,
          flexWrap: "wrap",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {podeCancelar && (
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={loading}
            title="Cancelar venda"
            style={{
              minHeight: 38,
              padding: mobile ? "9px 11px" : "9px 12px",
              background: "#fff",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              borderRadius: 7,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 11,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              flex: mobile ? "1 1 100px" : "0 0 auto",
              boxSizing: "border-box",
            }}
          >
            <FontAwesomeIcon icon={faBan} style={{ fontSize: 10 }} />
            Cancelar
          </button>
        )}

        {podeMarcarNaoPaga && (
          <button
            onClick={handleMarcarNaoPaga}
            disabled={loading}
            title="Marcar como não paga"
            style={{
              minHeight: 38,
              padding: mobile ? "9px 11px" : "9px 12px",
              background: "#fff",
              color: "#b45309",
              border: "1px solid #fde68a",
              borderRadius: 7,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 11,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              flex: mobile ? "1 1 100px" : "0 0 auto",
              boxSizing: "border-box",
            }}
          >
            <FontAwesomeIcon icon={faClock} style={{ fontSize: 10 }} />
            Não paga
          </button>
        )}

        {podeFinalizar && (
          <button
            onClick={handleFinalizarVenda}
            disabled={loading}
            style={{
              minHeight: 38,
              padding: mobile ? "9px 14px" : "9px 16px",
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 11,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              flex: mobile ? "1.3 1 130px" : "0 0 auto",
              boxSizing: "border-box",
            }}
          >
            <FontAwesomeIcon icon={faCheck} style={{ fontSize: 10 }} />
            {venda.status === "pendente"
              ? "Finalizar e receber"
              : "Finalizar venda"}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <ToastComponent />
      <CancelModal />

      <div
        style={{
          width: "100%",
          height: isMobile ? "auto" : "100%",
          minWidth: 0,
          minHeight: 0,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          color: "#111827",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: isMobile ? 16 : "22px 24px",
            borderBottom: "1px solid #f1f5f9",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: 12,
              minWidth: 0,
            }}
          >
            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  minWidth: 0,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: isMobile ? 15 : 20,
                    fontWeight: 600,
                    letterSpacing: "-0.3px",
                    color: "#111827",
                    overflowWrap: "anywhere",
                  }}
                >
                  {isMobile ? "Venda #" : "Ordem nº : "}
                  {venda.order_number || venda.id}
                </h2>

                <span
                  style={{
                    padding: isMobile ? "4px 8px" : "4px 9px",
                    borderRadius: 20,
                    fontSize: isMobile ? 9 : 12,
                    fontWeight: 600,
                    background: statusInfo.bg,
                    color: statusInfo.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {statusInfo.text}
                </span>
              </div>

              <p
                style={{
                  margin: "7px 0 0",
                  fontSize: isMobile ? 12 : 14,
                  color: "#6b7280",
                  overflowWrap: "anywhere",
                }}
              >
                {venda.customer_name}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 12 : 22,
              marginTop: isMobile ? 12 : 18,
              paddingTop: isMobile ? 0 : 14,
              borderTop: isMobile ? "none" : "1px solid #f8fafc",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: isMobile ? 10 : 12,
                color: isMobile ? "#9ca3af" : "#6b7280",
              }}
            >
              Ponto:{" "}
              <strong
                style={{
                  color: "#374151",
                  fontWeight: 500,
                }}
              >
                {getNomePontoVenda(venda.table_id)}
              </strong>
            </span>

            <span
              style={{
                fontSize: isMobile ? 10 : 12,
                color: isMobile ? "#9ca3af" : "#6b7280",
              }}
            >
              {isMobile && (
                <FontAwesomeIcon icon={faCalendar} style={{ marginRight: 4 }} />
              )}
              Data:{" "}
              <strong
                style={{
                  color: "#374151",
                  fontWeight: 500,
                }}
              >
                {formatDate(venda.order_date)}
              </strong>
            </span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: isMobile ? "visible" : "auto",
            overflowX: "hidden",
            padding: isMobile ? 14 : "22px 24px",
            boxSizing: "border-box",
          }}
        >
          {!temItens ? (
            <div
              style={{
                minHeight: isMobile ? 180 : 260,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                textAlign: "center",
                padding: 20,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: isMobile ? 48 : 58,
                  height: isMobile ? 48 : 58,
                  minWidth: isMobile ? 48 : 58,
                  borderRadius: "50%",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <FontAwesomeIcon
                  icon={faShoppingCart}
                  style={{
                    fontSize: isMobile ? 18 : 22,
                  }}
                />
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 500,
                  color: "#6b7280",
                }}
              >
                Nenhum item adicionado
              </p>

              {!isMobile && (
                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: 11,
                  }}
                >
                  Clique nos produtos ao lado para adicionar.
                </p>
              )}
            </div>
          ) : isMobile ? (
            <div
              style={{
                width: "100%",
                maxWidth: "100%",
                border: "1px solid #eef2f7",
                borderRadius: 9,
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              {itensAgrupados.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    padding: "12px 10px",
                    borderBottom:
                      index < itensAgrupados.length - 1
                        ? "1px solid #f1f5f9"
                        : "none",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 10,
                      minWidth: 0,
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
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#1f2937",
                          overflowWrap: "anywhere",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.product?.name || `Produto ${item.product_id}`}
                      </div>

                      {item.product?.product_code && (
                        <div
                          style={{
                            marginTop: 3,
                            fontSize: 9,
                            color: "#9ca3af",
                          }}
                        >
                          Cód. {item.product.product_code}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 10,
                          color: "#9ca3af",
                        }}
                      >
                        {item.quantity} × {formatCurrency(item.price)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 12,
                          color: "#059669",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(item.price * item.quantity)}
                      </strong>

                      {(venda.status === "aberto" ||
                        venda.status === "pendente") && (
                        <button
                          onClick={() => onRemoverItem(venda.id, item.id)}
                          title="Remover item"
                          style={{
                            width: 28,
                            height: 28,
                            minWidth: 28,
                            borderRadius: 6,
                            border: "none",
                            background: "#fef2f2",
                            color: "#dc2626",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            style={{ fontSize: 11 }}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  padding: "13px 10px",
                  background: "#fafafa",
                  boxSizing: "border-box",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#6b7280",
                  }}
                >
                  Total
                </span>

                <strong
                  style={{
                    fontSize: 17,
                    color: "#059669",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(totalVenda)}
                </strong>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                border: "1px solid #eef2f7",
                borderRadius: 10,
                overflowX: "auto",
                overflowY: "hidden",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  minWidth: 530,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(180px, 1fr) 70px 110px 120px 50px",
                    padding: "10px 14px",
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
                  <div style={{ textAlign: "center" }}>Qtd</div>
                  <div style={{ textAlign: "right" }}>Unitário</div>
                  <div style={{ textAlign: "right" }}>Subtotal</div>
                  <div />
                </div>

                {itensAgrupados.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(180px, 1fr) 70px 110px 120px 50px",
                      alignItems: "center",
                      padding: "13px 14px",
                      borderBottom:
                        index < itensAgrupados.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          color: "#1f2937",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {item.product?.name || `Produto ${item.product_id}`}
                      </div>

                      {item.product?.product_code && (
                        <div
                          style={{
                            marginTop: 3,
                            fontSize: 10,
                            color: "#9ca3af",
                          }}
                        >
                          Cód. {item.product.product_code}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                        color: "#374151",
                        fontWeight: 500,
                      }}
                    >
                      {item.quantity}
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(item.price)}
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        color: "#059669",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(item.price * item.quantity)}
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                      }}
                    >
                      {(venda.status === "aberto" ||
                        venda.status === "pendente") && (
                        <button
                          onClick={() => onRemoverItem(venda.id, item.id)}
                          title="Remover item"
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border: "none",
                            background: "#fef2f2",
                            color: "#dc2626",
                            cursor: "pointer",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            style={{ fontSize: 12 }}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 20,
                    padding: "16px 14px",
                    background: "#fafafa",
                    flexWrap: "wrap",
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
                      fontSize: 20,
                      color: "#059669",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totalVenda)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <AcoesVenda mobile={isMobile} />
        </div>
      </div>
    </>
  );
};
