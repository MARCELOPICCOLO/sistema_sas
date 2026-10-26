import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faCircleCheck,
  faCircleExclamation,
  faCloudArrowUp,
  faDownload,
  faFileExcel,
  faFileImport,
  faRotate,
  faSpinner,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import { getErrorMessage } from "../src/api/axios";
import {
  baixarModeloPlanilha,
  importarPlanilha,
  validarPlanilha,
  type LinhaImportacao,
  type ResumoImportacao,
  type TipoPlanilha,
} from "../src/api/planilhaImport";
import { notify } from "../src/feedback";
import "./ModalImportarPlanilha.css";

interface CategoriaOpcao {
  id: number;
  name: string;
}

interface ModalImportarPlanilhaProps {
  aberto: boolean;
  /** Aba exibida ao abrir. */
  tipoInicial?: TipoPlanilha;
  onFechar: () => void;
  categorias: CategoriaOpcao[];
  /** Chamado depois de uma importação bem-sucedida (para recarregar o Caixa). */
  onImportado: () => void;
}

const EXTENSOES = [".xls", ".xlsx", ".csv"];
const TAMANHO_MAXIMO = 2 * 1024 * 1024;

const PAGAMENTOS = [
  { valor: "dinheiro", rotulo: "Dinheiro" },
  { valor: "pix", rotulo: "Pix" },
  { valor: "credito", rotulo: "Crédito" },
  { valor: "debito", rotulo: "Débito" },
  { valor: "pendente", rotulo: "Pendente (não pago)" },
];

/** O que muda entre importar gastos e vendas. */
const TIPOS: Record<
  TipoPlanilha,
  {
    rotulo: string;
    icone: typeof faArrowUp;
    colunas: string;
    colunaTexto: string;
    colunaExtra: string;
    rotuloPadrao: string;
    semPadrao: string;
    erroSemPadrao: string;
    singular: string;
    plural: string;
    textoLinha: (l: LinhaImportacao) => string;
    extraLinha: (l: LinhaImportacao) => string;
  }
> = {
  gastos: {
    rotulo: "Gastos",
    icone: faArrowDown,
    colunas: "Data, Descrição, Valor e Categoria",
    colunaTexto: "Descrição",
    colunaExtra: "Categoria",
    rotuloPadrao: "Categoria para linhas sem categoria",
    semPadrao: "Nenhuma (marcar como erro)",
    erroSemPadrao: "Categoria em branco",
    singular: "gasto",
    plural: "gastos",
    textoLinha: (l) => l.description || "—",
    extraLinha: (l) => l.category_name ?? "—",
  },
  vendas: {
    rotulo: "Vendas",
    icone: faArrowUp,
    colunas: "Data, Cliente, Valor e Pagamento",
    colunaTexto: "Cliente",
    colunaExtra: "Pagamento",
    rotuloPadrao: "Pagamento para linhas sem forma de pagamento",
    semPadrao: "Nenhuma (marcar como erro)",
    erroSemPadrao: "Forma de pagamento em branco",
    singular: "venda",
    plural: "vendas",
    textoLinha: (l) => l.customer_name || "—",
    extraLinha: (l) => l.payment_label ?? "—",
  },
};

const moeda = (valor: number | null) =>
  valor == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

const dataBR = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");

const tamanho = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;

