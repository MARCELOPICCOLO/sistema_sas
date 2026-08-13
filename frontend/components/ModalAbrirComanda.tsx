// components/ModalAbrirComanda.tsx
import React, { useState } from "react";

interface ModalAbrirComandaProps {
  showModal: boolean;
  onClose: () => void;
  onConfirm: (
    numeroComanda: number,
    nomeCliente: string,
    dataComanda: string,
  ) => Promise<void>;
}

export const ModalAbrirComanda: React.FC<ModalAbrirComandaProps> = ({
  showModal,
  onClose,
  onConfirm,
}) => {
  const hoje = new Date().toISOString().split("T")[0];

  const [numeroComanda, setNumeroComanda] = useState<number | "">("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [dataComanda, setDataComanda] = useState(hoje);
  const [loading, setLoading] = useState(false);

  if (!showModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar número da comanda - obrigatório
    if (numeroComanda === "" || numeroComanda <= 0) {
      alert("Digite um número de terminal válido (maior que 0)");
      return;
    }

    // Se nome do cliente estiver vazio, usar "Venda Rápida"
    const clienteFinal =
      nomeCliente.trim() === "" ? "Venda Rápida" : nomeCliente.trim();

    setLoading(true);

    try {
      await onConfirm(Number(numeroComanda), clienteFinal, dataComanda);

      setNumeroComanda("");
      setNomeCliente("");
      setDataComanda(hoje);
      onClose();
    } catch (error) {
      console.error("Erro ao abrir comanda:", error);
      alert("Erro ao abrir atendimento");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 7,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#111827",
    fontSize: 13,
    outline: "none",
    transition: "all 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(17, 24, 39, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: 20,
          width: "100%",
          maxWidth: 430,
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          border: "1px solid #e5e7eb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* CABEÇALHO */}
          <div
            style={{
              marginBottom: 20,
              paddingBottom: 14,
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Abrir Comanda
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                color: "#9ca3af",
                fontSize: 12,
              }}
            >
              Informe os dados do atendimento
            </p>
          </div>

          {/* TERMINAL + DATA */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {/* Número do Terminal */}
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Ponto da Venda <span style={{ color: "#dc2626" }}>*</span>
              </label>

              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={numeroComanda}
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? "" : Number(e.target.value);

                  setNumeroComanda(value);
                }}
                placeholder="Ex: 1"
                autoFocus
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#10b981";
                  e.currentTarget.style.boxShadow = "0 0 0 2px #d1fae5";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "e" ||
                    e.key === "E" ||
                    e.key === "-" ||
                    e.key === "+"
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </div>

            {/* Data */}
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Data da Comanda</label>

              <input
                type="date"
                value={dataComanda}
                onChange={(e) => setDataComanda(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#10b981";
                  e.currentTarget.style.boxShadow = "0 0 0 2px #d1fae5";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* CLIENTE */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              Nome do Cliente{" "}
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: 10,
                  fontWeight: 400,
                }}
              >
                (opcional)
              </span>
            </label>

            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Deixe vazio para Venda Rápida"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#10b981";
                e.currentTarget.style.boxShadow = "0 0 0 2px #d1fae5";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.boxShadow = "none";
              }}
            />

            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                color: "#9ca3af",
              }}
            >
              Se não informado, será usado "Venda Rápida"
            </div>
          </div>

          {/* BOTÕES */}
          <div
            style={{
              display: "flex",
              gap: 8,
              paddingTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "9px 14px",
                borderRadius: 7,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#6b7280",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "9px 14px",
                borderRadius: 7,
                border: "none",
                background: loading ? "#d1d5db" : "#10b981",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#059669";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#10b981";
                }
              }}
            >
              {loading ? "Abrindo..." : "Abrir Comanda"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
