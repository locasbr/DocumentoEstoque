"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  Camera,
  CircleDollarSign,
  Clock3,
  Loader2,
  Package,
  QrCode,
  RefreshCw,
  Save,
  Tag,
  Warehouse,
} from "lucide-react";

import Alert from "@/components/alerts";
import BarcodeProductModal from "@/components/barcode-product-modal";
import BarcodeScanner from "@/components/barcode-scanner";
import PageHeader from "@/components/page-header";
import { useNotification } from "@/contexts/NotificationContext";
import {
  buscarProdutoPorBarcode,
  type ProdutoBarcode,
} from "@/lib/barcode-api";
import { supabase } from "@/lib/supabase";
import type { MovimentoEstoque, Produto } from "@/lib/types";
import { formatarMoeda } from "@/lib/utils";

interface FormProduto {
  nome: string;
  descricao: string;
  marca: string;
  sku: string;
  categoria: string;
  quantidade_minima: number;
  preco_custo: number;
  preco_venda: number;
  data_validade: string;
  ativo: boolean;
}

const CATEGORIAS = [
  "Alimentos",
  "Bebidas",
  "Limpeza",
  "Higiene",
  "Eletrônicos",
  "Utilidades",
  "Outros",
] as const;

function numeroSeguro(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(numero, 0) : 0;
}