export function ModalImportarPlanilha({
  aberto,
  tipoInicial = "gastos",
  onFechar,
  categorias,
  onImportado,
}: ModalImportarPlanilhaProps) {
  const [tipo, setTipo] = useState<TipoPlanilha>(tipoInicial);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [padrao, setPadrao] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaImportacao[] | null>(null);
  const [resumo, setResumo] = useState<ResumoImportacao | null>(null);
  const [erroArquivo, setErroArquivo] = useState("");
  const [validando, setValidando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [soErros, setSoErros] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  // Só a resposta da validação mais recente é aplicada (troca rápida de arquivo/opção).
  const ultimaValidacao = useRef(0);

  const config = TIPOS[tipo];

  const limpar = () => {
    ultimaValidacao.current++;
    setArquivo(null);
    setPadrao(null);
    setLinhas(null);
    setResumo(null);
    setErroArquivo("");
    setSoErros(false);
    setValidando(false);
  };

  const fechar = () => {
    if (importando) return;
    limpar();
    onFechar();
  };

  /** Valida no servidor (sem gravar) e mostra a prévia linha a linha. */
  const validar = async (alvoTipo: TipoPlanilha, alvo: File, opcaoPadrao: string | null) => {
    const id = ++ultimaValidacao.current;
    setValidando(true);
    setErroArquivo("");

    try {
      const dados = await validarPlanilha(alvoTipo, alvo, opcaoPadrao);
      if (id !== ultimaValidacao.current) return;
      setLinhas(dados.rows);
      setResumo(dados.summary);
      if (dados.summary.total === 0) setErroArquivo("A planilha não tem nenhuma linha preenchida.");
    } catch (erro) {
      if (id !== ultimaValidacao.current) return;
      setLinhas(null);
      setResumo(null);
      setErroArquivo(getErrorMessage(erro, "Não foi possível ler a planilha."));
    } finally {
      if (id === ultimaValidacao.current) setValidando(false);
    }
  };

  // Esc fecha o modal.
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const linhasVisiveis = useMemo(
    () => (linhas ?? []).filter((l) => !soErros || l.errors.length > 0),
    [linhas, soErros],
  );

  const temSemPadrao = (linhas ?? []).some((l) => l.errors.some((e) => e.startsWith(config.erroSemPadrao)));

  if (!aberto) return null;

  const trocarTipo = (novo: TipoPlanilha) => {
    if (novo === tipo || importando) return;
    limpar();
    setTipo(novo);
  };

  const escolherArquivo = (novo: File | undefined) => {
    if (!novo) return;

    const extensao = novo.name.slice(novo.name.lastIndexOf(".")).toLowerCase();
    if (!EXTENSOES.includes(extensao)) {
      setErroArquivo("Formato não suportado. Envie um arquivo .xls, .xlsx ou .csv.");
      return;
    }
    if (novo.size > TAMANHO_MAXIMO) {
      setErroArquivo("O arquivo passa de 2 MB.");
      return;
    }

    setLinhas(null);
    setResumo(null);
    setSoErros(false);
    setArquivo(novo);
    validar(tipo, novo, padrao);
  };

  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setArrastando(false);
    escolherArquivo(e.dataTransfer.files?.[0]);
  };

  const baixarModelo = async () => {
    setBaixando(true);
    try {
      await baixarModeloPlanilha(tipo);
    } catch (erro) {
      notify(getErrorMessage(erro, "Não foi possível baixar o modelo."), "error");
    } finally {
      setBaixando(false);
    }
  };

  const importar = async () => {
    if (!arquivo || !resumo?.valid) return;

    setImportando(true);
    try {
      const resultado = await importarPlanilha(tipo, arquivo, padrao);
      notify(resultado.message, "success");
      if (resultado.skipped.length) {
        notify(`${resultado.skipped.length} linha(s) com erro não foram importadas.`, "warning");
      }
      onImportado();
      limpar();
      onFechar();
    } catch (erro) {
      notify(getErrorMessage(erro, `Não foi possível importar os ${config.plural}.`), "error");
    } finally {
      setImportando(false);
    }
  };

  const opcoesPadrao =
    tipo === "gastos"
      ? categorias.map((c) => ({ valor: String(c.id), rotulo: c.name }))
      : PAGAMENTOS;

  return (
    <div className="imp-overlay" style={{ background: "var(--overlay)" }} onClick={fechar}>
      <div
        className="imp-modal"
        style={{ boxShadow: "var(--shadow-modal)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="imp-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="imp-head">
          <span className="imp-head__icon">
            <FontAwesomeIcon icon={faFileImport} />
          </span>
          <div>
            <h2 id="imp-titulo">Importar planilha</h2>
            <p>Gastos ou vendas a partir do Excel (.xls ou .xlsx) ou de um arquivo CSV</p>
          </div>
          <button className="imp-close" onClick={fechar} aria-label="Fechar" disabled={importando}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className="imp-tabs" role="tablist" aria-label="Tipo de planilha">
          {(Object.keys(TIPOS) as TipoPlanilha[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tipo === t}
              className={`imp-tab is-${t}${tipo === t ? " is-active" : ""}`}
              onClick={() => trocarTipo(t)}
              disabled={importando}
            >
              <FontAwesomeIcon icon={TIPOS[t].icone} />
              {TIPOS[t].rotulo}
            </button>
          ))}
        </div>

        <div className="imp-body">
          {/* Passo 1: modelo */}
          <section className="imp-step">
            <span className="imp-step__num">1</span>
            <div className="imp-step__text">
              <strong>Baixe o modelo de planilha de {config.plural}</strong>
              <small>
                {tipo === "gastos"
                  ? "Já vem com as colunas certas e a lista das suas categorias."
                  : "Já vem com as colunas certas e a lista das formas de pagamento."}
              </small>
            </div>
            <button className="btn btn-secondary imp-step__btn" onClick={baixarModelo} disabled={baixando}>
              <FontAwesomeIcon icon={baixando ? faSpinner : faDownload} spin={baixando} />
              Modelo de {config.plural} (.xls)
            </button>
          </section>

          {/* Passo 2: arquivo */}
          <section className="imp-step imp-step--column">
            <div className="imp-step__row">
              <span className="imp-step__num">2</span>
              <div className="imp-step__text">
                <strong>Envie a planilha preenchida</strong>
                <small>Colunas: {config.colunas}. Até 1.000 linhas, 2 MB.</small>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={EXTENSOES.join(",")}
              hidden
              onChange={(e) => {
                escolherArquivo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />

            {!arquivo ? (
              <button
                className={`imp-drop${arrastando ? " is-dragging" : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastando(true);
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={onDrop}
              >
                <FontAwesomeIcon icon={faCloudArrowUp} className="imp-drop__icon" />
                <strong>Arraste a planilha de {config.plural} aqui ou clique para escolher</strong>
                <small>.xls, .xlsx ou .csv</small>
              </button>
            ) : (
              <div className="imp-file">
                <FontAwesomeIcon icon={faFileExcel} className="imp-file__icon" />
                <div className="imp-file__info">
                  <strong>{arquivo.name}</strong>
                  <small>{tamanho(arquivo.size)}</small>
                </div>
                <button className="imp-link" onClick={() => inputRef.current?.click()} disabled={importando}>
                  <FontAwesomeIcon icon={faRotate} /> Trocar arquivo
                </button>
              </div>
            )}

            {erroArquivo && (
              <p className="imp-alert is-error">
                <FontAwesomeIcon icon={faCircleExclamation} /> {erroArquivo}
              </p>
            )}
          </section>

          {/* Passo 3: conferência */}
          {arquivo && !erroArquivo && (
            <section className="imp-step imp-step--column">
              <div className="imp-step__row">
                <span className="imp-step__num">3</span>
                <div className="imp-step__text">
                  <strong>Confira antes de importar</strong>
                  <small>
                    Só as linhas válidas serão gravadas
                    {tipo === "vendas" ? ", como vendas já finalizadas na data informada." : "."}
                  </small>
                </div>
              </div>

              <label className={`imp-default${temSemPadrao ? " is-highlight" : ""}`}>
                <span>{config.rotuloPadrao}</span>
                <select
                  value={padrao ?? ""}
                  onChange={(e) => {
                    const valor = e.target.value || null;
                    setPadrao(valor);
                    if (arquivo) validar(tipo, arquivo, valor);
                  }}
                  disabled={validando || importando}
                >
                  <option value="">{config.semPadrao}</option>
                  {opcoesPadrao.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.rotulo}
                    </option>
                  ))}
                </select>
              </label>

              {validando && !linhas ? (
                <div className="imp-loading">
                  <FontAwesomeIcon icon={faSpinner} spin /> Lendo a planilha...
                </div>
              ) : (
                resumo && (
                  <>
                    <div className="imp-summary">
                      <span>
                        <strong>{resumo.total}</strong> linhas
                      </span>
                      <span className="is-ok">
                        <FontAwesomeIcon icon={faCircleCheck} /> <strong>{resumo.valid}</strong> válidas
                      </span>
                      <span className={resumo.invalid ? "is-error" : ""}>
                        <FontAwesomeIcon icon={faCircleExclamation} /> <strong>{resumo.invalid}</strong> com erro
                      </span>
                      {resumo.invalid > 0 && (
                        <label className="imp-filter">
                          <input type="checkbox" checked={soErros} onChange={(e) => setSoErros(e.target.checked)} />
                          Mostrar só com erro
                        </label>
                      )}
                      {validando && <FontAwesomeIcon icon={faSpinner} spin className="imp-summary__spin" />}
                    </div>

                    <div className="imp-table-wrap">
                      <table className="imp-table">
                        <thead>
                          <tr>
                            <th>Linha</th>
                            <th>Data</th>
                            <th>{config.colunaTexto}</th>
                            <th className="is-right">Valor</th>
                            <th>{config.colunaExtra}</th>
                            <th>Situação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {linhasVisiveis.map((l) => (
                            <tr key={l.line} className={l.errors.length ? "is-invalid" : ""}>
                              <td className="is-muted">{l.line}</td>
                              <td>{dataBR(l.date)}</td>
                              <td className="imp-table__desc">{config.textoLinha(l)}</td>
                              <td className="is-right">{moeda(l.amount)}</td>
                              <td>{config.extraLinha(l)}</td>
                              <td>
                                {l.errors.length ? (
                                  <span className="imp-status is-error" title={l.errors.join("\n")}>
                                    <FontAwesomeIcon icon={faCircleExclamation} /> {l.errors[0]}
                                    {l.errors.length > 1 && ` (+${l.errors.length - 1})`}
                                  </span>
                                ) : (
                                  <span className="imp-status is-ok">
                                    <FontAwesomeIcon icon={faCircleCheck} /> OK
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              )}
            </section>
          )}
        </div>

        <footer className="imp-foot">
          <button className="btn btn-secondary" onClick={fechar} disabled={importando}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={importar} disabled={!resumo?.valid || validando || importando}>
            <FontAwesomeIcon icon={importando ? faSpinner : faFileImport} spin={importando} />
            {importando
              ? "Importando..."
              : resumo?.valid
                ? `Importar ${resumo.valid} ${resumo.valid === 1 ? config.singular : config.plural}`
                : "Importar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
