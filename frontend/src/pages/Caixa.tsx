import { useState, useEffect, useCallback } from "react";
import { SidebarCaixa } from "../../components/SidebarCaixa";
import { TabelaGastos } from "../../components/TabelaGastos";
import { HeaderCaixa } from "../../components/HeaderCaixa";
import { ModalAdicionarCategoria } from "../../components/ModalAdicionarCategoria";
import { ModalAdicionarSaida } from "../../components/ModalAdicionarSaida";
import { ModalGerenciarCategorias } from "../../components/ModalGerenciarCategorias";
import { ModalImportarGastos } from "../../components/ModalImportarGastos";
import { ModalImportarVendas } from "../../components/ModalImportarVendas";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faTimes,
  faBars,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
const API_URL = import.meta.env.VITE_API_URL;

interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category_id: number;
  expense_category_id?: number;
  type: "entrada" | "saida";
  category?: ExpenseCategory;
  notes: string | null;
  source?: "pdv" | "manual";
}

interface Order {
  id: number;
  customer_name: string;
  total: number;
  closed_at: string;
  payment_method: string;
  status: string;
  table_id: number;
}

interface DailySummary {
  date: string;
  total_vendas: number;
  total_entradas: number;
  total_saidas: number;
  saldo: number;
}

interface CaixaProps {
  setTela?: (tela: string) => void;
}

interface CSVPreview {
  data_original?: string;
  descricao?: string;
  valor?: string;
  categoria?: string;
  cliente?: string;
  pagamento?: string;
}

