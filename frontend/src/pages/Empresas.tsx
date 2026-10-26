import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faPowerOff,
  faSpinner,
  faTrash,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

import api, { getErrorMessage } from "../api/axios";
import { confirmar, notify } from "../feedback";
import "./Empresas.css";

interface Empresa {
  id: number;
  corporate_name: string;
  trade_name: string | null;
  document: string;
  zip_code: string;
  street: string;
  number: string | null;
  district: string;
  city: string;
  state: string;
  active: boolean;
  users_count: number;
}

type Formulario = Omit<Empresa, "id" | "users_count" | "trade_name" | "number"> & {
  trade_name: string;
  number: string;
};

type Erros = Partial<Record<keyof Formulario, string>>;

const VAZIO: Formulario = {
  corporate_name: "",
  trade_name: "",
  document: "",
  zip_code: "",
  street: "",
  number: "",
  district: "",
  city: "",
  state: "",
  active: true,
};

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

/** Aplica um padrão como "000.000.000-00" aos dígitos já digitados. */
const aplicarPadrao = (digitos: string, padrao: string) => {
  let i = 0;
  let saida = "";
  for (const c of padrao) {
    if (i >= digitos.length) break;
    saida += c === "0" ? digitos[i++] : c;
  }
  return saida;
};

/** Máscara de CPF (até 11 dígitos) ou CNPJ (12 a 14 dígitos). */
const mascaraDocumento = (valor: string) => {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  return aplicarPadrao(d, d.length <= 11 ? "000.000.000-00" : "00.000.000/0000-00");
};

const mascaraCep = (valor: string) => aplicarPadrao(valor.replace(/\D/g, "").slice(0, 8), "00000-000");

