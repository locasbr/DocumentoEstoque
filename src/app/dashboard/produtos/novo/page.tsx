"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  CalendarDays,
  Camera,
  DollarSign,
  Loader2,
  Lock,
  PackagePlus,
  Save,
  Tag,
  Warehouse,
  X,
  Zap,
} from "lucide-react";

import Alert from "@/components/alerts";
import BarcodeProductModal from "@/components/barcode-product-modal";
import BarcodeScanner from "@/components/barcode-scanner";
import PageHeader from "@/components/page-header";
import UpgradeBlock from "@/components/upgrade-block";
import { useNotification } from "@/contexts/NotificationContext";
import { usePlano } from "@/hooks/usePlano";
import {
  buscarProdutoPorBarcode,
  type ProdutoBarcode,
} from "@/lib/barcode-api";
import { supabase } from "@/lib/supabase";
import { formatarMoeda } from "@/lib/utils";

interface FormProduto {
  nome: string;
  descricao: string;
  marca: string;
  sku: string;
  categoria: string;
  quantidade_atual: number;
  quantidade_minima: number;
  preco_custo: number;
  preco_venda: number;
  data_validade: string;
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

const FORM_INICIAL: FormProduto = {
  nome: "",
  descricao: "",
  marca: "",
  sku: "",
  categoria: "",
  quantidade_atual: 0,
  quantidade_minima: 10,
  preco_custo: 0,
  preco_venda: 0,
  data_validade: "",
};

const PRODUTO_BARCODE_VAZIO: ProdutoBarcode = {
  nome: "",
  marca: "",
  descricao: "",
  categoria: "",
  encontrado: false,
  fonte: "",
};

function numeroSeguro(valor: string): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(numero, 0) : 0;
}