export default function Caixa({ setTela }: CaixaProps) {
  // =========================================================
  // ESTADOS
  // =========================================================

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const hoje = new Date().toISOString().split("T")[0];
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);

  // =========================================================
  // NOVA ESTRUTURA DO CAIXA
  // =========================================================

  const [resumoDiario, setResumoDiario] = useState<DailySummary[]>([]);

  const [transacoesPorData, setTransacoesPorData] = useState<
    Record<string, Transaction[]>
  >({});

  const [diasExpandidos, setDiasExpandidos] = useState<Record<string, boolean>>(
    {},
  );

  const [loadingResumo, setLoadingResumo] = useState(false);

  const [loadingDias, setLoadingDias] = useState<Record<string, boolean>>({});

  const [categorias, setCategorias] = useState<ExpenseCategory[]>([]);

  const [showEntradas, setShowEntradas] = useState(true);
  const [showSaidas, setShowSaidas] = useState(true);

  const [showModalGerenciar, setShowModalGerenciar] = useState(false);
  const [showModalCategoria, setShowModalCategoria] = useState(false);
  const [showModalSaida, setShowModalSaida] = useState(false);

  const [editandoCategoria, setEditandoCategoria] =
    useState<ExpenseCategory | null>(null);

  const [novaCategoria, setNovaCategoria] = useState({
    name: "",
    icon: "📌",
    color: "#6b7280",
  });

  const [novaSaida, setNovaSaida] = useState({
    descricao: "",
    valor: 0,
    category_id: 0,
    data: hoje,
  });

  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);

  const [showModalImportarGastos, setShowModalImportarGastos] = useState(false);

  const [showModalImportarVendas, setShowModalImportarVendas] = useState(false);

  const [importFile, setImportFile] = useState<File | null>(null);

  const [importPreview, setImportPreview] = useState<CSVPreview[]>([]);

  const [importing, setImporting] = useState(false);

  // =========================================================
  // CORES
  // =========================================================

  const cores = [
    "#dc2626",
    "#f59e0b",
    "#3b82f6",
    "#fbbf24",
    "#ef4444",
    "#8b5cf6",
    "#10b981",
    "#6b7280",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#06b6d4",
    "#84cc16",
    "#d946ef",
    "#f43f5e",
  ];

  // =========================================================
  // AUTENTICAÇÃO
  // =========================================================

  const getToken = (): string | null => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      console.error("JWT não encontrado.");
      return null;
    }

    return token;
  };


  // =========================================================
  // RESPONSIVIDADE
  // =========================================================

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // =========================================================
  // CATEGORIAS
  // =========================================================

  const fetchCategorias = useCallback(async () => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/expense-categories`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar categorias: ${response.status}`);
      }

      const data = await response.json();

      const categoriasRecebidas: ExpenseCategory[] = Array.isArray(data)
        ? data
        : data.data || [];

      setCategorias(categoriasRecebidas);

      setNovaSaida((prev) => ({
        ...prev,
        category_id:
          prev.category_id === 0 && categoriasRecebidas.length > 0
            ? categoriasRecebidas[0].id
            : prev.category_id,
      }));
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  }, []);

  // =========================================================
  // DATAS
  // =========================================================

  const obterPeriodoSelecionado = useCallback(() => {
    const startDate = `${anoSelecionado}-${String(mesSelecionado).padStart(
      2,
      "0",
    )}-01`;

    const lastDay = new Date(anoSelecionado, mesSelecionado, 0).getDate();

    const endDate = `${anoSelecionado}-${String(mesSelecionado).padStart(
      2,
      "0",
    )}-${String(lastDay).padStart(2, "0")}`;

    return {
      startDate,
      endDate,
    };
  }, [anoSelecionado, mesSelecionado]);

  // =========================================================
  // RESUMO DIÁRIO
  // =========================================================

  const fetchResumoDiario = useCallback(async () => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      setLoadingResumo(true);

      const { startDate, endDate } = obterPeriodoSelecionado();

      const response = await fetch(
        `${API_URL}/orders/daily-summary?start_date=${startDate}&end_date=${endDate}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar resumo diário: ${response.status}`);
      }

      const responseData = await response.json();

      const lista: DailySummary[] = Array.isArray(responseData)
        ? responseData
        : responseData.data || [];

      const resumo: DailySummary[] = lista.map((dia) => ({
        date: dia.date,
        total_vendas: Number(dia.total_vendas) || 0,
        total_entradas: Number(dia.total_entradas) || 0,
        total_saidas: Number(dia.total_saidas) || 0,
        saldo: Number(dia.saldo) || 0,
      }));

      setResumoDiario(resumo);

      setTransacoesPorData({});
      setDiasExpandidos({});
      setLoadingDias({});
    } catch (error) {
      console.error("Erro ao buscar resumo diário:", error);

      setResumoDiario([]);
      setTransacoesPorData({});
      setDiasExpandidos({});
    } finally {
      setLoadingResumo(false);
    }
  }, [obterPeriodoSelecionado]);

  // =========================================================
  // TRANSAÇÕES DE UM DIA
  // =========================================================

  const carregarTransacoesDoDia = useCallback(async (data: string) => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      setLoadingDias((prev) => ({
        ...prev,
        [data]: true,
      }));

      const ordersUrl =
        `${API_URL}/orders` + `?start_date=${data}` + `&end_date=${data}`;

      const expensesUrl =
        `${API_URL}/expenses` + `?start_date=${data}` + `&end_date=${data}`;

      const [ordersResponse, expensesResponse] = await Promise.all([
        fetch(ordersUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),

        fetch(expensesUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
      ]);

      if (!ordersResponse.ok) {
        throw new Error(
          `Erro ao buscar vendas do dia: ${ordersResponse.status}`,
        );
      }

      if (!expensesResponse.ok) {
        throw new Error(
          `Erro ao buscar despesas do dia: ${expensesResponse.status}`,
        );
      }

      const ordersResponseData = await ordersResponse.json();
      const expensesResponseData = await expensesResponse.json();

      const orders: Order[] = Array.isArray(ordersResponseData)
        ? ordersResponseData
        : ordersResponseData.data || [];

      const expenses = Array.isArray(expensesResponseData)
        ? expensesResponseData
        : expensesResponseData.data || [];

      const entradas: Transaction[] = orders
        // Somente vendas pagas entram no caixa (igual ao resumo diário).
        .filter((order) => order.status === "fechado")
        .map((order) => ({
          id: order.id,

          description: order.customer_name?.trim()
            ? `Venda - ${order.customer_name}`
            : `Venda ${order.id}`,

          amount: Number(order.total) || 0,

          date: data,

          category_id: 0,

          type: "entrada",

          category: undefined,

          notes: `Status: ${order.status} | Pagamento: ${
            order.payment_method || "N/A"
          }`,

          source: "pdv",
        }));

      const saidas: Transaction[] = expenses.map((item: any) => ({
        id: item.id,

        description: item.description,

        amount: Number(item.amount) || 0,

        date: item.expense_date
          ? item.expense_date.split("T")[0].split(" ")[0]
          : data,

        category_id: Number(item.expense_category_id) || 0,

        expense_category_id: Number(item.expense_category_id) || 0,

        type: "saida",

        category: item.category,

        notes: item.notes || null,

        source: "manual",
      }));

      const transacoes = [...entradas, ...saidas];

      transacoes.sort((a, b) => String(b.date).localeCompare(String(a.date)));

      setTransacoesPorData((prev) => ({
        ...prev,
        [data]: transacoes,
      }));
    } catch (error) {
      console.error(`Erro ao buscar transações do dia ${data}:`, error);

      setTransacoesPorData((prev) => ({
        ...prev,
        [data]: [],
      }));
    } finally {
      setLoadingDias((prev) => ({
        ...prev,
        [data]: false,
      }));
    }
  }, []);

  // =========================================================
  // CARREGAMENTO INICIAL
  // =========================================================

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  useEffect(() => {
    fetchResumoDiario();
  }, [fetchResumoDiario]);

  // =========================================================
  // ADICIONAR CATEGORIA
  // =========================================================

  const adicionarCategoria = async () => {
    if (!novaCategoria.name.trim()) {
      alert("Digite o nome da categoria");
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await fetch(`${API_URL}/expense-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: novaCategoria.name.trim(),
          icon: novaCategoria.icon,
          color: novaCategoria.color,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);

        throw new Error(error?.message || "Erro ao criar categoria");
      }

      await fetchCategorias();

      setShowModalCategoria(false);

      setNovaCategoria({
        name: "",
        icon: "📌",
        color: "#6b7280",
      });

      alert("Categoria adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);

      alert(
        error instanceof Error ? error.message : "Erro ao adicionar categoria",
      );
    }
  };

  // =========================================================
  // EDITAR CATEGORIA
  // =========================================================

  const editarCategoria = async () => {
    if (!editandoCategoria) {
      return;
    }

    if (!editandoCategoria.name.trim()) {
      alert("Digite o nome da categoria");
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await fetch(
        `${API_URL}/expense-categories/${editandoCategoria.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editandoCategoria.name.trim(),
            icon: editandoCategoria.icon,
            color: editandoCategoria.color,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);

        throw new Error(error?.message || "Erro ao editar categoria");
      }

      await fetchCategorias();

      setEditandoCategoria(null);

      alert("Categoria atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao editar categoria:", error);

      alert(
        error instanceof Error ? error.message : "Erro ao editar categoria",
      );
    }
  };

  // =========================================================
  // EXCLUIR CATEGORIA
  // =========================================================

  const excluirCategoria = async (id: number, name: string) => {
    const temSaidas = Object.values(transacoesPorData)
      .flat()
      .some(
        (transaction) =>
          transaction.type === "saida" &&
          transaction.expense_category_id === id,
      );

    const mensagem = temSaidas
      ? `A categoria "${name}" possui gastos associados. Excluir mesmo assim?`
      : `Tem certeza que deseja excluir a categoria "${name}"?`;

    if (!confirm(mensagem)) {
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await fetch(`${API_URL}/expense-categories/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);

        alert(error?.message || "Erro ao excluir categoria");

        return;
      }

      await fetchCategorias();

      if (filtroCategoria === id) {
        setFiltroCategoria(null);
      }

      alert("Categoria excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);

      alert("Erro ao excluir categoria");
    }
  };

  // =========================================================
  // ADICIONAR SAÍDA
  // =========================================================

  const adicionarSaida = async () => {
    if (!novaSaida.descricao.trim()) {
      alert("Preencha a descrição");
      return;
    }

    if (novaSaida.valor <= 0) {
      alert("Digite um valor válido maior que zero");
      return;
    }

    if (!novaSaida.category_id) {
      alert("Selecione uma categoria");
      return;
    }

    if (!novaSaida.data) {
      alert("Selecione uma data");
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: novaSaida.descricao.trim(),
          amount: Number(novaSaida.valor),
          expense_date: novaSaida.data,
          expense_category_id: Number(novaSaida.category_id),
          type: "saida",
          notes: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.message ||
            `Erro ${response.status}: ${response.statusText}`,
        );
      }

      setNovaSaida({
        descricao: "",
        valor: 0,
        category_id: categorias[0]?.id || 0,
        data: hoje,
      });

      setShowModalSaida(false);

      await fetchResumoDiario();

      if (transacoesPorData[novaSaida.data]) {
        await carregarTransacoesDoDia(novaSaida.data);
      }

      alert("Saída adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar saída:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao conectar com o servidor",
      );
    }
  };

  // =========================================================
  // REMOVER TRANSAÇÃO
  // =========================================================

  const removerTransacao = async (
    id: number,
    type: string,
    source?: string,
  ) => {
    if (!confirm("Remover esse lançamento?")) {
      return;
    }

    if (type === "entrada" && source === "pdv") {
      alert("Entradas do PDV não podem ser removidas aqui.");

      return;
    }

    try {
      const token = getToken();

      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const transacao = Object.values(transacoesPorData)
        .flat()
        .find((item) => item.id === id);

      const dataTransacao = transacao?.date;

      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);

        alert(error?.message || "Erro ao remover lançamento");

        return;
      }

      await fetchResumoDiario();

      if (dataTransacao) {
        await carregarTransacoesDoDia(dataTransacao);
      }

      alert("Removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover:", error);

      alert("Erro ao conectar com o servidor");
    }
  };

  // =========================================================
  // CSV
  // =========================================================

  const parseBrazilianDate = (dateStr: string): string => {
    if (!dateStr) {
      return "";
    }

    const cleanDate = dateStr.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return cleanDate;
    }

    if (cleanDate.includes("/")) {
      const parts = cleanDate.split("/");

      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        let year = parts[2];

        if (year.length === 2) {
          year = `20${year}`;
        }

        return `${year}-${month}-${day}`;
      }
    }

    return cleanDate;
  };

  const parseBrazilianNumber = (value: string): number => {
    if (!value) {
      return 0;
    }

    let clean = value.replace(/R\$\s*/gi, "").trim();

    if (clean.includes(",")) {
      clean = clean.replace(/\./g, "");
      clean = clean.replace(",", ".");
    }

    const number = parseFloat(clean);

    return isNaN(number) ? 0 : number;
  };

  // =========================================================
  // PROCESSAR CSV
  // =========================================================

  const processCSV = (file: File, callback: (data: CSVPreview[]) => void) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;

      if (!text) {
        callback([]);
        return;
      }

      const lines = text.split(/\r?\n/).filter((line) => line.trim());

      if (lines.length === 0) {
        callback([]);
        return;
      }

      const firstLine = lines[0];

      const commaCount = (firstLine.match(/,/g) || []).length;

      const semicolonCount = (firstLine.match(/;/g) || []).length;

      const delimiter = semicolonCount > commaCount ? ";" : ",";

      const parseRow = (line: string): string[] => {
        const result: string[] = [];

        let inQuotes = false;
        let currentValue = "";

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(currentValue.trim());

            currentValue = "";
          } else {
            currentValue += char;
          }
        }

        result.push(currentValue.trim());

        return result.map((value) =>
          value.replace(/^"|"$/g, "").replace(/""/g, '"'),
        );
      };

      const firstLineLower = firstLine.toLowerCase();

      const hasHeader =
        firstLineLower.includes("descricao") ||
        firstLineLower.includes("description") ||
        firstLineLower.includes("data") ||
        firstLineLower.includes("valor") ||
        firstLineLower.includes("cliente") ||
        firstLineLower.includes("categoria");

      let headers: string[] = [];
      let startRow = 0;

      if (hasHeader) {
        headers = parseRow(lines[0]);

        startRow = 1;
      } else {
        const firstRow = parseRow(lines[0]);

        if (firstRow.length >= 4) {
          headers = ["data", "descricao", "valor", "categoria"];
        } else {
          headers = ["data", "descricao", "valor"];
        }
      }

      const normalizedHeaders = headers.map((header) =>
        header.toLowerCase().trim(),
      );

      const dataIndex = normalizedHeaders.findIndex(
        (header) => header === "data" || header === "date",
      );

      const descIndex = normalizedHeaders.findIndex(
        (header) => header === "descricao" || header === "description",
      );

      const valorIndex = normalizedHeaders.findIndex(
        (header) =>
          header === "valor" || header === "amount" || header === "total",
      );

      const categoriaIndex = normalizedHeaders.findIndex(
        (header) => header === "categoria" || header === "category",
      );

      const data: CSVPreview[] = [];

      for (let i = startRow; i < lines.length; i++) {
        const values = parseRow(lines[i]);

        if (values.length < 3) {
          continue;
        }

        const row: CSVPreview = {
          data_original:
            dataIndex !== -1 ? values[dataIndex] || "" : values[0] || "",

          descricao:
            descIndex !== -1 ? values[descIndex] || "" : values[1] || "",

          valor: valorIndex !== -1 ? values[valorIndex] || "" : values[2] || "",

          categoria:
            categoriaIndex !== -1
              ? values[categoriaIndex] || ""
              : values[3] || "",
        };

        data.push(row);
      }

      callback(data);
    };

    reader.readAsText(file, "UTF-8");
  };

  // =========================================================
  // PREVIEW GASTOS
  // =========================================================

  const previewCSV = (file: File) => {
    processCSV(file, (data) => {
      setImportPreview(data.slice(0, 5));
    });
  };

  // =========================================================
  // IMPORTAR GASTOS
  // =========================================================

  const importarGastosCSV = async () => {
    if (!importFile) {
      alert("Selecione um arquivo CSV");
      return;
    }

    const token = getToken();

    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      return;
    }

    setImporting(true);

    try {
      const conteudo = await importFile.text();

      const linhas = conteudo.split(/\r?\n/).filter((linha) => linha.trim());

      if (linhas.length < 2) {
        alert("Arquivo vazio ou formato inválido");
        return;
      }

      const primeiraLinha = linhas[0].toLowerCase();

      const delimiter = primeiraLinha.includes(";") ? ";" : ",";

      let sucesso = 0;
      let erros = 0;

      const inicio =
        primeiraLinha.includes("data") ||
        primeiraLinha.includes("date") ||
        primeiraLinha.includes("descricao") ||
        primeiraLinha.includes("description")
          ? 1
          : 0;

      for (let i = inicio; i < linhas.length; i++) {
        const partes = linhas[i]
          .split(delimiter)
          .map((item) => item.trim().replace(/^"|"$/g, ""));

        if (partes.length < 3) {
          erros++;
          continue;
        }

        const dataOriginal = partes[0] || "";
        const descricao = partes[1] || "";
        const valorRaw = partes[2] || "";
        const categoriaRaw = partes[3] || "";

        if (!dataOriginal || !descricao || !valorRaw) {
          erros++;
          continue;
        }

        const valor = parseBrazilianNumber(valorRaw);

        if (valor <= 0) {
          erros++;
          continue;
        }

        const dataFormatada = parseBrazilianDate(dataOriginal);

        let categoriaId = 0;

        if (categoriaRaw) {
          categoriaId = Number(categoriaRaw) || 0;
        }

        if (!categoriaId) {
          categoriaId = categorias[0]?.id || 0;
        }

        if (!categoriaId) {
          erros++;
          continue;
        }

        try {
          const response = await fetch(`${API_URL}/expenses`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              description: descricao,
              amount: valor,
              expense_date: dataFormatada,
              expense_category_id: categoriaId,
              type: "saida",
              notes: "Importado via CSV",
            }),
          });

          if (response.ok) {
            sucesso++;
          } else {
            erros++;

            const error = await response.json().catch(() => null);

            console.error("Erro ao importar gasto:", error);
          }
        } catch (error) {
          erros++;

          console.error("Erro na importação:", error);
        }
      }

      alert(
        `Importação finalizada!\n\n` +
          `✅ Sucesso: ${sucesso}\n` +
          `❌ Erros: ${erros}`,
      );

      setShowModalImportarGastos(false);
      setImportFile(null);
      setImportPreview([]);

      await fetchResumoDiario();
    } catch (error) {
      console.error("Erro ao processar CSV:", error);

      alert("Erro ao processar o arquivo CSV.");
    } finally {
      setImporting(false);
    }
  };

  // =========================================================
  // PREVIEW VENDAS
  // =========================================================

  const previewVendasCSV = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const conteudo = event.target?.result as string;

      const linhas = conteudo.split(/\r?\n/).filter((linha) => linha.trim());

      if (linhas.length < 2) {
        setImportPreview([]);
        return;
      }

      const cabecalho = linhas[0]
        .split(";")
        .map((col) => col.trim().toLowerCase());

      let idxData = cabecalho.findIndex((h) => h === "data" || h === "date");

      const idxCliente = cabecalho.findIndex(
        (h) => h === "cliente" || h === "customer" || h === "customer_name",
      );

      let idxValor = cabecalho.findIndex(
        (h) => h === "valor" || h === "amount" || h === "total",
      );

      const idxPagamento = cabecalho.findIndex(
        (h) => h === "pagamento" || h === "payment" || h === "payment_method",
      );

      if (idxData === -1) {
        idxData = 0;
      }

      if (idxValor === -1) {
        idxValor = 1;
      }

      const preview: CSVPreview[] = [];

      for (let i = 1; i < Math.min(linhas.length, 6); i++) {
        const partes = linhas[i].split(";").map((col) => col.trim());

        preview.push({
          data_original: partes[idxData] || "",

          cliente:
            idxCliente !== -1
              ? partes[idxCliente] || "Venda Rápida"
              : "Venda Rápida",

          valor: partes[idxValor] || "",

          pagamento:
            idxPagamento !== -1
              ? partes[idxPagamento] || "dinheiro"
              : "dinheiro",
        });
      }

      setImportPreview(preview);
    };

    reader.readAsText(file, "UTF-8");
  };

  // =========================================================
  // IMPORTAR VENDAS
  // =========================================================

  const importarVendasCSV = async () => {
    if (!importFile) {
      alert("Selecione um arquivo CSV");
      return;
    }

    const token = getToken();

    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      return;
    }

    setImporting(true);

    try {
      const conteudo = await importFile.text();

      const linhas = conteudo.split(/\r?\n/).filter((linha) => linha.trim());

      if (linhas.length < 2) {
        alert("Arquivo vazio ou formato inválido");
        return;
      }

      const cabecalho = linhas[0]
        .split(";")
        .map((col) => col.trim().toLowerCase());

      let idxData = cabecalho.findIndex((h) => h === "data" || h === "date");

      const idxCliente = cabecalho.findIndex(
        (h) => h === "cliente" || h === "customer" || h === "customer_name",
      );

      let idxValor = cabecalho.findIndex(
        (h) => h === "valor" || h === "amount" || h === "total",
      );

      const idxPagamento = cabecalho.findIndex(
        (h) => h === "pagamento" || h === "payment" || h === "payment_method",
      );

      if (idxData === -1) {
        idxData = 0;
      }

      if (idxValor === -1) {
        idxValor = 1;
      }

      let sucesso = 0;
      let erros = 0;

      for (let i = 1; i < linhas.length; i++) {
        const partes = linhas[i].split(";").map((col) => col.trim());

        if (partes.length < 2) {
          erros++;
          continue;
        }

        const dataOriginal = partes[idxData] || "";

        const cliente =
          idxCliente !== -1
            ? partes[idxCliente] || "Venda Rápida"
            : "Venda Rápida";

        const valorRaw = partes[idxValor] || "";

        const pagamento =
          idxPagamento !== -1 ? partes[idxPagamento] || "dinheiro" : "dinheiro";

        if (!dataOriginal || !valorRaw) {
          erros++;
          continue;
        }

        const valorNumerico = parseBrazilianNumber(valorRaw);

        if (valorNumerico <= 0) {
          erros++;
          continue;
        }

        const dataFormatada = parseBrazilianDate(dataOriginal);

        try {
          const response = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              table_id: 1,
              customer_name: cliente,
              status: "fechado",
              total: valorNumerico,
              payment_method: pagamento.toLowerCase(),
              closed_at: dataFormatada,
            }),
          });

          if (response.ok) {
            sucesso++;
          } else {
            erros++;

            const error = await response.json().catch(() => null);

            console.error("Erro API:", error);
          }
        } catch (error) {
          erros++;

          console.error("Erro ao importar venda:", error);
        }
      }

      alert(
        `Importação de vendas finalizada!\n\n` +
          `✅ Sucesso: ${sucesso}\n` +
          `❌ Erros: ${erros}`,
      );

      setShowModalImportarVendas(false);
      setImportFile(null);
      setImportPreview([]);

      await fetchResumoDiario();
    } catch (error) {
      console.error("Erro ao processar vendas:", error);

      alert("Erro ao processar o arquivo CSV.");
    } finally {
      setImporting(false);
    }
  };

  // =========================================================
  // CONTROLES
  // =========================================================

  const toggleDia = async (data: string) => {
    const estaExpandido = diasExpandidos[data];

    setDiasExpandidos((prev) => ({
      ...prev,
      [data]: !prev[data],
    }));

    if (estaExpandido) {
      return;
    }

    if (transacoesPorData[data]) {
      return;
    }

    await carregarTransacoesDoDia(data);
  };

  const formatCurrency = (value: any): string => {
    const num = typeof value === "number" ? value : Number(value) || 0;

    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) {
      return "-";
    }

    return dateString.split("-").reverse().join("/");
  };

  // =========================================================
  // TOTAIS DO MÊS
  // =========================================================

  const totalEntradas = resumoDiario.reduce(
    (sum, item) => sum + (Number(item.total_entradas) || 0),
    0,
  );

  const totalSaidas = resumoDiario.reduce(
    (sum, item) => sum + (Number(item.total_saidas) || 0),
    0,
  );

  const saldoGeral = totalEntradas - totalSaidas;

  // =========================================================
  // TRANSAÇÕES FILTRADAS
  // =========================================================

  const transacoesFiltradasPorData: Record<string, Transaction[]> = {};

  Object.entries(transacoesPorData).forEach(([data, transacoes]) => {
    transacoesFiltradasPorData[data] = transacoes.filter((t) => {
      const matchCategoria =
        filtroCategoria !== null
          ? t.expense_category_id === filtroCategoria
          : true;

      const matchTipo =
        (t.type === "entrada" && showEntradas) ||
        (t.type === "saida" && showSaidas);

      return matchCategoria && matchTipo;
    });
  });

  // =========================================================
  // TOTAIS POR DATA
  // =========================================================

  const totalEntradasPorData: Record<string, number> = {};
  const totalSaidasPorData: Record<string, number> = {};
  const saldoPorData: Record<string, number> = {};

  resumoDiario.forEach((item) => {
    totalEntradasPorData[item.date] = Number(item.total_entradas) || 0;

    totalSaidasPorData[item.date] = Number(item.total_saidas) || 0;

    saldoPorData[item.date] = Number(item.saldo) || 0;
  });

  // =========================================================
  // ANOS / MESES
  // =========================================================

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i);

  const meses = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  // =========================================================
  // MODAIS
  // =========================================================

  const modais = (
    <>
      {showModalGerenciar && (
        <ModalGerenciarCategorias
          showModalGerenciar={showModalGerenciar}
          setShowModalGerenciar={setShowModalGerenciar}
          categorias={categorias}
          editandoCategoria={editandoCategoria}
          setEditandoCategoria={setEditandoCategoria}
          transacoes={Object.values(transacoesPorData).flat()}
          editarCategoria={editarCategoria}
          excluirCategoria={excluirCategoria}
          setShowModalCategoria={setShowModalCategoria}
        />
      )}

      <ModalAdicionarCategoria
        showModalCategoria={showModalCategoria}
        setShowModalCategoria={setShowModalCategoria}
        novaCategoria={novaCategoria}
        setNovaCategoria={setNovaCategoria}
        cores={cores}
        adicionarCategoria={adicionarCategoria}
      />

      <ModalAdicionarSaida
        showModalSaida={showModalSaida}
        setShowModalSaida={setShowModalSaida}
        novaSaida={novaSaida}
        setNovaSaida={setNovaSaida}
        categorias={categorias}
        adicionarSaida={adicionarSaida}
      />

      <ModalImportarGastos
        showModalImportarGastos={showModalImportarGastos}
        setShowModalImportarGastos={setShowModalImportarGastos}
        importFile={importFile}
        setImportFile={setImportFile}
        importPreview={importPreview}
        importing={importing}
        previewCSV={previewCSV}
        importarGastosCSV={importarGastosCSV}
      />

      <ModalImportarVendas
        showModalImportarVendas={showModalImportarVendas}
        setShowModalImportarVendas={setShowModalImportarVendas}
        importFile={importFile}
        setImportFile={setImportFile}
        importPreview={importPreview}
        importing={importing}
        previewCSV={previewVendasCSV}
        importarVendasCSV={importarVendasCSV}
      />
    </>
  );

  // =========================================================
  // DESKTOP
  // =========================================================

  if (!isMobile) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          height: "100%",
          background: "var(--surface-2)",
        }}
      >
        <SidebarCaixa
          setShowModalSaida={setShowModalSaida}
          setShowModalGerenciar={setShowModalGerenciar}
          setShowModalImportarGastos={setShowModalImportarGastos}
          setShowModalImportarVendas={setShowModalImportarVendas}
          onVoltarDashboard={setTela ? () => setTela("dashboard") : undefined}
        />

        <div
          style={{
            padding: "20px",
            overflowY: "auto",
            height: "100vh",
            background: "var(--bg)",
          }}
        >
          <HeaderCaixa
            mesSelecionado={mesSelecionado}
            setMesSelecionado={setMesSelecionado}
            anoSelecionado={anoSelecionado}
            setAnoSelecionado={setAnoSelecionado}
            showEntradas={showEntradas}
            setShowEntradas={setShowEntradas}
            showSaidas={showSaidas}
            setShowSaidas={setShowSaidas}
            totalEntradas={totalEntradas}
            totalSaidas={totalSaidas}
            saldoGeral={saldoGeral}
            formatCurrency={formatCurrency}
            anos={anos}
            meses={meses}
            categorias={categorias}
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
          />

          <TabelaGastos
            resumoDiario={resumoDiario}
            transacoesPorData={transacoesFiltradasPorData}
            diasExpandidos={diasExpandidos}
            totalEntradasPorData={totalEntradasPorData}
            totalSaidasPorData={totalSaidasPorData}
            saldoPorData={saldoPorData}
            loading={loadingResumo}
            diasCarregando={loadingDias}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            toggleDia={toggleDia}
            removerTransacao={removerTransacao}
          />
        </div>

        {modais}
      </div>
    );
  }

  // =========================================================
  // MOBILE
  // =========================================================

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          padding: "16px",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "var(--surface-3)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* ÍCONE DO CAIXA CORRIGIDO */}
            <FontAwesomeIcon
              icon={faWallet}
              style={{
                fontSize: 18,
                color: "var(--primary)",
              }}
            />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Caixa
          </h1>
        </div>

        <button
          onClick={() => setShowMobileMenu(true)}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "8px 12px",
            cursor: "pointer",
            color: "var(--text-secondary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      {/* VOLTAR */}

      <div
        style={{
          padding: "12px 16px",
        }}
      >
        <button
          onClick={() => setTela && setTela("dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "10px 16px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 14,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar ao início
        </button>
      </div>

      {/* MENU */}

      {showMobileMenu && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "var(--overlay)",
              zIndex: 1000,
            }}
            onClick={() => setShowMobileMenu(false)}
          />

          <div
            className="sidebar-dark"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "280px",
              background: "var(--surface)",
              zIndex: 1001,
              padding: "20px",
              overflowY: "auto",
              boxShadow: "4px 0 12px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 20,
              }}
            >
              <button
                onClick={() => setShowMobileMenu(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "var(--text)",
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* NOVA SAÍDA */}

            <button
              onClick={() => {
                setShowModalSaida(true);
                setShowMobileMenu(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                color: "var(--text-secondary)",
                marginBottom: 12,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--surface-3)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                📤
              </div>

              <span>Nova Saída</span>
            </button>

            {/* CATEGORIAS */}

            <button
              onClick={() => {
                setShowModalGerenciar(true);
                setShowMobileMenu(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                color: "var(--text-secondary)",
                marginBottom: 12,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--surface-3)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🏷️
              </div>

              <span>Categorias</span>
            </button>

            {/* IMPORTAR GASTOS */}

            <button
              onClick={() => {
                setShowModalImportarGastos(true);
                setShowMobileMenu(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                color: "var(--text-secondary)",
                marginBottom: 12,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--surface-3)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                📥
              </div>

              <span>Importar Gastos</span>
            </button>

            {/* IMPORTAR VENDAS */}

            <button
              onClick={() => {
                setShowModalImportarVendas(true);
                setShowMobileMenu(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                color: "var(--text-secondary)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--surface-3)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                📤
              </div>

              <span>Importar Vendas</span>
            </button>
          </div>
        </>
      )}

      {/* CONTEÚDO */}

      <div
        style={{
          padding: "16px",
        }}
      >
        <HeaderCaixa
          mesSelecionado={mesSelecionado}
          setMesSelecionado={setMesSelecionado}
          anoSelecionado={anoSelecionado}
          setAnoSelecionado={setAnoSelecionado}
          showEntradas={showEntradas}
          setShowEntradas={setShowEntradas}
          showSaidas={showSaidas}
          setShowSaidas={setShowSaidas}
          totalEntradas={totalEntradas}
          totalSaidas={totalSaidas}
          saldoGeral={saldoGeral}
          formatCurrency={formatCurrency}
          anos={anos}
          meses={meses}
          categorias={categorias}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
        />

        <TabelaGastos
          resumoDiario={resumoDiario}
          transacoesPorData={transacoesFiltradasPorData}
          diasExpandidos={diasExpandidos}
          totalEntradasPorData={totalEntradasPorData}
          totalSaidasPorData={totalSaidasPorData}
          saldoPorData={saldoPorData}
          loading={loadingResumo}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          toggleDia={toggleDia}
          removerTransacao={removerTransacao}
        />
      </div>

      {modais}
    </div>
  );
}
