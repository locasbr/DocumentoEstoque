"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Camera,
  CheckCircle2,
  CreditCard,
  Keyboard,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Package,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  Star,
  Tag,
  TrendingUp,
  Usb,
  UserPlus,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import Alert from "@/components/alerts";
import BarcodeScanner from "@/components/barcode-scanner";
import CupomImpressao from "@/components/cupom-impressao";
import { useNotification } from "@/contexts/NotificationContext";
import { useCupom } from "@/hooks/useCupom";
import { buscarProdutoPorBarcode } from "@/lib/barcode-api";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { formatarMoeda } from "@/lib/utils";

type FormaPagamento =
  | "Dinheiro"
  | "Pix"
  | "Cartão Débito"
  | "Cartão Crédito";

interface ItemCarrinho {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
}

interface ClientePDV {
  id: string;
  nome: string;
  telefone: string | null;
  endereco: string | null;
}

interface ItemVendaResultado {
  produto_id: string;
  nome: string;
  sku: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

interface ResultadoVenda {
  venda_id: string;
  numero_venda: string;
  usuario_id: string;
  realizado_por: string;
  cliente_id: string | null;
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: FormaPagamento;
  valor_recebido: number | null;
  troco: number | null;
  itens: ItemVendaResultado[];
}

interface VendaRecente {
  numero_venda: string;
  total: number;
  desconto: number;
  forma_pagamento: FormaPagamento;
  valor_recebido?: number;
  itens: ItemVendaResultado[];
  hora: string;
}

interface StatsDia {
  totalVendas: number;
  faturamento: number;
  ticketMedio: number;
}

interface DadosProdutoBarcode {
  encontrado: boolean;
  nome?: string;
  marca?: string;
  descricao?: string;
  categoria?: string;
}

const FORMAS_PAGAMENTO: ReadonlyArray<{
  label: string;
  icon: typeof Banknote;
  value: FormaPagamento;
}> = [
  { label: "Dinheiro", icon: Banknote, value: "Dinheiro" },
  { label: "Pix", icon: QrCode, value: "Pix" },
  { label: "Débito", icon: CreditCard, value: "Cartão Débito" },
  { label: "Crédito", icon: CreditCard, value: "Cartão Crédito" },
];

const SOM_BIPE_KEY = "pdv_som_ativo";

function numero(valor: unknown): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function mensagemErro(valor: unknown): string {
  return valor instanceof Error ? valor.message : "Erro inesperado";
}

export default function PDVPage() {
  const { addNotification } = useNotification();
  const { cupomAberto, dadosCupom, gerarCupom, fecharCupom } = useCupom();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<ClientePDV[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([]);
  const [topVendidosIds, setTopVendidosIds] = useState<string[]>([]);
  const [statsDia, setStatsDia] = useState<StatsDia>({
    totalVendas: 0,
    faturamento: 0,
    ticketMedio: 0,
  });

  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [somAtivo, setSomAtivo] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [usbDetectado, setUsbDetectado] = useState(false);
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false);
  const [scannerAberto, setScannerAberto] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [mostrarSeletorCliente, setMostrarSeletorCliente] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] =
    useState<ClientePDV | null>(null);
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("Dinheiro");
  const [valorRecebido, setValorRecebido] = useState("");
  const [desconto, setDesconto] = useState("");
  const [animacaoAdd, setAnimacaoAdd] = useState<{
    id: string;
    key: number;
  } | null>(null);
  const [telaSucesso, setTelaSucesso] = useState<{
    total: number;
    recebido: number;
    troco: number;
    formaPagamento: string;
  } | null>(null);

  const [modalCadastroRapido, setModalCadastroRapido] = useState(false);
  const [dadosProdutoAPI, setDadosProdutoAPI] =
    useState<DadosProdutoBarcode | null>(null);
  const [skuParaCadastro, setSkuParaCadastro] = useState("");
  const [cadastroNome, setCadastroNome] = useState("");
  const [cadastroMarca, setCadastroMarca] = useState("");
  const [cadastroDescricao, setCadastroDescricao] = useState("");
  const [cadastroCategoria, setCadastroCategoria] = useState("");
  const [cadastroPreco, setCadastroPreco] = useState("");
  const [cadastroCusto, setCadastroCusto] = useState("");
  const [cadastroQuantidade, setCadastroQuantidade] = useState("1");
  const [salvandoProdutoRapido, setSalvandoProdutoRapido] = useState(false);

  const buscaInputRef = useRef<HTMLInputElement>(null);
  const usbBufferRef = useRef("");
  const usbTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const totalItens = useMemo(
    () => carrinho.reduce((total, item) => total + item.quantidade, 0),
    [carrinho],
  );

  const subtotal = useMemo(
    () =>
      carrinho.reduce(
        (total, item) => total + item.quantidade * item.preco_unitario,
        0,
      ),
    [carrinho],
  );

  const descontoInformado = Number.parseFloat(desconto);
  const descontoVal = Number.isFinite(descontoInformado)
    ? Math.max(descontoInformado, 0)
    : 0;
  const descontoInvalido = descontoVal > subtotal;
  const totalPagar = descontoInvalido ? subtotal : subtotal - descontoVal;
  const recebido = Number.parseFloat(valorRecebido);
  const pagamentoDinheiroInvalido =
    formaPagamento === "Dinheiro" &&
    (!Number.isFinite(recebido) || recebido < totalPagar);
  const trocoVal =
    formaPagamento === "Dinheiro" && Number.isFinite(recebido)
      ? Math.max(0, recebido - totalPagar)
      : 0;