function dataLocal(dataISO: string): Date | null {
  if (!dataISO) return null;
  const data = new Date(`${dataISO}T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

export default function NovoProdutoPage() {
  const router = useRouter();
  const { addNotification } = useNotification();
  const {
    isIniciante,
    loading: loadingPlano,
    podeAdicionarProduto,
    totalProdutos,
    limites,
    temValidade,
  } = usePlano();

  const [formData, setFormData] = useState<FormProduto>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [scannerAberto, setScannerAberto] = useState(false);
  const [barcodeModalAberto, setBarcodeModalAberto] = useState(false);
  const [barcodeDetectado, setBarcodeDetectado] = useState("");
  const [produtoBarcode, setProdutoBarcode] =
    useState<ProdutoBarcode | null>(null);
  const [buscandoBarcode, setBuscandoBarcode] = useState(false);
  const [mostrarLimiteAtingido, setMostrarLimiteAtingido] = useState(false);

  const limiteProdutos = Math.max(Number(limites.produtos) || 0, 0);
  const restantes = isIniciante
    ? Math.max(limiteProdutos - totalProdutos, 0)
    : 0;
  const porcentagemUso =
    isIniciante && limiteProdutos > 0
      ? Math.min(Math.round((totalProdutos / limiteProdutos) * 100), 100)
      : 0;
  const pertoDoLimite = isIniciante && restantes > 0 && restantes <= 20;

  const margem = useMemo(() => {
    if (formData.preco_venda <= 0) return null;
    const valor =
      ((formData.preco_venda - formData.preco_custo) /
        formData.preco_venda) *
      100;
    return Number.isFinite(valor) ? valor : null;
  }, [formData.preco_custo, formData.preco_venda]);

  const lucroUnitario = Math.max(
    formData.preco_venda - formData.preco_custo,
    0,
  );

  const validadeInfo = useMemo(() => {
    const validade = dataLocal(formData.data_validade);
    if (!validade) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diasRestantes = Math.ceil(
      (validade.getTime() - hoje.getTime()) / 86_400_000,
    );

    return {
      diasRestantes,
      vencido: diasRestantes < 0,
    };
  }, [formData.data_validade]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    const campoNumerico =
      name === "quantidade_atual" ||
      name === "quantidade_minima" ||
      name === "preco_custo" ||
      name === "preco_venda";

    setFormData((atual) => ({
      ...atual,
      [name]: campoNumerico ? numeroSeguro(value) : value,
    }));
  };

  const handleCodigoBarrasLido = async (codigo: string) => {
    const codigoLimpo = codigo.trim();
    if (!codigoLimpo) return;

    setScannerAberto(false);
    setBarcodeDetectado(codigoLimpo);
    setBarcodeModalAberto(true);
    setBuscandoBarcode(true);
    setProdutoBarcode(null);
    setFormData((atual) => ({ ...atual, sku: codigoLimpo }));

    try {
      const resultado = await buscarProdutoPorBarcode(codigoLimpo);
      setProdutoBarcode(resultado);
    } catch (error) {
      console.error("Erro ao consultar código de barras:", error);
      addNotification(
        "Não foi possível consultar o código. Você pode preencher os dados manualmente.",
        "warning",
        4000,
      );
      setBarcodeModalAberto(false);
    } finally {
      setBuscandoBarcode(false);
    }
  };

  const handleConfirmarBarcode = (produto: ProdutoBarcode) => {
    setFormData((atual) => ({
      ...atual,
      nome: produto.nome || atual.nome,
      descricao: produto.descricao || atual.descricao,
      categoria: produto.categoria || atual.categoria,
      marca:
        "marca" in produto && typeof produto.marca === "string"
          ? produto.marca || atual.marca
          : atual.marca,
    }));
    setBarcodeModalAberto(false);
    addNotification("Dados do produto preenchidos.", "success", 2000);
  };

  const validarFormulario = (): string | null => {
    if (!formData.nome.trim()) return "Informe o nome do produto.";
    if (!formData.sku.trim()) return "Informe o SKU ou código de barras.";
    if (formData.quantidade_atual < 0)
      return "A quantidade inicial não pode ser negativa.";
    if (formData.quantidade_minima < 0)
      return "O estoque mínimo não pode ser negativo.";
    if (formData.preco_custo < 0)
      return "O preço de custo não pode ser negativo.";
    if (formData.preco_venda <= 0)
      return "Informe um preço de venda maior que zero.";
    if (salvando) return "O produto já está sendo salvo.";
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!podeAdicionarProduto) {
      setMostrarLimiteAtingido(true);
      return;
    }

    const validacao = validarFormulario();
    if (validacao) {
      setErro(validacao);
      addNotification(validacao, "warning", 3000);
      return;
    }

    setSalvando(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErro("Sua sessão não foi encontrada. Entre novamente.");
        addNotification("Usuário não autenticado.", "error");
        return;
      }

      const dadosParaSalvar = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        marca: formData.marca.trim(),
        sku: formData.sku.trim(),
        categoria: formData.categoria || null,
        quantidade_atual: Math.trunc(formData.quantidade_atual),
        quantidade_minima: Math.trunc(formData.quantidade_minima),
        preco_custo: Number(formData.preco_custo.toFixed(2)),
        preco_venda: Number(formData.preco_venda.toFixed(2)),
        data_validade:
          temValidade && formData.data_validade
            ? formData.data_validade
            : null,
        ativo: true,
        usuario_id: user.id,
      };

      const { data: produtoCriado, error: insertError } = await supabase
        .from("produtos")
        .insert(dadosParaSalvar)
        .select("id")
        .single();

      if (insertError) {
        console.error("Erro ao criar produto:", insertError);

        if (
          insertError.code === "23505" ||
          insertError.message.toLocaleLowerCase("pt-BR").includes("sku")
        ) {
          setErro(
            "Este SKU ou código de barras já está cadastrado. Use outro código.",
          );
          addNotification("SKU já cadastrado.", "warning", 3500);
          return;
        }

        if (insertError.message.includes("Limite de 100 produtos")) {
          setMostrarLimiteAtingido(true);
          return;
        }

        setErro("Não foi possível criar o produto. Revise os dados e tente novamente.");
        addNotification("Erro ao criar produto.", "error");
        return;
      }

      setSucesso("Produto criado com sucesso.");
      addNotification("Produto adicionado ao estoque.", "success", 2500);

      if (produtoCriado?.id) {
        router.push(`/dashboard/produtos/${produtoCriado.id}`);
      } else {
        router.push("/dashboard/produtos");
      }
      router.refresh();
    } catch (error) {
      console.error("Erro inesperado ao criar produto:", error);
      setErro("Ocorreu um erro inesperado. Tente novamente.");
      addNotification("Erro inesperado ao criar produto.", "error");
    } finally {
      setSalvando(false);
    }
  };

  if (loadingPlano) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="sr-only">Verificando o plano</span>
      </div>
    );
  }

  if (!podeAdicionarProduto) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 py-10">
        <Link
          href="/dashboard/produtos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para produtos
        </Link>
        <UpgradeBlock
          titulo={`Limite de ${limiteProdutos} produtos atingido`}
          descricao={`Você já cadastrou ${totalProdutos} produtos. Faça upgrade para continuar cadastrando novos itens.`}
          planoNecessario="profissional"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <PageHeader
        eyebrow="CADASTRO DE ESTOQUE"
        title="Novo produto"
        description="Cadastre as informações essenciais para controlar saldo, reposição e validade."
        icon={PackagePlus}
        actions={
          <Link
            href="/dashboard/produtos"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        }
      />

      {isIniciante && (
        <section
          className={`rounded-xl border p-4 ${
            pertoDoLimite
              ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
              : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Lock
                  className={`h-4 w-4 ${
                    pertoDoLimite ? "text-amber-600" : "text-blue-600"
                  }`}
                />
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {totalProdutos} de {limiteProdutos} produtos cadastrados
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full ${
                    pertoDoLimite ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${porcentagemUso}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                {restantes} cadastro(s) disponível(is) neste plano.
              </p>
            </div>
            <Link
              href="/assinar"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              <Zap className="h-4 w-4" />
              Ver planos
            </Link>
          </div>
        </section>
      )}

      {erro && <Alert message={erro} type="error" />}
      {sucesso && <Alert message={sucesso} type="success" />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Identificação
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Informações usadas para localizar o produto rapidamente.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="nome" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                Nome do produto *
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                autoComplete="off"
                maxLength={255}
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex.: Arroz tipo 1, 5 kg"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                    type="text"
                    autoComplete="off"
                    maxLength={100}
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Digite ou leia o código"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setScannerAberto(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
                type="text"
                maxLength={120}
                value={formData.marca}
                onChange={handleInputChange}
                placeholder="Ex.: Nestlé"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
              placeholder="Informações adicionais para identificar o produto"
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-right text-[10px] text-gray-400">
              {formData.descricao.length}/500
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Warehouse className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Controle de estoque
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                O estoque mínimo alimenta Alertas e Reposição.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="quantidade_atual" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                Quantidade inicial
              </label>
              <input
                id="quantidade_atual"
                name="quantidade_atual"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={formData.quantidade_atual}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Informe o saldo físico disponível agora.
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
                inputMode="numeric"
                value={formData.quantidade_minima}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Abaixo dessa quantidade, o sistema recomenda reposição.
              </p>
            </div>
          </div>

          {formData.quantidade_minima > 0 &&
            formData.quantidade_atual < formData.quantidade_minima && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Este produto será cadastrado abaixo do mínimo. A Reposição
                  sugerirá {formData.quantidade_minima - formData.quantidade_atual}{" "}
                  unidade(s).
                </p>
              </div>
            )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Preços
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                O custo ajuda a calcular valor em estoque, reposição e perdas.
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
                inputMode="decimal"
                value={formData.preco_custo}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                inputMode="decimal"
                value={formData.preco_venda}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">
                Custo
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                {formatarMoeda(formData.preco_custo)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">
                Resultado unitário
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                {formatarMoeda(lucroUnitario)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">
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

          {formData.preco_venda > 0 &&
            formData.preco_custo > formData.preco_venda && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>O preço de venda está menor que o preço de custo.</p>
              </div>
            )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Validade
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use apenas para produtos que possuem data de vencimento.
              </p>
            </div>
          </div>

          {temValidade ? (
            <>
              <label htmlFor="data_validade" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                Data de validade
              </label>
              <input
                id="data_validade"
                name="data_validade"
                type="date"
                value={formData.data_validade}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:max-w-xs"
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
                  {validadeInfo.vencido ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <p>
                    {validadeInfo.vencido
                      ? `A data informada venceu há ${Math.abs(validadeInfo.diasRestantes)} dia(s).`
                      : `Faltam ${validadeInfo.diasRestantes} dia(s) para a validade.`}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                  <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    Controle de validade
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Disponível em um plano com controle de vencimentos.
                  </p>
                </div>
              </div>
              <Link
                href="/assinar"
                className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Ver planos
              </Link>
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/produtos"
            className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </Link>
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
                Salvar produto
              </>
            )}
          </button>
        </div>
      </form>

      {scannerAberto && (
        <BarcodeScanner
          onDetected={handleCodigoBarrasLido}
          onClose={() => setScannerAberto(false)}
        />
      )}

      {barcodeModalAberto && (
        <BarcodeProductModal
          codigo={barcodeDetectado}
          produto={produtoBarcode ?? PRODUTO_BARCODE_VAZIO}
          loading={buscandoBarcode}
          onConfirmar={handleConfirmarBarcode}
          onCancelar={() => {
            if (!buscandoBarcode) {
              setBarcodeModalAberto(false);
            }
          }}
        />
      )}

      {mostrarLimiteAtingido && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMostrarLimiteAtingido(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Limite de produtos atingido"
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setMostrarLimiteAtingido(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <UpgradeBlock
              titulo={`Limite de ${limiteProdutos} produtos atingido`}
              descricao={`Você já cadastrou ${totalProdutos} produtos. Faça upgrade para continuar cadastrando.`}
              planoNecessario="profissional"
            />
          </div>
        </div>
      )}
    </div>
  );
}