const tipoDocumento = (doc: string) => (doc.replace(/\D/g, "").length > 11 ? "CNPJ" : "CPF");

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null);
  const [erroLista, setErroLista] = useState("");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<"todas" | "ativas" | "inativas">("todas");

  const [editando, setEditando] = useState<Empresa | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const buscarEmpresas = () => api.get<Empresa[]>("/admin/partner-companies").then(({ data }) => data);

  const aplicarLista = (lista: Empresa[] | null, erro?: unknown) => {
    setEmpresas(lista ?? []);
    setErroLista(erro ? getErrorMessage(erro, "Não foi possível carregar as empresas.") : "");
  };

  const carregar = () => buscarEmpresas().then(aplicarLista, (erro) => aplicarLista(null, erro));

  // Carga inicial: o estado só é alterado quando a requisição responde.
  useEffect(() => {
    let ativo = true;
    buscarEmpresas().then(
      (lista) => ativo && aplicarLista(lista),
      (erro) => ativo && aplicarLista(null, erro),
    );
    return () => {
      ativo = false;
    };
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, "");

    return (empresas ?? []).filter((e) => {
      if (status === "ativas" && !e.active) return false;
      if (status === "inativas" && e.active) return false;
      if (!termo) return true;

      return (
        e.corporate_name.toLowerCase().includes(termo) ||
        (e.trade_name ?? "").toLowerCase().includes(termo) ||
        e.city.toLowerCase().includes(termo) ||
        (digitos.length > 0 && e.document.replace(/\D/g, "").includes(digitos))
      );
    });
  }, [empresas, busca, status]);

  const totais = useMemo(() => {
    const lista = empresas ?? [];
    return { total: lista.length, ativas: lista.filter((e) => e.active).length };
  }, [empresas]);

  const abrirNovo = () => {
    setEditando(null);
    setForm(VAZIO);
    setErros({});
    setFormAberto(true);
  };

  const abrirEdicao = (empresa: Empresa) => {
    setEditando(empresa);
    setForm({
      ...empresa,
      trade_name: empresa.trade_name ?? "",
      number: empresa.number ?? "",
    });
    setErros({});
    setFormAberto(true);
  };

  const fecharForm = () => {
    if (salvando) return;
    setFormAberto(false);
  };

  const alterar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErros({});

    try {
      if (editando) {
        await api.put(`/admin/partner-companies/${editando.id}`, form);
        notify("Empresa atualizada com sucesso.", "success");
      } else {
        await api.post("/admin/partner-companies", form);
        notify("Empresa cadastrada com sucesso.", "success");
      }
      setFormAberto(false);
      await carregar();
    } catch (erro) {
      if (axios.isAxiosError(erro) && erro.response?.status === 422) {
        const campos = (erro.response.data?.errors ?? {}) as Record<string, string[]>;
        setErros(Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, v[0]])) as Erros);
        notify("Revise os campos destacados.", "warning");
      } else {
        notify(getErrorMessage(erro, "Não foi possível salvar a empresa."), "error");
      }
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (empresa: Empresa) => {
    if (
      empresa.active &&
      !(await confirmar(
        `Desativar "${empresa.corporate_name}"? Os usuários dela não conseguirão mais entrar no sistema.`,
      ))
    ) {
      return;
    }

    setProcessandoId(empresa.id);
    try {
      const { data } = await api.patch(`/admin/partner-companies/${empresa.id}/status`);
      notify(data.message, "success");
      await carregar();
    } catch (erro) {
      notify(getErrorMessage(erro, "Não foi possível alterar o status."), "error");
    } finally {
      setProcessandoId(null);
    }
  };

  const excluir = async (empresa: Empresa) => {
    if (!(await confirmar(`Excluir definitivamente "${empresa.corporate_name}"?`))) return;

    setProcessandoId(empresa.id);
    try {
      await api.delete(`/admin/partner-companies/${empresa.id}`);
      notify("Empresa removida com sucesso.", "success");
      await carregar();
    } catch (erro) {
      notify(getErrorMessage(erro, "Não foi possível excluir a empresa."), "error");
    } finally {
      setProcessandoId(null);
    }
  };

  const campo = (
    nome: keyof Formulario,
    rotulo: string,
    props: { obrigatorio?: boolean; placeholder?: string; mascara?: (v: string) => string; classe?: string } = {},
  ) => (
    <label className={`emp-field ${props.classe ?? ""}${erros[nome] ? " has-error" : ""}`}>
      <span>
        {rotulo}
        {props.obrigatorio && <em>*</em>}
      </span>
      <input
        value={String(form[nome] ?? "")}
        placeholder={props.placeholder}
        onChange={(e) => alterar(nome, (props.mascara ? props.mascara(e.target.value) : e.target.value) as never)}
        disabled={salvando}
      />
      {erros[nome] && <small>{erros[nome]}</small>}
    </label>
  );

  return (
    <div className="emp-page">
      <header className="emp-header">
        <div className="emp-header__title">
          <span className="emp-header__icon">
            <FontAwesomeIcon icon={faBuilding} />
          </span>
          <div>
            <h1>Empresas</h1>
            <p>Cadastro das empresas que usam o sistema. Visível apenas para o operador master.</p>
          </div>
        </div>
        <button className="btn btn-accent" onClick={abrirNovo}>
          <FontAwesomeIcon icon={faPlus} /> Nova empresa
        </button>
      </header>

      <section className="emp-toolbar">
        <div className="emp-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ ou cidade..."
            aria-label="Buscar empresa"
          />
        </div>
        <div className="emp-tabs" role="tablist">
          {(
            [
              ["todas", `Todas (${totais.total})`],
              ["ativas", `Ativas (${totais.ativas})`],
              ["inativas", `Inativas (${totais.total - totais.ativas})`],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              role="tab"
              aria-selected={status === valor}
              className={status === valor ? "is-active" : ""}
              onClick={() => setStatus(valor)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </section>

      <section className="emp-card">
        {empresas === null ? (
          <div className="emp-empty">
            <FontAwesomeIcon icon={faSpinner} spin /> Carregando empresas...
          </div>
        ) : erroLista ? (
          <div className="emp-empty is-error">{erroLista}</div>
        ) : filtradas.length === 0 ? (
          <div className="emp-empty">
            <FontAwesomeIcon icon={faBuilding} className="emp-empty__icon" />
            <strong>{empresas.length ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}</strong>
            <span>{empresas.length ? "Ajuste a busca ou o filtro." : "Cadastre a primeira empresa."}</span>
          </div>
        ) : (
          <div className="emp-table-wrap">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>CPF/CNPJ</th>
                  <th>Cidade</th>
                  <th className="is-center">Usuários</th>
                  <th>Status</th>
                  <th className="is-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((e) => (
                  <tr key={e.id} className={e.active ? "" : "is-inactive"}>
                    <td>
                      <div className="emp-name">
                        <span className="emp-avatar">{e.corporate_name.charAt(0).toUpperCase()}</span>
                        <span>
                          <strong>{e.corporate_name}</strong>
                          {e.trade_name && <small>{e.trade_name}</small>}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="emp-doc">{tipoDocumento(e.document)}</span> {e.document}
                    </td>
                    <td>
                      {e.city}/{e.state}
                    </td>
                    <td className="is-center">
                      <span className="emp-users">
                        <FontAwesomeIcon icon={faUsers} /> {e.users_count}
                      </span>
                    </td>
                    <td>
                      <span className={`emp-badge ${e.active ? "is-on" : "is-off"}`}>
                        {e.active ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="is-right">
                      <div className="emp-actions">
                        <button onClick={() => abrirEdicao(e)} title="Editar" aria-label={`Editar ${e.corporate_name}`}>
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          onClick={() => alternarStatus(e)}
                          title={e.active ? "Desativar" : "Ativar"}
                          aria-label={`${e.active ? "Desativar" : "Ativar"} ${e.corporate_name}`}
                          className={e.active ? "is-warning" : "is-success"}
                          disabled={processandoId === e.id}
                        >
                          <FontAwesomeIcon icon={processandoId === e.id ? faSpinner : faPowerOff} spin={processandoId === e.id} />
                        </button>
                        <button
                          onClick={() => excluir(e)}
                          title={e.users_count ? "Empresa com usuários: desative em vez de excluir" : "Excluir"}
                          aria-label={`Excluir ${e.corporate_name}`}
                          className="is-danger"
                          disabled={processandoId === e.id || e.users_count > 0}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formAberto && (
        <div className="emp-overlay" style={{ background: "var(--overlay)" }} onClick={fecharForm}>
          <form
            className="emp-modal"
            style={{ boxShadow: "var(--shadow-modal)" }}
            onSubmit={salvar}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="emp-form-titulo"
            noValidate
          >
            <header className="emp-modal__head">
              <h2 id="emp-form-titulo">{editando ? "Editar empresa" : "Nova empresa"}</h2>
              <button type="button" className="emp-close" onClick={fecharForm} aria-label="Fechar">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </header>

            <div className="emp-modal__body">
              <h3>Dados da empresa</h3>
              <div className="emp-grid">
                {campo("corporate_name", "Razão social / Nome", { obrigatorio: true, classe: "is-wide" })}
                {campo("trade_name", "Nome fantasia", { classe: "is-wide" })}
                {campo("document", "CPF ou CNPJ", {
                  obrigatorio: true,
                  placeholder: "00.000.000/0000-00",
                  mascara: mascaraDocumento,
                })}
                <label className="emp-field emp-switch">
                  <span>Situação</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.active}
                    className={form.active ? "is-on" : ""}
                    onClick={() => alterar("active", !form.active)}
                    disabled={salvando}
                  >
                    <i />
                    {form.active ? "Ativa" : "Inativa"}
                  </button>
                </label>
              </div>

              <h3>Endereço</h3>
              <div className="emp-grid">
                {campo("zip_code", "CEP", { obrigatorio: true, placeholder: "00000-000", mascara: mascaraCep })}
                {campo("street", "Logradouro", { obrigatorio: true, classe: "is-wide" })}
                {campo("number", "Número")}
                {campo("district", "Bairro", { obrigatorio: true })}
                {campo("city", "Cidade", { obrigatorio: true })}
                <label className={`emp-field${erros.state ? " has-error" : ""}`}>
                  <span>
                    UF<em>*</em>
                  </span>
                  <select value={form.state} onChange={(e) => alterar("state", e.target.value)} disabled={salvando}>
                    <option value="">Selecione</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  {erros.state && <small>{erros.state}</small>}
                </label>
              </div>
            </div>

            <footer className="emp-modal__foot">
              <button type="button" className="btn btn-secondary" onClick={fecharForm} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando && <FontAwesomeIcon icon={faSpinner} spin />}
                {editando ? "Salvar alterações" : "Cadastrar empresa"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