  const categorias = useMemo(() => {
    return Array.from(
      new Set(
        produtos
          .map((produto) => produto.categoria?.trim())
          .filter((categoria): categoria is string => Boolean(categoria)),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const termo = filtro.trim().toLocaleLowerCase("pt-BR");
    return produtos.filter((produto) => {
      const correspondeTexto =
        !termo ||
        produto.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        produto.sku.toLocaleLowerCase("pt-BR").includes(termo) ||
        produto.categoria?.toLocaleLowerCase("pt-BR").includes(termo) ||
        produto.marca?.toLocaleLowerCase("pt-BR").includes(termo);
      const correspondeCategoria =
        !categoriaFiltro || produto.categoria === categoriaFiltro;
      return correspondeTexto && correspondeCategoria;
    });
  }, [categoriaFiltro, filtro, produtos]);

  const topVendidos = useMemo(
    () =>
      topVendidosIds
        .map((id) => produtos.find((produto) => produto.id === id))
        .filter(
          (produto): produto is Produto =>
            Boolean(produto && numero(produto.quantidade_atual) > 0),
        ),
    [produtos, topVendidosIds],
  );

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLocaleLowerCase("pt-BR");
    return clientes.filter((cliente) =>
      cliente.nome.toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [buscaCliente, clientes]);

  const carregarProdutos = useCallback(async () => {
    const { data, error: produtosError } = await supabase
      .from("produtos")
      .select("*")
      .eq("ativo", true)
      .gt("quantidade_atual", 0)
      .order("nome", { ascending: true });

    if (produtosError) throw produtosError;
    setProdutos((data as Produto[] | null) ?? []);
  }, []);

  const carregarClientes = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return;

    const { data: membro } = await supabase
      .from("membros")
      .select("dono_id")
      .eq("user_id", userData.user.id)
      .eq("status", "ativo")
      .maybeSingle();

    const donoId = membro?.dono_id ?? userData.user.id;
    const { data, error: clientesError } = await supabase
      .from("clientes")
      .select("id, nome, telefone, endereco")
      .eq("usuario_id", donoId)
      .order("nome", { ascending: true });

    if (clientesError) {
      console.error("Erro ao carregar clientes:", clientesError);
      return;
    }
    setClientes((data as ClientePDV[] | null) ?? []);
  }, []);