function dataValida(valor?: string | null): Date | null {
  if (!valor) return null;
  const data = new Date(`${valor.slice(0, 10)}T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function formatarDataHora(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Data não informada";

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function descricaoMovimento(movimento: MovimentoEstoque): string {
  const motivo = movimento.motivo?.trim();
  if (!motivo) return "Sem motivo informado";
  if (motivo.startsWith("PDV-") || motivo.startsWith("PDV -")) {
    return "Venda rápida";
  }
  return motivo;
}

function formDoProduto(produto: Produto): FormProduto {
  return {
    nome: produto.nome ?? "",
    descricao: produto.descricao ?? "",
    marca: produto.marca ?? "",
    sku: produto.sku ?? "",
    categoria: produto.categoria ?? "",
    quantidade_minima: numeroSeguro(produto.quantidade_minima),
    preco_custo: numeroSeguro(produto.preco_custo),
    preco_venda: numeroSeguro(produto.preco_venda),
    data_validade: produto.data_validade?.slice(0, 10) ?? "",
    ativo: produto.ativo !== false,
  };
}

export default function ProdutoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addNotification } = useNotification();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [produto, setProduto] = useState<Produto | null>(null);
  const [formData, setFormData] = useState<FormProduto | null>(null);
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [scannerAberto, setScannerAberto] = useState(false);
  const [barcodeModalAberto, setBarcodeModalAberto] = useState(false);
  const [barcodeDetectado, setBarcodeDetectado] = useState("");
  const [produtoBarcode, setProdutoBarcode] =
    useState<ProdutoBarcode | null>(null);
  const [buscandoBarcode, setBuscandoBarcode] = useState(false);

  const carregarProduto = useCallback(
    async (mostrarFeedback = false) => {
      if (!id) {
        setErro("ID do produto não encontrado.");
        setLoading(false);
        return;
      }

      mostrarFeedback ? setRecarregando(true) : setLoading(true);
      setErro("");

      try {
        const [produtoRes, movimentosRes] = await Promise.all([
          supabase.from("produtos").select("*").eq("id", id).single(),
          supabase
            .from("movimentos_estoque")
            .select("*")
            .eq("produto_id", id)
            .order("criado_em", { ascending: false })
            .limit(10),
        ]);

        if (produtoRes.error || !produtoRes.data) {
          console.error("Erro ao carregar produto:", produtoRes.error);
          setProduto(null);
          setFormData(null);
          setErro("Produto não encontrado ou sem permissão de acesso.");
          return;
        }

        const produtoCarregado = produtoRes.data as Produto;
        setProduto(produtoCarregado);
        setFormData(formDoProduto(produtoCarregado));
        setMovimentos(
          (movimentosRes.data as MovimentoEstoque[] | null) ?? [],
        );

        if (movimentosRes.error) {
          console.error(
            "Erro ao carregar movimentações do produto:",
            movimentosRes.error,
          );
        }

        if (mostrarFeedback) {
          addNotification("Produto atualizado.", "success", 1800);
        }
      } catch (error) {
        console.error("Erro inesperado ao carregar produto:", error);
        setErro("Ocorreu um erro inesperado ao carregar o produto.");
      } finally {
        setLoading(false);
        setRecarregando(false);
      }
    },
    [addNotification, id],
  );

  useEffect(() => {
    void carregarProduto();
  }, [carregarProduto]);

  const estoqueAtual = numeroSeguro(produto?.quantidade_atual);
  const estoqueMinimo = numeroSeguro(formData?.quantidade_minima);
  const precoCusto = numeroSeguro(formData?.preco_custo);
  const precoVenda = numeroSeguro(formData?.preco_venda);
  const valorEmEstoque = estoqueAtual * precoCusto;
  const resultadoUnitario = precoVenda - precoCusto;
  const margem =
    precoVenda > 0 ? ((precoVenda - precoCusto) / precoVenda) * 100 : null;

  const situacao = useMemo(() => {
    if (!formData?.ativo) {
      return {
        label: "Inativo",
        classe:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      };
    }
    if (estoqueAtual <= 0) {
      return {
        label: "Estoque zerado",
        classe:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      };
    }
    if (estoqueMinimo > 0 && estoqueAtual < estoqueMinimo) {
      return {
        label: "Abaixo do mínimo",
        classe:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      };
    }
    return {
      label: "Estoque adequado",
      classe:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    };
  }, [estoqueAtual, estoqueMinimo, formData?.ativo]);

  const validadeInfo = useMemo(() => {
    const validade = dataValida(formData?.data_validade);
    if (!validade) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diasRestantes = Math.ceil(
      (validade.getTime() - hoje.getTime()) / 86_400_000,
    );

    return { diasRestantes, vencido: diasRestantes < 0 };
  }, [formData?.data_validade]);

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!formData) return;

    const { name, value } = event.target;
    const numerico =
      name === "quantidade_minima" ||
      name === "preco_custo" ||
      name === "preco_venda";

    setFormData((atual) =>
      atual
        ? {
            ...atual,
            [name]: numerico ? numeroSeguro(value) : value,
          }
        : null,
    );
  };

  const handleAtivoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((atual) =>
      atual ? { ...atual, ativo: event.target.checked } : null,
    );
  };

  const handleCodigoBarrasLido = async (codigo: string) => {
    if (!formData) return;

    const codigoLimpo = codigo.trim();
    if (!codigoLimpo) return;

    setScannerAberto(false);
    setBarcodeDetectado(codigoLimpo);
    setBarcodeModalAberto(true);
    setBuscandoBarcode(true);
    setProdutoBarcode(null);
    setFormData((atual) =>
      atual ? { ...atual, sku: codigoLimpo } : null,
    );

    try {
      const resultado = await buscarProdutoPorBarcode(codigoLimpo);
      setProdutoBarcode(resultado);
    } catch (error) {
      console.error("Erro ao consultar código de barras:", error);
      setBarcodeModalAberto(false);
      addNotification(
        "Não foi possível consultar o código. O SKU foi preenchido manualmente.",
        "warning",
        3500,
      );
    } finally {
      setBuscandoBarcode(false);
    }
  };

  const handleConfirmarBarcode = (resultado: ProdutoBarcode) => {
    setFormData((atual) =>
      atual
        ? {
            ...atual,
            nome: resultado.nome || atual.nome,
            descricao: resultado.descricao || atual.descricao,
            categoria: resultado.categoria || atual.categoria,
            marca:
              "marca" in resultado && typeof resultado.marca === "string"
                ? resultado.marca || atual.marca
                : atual.marca,
          }
        : null,
    );
    setBarcodeModalAberto(false);
    addNotification("Dados encontrados foram aplicados.", "success", 2000);
  };

  const validar = (): string | null => {
    if (!formData) return "Produto não carregado.";
    if (!formData.nome.trim()) return "Informe o nome do produto.";
    if (!formData.sku.trim()) return "Informe o SKU ou código de barras.";
    if (formData.quantidade_minima < 0)
      return "O estoque mínimo não pode ser negativo.";
    if (formData.preco_custo < 0)
      return "O preço de custo não pode ser negativo.";
    if (formData.preco_venda <= 0)
      return "Informe um preço de venda maior que zero.";
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData || !produto || !id || salvando) return;

    setErro("");
    setSucesso("");

    const validacao = validar();
    if (validacao) {
      setErro(validacao);
      addNotification(validacao, "warning", 3000);
      return;
    }

    setSalvando(true);

    try {
      const dadosParaSalvar = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        marca: formData.marca.trim(),
        sku: formData.sku.trim(),
        categoria: formData.categoria || null,
        quantidade_minima: Math.trunc(formData.quantidade_minima),
        preco_custo: Number(formData.preco_custo.toFixed(2)),
        preco_venda: Number(formData.preco_venda.toFixed(2)),
        data_validade: formData.data_validade || null,
        ativo: formData.ativo,
      };

      const { data, error: updateError } = await supabase
        .from("produtos")
        .update(dadosParaSalvar)
        .eq("id", id)
        .select("*")
        .single();

      if (updateError) {
        console.error("Erro ao atualizar produto:", updateError);

        if (
          updateError.code === "23505" ||
          updateError.message.toLocaleLowerCase("pt-BR").includes("sku")
        ) {
          setErro("Este SKU ou código de barras já está cadastrado.");
          addNotification("SKU já cadastrado.", "warning", 3000);
          return;
        }

        setErro("Não foi possível atualizar o produto. Tente novamente.");
        addNotification("Erro ao atualizar produto.", "error");
        return;
      }

      const produtoAtualizado = data as Produto;
      setProduto(produtoAtualizado);
      setFormData(formDoProduto(produtoAtualizado));
      setSucesso("Produto atualizado com sucesso.");
      addNotification("Produto atualizado.", "success", 2200);

      router.refresh();
    } catch (error) {
      console.error("Erro inesperado ao atualizar produto:", error);
      setErro("Ocorreu um erro inesperado. Tente novamente.");
      addNotification("Erro inesperado ao atualizar produto.", "error");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="sr-only">Carregando produto</span>
      </div>
    );
  }

  if (!produto || !formData) {
    return (
      <div className="mx-auto max-w-xl space-y-5 py-12">
        <Alert message={erro || "Produto não encontrado."} type="error" />
        <Link
          href="/dashboard/produtos"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-6 overflow-x-clip pb-10">
      <PageHeader
        eyebrow="DETALHES DO PRODUTO"
        title={produto.nome}
        description={`SKU: ${produto.sku}`}
        icon={Package}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/produtos"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <button
              type="button"
              onClick={() => void carregarProduto(true)}
              disabled={recarregando}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <RefreshCw
                className={`h-4 w-4 ${recarregando ? "animate-spin" : ""}`}
              />
              Atualizar
            </button>
            <Link
              href={`/dashboard/estoque/movimento?tipo=entrada&produto=${id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <ArrowDown className="h-4 w-4" />
              Entrada
            </Link>
            <Link
              href={`/dashboard/estoque/movimento?tipo=saida&produto=${id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900"
            >
              <ArrowUp className="h-4 w-4" />
              Saída
            </Link>
          </div>
        }
      />

      {erro && <Alert message={erro} type="error" />}
      {sucesso && <Alert message={sucesso} type="success" />}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <Warehouse className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Estoque atual
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {estoqueAtual}
          </p>
          <span
            className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${situacao.classe}`}
          >
            {situacao.label}
          </span>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Estoque mínimo
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {estoqueMinimo}
          </p>
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
            Base para alertas e reposição
          </p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <CircleDollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Valor em estoque
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {formatarMoeda(valorEmEstoque)}
          </p>
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
            Quantidade atual × custo atual
          </p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <CalendarDays className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Validade
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {formData.data_validade
              ? new Date(
                  `${formData.data_validade}T00:00:00`,
                ).toLocaleDateString("pt-BR")
              : "Não informada"}
          </p>
          {validadeInfo && (
            <p
              className={`mt-2 text-[11px] font-semibold ${
                validadeInfo.vencido
                  ? "text-red-600 dark:text-red-400"
                  : validadeInfo.diasRestantes <= 7
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {validadeInfo.vencido
                ? `Vencido há ${Math.abs(validadeInfo.diasRestantes)} dia(s)`
                : `${validadeInfo.diasRestantes} dia(s) restantes`}
            </p>
          )}
        </article>
      </section>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <strong>Saldo protegido:</strong> a quantidade atual não é editada nesta
        página. Use Entrada ou Saída para que toda alteração fique registrada no
        histórico.
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit} className="min-w-0 space-y-5">
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Informações do produto
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Edite identificação, classificação e descrição.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="nome" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Nome *
                </label>
                <input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  maxLength={255}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="sku" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  SKU ou código de barras *
                </label>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <QrCode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      maxLength={100}
                      required
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannerAberto(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="hidden sm:inline">Ler</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="marca" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Marca
                </label>
                <input
                  id="marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  maxLength={120}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="categoria" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Categoria
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Sem categoria</option>
                  {CATEGORIAS.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="descricao" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                Descrição
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Warehouse className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Configuração do estoque
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ajuste o mínimo. O saldo muda pelas movimentações.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Quantidade atual
                </p>
                <div className="rounded-xl border border-gray-200 bg-gray-100 px-3 py-3 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {estoqueAtual} unidade(s)
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use os botões Entrada e Saída no topo.
                </p>
              </div>

              <div>
                <label htmlFor="quantidade_minima" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Estoque mínimo
                </label>
                <input
                  id="quantidade_minima"
                  name="quantidade_minima"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.quantidade_minima}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Produto ativo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Produtos inativos deixam de aparecer nos fluxos operacionais.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={handleAtivoChange}
                className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CircleDollarSign className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Preços
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Os relatórios usam os valores atuais como estimativa.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="preco_custo" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Preço de custo
                </label>
                <input
                  id="preco_custo"
                  name="preco_custo"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.preco_custo}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="preco_venda" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Preço de venda *
                </label>
                <input
                  id="preco_venda"
                  name="preco_venda"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.preco_venda}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60 sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase text-gray-400">Custo</p>
                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                  {formatarMoeda(precoCusto)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400">
                  Resultado unitário
                </p>
                <p
                  className={`mt-1 text-sm font-bold ${
                    resultadoUnitario < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {formatarMoeda(resultadoUnitario)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400">
                  Margem estimada
                </p>
                <p
                  className={`mt-1 text-sm font-bold ${
                    margem !== null && margem < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {margem === null ? "Não calculada" : `${margem.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Validade
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Deixe em branco quando o produto não possuir vencimento.
                </p>
              </div>
            </div>

            <input
              name="data_validade"
              type="date"
              value={formData.data_validade}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:max-w-xs"
            />

            {validadeInfo && (
              <div
                className={`mt-4 flex items-start gap-3 rounded-xl border p-3 text-sm ${
                  validadeInfo.vencido
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                    : validadeInfo.diasRestantes <= 7
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                      : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                }`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {validadeInfo.vencido
                    ? `Produto vencido há ${Math.abs(validadeInfo.diasRestantes)} dia(s).`
                    : `Faltam ${validadeInfo.diasRestantes} dia(s) para a validade.`}
                </p>
              </div>
            )}
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setFormData(formDoProduto(produto));
                setErro("");
                setSucesso("");
              }}
              disabled={salvando}
              className="rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300"
            >
              Descartar alterações
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Salvar alterações
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <header className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-gray-500" />
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Movimentações recentes
                </h2>
              </div>
            </header>

            {movimentos.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Nenhuma movimentação registrada
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Entradas e saídas aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {movimentos.map((movimento) => {
                  const entrada = movimento.tipo_movimento === "entrada";

                  return (
                    <article key={movimento.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            entrada
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {entrada ? (
                            <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {entrada ? "Entrada" : "Saída"}
                            </p>
                            <p
                              className={`text-sm font-bold ${
                                entrada
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {entrada ? "+" : "-"}
                              {movimento.quantidade}
                            </p>
                          </div>
                          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                            {descricaoMovimento(movimento)}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-400">
                            {formatarDataHora(movimento.criado_em)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="border-t border-gray-100 p-4 dark:border-gray-800">
              <Link
                href={`/dashboard/estoque?produto=${id}`}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Ver todas as movimentações
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {scannerAberto && (
        <BarcodeScanner
          onDetected={handleCodigoBarrasLido}
          onClose={() => setScannerAberto(false)}
        />
      )}

      {barcodeModalAberto && produtoBarcode !== null && (
        <BarcodeProductModal
          codigo={barcodeDetectado}
          produto={produtoBarcode}
          loading={buscandoBarcode}
          onConfirmar={handleConfirmarBarcode}
          onCancelar={() => setBarcodeModalAberto(false)}
        />
      )}

      {barcodeModalAberto && buscandoBarcode && produtoBarcode === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
              Consultando código de barras...
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {barcodeDetectado}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
