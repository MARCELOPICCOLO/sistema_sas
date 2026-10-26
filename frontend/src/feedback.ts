/**
 * Feedback visual do sistema: toasts (no lugar de alert) e diálogo de
 * confirmação (no lugar de confirm). Funciona fora de componentes React:
 *
 *   notify("Produto salvo!");                  // tipo detectado pelo texto
 *   notify("Falha ao salvar", "error");
 *   if (await confirmar("Excluir o item?")) { ... }
 *
 * A interface é desenhada por <FeedbackHost />, montado na raiz.
 */

export type ToastTipo = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensagem: string;
}

export interface Confirmacao {
  mensagem: string;
  resolver: (ok: boolean) => void;
}

export type Estado = { toasts: Toast[]; confirmacao: Confirmacao | null };

let estado: Estado = { toasts: [], confirmacao: null };
const ouvintes = new Set<(e: Estado) => void>();
let proximoId = 1;

const emitir = (novo: Partial<Estado>) => {
  estado = { ...estado, ...novo };
  ouvintes.forEach((fn) => fn(estado));
};

// Emojis que as telas antigas colocavam nas mensagens (✅ ❌ ⚠️ 💡 📋).
const EMOJIS = /(?:✅|❌|⚠️?|\u{1F4A1}|\u{1F4CB})/gu;

const detectarTipo = (mensagem: string): ToastTipo => {
  const m = mensagem.toLowerCase();
  if (/❌|erro|não foi possível|falha|inválid|não encontrad/.test(m)) return "error";
  if (
    /✅|sucesso|salv[oa]|criad[oa]|atualizad[oa]|removid[oa]|excluíd[oa]|concluíd[oa]|registrad[oa]/.test(m)
  )
    return "success";
  if (/selecione|informe|preencha|adicione|obrigat|atenção|⚠/.test(m)) return "warning";
  return "info";
};

export function notify(mensagem: unknown, tipo?: ToastTipo) {
  const original = String(mensagem ?? "");
  const texto = original.replace(EMOJIS, "").trim();
  if (!texto) return;

  const toast: Toast = { id: proximoId++, tipo: tipo ?? detectarTipo(original), mensagem: texto };
  emitir({ toasts: [...estado.toasts, toast].slice(-4) });

  const duracao = toast.tipo === "error" ? 6000 : 4000;
  window.setTimeout(() => fecharToast(toast.id), duracao);
}

export function fecharToast(id: number) {
  emitir({ toasts: estado.toasts.filter((t) => t.id !== id) });
}

export function confirmar(mensagem: string): Promise<boolean> {
  // Uma confirmação pendente é recusada se outra for aberta.
  estado.confirmacao?.resolver(false);

  return new Promise((resolve) => {
    emitir({
      confirmacao: {
        mensagem,
        resolver: (ok) => {
          emitir({ confirmacao: null });
          resolve(ok);
        },
      },
    });
  });
}

export const estadoAtual = () => estado;

export function assinar(fn: (e: Estado) => void) {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}
