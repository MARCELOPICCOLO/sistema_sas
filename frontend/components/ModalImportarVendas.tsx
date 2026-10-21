import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faFileLines, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import React from "react";

interface ModalImportarVendasProps {
  showModalImportarVendas: boolean;
  setShowModalImportarVendas: (show: boolean) => void;
  importFile: File | null;
  setImportFile: (file: File | null) => void;
  importPreview: any[];
  importing: boolean;
  previewCSV: (file: File) => void;
  importarVendasCSV: () => void;
}

export const ModalImportarVendas: React.FC<ModalImportarVendasProps> = ({
  showModalImportarVendas,
  setShowModalImportarVendas,
  importFile,
  setImportFile,
  importPreview,
  importing,
  previewCSV,
  importarVendasCSV,
}) => {
  if (!showModalImportarVendas) return null;

  // Função para formatar data no preview
  const formatPreviewDate = (dateStr: string): string => {
    if (!dateStr || dateStr === "N/A") return "N/A";

    // Se já estiver no formato ISO (YYYY-MM-DD)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    }

    return dateStr;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1003,
      }}
      onClick={() => setShowModalImportarVendas(false)}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          padding: 24,
          width: "90%",
          maxWidth: 650,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 20px 0", fontSize: "var(--fs-2xl)" }}>
          Importar Vendas (CSV)
        </h2>

        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "var(--surface-3)",
            borderRadius: 10,
          }}
        >
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", fontWeight: 500 }}>
            <FontAwesomeIcon icon={faFileLines} style={{ marginRight: 6, color: "var(--primary)" }} /> Formato esperado:
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
            <strong>Delimitador:</strong> ponto e vírgula (;) <br />
            <strong>Colunas:</strong> Data;Cliente;Valor;Pagamento
            <br />
            Exemplo: 05/01/2026;João Silva;150.00;pix
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "var(--fs-2xs)", color: "var(--primary)" }}>
            <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: 6 }} /> Datas nos formatos DD/MM/AAAA ou AAAA-MM-DD são aceitas
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: "var(--fs-md)",
              fontWeight: 500,
            }}
          >
            Arquivo CSV:
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImportFile(file);
                previewCSV(file);
              }
            }}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          />
        </div>

        {importPreview.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: "var(--fs-sm)", fontWeight: 500, marginBottom: 8 }}>
              Preview (primeiras 5 linhas):
            </p>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  fontSize: "var(--fs-xs)",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th
                      style={{
                        padding: "6px 8px",
                        border: "1px solid var(--border)",
                        textAlign: "left",
                      }}
                    >
                      Data Original
                    </th>
                    <th
                      style={{
                        padding: "6px 8px",
                        border: "1px solid var(--border)",
                        textAlign: "left",
                      }}
                    >
                      Data Convertida
                    </th>
                    <th
                      style={{
                        padding: "6px 8px",
                        border: "1px solid var(--border)",
                        textAlign: "left",
                      }}
                    >
                      Cliente
                    </th>
                    <th
                      style={{
                        padding: "6px 8px",
                        border: "1px solid var(--border)",
                        textAlign: "right",
                      }}
                    >
                      Valor
                    </th>
                    <th
                      style={{
                        padding: "6px 8px",
                        border: "1px solid var(--border)",
                        textAlign: "left",
                      }}
                    >
                      Pagamento
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, idx) => {
                    // Mapeamento direto dos campos que vêm do preview
                    const dataOriginal =
                      row.data_original || row.Data || row.data || "N/A";
                    const cliente =
                      row.cliente || row.Cliente || row.customer_name || "N/A";
                    const valor = row.valor || row.Valor || row.amount || "N/A";
                    const pagamento =
                      row.pagamento ||
                      row.Pagamento ||
                      row.payment_method ||
                      "N/A";

                    return (
                      <tr key={idx}>
                        <td
                          style={{
                            padding: "6px 8px",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {dataOriginal}
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            border: "1px solid var(--border)",
                            color: "var(--primary)",
                            fontWeight: 500,
                          }}
                        >
                          {formatPreviewDate(dataOriginal)}
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {cliente}
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            border: "1px solid var(--border)",
                            textAlign: "right",
                          }}
                        >
                          {valor}
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {pagamento}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {importPreview.length === 0 && importFile && (
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--danger)", marginTop: 12 }}>
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 6 }} /> Nenhum dado válido encontrado. Verifique se o arquivo está no
            formato correto.
          </p>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            onClick={() => {
              setShowModalImportarVendas(false);
              setImportFile(null);
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-secondary)",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "var(--shadow-card)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={importarVendasCSV}
            disabled={!importFile || importing}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: "none",
              background: !importFile || importing ? "var(--text-subtle)" : "var(--primary)",
              color: "#fff",
              fontWeight: 700,
              cursor: !importFile || importing ? "not-allowed" : "pointer",
            }}
          >
            {importing ? "Importando..." : "Importar"}
          </button>
        </div>
      </div>
    </div>
  );
};
