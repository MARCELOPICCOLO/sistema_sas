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
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          width: "90%",
          maxWidth: 450,
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 24 }}>Abrir Comanda</h2>
            <p style={{ margin: "8px 0 0", color: "#6b7280" }}>
              Preencha os dados abaixo
            </p>
          </div>

          {/* Campo: Número do Terminal de Venda */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Número do Terminal de Venda{" "}
              <span style={{ color: "#dc2626" }}>*</span>
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
              placeholder="Ex: 1, 2, 3..."
              autoFocus
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                outline: "none",
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
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              * Digite o número do terminal de venda (PDV)
            </p>
          </div>

          {/* Campo: Nome do Cliente - OPCIONAL */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Nome do Cliente{" "}
              <span style={{ color: "#9ca3af", fontSize: 12 }}>(opcional)</span>
            </label>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Deixe em branco para 'Venda Rápida'"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                outline: "none",
              }}
            />
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              * Se não preenchido, será usado "Venda Rápida"
            </p>
          </div>

          {/* Campo: Data da Comanda */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Data da Comanda
            </label>
            <input
              type="date"
              value={dataComanda}
              onChange={(e) => setDataComanda(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                outline: "none",
              }}
            />
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              * Data em que a venda foi realizada
            </p>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: loading ? "#9ca3af" : "#10b981",
                color: "#fff",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
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
