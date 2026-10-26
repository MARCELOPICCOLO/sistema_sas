export type Tema = "light" | "dark";

const CHAVE = "tema";

/** Tema salvo pelo usuário; sem preferência salva, segue o sistema operacional. */
export function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === "light" || salvo === "dark") return salvo;
  } catch {
    // localStorage indisponível (modo privado): usa a preferência do sistema.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function aplicarTema(tema: Tema) {
  document.documentElement.dataset.theme = tema;
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    // Sem persistência: o tema vale só para esta sessão.
  }
}
