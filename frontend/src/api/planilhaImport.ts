import api from "./axios";

export type TipoPlanilha = "gastos" | "vendas";

/** Linha da prévia devolvida pelo servidor (campos variam conforme o tipo). */
export interface LinhaImportacao {
  line: number;
  date: string | null;
  amount: number | null;
  errors: string[];
  // gastos
  description?: string;
  category_name?: string | null;
  // vendas
  customer_name?: string;
  payment_label?: string | null;
}

export interface ResumoImportacao {
  total: number;
  valid: number;
  invalid: number;
}

export interface ResultadoImportacao {
  message: string;
  imported: number;
  summary: ResumoImportacao;
  skipped: { line: number; errors: string[] }[];
}

const CONFIG: Record<TipoPlanilha, { base: string; campoPadrao: string; arquivoModelo: string }> = {
  gastos: { base: "/expenses", campoPadrao: "default_category_id", arquivoModelo: "modelo-importacao-gastos.xls" },
  vendas: { base: "/orders", campoPadrao: "default_payment_method", arquivoModelo: "modelo-importacao-vendas.xls" },
};

const montarForm = (tipo: TipoPlanilha, arquivo: File, padrao: string | null, dryRun: boolean) => {
  const form = new FormData();
  form.append("file", arquivo);
  if (padrao) form.append(CONFIG[tipo].campoPadrao, padrao);
  if (dryRun) form.append("dry_run", "1");
  return form;
};

/** Valida a planilha no servidor sem gravar nada. */
export async function validarPlanilha(tipo: TipoPlanilha, arquivo: File, padrao: string | null) {
  const { data } = await api.post<{ summary: ResumoImportacao; rows: LinhaImportacao[] }>(
    `${CONFIG[tipo].base}/import`,
    montarForm(tipo, arquivo, padrao, true),
  );
  return data;
}

/** Grava as linhas válidas da planilha. */
export async function importarPlanilha(tipo: TipoPlanilha, arquivo: File, padrao: string | null) {
  const { data } = await api.post<ResultadoImportacao>(
    `${CONFIG[tipo].base}/import`,
    montarForm(tipo, arquivo, padrao, false),
  );
  return data;
}

/** Baixa o modelo .xls do tipo escolhido e dispara o download. */
export async function baixarModeloPlanilha(tipo: TipoPlanilha) {
  const { data } = await api.get<Blob>(`${CONFIG[tipo].base}/import-template`, { responseType: "blob" });

  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = CONFIG[tipo].arquivoModelo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
