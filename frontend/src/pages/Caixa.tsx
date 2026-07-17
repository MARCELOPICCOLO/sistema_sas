import { useState, useEffect, useCallback } from "react";
import { SidebarCaixa } from "../../components/SidebarCaixa";
import { TabelaGastos } from "../../components/TabelaGastos";
import { HeaderCaixa } from "../../components/HeaderCaixa";
import { FiltrosCaixa } from "../../components/FiltrosCaixa";
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
} from "@fortawesome/free-solid-svg-icons";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category_id: number;
  type: "entrada" | "saida";
  category?: ExpenseCategory;
  notes: string | null;
  source?: "pdv" | "manual";
}

interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
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

interface CaixaProps {
  setTela?: (tela: string) => void;
}

export default function Caixa({ setTela }: CaixaProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const hoje = new Date().toISOString().split("T")[0];
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [transacoes, setTransacoes] = useState<Transaction[]>([]);
  const [categorias, setCategorias] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [diasExpandidos, setDiasExpandidos] = useState<{
    [key: string]: boolean;
  }>({});
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

  const [showModalImportarGastos, setShowModalImportarGastos] = useState(false);
  const [showModalImportarVendas, setShowModalImportarVendas] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Buscar categorias
  const fetchCategorias = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/expense-categories?restaurant_id=1",
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar categorias");
      }

      const data = await response.json();

      console.log("Categorias:", data);

      setCategorias(data);

      setNovaSaida((prev) => ({
        ...prev,
        category_id:
          prev.category_id === 0 && data.length > 0
            ? data[0].id
            : prev.category_id,
      }));
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  }, []);

  // Buscar entradas (vendas do PDV) - COM FILTRO DE DATA E STATUS
  const fetchEntradas = useCallback(async () => {
    try {
      // Datas do mês selecionado
      const startDate = `${anoSelecionado}-${String(mesSelecionado).padStart(2, "0")}-01`;
      const lastDay = new Date(anoSelecionado, mesSelecionado, 0).getDate();
      const endDate = `${anoSelecionado}-${String(mesSelecionado).padStart(2, "0")}-${lastDay}`;

      console.log(`=== BUSCANDO VENDAS DE ${startDate} ATÉ ${endDate} ===`);

      const response = await fetch(
        `http://localhost:8000/api/orders?restaurant_id=1`,
      );
      if (!response.ok) throw new Error("Erro ao buscar vendas");

      const orders: Order[] = await response.json();

      // 🔥 CORREÇÃO: Incluir "fechado" E "pendente"
      const ordensFiltradas = orders.filter((order) => {
        // Inclui fechados e pendentes (não pagas)
        if (order.status !== "fechado" && order.status !== "pendente")
          return false;

        if (!order.closed_at) return false;

        const orderDate = order.closed_at.split("T")[0];
        return orderDate >= startDate && orderDate <= endDate;
      });

      console.log(
        `Vendas no período (fechadas + pendentes): ${ordensFiltradas.length}`,
      );

      const extrairData = (dataCompleta: string): string => {
        if (!dataCompleta) return "";
        return dataCompleta.split("T")[0].split(" ")[0];
      };

      const entradas: Transaction[] = ordensFiltradas.map((order) => {
        const orderDate = extrairData(order.closed_at);

        return {
          id: order.id,
          description: `Venda - ${order.customer_name || `Mesa ${order.table_id}`}`,
          amount: Number(order.total) || 0,
          date: orderDate || new Date().toISOString().split("T")[0],
          category_id: 0,
          type: "entrada",
          category: undefined,
          notes: `Status: ${order.status} | Pagamento: ${order.payment_method || "N/A"}`,
          source: "pdv",
        };
      });

      console.log("Entradas geradas:", entradas.length);
      return entradas;
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
      return [];
    }
  }, [anoSelecionado, mesSelecionado]);

  // Buscar saídas (gastos)
  const fetchSaidas = useCallback(async () => {
    try {
      const startDate = `${anoSelecionado}-${String(mesSelecionado).padStart(2, "0")}-01`;
      const lastDay = new Date(anoSelecionado, mesSelecionado, 0).getDate();
      const endDate = `${anoSelecionado}-${String(mesSelecionado).padStart(2, "0")}-${lastDay}`;

      console.log(`=== BUSCANDO GASTOS DE ${startDate} ATÉ ${endDate} ===`);

      const url = `http://localhost:8000/api/expenses?restaurant_id=1&start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error("Erro ao buscar saídas");

      const data = await response.json();

      const saidas: Transaction[] = data.map((item: any) => {
        const categoria = categorias.find((c) => c.id === item.category_id);
        return {
          id: item.id,
          description: item.description,
          amount: Number(item.amount) || 0,
          date: item.expense_date
            ? item.expense_date.split("T")[0]
            : new Date().toISOString().split("T")[0],
          category_id: item.category_id,
          type: "saida",
          category: categoria,
          notes: item.notes,
          source: "manual",
        };
      });

      console.log(`Gastos no período: ${saidas.length}`);
      return saidas;
    } catch (error) {
      console.error("Erro ao buscar saídas:", error);
      return [];
    }
  }, [anoSelecionado, mesSelecionado, categorias]);

  // Buscar todas as transações
  const fetchTransacoes = useCallback(async () => {
    setLoading(true);

    try {
      console.log("========== INICIANDO BUSCA ==========");

      const [entradas, saidas] = await Promise.all([
        fetchEntradas(),
        fetchSaidas(),
      ]);

      console.log("Entradas recebidas:", entradas);
      console.log("Saídas recebidas:", saidas);

      console.log("Quantidade de entradas:", entradas.length);
      console.log("Quantidade de saídas:", saidas.length);

      const todasTransacoes = [...entradas, ...saidas];

      console.log("Todas as transações antes do sort:");
      console.table(todasTransacoes);

      todasTransacoes.sort((a, b) =>
        String(b.date).localeCompare(String(a.date)),
      );

      console.log("Todas as transações após o sort:");
      console.table(todasTransacoes);

      setTransacoes(todasTransacoes);

      console.log("setTransacoes executado com sucesso");
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      setTransacoes([]);
    } finally {
      setLoading(false);
      console.log("========== FIM DA BUSCA ==========");
    }
  }, [fetchEntradas, fetchSaidas]);

  // Efeito para carregar categorias uma vez
  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // Efeito para carregar transações
  useEffect(() => {
    fetchTransacoes();
  }, [fetchTransacoes]);

  // Adicionar categoria
  const adicionarCategoria = async () => {
    if (!novaCategoria.name.trim()) {
      alert("Digite o nome da categoria");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/expense-categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            restaurant_id: 1,
            name: novaCategoria.name,
            icon: novaCategoria.icon,
            color: novaCategoria.color,
          }),
        },
      );

      if (!response.ok) throw new Error("Erro ao criar categoria");

      await fetchCategorias();
      setShowModalCategoria(false);
      setNovaCategoria({ name: "", icon: "📌", color: "#6b7280" });
      alert("Categoria adicionada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar categoria");
    }
  };

  // Processar arquivo CSV
  const processCSV = (file: File, callback: (data: any[]) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        callback([]);
        return;
      }

      const firstLine = lines[0];
      let delimiter = ",";

      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;

      if (semicolonCount > commaCount) {
        delimiter = ";";
      }

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

        return result.map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"'));
      };

      if (hasHeader) {
        headers = parseRow(lines[0]);
        startRow = 1;
      } else {
        const firstRowData = parseRow(lines[0]);
        if (firstRowData.length === 3) {
          headers = ["data", "descricao", "valor"];
        } else if (firstRowData.length === 4) {
          headers = ["data", "descricao", "valor", "categoria"];
        } else {
          headers = ["data", "descricao", "valor"];
        }
        startRow = 0;
      }

      const dataIndex = headers.findIndex(
        (h) => h.toLowerCase() === "data" || h.toLowerCase() === "date",
      );
      const descIndex = headers.findIndex(
        (h) =>
          h.toLowerCase() === "descricao" || h.toLowerCase() === "description",
      );
      const valorIndex = headers.findIndex(
        (h) =>
          h.toLowerCase() === "valor" ||
          h.toLowerCase() === "amount" ||
          h.toLowerCase() === "total",
      );
      const categoriaIndex = headers.findIndex(
        (h) =>
          h.toLowerCase() === "categoria" || h.toLowerCase() === "category",
      );

      const data: any[] = [];

      for (let i = startRow; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = parseRow(lines[i]);
        const row: any = {};

        if (dataIndex !== -1) row.data = values[dataIndex] || "";
        if (descIndex !== -1) row.descricao = values[descIndex] || "";
        if (valorIndex !== -1) row.valor = values[valorIndex] || "";
        if (categoriaIndex !== -1) row.categoria = values[categoriaIndex] || "";

        if (Object.keys(row).length === 0 && values.length >= 3) {
          row.data = values[0];
          row.descricao = values[1];
          row.valor = values[2];
          if (values.length >= 4) row.categoria = values[3];
        }

        data.push(row);
      }

      callback(data);
    };
    reader.readAsText(file, "UTF-8");
  };

  // Função para converter data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
  const parseBrazilianDate = (dateStr: string): string => {
    if (!dateStr) return "";

    const cleanDate = dateStr.trim();

    if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return cleanDate;
    }

    if (cleanDate.includes("/")) {
      const parts = cleanDate.split("/");
      if (parts.length === 3) {
        let day = parts[0].padStart(2, "0");
        let month = parts[1].padStart(2, "0");
        let year = parts[2];

        if (year.length === 2) {
          year = "20" + year;
        }

        return `${year}-${month}-${day}`;
      }
    }

    return cleanDate;
  };

  const importarGastosCSV = async () => {
    if (!importFile) {
      alert("Selecione um arquivo CSV");
      return;
    }

    setImporting(true);

    const reader = new FileReader();

    reader.onload = async (event) => {
      const conteudo = event.target?.result as string;
      const linhas = conteudo.split(/\r?\n/);

      let sucesso = 0;
      let erros = 0;

      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];

        if (!linha.trim()) continue;

        const partes = linha.split(";");

        if (partes.length < 3) {
          erros++;
          continue;
        }

        const data = partes[0]?.trim();
        const descricao = partes[1]?.trim();
        let valor = partes[2]?.trim();
        const categoriaId = partes[3]?.trim() || "2";

        if (!data || !descricao || !valor) {
          erros++;
          continue;
        }

        valor = valor.replace("R$", "").replace(",", ".").trim();
        const valorNumerico = parseFloat(valor);

        if (isNaN(valorNumerico)) {
          erros++;
          continue;
        }

        let dataFormatada = data;
        if (data.includes("/")) {
          const [dia, mes, ano] = data.split("/");
          dataFormatada = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
        }

        try {
          const response = await fetch("http://localhost:8000/api/expenses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              restaurant_id: 1,
              description: descricao,
              amount: valorNumerico,
              expense_date: dataFormatada,
              category_id: parseInt(categoriaId),
              notes: "Importado via CSV",
            }),
          });

          if (response.ok) {
            sucesso++;
          } else {
            erros++;
          }
        } catch (error) {
          erros++;
        }
      }

      alert(
        `Importação finalizada!\n✅ Sucesso: ${sucesso}\n❌ Erros: ${erros}`,
      );

      setShowModalImportarGastos(false);
      setImportFile(null);
      setImportPreview([]);
      fetchTransacoes();
      setImporting(false);
    };

    reader.readAsText(importFile, "UTF-8");
  };

  const importarVendasCSV = async () => {
    if (!importFile) {
      alert("Selecione um arquivo CSV");
      return;
    }

    setImporting(true);

    const reader = new FileReader();

    reader.onload = async (event) => {
      const conteudo = event.target?.result as string;
      const linhas = conteudo.split(/\r?\n/).filter((linha) => linha.trim());

      if (linhas.length < 2) {
        alert("Arquivo vazio ou formato inválido");
        setImporting(false);
        return;
      }

      const cabecalho = linhas[0]
        .split(";")
        .map((col) => col.trim().toLowerCase());

      let idxData = cabecalho.findIndex((h) => h === "data" || h === "date");
      let idxCliente = cabecalho.findIndex(
        (h) => h === "cliente" || h === "customer" || h === "customer_name",
      );
      let idxValor = cabecalho.findIndex(
        (h) => h === "valor" || h === "amount" || h === "total",
      );
      let idxPagamento = cabecalho.findIndex(
        (h) => h === "pagamento" || h === "payment" || h === "payment_method",
      );

      if (idxData === -1) idxData = 0;
      if (idxValor === -1) idxValor = 1;

      let sucesso = 0;
      let erros = 0;

      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];
        if (!linha.trim()) continue;

        const partes = linha.split(";").map((col) => col.trim());

        if (partes.length < 2) {
          erros++;
          continue;
        }

        const dataOriginal = partes[idxData] || "";
        const cliente =
          idxCliente !== -1
            ? partes[idxCliente] || "Venda Rápida"
            : "Venda Rápida";
        let valorRaw = partes[idxValor] || "";
        const pagamento =
          idxPagamento !== -1 ? partes[idxPagamento] || "dinheiro" : "dinheiro";

        if (!dataOriginal || !valorRaw) {
          erros++;
          continue;
        }

        let valorNumerico = 0;
        let valorLimpo = valorRaw.replace(/R\$\s*/g, "").trim();

        if (valorLimpo.includes(",")) {
          valorLimpo = valorLimpo.replace(/\./g, "");
          valorLimpo = valorLimpo.replace(",", ".");
        }

        valorNumerico = parseFloat(valorLimpo);

        console.log(
          `Valor: "${valorRaw}" -> "${valorLimpo}" -> ${valorNumerico}`,
        );

        if (isNaN(valorNumerico) || valorNumerico <= 0) {
          console.error(`Valor inválido: ${valorRaw}`);
          erros++;
          continue;
        }

        let dataFormatada = dataOriginal;
        if (dataOriginal.includes("/")) {
          const [dia, mes, ano] = dataOriginal.split("/");
          dataFormatada = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
        }

        try {
          const response = await fetch("http://localhost:8000/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              restaurant_id: 1,
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
            const errorData = await response.json();
            console.error(`Erro API:`, errorData);
            erros++;
          }
        } catch (error) {
          console.error(`Erro:`, error);
          erros++;
        }
      }

      alert(
        `Importação de vendas finalizada!\n✅ Sucesso: ${sucesso}\n❌ Erros: ${erros}`,
      );

      setShowModalImportarVendas(false);
      setImportFile(null);
      setImportPreview([]);
      fetchTransacoes();
      setImporting(false);
    };

    reader.readAsText(importFile, "UTF-8");
  };

  const previewCSV = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const conteudo = event.target?.result as string;
      const linhas = conteudo.split(/\r?\n/);

      const preview = [];

      for (let i = 1; i < linhas.length && i < 6; i++) {
        const linha = linhas[i];
        if (!linha.trim()) continue;

        const partes = linha.split(";");

        preview.push({
          data_original: partes[0]?.trim() || "",
          descricao: partes[1]?.trim() || "",
          valor: partes[2]?.trim() || "",
          categoria: partes[3]?.trim() || "",
        });
      }

      setImportPreview(preview);
    };

    reader.readAsText(file, "UTF-8");
  };

  const previewVendasCSV = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const conteudo = event.target?.result as string;
      const linhas = conteudo.split(/\r?\n/).filter((linha) => linha.trim());

      if (linhas.length === 0) return;

      const cabecalho = linhas[0]
        .split(";")
        .map((col) => col.trim().toLowerCase());
      console.log("Cabeçalho detectado:", cabecalho);

      let idxData = cabecalho.findIndex((h) => h === "data" || h === "date");
      let idxCliente = cabecalho.findIndex(
        (h) => h === "cliente" || h === "customer" || h === "customer_name",
      );
      let idxValor = cabecalho.findIndex(
        (h) => h === "valor" || h === "amount" || h === "total",
      );
      let idxPagamento = cabecalho.findIndex(
        (h) => h === "pagamento" || h === "payment" || h === "payment_method",
      );

      if (idxData === -1) idxData = 0;
      if (idxValor === -1) idxValor = 1;

      const preview = [];

      for (let i = 1; i < Math.min(linhas.length, 6); i++) {
        const linha = linhas[i];
        if (!linha.trim()) continue;

        const partes = linha.split(";").map((col) => col.trim());

        preview.push({
          data_original: partes[idxData] || "",
          cliente:
            idxCliente !== -1
              ? partes[idxCliente] || "Venda Rápida"
              : "Venda Rápida",
          valor: partes[idxValor] || "",
          pagamento:
            idxPagamento !== -1 ? partes[idxPagamento] || "debito" : "debito",
        });
      }

      console.log("Preview vendas:", preview);
      setImportPreview(preview);
    };

    reader.readAsText(file, "UTF-8");
  };

  const editarCategoria = async () => {
    if (!editandoCategoria) return;
    if (!editandoCategoria.name.trim()) {
      alert("Digite o nome da categoria");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/expense-categories/${editandoCategoria.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: editandoCategoria.name,
            icon: editandoCategoria.icon,
            color: editandoCategoria.color,
          }),
        },
      );

      if (!response.ok) throw new Error("Erro ao editar categoria");

      await fetchCategorias();
      setEditandoCategoria(null);
      alert("Categoria atualizada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao editar categoria");
    }
  };

  const excluirCategoria = async (id: number, name: string) => {
    const temSaidas = transacoes.some(
      (t) => t.type === "saida" && t.category_id === id,
    );

    if (temSaidas) {
      if (
        !confirm(
          `A categoria "${name}" possui gastos associados. Excluir mesmo assim?`,
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
        return;
      }
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/expense-categories/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Erro ao excluir categoria");
        return;
      }

      await fetchCategorias();

      if (filtroCategoria === id) {
        setFiltroCategoria(null);
      }

      alert("Categoria excluída com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir categoria");
    }
  };

  const adicionarSaida = async () => {
    if (!novaSaida.descricao || novaSaida.descricao.trim() === "") {
      alert("Preencha a descrição");
      return;
    }

    if (novaSaida.valor <= 0) {
      alert("Digite um valor válido maior que zero");
      return;
    }

    if (!novaSaida.category_id || novaSaida.category_id === 0) {
      alert("Selecione uma categoria");
      return;
    }

    if (!novaSaida.data) {
      alert("Selecione uma data");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          restaurant_id: 1,
          description: novaSaida.descricao,
          amount: Number(novaSaida.valor),
          expense_date: novaSaida.data,
          category_id: Number(novaSaida.category_id),
          type: "saida",
          notes: null,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Erro ao adicionar saída";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        alert(errorMessage);
        return;
      }

      setNovaSaida({
        descricao: "",
        valor: 0,
        category_id: categorias[0]?.id || 0,
        data: hoje,
      });
      setShowModalSaida(false);
      fetchTransacoes();
      alert("Saída adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar saída:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const removerTransacao = async (
    id: number,
    type: string,
    source?: string,
  ) => {
    if (!confirm("Remover esse lançamento?")) return;

    if (type === "entrada" && source === "pdv") {
      alert("Entradas do PDV não podem ser removidas aqui.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/expenses/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        alert("Erro ao remover");
        return;
      }

      fetchTransacoes();
      alert("Removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const toggleDia = (data: string) => {
    setDiasExpandidos((prev) => ({ ...prev, [data]: !prev[data] }));
  };

  const formatCurrency = (value: any): string => {
    const num = typeof value === "number" ? value : Number(value) || 0;
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "-";
    return dateString.split("-").reverse().join("/");
  };

  const totalEntradas = transacoes
    .filter((t) => t.type === "entrada")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalSaidas = transacoes
    .filter((t) => t.type === "saida")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const saldoGeral = (totalEntradas || 0) - (totalSaidas || 0);

  const transacoesFiltradas = transacoes.filter((t) => {
    const matchCategoria = filtroCategoria
      ? t.category_id === filtroCategoria
      : true;
    const matchTipo =
      (t.type === "entrada" && showEntradas) ||
      (t.type === "saida" && showSaidas);
    return matchCategoria && matchTipo;
  });

  const transacoesPorData = transacoesFiltradas.reduce(
    (acc: any, transacao) => {
      const data = transacao.date;
      if (!acc[data]) acc[data] = [];
      acc[data].push(transacao);
      return acc;
    },
    {},
  );

  const totalEntradasPorData = Object.keys(transacoesPorData).reduce(
    (acc: any, data) => {
      acc[data] = transacoesPorData[data]
        .filter((t: Transaction) => t.type === "entrada")
        .reduce(
          (sum: number, t: Transaction) => sum + (Number(t.amount) || 0),
          0,
        );
      return acc;
    },
    {},
  );

  const totalSaidasPorData = Object.keys(transacoesPorData).reduce(
    (acc: any, data) => {
      acc[data] = transacoesPorData[data]
        .filter((t: Transaction) => t.type === "saida")
        .reduce(
          (sum: number, t: Transaction) => sum + (Number(t.amount) || 0),
          0,
        );
      return acc;
    },
    {},
  );

  const saldoPorData = Object.keys(transacoesPorData).reduce(
    (acc: any, data) => {
      const entradas = totalEntradasPorData[data] || 0;
      const saidas = totalSaidasPorData[data] || 0;
      acc[data] = entradas - saidas;
      return acc;
    },
    {},
  );

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

  // Versão Desktop
  if (!isMobile) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          height: "100%",
          background: "#FAFAFA",
        }}
      >
        <SidebarCaixa
          setShowModalSaida={setShowModalSaida}
          setShowModalGerenciar={setShowModalGerenciar}
          setShowModalImportarGastos={setShowModalImportarGastos}
          setShowModalImportarVendas={setShowModalImportarVendas}
          onVoltarDashboard={setTela ? () => setTela("dashboard") : undefined}
        />

        <div style={{ padding: "20px", overflowY: "auto", height: "100vh" }}>
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
          />

          <FiltrosCaixa
            categorias={categorias}
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
          />

          <TabelaGastos
            transacoesPorData={transacoesPorData}
            diasExpandidos={diasExpandidos}
            totalEntradasPorData={totalEntradasPorData}
            totalSaidasPorData={totalSaidasPorData}
            saldoPorData={saldoPorData}
            loading={loading}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            toggleDia={toggleDia}
            removerTransacao={removerTransacao}
          />
        </div>

        {/* MODAIS */}
        {showModalGerenciar && (
          <ModalGerenciarCategorias
            showModalGerenciar={showModalGerenciar}
            setShowModalGerenciar={setShowModalGerenciar}
            categorias={categorias}
            editandoCategoria={editandoCategoria}
            setEditandoCategoria={setEditandoCategoria}
            transacoes={transacoes}
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
      </div>
    );
  }

  // Versão Mobile
  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh" }}>
      {/* Header Mobile */}
      <div
        style={{
          padding: "16px",
          background: "#1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#374151",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 20 }}>💰</span>
          </div>
          <h1
            style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#fff" }}
          >
            Caixa
          </h1>
        </div>
        <button
          onClick={() => setShowMobileMenu(true)}
          style={{
            background: "#374151",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      {/* Botão Voltar ao Dashboard - Mobile */}
      <div style={{ padding: "12px 16px" }}>
        <button
          onClick={() => setTela && setTela("dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "10px 16px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            cursor: "pointer",
            color: "#374151",
            fontSize: 14,
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar ao Dashboard
        </button>
      </div>

      {/* Menu Mobile */}
      {showMobileMenu && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1000,
            }}
            onClick={() => setShowMobileMenu(false)}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "280px",
              background: "#1f2937",
              zIndex: 1001,
              padding: "20px",
              overflowY: "auto",
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
                  color: "#fff",
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

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
                borderRadius: 8,
                cursor: "pointer",
                color: "#fff",
                marginBottom: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#374151";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#374151",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 14 }}>📤</span>
              </div>
              <span>Nova Saída</span>
            </button>

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
                borderRadius: 8,
                cursor: "pointer",
                color: "#fff",
                marginBottom: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#374151";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#374151",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 14 }}>🏷️</span>
              </div>
              <span>Categorias</span>
            </button>

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
                borderRadius: 8,
                cursor: "pointer",
                color: "#fff",
                marginBottom: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#374151";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#374151",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 14 }}>📥</span>
              </div>
              <span>Importar Gastos</span>
            </button>

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
                borderRadius: 8,
                cursor: "pointer",
                color: "#fff",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#374151";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#374151",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 14 }}>📤</span>
              </div>
              <span>Importar Vendas</span>
            </button>
          </div>
        </>
      )}

      {/* Conteúdo Mobile */}
      <div style={{ padding: "16px" }}>
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
        />

        <FiltrosCaixa
          categorias={categorias}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
        />

        <TabelaGastos
          transacoesPorData={transacoesPorData}
          diasExpandidos={diasExpandidos}
          totalEntradasPorData={totalEntradasPorData}
          totalSaidasPorData={totalSaidasPorData}
          saldoPorData={saldoPorData}
          loading={loading}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          toggleDia={toggleDia}
          removerTransacao={removerTransacao}
        />
      </div>

      {/* MODAIS */}
      {showModalGerenciar && (
        <ModalGerenciarCategorias
          showModalGerenciar={showModalGerenciar}
          setShowModalGerenciar={setShowModalGerenciar}
          categorias={categorias}
          editandoCategoria={editandoCategoria}
          setEditandoCategoria={setEditandoCategoria}
          transacoes={transacoes}
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
    </div>
  );
}