  const carregarStatsDia = useCallback(async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const { data, error: statsError } = await supabase
      .from("vendas")
      .select("id, total")
      .gte("criado_em", hoje.toISOString());

    if (statsError) {
      console.error("Erro nos indicadores do PDV:", statsError);
      return;
    }

    const vendasHoje = data ?? [];
    const totalVendas = vendasHoje.length;
    const faturamento = vendasHoje.reduce(
      (total, venda) => total + numero(venda.total),
      0,
    );

    setStatsDia({
      totalVendas,
      faturamento,
      ticketMedio: totalVendas > 0 ? faturamento / totalVendas : 0,
    });
  }, []);

  const carregarTopVendidos = useCallback(async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const { data: vendasHoje, error: vendasError } = await supabase
      .from("vendas")
      .select("id")
      .gte("criado_em", hoje.toISOString());

    if (vendasError || !vendasHoje?.length) {
      if (vendasError) console.error("Erro nas vendas do dia:", vendasError);
      setTopVendidosIds([]);
      return;
    }

    const { data: itens, error: itensError } = await supabase
      .from("itens_venda")
      .select("produto_id, quantidade")
      .in(
        "venda_id",
        vendasHoje.map((venda) => venda.id),
      );

    if (itensError) {
      console.error("Erro nos produtos mais vendidos:", itensError);
      return;
    }

    const contagem = new Map<string, number>();
    for (const item of itens ?? []) {
      if (!item.produto_id) continue;
      contagem.set(
        item.produto_id,
        (contagem.get(item.produto_id) ?? 0) + numero(item.quantidade),
      );
    }

    setTopVendidosIds(
      Array.from(contagem.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([produtoId]) => produtoId),
    );
  }, []);

  const carregarTudo = useCallback(
    async (feedback = false) => {
      feedback ? setAtualizando(true) : setLoading(true);
      setError("");

      try {
        await Promise.all([
          carregarProdutos(),
          carregarClientes(),
          carregarStatsDia(),
          carregarTopVendidos(),
        ]);
        if (feedback) {
          addNotification("PDV atualizado.", "success", 1600);
        }
      } catch (erro) {
        console.error("Erro ao carregar PDV:", erro);
        setError("Não foi possível carregar os dados do PDV.");
      } finally {
        setLoading(false);
        setAtualizando(false);
      }
    },
    [
      addNotification,
      carregarClientes,
      carregarProdutos,
      carregarStatsDia,
      carregarTopVendidos,
    ],
  );

  useEffect(() => {
    void carregarTudo();
  }, [carregarTudo]);

  useEffect(() => {
    const salvo = localStorage.getItem(SOM_BIPE_KEY);
    if (salvo !== null) setSomAtivo(salvo === "true");
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!telaSucesso) return;
    const timer = window.setTimeout(() => setTelaSucesso(null), 8000);
    return () => window.clearTimeout(timer);
  }, [telaSucesso]);

  useEffect(() => {
    if (!dadosProdutoAPI) return;
    setCadastroNome(dadosProdutoAPI.nome ?? "");
    setCadastroMarca(dadosProdutoAPI.marca ?? "");
    setCadastroDescricao(dadosProdutoAPI.descricao ?? "");
    setCadastroCategoria(dadosProdutoAPI.categoria ?? "");
  }, [dadosProdutoAPI]);

  const tocarBipe = useCallback(() => {
    if (!somAtivo) return;
    try {
      const AudioContextCompativel =
        window.AudioContext ??
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;
      if (!AudioContextCompativel) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextCompativel();
      }
      const contexto = audioContextRef.current;
      const oscilador = contexto.createOscillator();
      const ganho = contexto.createGain();
      oscilador.connect(ganho);
      ganho.connect(contexto.destination);
      oscilador.frequency.value = 1200;
      ganho.gain.setValueAtTime(0.15, contexto.currentTime);
      ganho.gain.exponentialRampToValueAtTime(
        0.001,
        contexto.currentTime + 0.1,
      );
      oscilador.start(contexto.currentTime);
      oscilador.stop(contexto.currentTime + 0.1);
    } catch {
      // O som e opcional.
    }
  }, [somAtivo]);

  const adicionarAoCarrinho = useCallback(
    (produto: Produto) => {
      tocarBipe();
      setAnimacaoAdd({ id: produto.id, key: Date.now() });

      setCarrinho((atual) => {
        const existente = atual.find((item) => item.produto_id === produto.id);
        if (existente) {
          if (existente.quantidade >= numero(produto.quantidade_atual)) {
            addNotification("Estoque insuficiente.", "warning", 1800);
            return atual;
          }
          return atual.map((item) =>
            item.produto_id === produto.id
              ? { ...item, quantidade: item.quantidade + 1 }
              : item,
          );
        }

        return [
          ...atual,
          {
            produto_id: produto.id,
            quantidade: 1,
            preco_unitario: numero(produto.preco_venda),
          },
        ];
      });
    },
    [addNotification, tocarBipe],
  );

  const removerDoCarrinho = useCallback((produtoId: string) => {
    setCarrinho((atual) =>
      atual.filter((item) => item.produto_id !== produtoId),
    );
  }, []);

  const atualizarQuantidade = useCallback(
    (produtoId: string, novaQuantidade: number) => {
      if (novaQuantidade <= 0) {
        removerDoCarrinho(produtoId);
        return;
      }
      const produto = produtos.find((item) => item.id === produtoId);
      if (!produto || novaQuantidade > numero(produto.quantidade_atual)) {
        addNotification("Estoque insuficiente.", "warning", 1800);
        return;
      }
      setCarrinho((atual) =>
        atual.map((item) =>
          item.produto_id === produtoId
            ? { ...item, quantidade: novaQuantidade }
            : item,
        ),
      );
    },
    [addNotification, produtos, removerDoCarrinho],
  );

  const handleCodigoBarrasLido = useCallback(
    async (codigoBarras: string) => {
      const codigo = codigoBarras.trim();
      if (!codigo) return;

      const produtoLocal = produtos.find((produto) => produto.sku === codigo);
      if (produtoLocal) {
        adicionarAoCarrinho(produtoLocal);
        addNotification(`${produtoLocal.nome} adicionado.`, "success", 1600);
        return;
      }

      addNotification(`Buscando ${codigo}...`, "info", 1800);
      try {
        const resultado = (await buscarProdutoPorBarcode(
          codigo,
        )) as DadosProdutoBarcode;
        setSkuParaCadastro(codigo);
        setDadosProdutoAPI(resultado);
        setModalCadastroRapido(true);
        if (!resultado.encontrado) {
          addNotification(
            "Produto não encontrado. Preencha os dados manualmente.",
            "info",
            3500,
          );
        }
      } catch (erro) {
        console.error("Erro ao consultar código de barras:", erro);
        setSkuParaCadastro(codigo);
        setDadosProdutoAPI({ encontrado: false });
        setModalCadastroRapido(true);
      }
    },
    [addNotification, adicionarAoCarrinho, produtos],
  );

  useEffect(() => {
    const MAX_GAP_MS = 50;
    const PROCESS_DELAY_MS = 80;
    const MIN_LENGTH = 8;

    const processarBuffer = () => {
      if (usbTimeoutRef.current) {
        clearTimeout(usbTimeoutRef.current);
        usbTimeoutRef.current = null;
      }
      const codigo = usbBufferRef.current.trim();
      usbBufferRef.current = "";
      if (codigo.length < MIN_LENGTH) return;
      setUsbDetectado(true);
      window.setTimeout(() => setUsbDetectado(false), 1800);
      navigator.vibrate?.(120);
      void handleCodigoBarrasLido(codigo);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = document.activeElement?.tagName.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Enter") {
        const codigo = usbBufferRef.current.trim();
        if (codigo.length >= MIN_LENGTH) {
          event.preventDefault();
          event.stopPropagation();
        }
        processarBuffer();
        return;
      }

      if (event.key.length !== 1) {
        usbBufferRef.current = "";
        lastKeyTimeRef.current = 0;
        return;
      }

      const agora = Date.now();
      if (agora - lastKeyTimeRef.current > MAX_GAP_MS) {
        usbBufferRef.current = "";
      }
      lastKeyTimeRef.current = agora;
      usbBufferRef.current += event.key;

      if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current);
      usbTimeoutRef.current = setTimeout(processarBuffer, PROCESS_DELAY_MS);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current);
    };
  }, [handleCodigoBarrasLido]);

  const abrirPagamento = useCallback(() => {
    if (carrinho.length === 0) {
      addNotification("Carrinho vazio.", "warning");
      return;
    }
    if (descontoInvalido) {
      addNotification(
        "O desconto não pode ser maior que o subtotal.",
        "warning",
        3500,
      );
      return;
    }
    setValorRecebido(totalPagar.toFixed(2));
    setModalPagamento(true);
  }, [addNotification, carrinho.length, descontoInvalido, totalPagar]);

  useEffect(() => {
    const handleHotkeys = (event: KeyboardEvent) => {
      const modalAberto =
        modalPagamento ||
        modalCadastroRapido ||
        scannerAberto ||
        cupomAberto ||
        mostrarSeletorCliente ||
        Boolean(telaSucesso);

      if (event.key === "F1") {
        event.preventDefault();
        setMostrarAtalhos(true);
      } else if (event.key === "F2" && !modalAberto) {
        event.preventDefault();
        buscaInputRef.current?.focus();
        buscaInputRef.current?.select();
      } else if (event.key === "F8" && !modalAberto) {
        event.preventDefault();
        abrirPagamento();
      } else if (event.key === "Escape" && !modalAberto && carrinho.length > 0) {
        if (window.confirm("Limpar carrinho?")) setCarrinho([]);
      }
    };

    window.addEventListener("keydown", handleHotkeys);
    return () => window.removeEventListener("keydown", handleHotkeys);
  }, [
    abrirPagamento,
    carrinho.length,
    cupomAberto,
    modalCadastroRapido,
    modalPagamento,
    mostrarSeletorCliente,
    scannerAberto,
    telaSucesso,
  ]);

  useEffect(() => {
    if (!modalPagamento) return;
    const handlePagamentoKeys = (event: KeyboardEvent) => {
      const digitando = document.activeElement?.tagName === "INPUT";
      if (!digitando && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        const forma = FORMAS_PAGAMENTO[Number(event.key) - 1];
        if (forma) setFormaPagamento(forma.value);
      }
      if (event.key === "Enter" && !processando) {
        event.preventDefault();
        void processarVenda();
      }
    };
    window.addEventListener("keydown", handlePagamentoKeys, true);
    return () => window.removeEventListener("keydown", handlePagamentoKeys, true);
  });

  const salvarProdutoRapido = async () => {
    if (salvandoProdutoRapido) return;

    const precoVenda = Number.parseFloat(cadastroPreco);
    const custoInformado = Number.parseFloat(cadastroCusto);
    const precoCusto = Number.isFinite(custoInformado)
      ? Math.max(custoInformado, 0)
      : 0;
    const quantidadeInformada = Number.parseInt(cadastroQuantidade, 10);
    const quantidade = Number.isFinite(quantidadeInformada)
      ? Math.max(quantidadeInformada, 0)
      : 0;

    if (!cadastroNome.trim() || !Number.isFinite(precoVenda) || precoVenda <= 0) {
      addNotification("Nome e preço de venda são obrigatórios.", "error");
      return;
    }

    setSalvandoProdutoRapido(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Usuário não autenticado");

      const { data: membro } = await supabase
        .from("membros")
        .select("dono_id")
        .eq("user_id", userData.user.id)
        .eq("status", "ativo")
        .maybeSingle();
      const donoId = membro?.dono_id ?? userData.user.id;

      const { data: novoProduto, error: insertError } = await supabase
        .from("produtos")
        .insert({
          sku: skuParaCadastro,
          nome: cadastroNome.trim(),
          marca: cadastroMarca.trim(),
          descricao: cadastroDescricao.trim(),
          categoria: cadastroCategoria.trim(),
          preco_venda: precoVenda,
          preco_custo: precoCusto,
          quantidade_atual: quantidade,
          quantidade_minima: 10,
          ativo: true,
          usuario_id: donoId,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      setModalCadastroRapido(false);
      setDadosProdutoAPI(null);
      setCadastroNome("");
      setCadastroMarca("");
      setCadastroDescricao("");
      setCadastroCategoria("");
      setCadastroPreco("");
      setCadastroCusto("");
      setCadastroQuantidade("1");
      await carregarProdutos();

      if (novoProduto && numero(novoProduto.quantidade_atual) > 0) {
        adicionarAoCarrinho(novoProduto as Produto);
      }
      addNotification("Produto cadastrado e pronto para uso.", "success");
    } catch (erro) {
      addNotification(`Erro ao cadastrar: ${mensagemErro(erro)}`, "error", 4500);
    } finally {
      setSalvandoProdutoRapido(false);
    }
  };

  const processarVenda = async () => {
    if (processando) return;
    setError("");

    if (carrinho.length === 0) {
      addNotification("Carrinho vazio.", "warning");
      return;
    }
    if (descontoInvalido) {
      setError("O desconto não pode ser maior que o subtotal.");
      return;
    }
    if (pagamentoDinheiroInvalido) {
      setError(
        `O valor recebido deve ser igual ou maior que ${formatarMoeda(totalPagar)}.`,
      );
      return;
    }

    setProcessando(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("processar_venda", {
        p_itens: carrinho.map((item) => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
        })),
        p_forma_pagamento: formaPagamento,
        p_desconto: descontoVal,
        p_valor_recebido: formaPagamento === "Dinheiro" ? recebido : null,
        p_cliente_id: clienteSelecionado?.id ?? null,
      });

      if (rpcError) {
        console.error("Erro na venda:", rpcError);
        setError(rpcError.message || "Não foi possível processar a venda.");
        return;
      }

      const resultado = data as ResultadoVenda | null;
      if (!resultado?.numero_venda || !Array.isArray(resultado.itens)) {
        setError("O servidor retornou dados inválidos após processar a venda.");
        return;
      }

      await gerarCupom({
        itens: resultado.itens.map((item) => ({
          nome: item.nome,
          sku: item.sku ?? undefined,
          quantidade: numero(item.quantidade),
          preco_unitario: numero(item.preco_unitario),
          subtotal: numero(item.subtotal),
        })),
        desconto: numero(resultado.desconto),
        forma_pagamento: resultado.forma_pagamento,
        valor_recebido: resultado.valor_recebido ?? undefined,
        nome_cliente: clienteSelecionado?.nome,
        endereco_cliente: clienteSelecionado?.endereco || undefined,
        telefone_cliente: clienteSelecionado?.telefone || undefined,
      });

      const novaVenda: VendaRecente = {
        numero_venda: resultado.numero_venda,
        total: numero(resultado.total),
        desconto: numero(resultado.desconto),
        forma_pagamento: resultado.forma_pagamento,
        valor_recebido: resultado.valor_recebido ?? undefined,
        itens: resultado.itens,
        hora: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setVendasRecentes((atuais) => [novaVenda, ...atuais].slice(0, 3));
      setTelaSucesso({
        total: numero(resultado.total),
        recebido: resultado.valor_recebido ?? numero(resultado.total),
        troco: resultado.troco ?? 0,
        formaPagamento: resultado.forma_pagamento,
      });

      setCarrinho([]);
      setDesconto("");
      setValorRecebido("");
      setModalPagamento(false);
      setClienteSelecionado(null);
      addNotification(
        `Venda ${resultado.numero_venda}: ${formatarMoeda(numero(resultado.total))}`,
        "success",
        4000,
      );
      await carregarTudo();
    } catch (erro) {
      console.error("Erro inesperado na venda:", erro);
      setError("Erro inesperado ao processar a venda.");
    } finally {
      setProcessando(false);
    }
  };

  const reimprimirCupom = async (venda: VendaRecente) => {
    await gerarCupom({
      itens: venda.itens.map((item) => ({
        nome: item.nome,
        sku: item.sku ?? undefined,
        quantidade: numero(item.quantidade),
        preco_unitario: numero(item.preco_unitario),
        subtotal: numero(item.subtotal),
      })),
      desconto: venda.desconto,
      forma_pagamento: venda.forma_pagamento,
      valor_recebido: venda.valor_recebido,
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  const BlocoCliente = () =>
    clienteSelecionado ? (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex min-w-0 items-center gap-2">
          <UserPlus className="h-4 w-4 shrink-0 text-blue-600" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {clienteSelecionado.nome}
            </p>
            {clienteSelecionado.telefone && (
              <p className="truncate text-xs text-gray-500">
                {clienteSelecionado.telefone}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Remover cliente"
          onClick={() => setClienteSelecionado(null)}
          className="rounded p-1 text-gray-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setMostrarSeletorCliente(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-2.5 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300"
      >
        <UserPlus className="h-4 w-4" />
        Vincular cliente (opcional)
      </button>
    );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center gap-2 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        Carregando PDV...
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 ${carrinho.length > 0 ? "pb-64 md:pb-6" : ""}`}>
      {usbDetectado && (
        <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          <Usb className="h-4 w-4" /> Código lido pelo leitor USB
        </div>
      )}

      <header className="mb-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              PDV
            </h1>
            <p className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Usb className="h-3 w-3" /> Leitor USB ativo
              <button
                type="button"
                onClick={() => setMostrarAtalhos(true)}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
              >
                <Keyboard className="h-3 w-3" /> Atalhos
              </button>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void carregarTudo(true)}
              disabled={atualizando}
              className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-800"
              title="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-800"
              title="Tela cheia"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                const novo = !somAtivo;
                setSomAtivo(novo);
                localStorage.setItem(SOM_BIPE_KEY, String(novo));
              }}
              className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-800"
              title="Som do leitor"
            >
              {somAtivo ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setScannerAberto(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Câmera</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <MetricCard icon={TrendingUp} label="Vendas hoje" valor={formatarMoeda(statsDia.faturamento)} cor="emerald" />
          <MetricCard icon={Receipt} label="Nº vendas" valor={String(statsDia.totalVendas)} cor="blue" />
          <MetricCard icon={ShoppingCart} label="Ticket médio" valor={formatarMoeda(statsDia.ticketMedio)} cor="violet" />
        </div>

        {vendasRecentes.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="whitespace-nowrap text-[10px] font-bold uppercase text-gray-400">Últimas:</span>
            {vendasRecentes.map((venda) => (
              <button
                key={venda.numero_venda}
                type="button"
                onClick={() => void reimprimirCupom(venda)}
                className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs dark:border-gray-700 dark:bg-gray-800"
              >
                <Receipt className="h-3 w-3" />
                {formatarMoeda(venda.total)} · {venda.hora}
              </button>
            ))}
          </div>
        )}
      </header>

      {error && <Alert message={error} type="error" />}

      {topVendidos.length > 0 && !filtro && !categoriaFiltro && (
        <section className="mb-4">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> Mais vendidos hoje
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {topVendidos.map((produto) => (
              <button
                key={produto.id}
                type="button"
                onClick={() => adicionarAoCarrinho(produto)}
                className="relative rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-left transition hover:border-yellow-400 dark:border-yellow-800 dark:bg-yellow-900/20"
              >
                <p className="truncate text-xs font-bold text-gray-900 dark:text-white">{produto.nome}</p>
                <p className="text-xs font-bold text-emerald-600">{formatarMoeda(numero(produto.preco_venda))}</p>
                {animacaoAdd?.id === produto.id && <span key={animacaoAdd.key} className="animate-floatUp absolute -top-1 right-2 text-xl font-extrabold text-emerald-500">+1</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mb-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={buscaInputRef}
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
            placeholder="Buscar por nome, SKU, marca ou categoria..."
            className="input-field w-full pl-10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            autoFocus
          />
        </div>
        {categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setCategoriaFiltro(null)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${!categoriaFiltro ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>Todos</button>
            {categorias.map((categoria) => (
              <button key={categoria} type="button" onClick={() => setCategoriaFiltro(categoriaFiltro === categoria ? null : categoria)} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${categoriaFiltro === categoria ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                <Tag className="h-3 w-3" /> {categoria}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-5 md:flex-row">
        <section className="min-w-0 flex-1">
          {produtosFiltrados.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-400 dark:border-gray-800 dark:bg-gray-900">
              <Package className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p className="font-semibold">Nenhum produto disponível</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {produtosFiltrados.map((produto) => {
                const item = carrinho.find((carrinhoItem) => carrinhoItem.produto_id === produto.id);
                return (
                  <button key={produto.id} type="button" onClick={() => adicionarAoCarrinho(produto)} className={`relative flex min-h-28 flex-col rounded-xl border-2 p-3 text-left transition active:scale-[0.98] ${item ? "border-blue-500 bg-blue-50 dark:bg-blue-900/25" : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"}`}>
                    <div className="flex w-full items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white">{produto.nome}</p>
                      {item && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{item.quantidade}</span>}
                    </div>
                    <p className="mt-1 text-base font-extrabold text-emerald-600">{formatarMoeda(numero(produto.preco_venda))}</p>
                    <p className="mt-auto pt-2 text-xs text-gray-400">{produto.quantidade_atual} em estoque</p>
                    {animacaoAdd?.id === produto.id && <span key={animacaoAdd.key} className="animate-floatUp absolute -top-1 right-2 text-xl font-extrabold text-emerald-500">+1</span>}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="hidden w-80 shrink-0 md:block">
          <Carrinho
            carrinho={carrinho}
            produtos={produtos}
            totalItens={totalItens}
            subtotal={subtotal}
            desconto={desconto}
            descontoVal={descontoVal}
            descontoInvalido={descontoInvalido}
            totalPagar={totalPagar}
            processando={processando}
            setDesconto={setDesconto}
            atualizarQuantidade={atualizarQuantidade}
            removerDoCarrinho={removerDoCarrinho}
            abrirPagamento={abrirPagamento}
            limpar={() => setCarrinho([])}
            cliente={<BlocoCliente />}
          />
        </aside>
      </div>

      {carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-3 shadow-2xl dark:border-gray-800 dark:bg-gray-900 md:hidden">
          <div className="mb-2 max-h-28 space-y-1 overflow-y-auto">
            {carrinho.map((item) => {
              const produto = produtos.find((p) => p.id === item.produto_id);
              return (
                <div key={item.produto_id} className="flex items-center gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate font-semibold">{produto?.nome}</span>
                  <button type="button" onClick={() => atualizarQuantidade(item.produto_id, item.quantidade - 1)} className="rounded bg-gray-100 p-1 dark:bg-gray-800"><Minus className="h-3 w-3" /></button>
                  <span className="w-5 text-center font-bold">{item.quantidade}</span>
                  <button type="button" onClick={() => atualizarQuantidade(item.produto_id, item.quantidade + 1)} className="rounded bg-gray-100 p-1 dark:bg-gray-800"><Plus className="h-3 w-3" /></button>
                  <span className="w-20 text-right font-bold">{formatarMoeda(item.quantidade * item.preco_unitario)}</span>
                  <button type="button" onClick={() => removerDoCarrinho(item.produto_id)} className="text-red-500"><X className="h-3.5 w-3.5" /></button>
                </div>
              );
            })}
          </div>
          <div className="mb-2"><BlocoCliente /></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCarrinho([])} className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold dark:bg-gray-800">Limpar</button>
            <button type="button" onClick={abrirPagamento} className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white">Vender · {formatarMoeda(totalPagar)}</button>
          </div>
        </div>
      )}

      {mostrarSeletorCliente && (
        <Modal onFechar={() => setMostrarSeletorCliente(false)}>
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
            <h2 className="text-lg font-bold">Selecionar cliente</h2>
            <button type="button" onClick={() => setMostrarSeletorCliente(false)}><X className="h-5 w-5" /></button>
          </div>
          <div className="p-4"><input autoFocus value={buscaCliente} onChange={(event) => setBuscaCliente(event.target.value)} placeholder="Buscar cliente..." className="input-field w-full dark:border-gray-700 dark:bg-gray-800" /></div>
          <div className="max-h-80 overflow-y-auto">
            {clientesFiltrados.length === 0 ? <p className="p-6 text-center text-sm text-gray-500">Nenhum cliente encontrado.</p> : clientesFiltrados.map((cliente) => (
              <button key={cliente.id} type="button" onClick={() => { setClienteSelecionado(cliente); setMostrarSeletorCliente(false); setBuscaCliente(""); }} className="w-full border-t border-gray-100 px-4 py-3 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
                <p className="text-sm font-semibold">{cliente.nome}</p>
                {cliente.telefone && <p className="text-xs text-gray-500">{cliente.telefone}</p>}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {mostrarAtalhos && (
        <Modal onFechar={() => setMostrarAtalhos(false)}>
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold"><Keyboard className="h-5 w-5 text-blue-600" /> Atalhos do PDV</h2><button type="button" onClick={() => setMostrarAtalhos(false)}><X className="h-5 w-5" /></button></div>
            <div className="space-y-2">
              {[["F1", "Mostrar ajuda"], ["F2", "Buscar produto"], ["F8", "Finalizar venda"], ["1-4", "Escolher pagamento"], ["Enter", "Confirmar venda"], ["Esc", "Limpar carrinho"]].map(([tecla, acao]) => (
                <div key={tecla} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"><span className="text-sm">{acao}</span><kbd className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-bold dark:border-gray-600 dark:bg-gray-900">{tecla}</kbd></div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {modalPagamento && (
        <Modal onFechar={() => !processando && setModalPagamento(false)}>
          <div className="max-h-[90vh] space-y-4 overflow-y-auto p-6">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Finalizar venda</h2><button type="button" disabled={processando} onClick={() => setModalPagamento(false)}><X className="h-6 w-6" /></button></div>
            <div className="space-y-2 rounded-xl bg-gray-50 p-4 dark:bg-gray-800"><div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatarMoeda(subtotal)}</span></div>{descontoVal > 0 && <div className="flex justify-between text-sm text-red-500"><span>Desconto</span><span>-{formatarMoeda(descontoVal)}</span></div>}<div className="flex justify-between border-t border-gray-200 pt-2 text-xl font-extrabold dark:border-gray-700"><span>Total</span><span>{formatarMoeda(totalPagar)}</span></div></div>
            <div className="grid grid-cols-4 gap-2">
              {FORMAS_PAGAMENTO.map(({ label, icon: Icon, value }, indice) => (
                <button key={value} type="button" onClick={() => setFormaPagamento(value)} className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs font-semibold ${formaPagamento === value ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/25" : "border-gray-200 dark:border-gray-700"}`}><kbd className="absolute right-1 top-1 text-[9px]">{indice + 1}</kbd><Icon className="h-5 w-5" />{label}</button>
              ))}
            </div>
            {formaPagamento === "Dinheiro" && (
              <div className="space-y-3"><label className="block text-sm font-semibold">Valor recebido</label><input type="number" min="0" step="0.01" value={valorRecebido} onChange={(event) => setValorRecebido(event.target.value)} className="input-field w-full text-lg font-bold dark:border-gray-700 dark:bg-gray-800" />{pagamentoDinheiroInvalido && <p className="text-sm text-red-600">Informe pelo menos {formatarMoeda(totalPagar)}.</p>}{trocoVal > 0 && <div className="flex justify-between rounded-xl bg-emerald-50 p-4 font-bold text-emerald-700 dark:bg-emerald-900/20"><span>Troco</span><span>{formatarMoeda(trocoVal)}</span></div>}</div>
            )}
            <button type="button" onClick={() => void processarVenda()} disabled={processando || descontoInvalido || pagamentoDinheiroInvalido} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 text-lg font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{processando ? <><Loader2 className="h-5 w-5 animate-spin" />Processando...</> : <>Confirmar · {formatarMoeda(totalPagar)}</>}</button>
          </div>
        </Modal>
      )}

      {modalCadastroRapido && dadosProdutoAPI && (
        <Modal onFechar={() => !salvandoProdutoRapido && setModalCadastroRapido(false)} largura="max-w-lg">
          <div className="max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Cadastrar produto</h2><button type="button" disabled={salvandoProdutoRapido} onClick={() => setModalCadastroRapido(false)}><X className="h-5 w-5" /></button></div>
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Os dados encontrados pelo código de barras foram preenchidos quando disponíveis. Revise tudo antes de salvar.</div>
            <div className="space-y-3">
              <Campo label="SKU"><div className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm dark:bg-gray-800">{skuParaCadastro}</div></Campo>
              <Campo label="Nome *"><input value={cadastroNome} onChange={(e) => setCadastroNome(e.target.value)} className="input-field w-full" /></Campo>
              <Campo label="Marca"><input value={cadastroMarca} onChange={(e) => setCadastroMarca(e.target.value)} className="input-field w-full" /></Campo>
              <Campo label="Descrição"><textarea value={cadastroDescricao} onChange={(e) => setCadastroDescricao(e.target.value)} rows={2} className="input-field w-full resize-none" /></Campo>
              <Campo label="Categoria"><input value={cadastroCategoria} onChange={(e) => setCadastroCategoria(e.target.value)} className="input-field w-full" /></Campo>
              <div className="grid gap-3 sm:grid-cols-2"><Campo label="Preço de venda *"><input type="number" min="0.01" step="0.01" value={cadastroPreco} onChange={(e) => setCadastroPreco(e.target.value)} className="input-field w-full" /></Campo><Campo label="Preço de custo"><input type="number" min="0" step="0.01" value={cadastroCusto} onChange={(e) => setCadastroCusto(e.target.value)} className="input-field w-full" /></Campo></div>
              <Campo label="Quantidade inicial"><input type="number" min="0" step="1" value={cadastroQuantidade} onChange={(e) => setCadastroQuantidade(e.target.value)} className="input-field w-full" /></Campo>
            </div>
            <div className="mt-6 flex gap-3"><button type="button" onClick={() => void salvarProdutoRapido()} disabled={salvandoProdutoRapido} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-50">{salvandoProdutoRapido && <Loader2 className="h-4 w-4 animate-spin" />}Salvar e usar</button><button type="button" disabled={salvandoProdutoRapido} onClick={() => setModalCadastroRapido(false)} className="rounded-lg bg-gray-100 px-4 py-3 font-semibold dark:bg-gray-800">Cancelar</button></div>
          </div>
        </Modal>
      )}

      {telaSucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-green-700 p-4 text-white">
          <div className="w-full max-w-xl text-center"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/20"><CheckCircle2 className="h-12 w-12" /></div><h2 className="text-3xl font-extrabold">Venda realizada!</h2><p className="mt-1 text-emerald-100">{telaSucesso.formaPagamento}</p><div className="mt-6 rounded-3xl bg-white/15 p-6"><p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Total cobrado</p><p className="mt-1 text-5xl font-extrabold">{formatarMoeda(telaSucesso.total)}</p></div>{telaSucesso.troco > 0 && <div className="mt-4 rounded-3xl bg-white p-7 text-emerald-700"><p className="text-xs font-bold uppercase">Devolver de troco</p><p className="mt-2 text-6xl font-extrabold">{formatarMoeda(telaSucesso.troco)}</p><p className="mt-2 text-sm text-gray-500">Recebido: {formatarMoeda(telaSucesso.recebido)}</p></div>}<button type="button" onClick={() => setTelaSucesso(null)} className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-bold text-emerald-700">Próxima venda <ArrowRight className="h-5 w-5" /></button></div>
        </div>
      )}

      {scannerAberto && <BarcodeScanner onDetected={handleCodigoBarrasLido} onClose={() => setScannerAberto(false)} />}
      {cupomAberto && dadosCupom && <CupomImpressao dados={dadosCupom} onFechar={fecharCupom} />}

      <style jsx>{`
        @keyframes floatUp { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-30px); } }
        .animate-floatUp { animation: floatUp 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}

function MetricCard({ icon: Icon, label, valor, cor }: { icon: typeof TrendingUp; label: string; valor: string; cor: "emerald" | "blue" | "violet" }) {
  const estilos = { emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20", blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20", violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20" };
  return <article className={`rounded-lg border px-3 py-2 ${estilos[cor]}`}><p className="flex items-center gap-1 text-[10px] font-bold uppercase"><Icon className="h-3 w-3" />{label}</p><p className="truncate text-sm font-extrabold text-gray-900 dark:text-white md:text-lg">{valor}</p></article>;
}

function Carrinho({ carrinho, produtos, totalItens, subtotal, desconto, descontoVal, descontoInvalido, totalPagar, processando, setDesconto, atualizarQuantidade, removerDoCarrinho, abrirPagamento, limpar, cliente }: { carrinho: ItemCarrinho[]; produtos: Produto[]; totalItens: number; subtotal: number; desconto: string; descontoVal: number; descontoInvalido: boolean; totalPagar: number; processando: boolean; setDesconto: (valor: string) => void; atualizarQuantidade: (id: string, quantidade: number) => void; removerDoCarrinho: (id: string) => void; abrirPagamento: () => void; limpar: () => void; cliente: React.ReactNode }) {
  return <div className="sticky top-20 space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Carrinho</h2><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{totalItens} un</span></div>{cliente}{carrinho.length === 0 ? <div className="py-8 text-center text-gray-400"><ShoppingCart className="mx-auto mb-2 h-8 w-8" /><p className="text-sm">Carrinho vazio</p></div> : <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">{carrinho.map((item) => { const produto = produtos.find((p) => p.id === item.produto_id); return <div key={item.produto_id} className="py-3"><div className="flex items-center justify-between gap-2"><p className="min-w-0 flex-1 truncate text-sm font-semibold">{produto?.nome}</p><button type="button" onClick={() => removerDoCarrinho(item.produto_id)} className="text-red-500"><X className="h-4 w-4" /></button></div><div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-1"><button type="button" onClick={() => atualizarQuantidade(item.produto_id, item.quantidade - 1)} className="rounded border p-1 dark:border-gray-700"><Minus className="h-3.5 w-3.5" /></button><span className="w-7 text-center text-sm font-bold">{item.quantidade}</span><button type="button" onClick={() => atualizarQuantidade(item.produto_id, item.quantidade + 1)} className="rounded border p-1 dark:border-gray-700"><Plus className="h-3.5 w-3.5" /></button></div><span className="text-sm font-bold">{formatarMoeda(item.quantidade * item.preco_unitario)}</span></div></div>; })}</div>}{carrinho.length > 0 && <><div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800"><div><label className="text-xs text-gray-500">Desconto</label><input type="number" min="0" step="0.01" value={desconto} onChange={(e) => setDesconto(e.target.value)} className={`input-field mt-1 w-full ${descontoInvalido ? "border-red-500" : ""}`} /></div><div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatarMoeda(subtotal)}</span></div>{descontoVal > 0 && <div className="flex justify-between text-sm text-red-500"><span>Desconto</span><span>-{formatarMoeda(descontoVal)}</span></div>}<div className="flex justify-between border-t pt-2 text-lg font-extrabold dark:border-gray-700"><span>Total</span><span>{formatarMoeda(totalPagar)}</span></div></div><button type="button" onClick={abrirPagamento} disabled={processando || descontoInvalido} className="w-full rounded-lg bg-emerald-600 py-3 font-bold text-white disabled:opacity-50">Finalizar venda</button><button type="button" onClick={limpar} className="flex w-full items-center justify-center gap-2 py-2 text-sm text-gray-500"><RotateCcw className="h-4 w-4" />Limpar carrinho</button></>}</div>;
}

function Modal({ children, onFechar, largura = "max-w-md" }: { children: React.ReactNode; onFechar: () => void; largura?: string }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onFechar(); }}><div className={`w-full ${largura} rounded-2xl bg-white shadow-2xl dark:bg-gray-900`}>{children}</div></div>;
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>{children}</div>;
}
