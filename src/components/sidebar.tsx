"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowLeftRight,
  ChevronDown,
  HelpCircle,
  Home,
  Lock,
  LogOut,
  MoreHorizontal,
  Package,
  PackagePlus,
  PackageX,
  Shield,
  ShoppingCart,
  History,
  Sparkles,
  TrendingUp,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useMembro } from "@/hooks/useMembro";
import { usePlano } from "@/hooks/usePlano";
import { supabase } from "@/lib/supabase";

type NivelNecessario = "dono" | null;
type GrupoNavegacao = "GESTÃO" | "ANÁLISE";
type TomIcone = "emerald" | "blue" | "red" | "amber" | "violet" | "indigo" | "gray";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredLevel: NivelNecessario;
  planoBloqueio: "iniciante" | null;
  apenasAdmin: boolean;
  group?: GrupoNavegacao;
  iconTone: TomIcone;
}

const navigationItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Visão Geral",
    icon: Home,
    iconTone: "emerald",
    requiredLevel: "dono",
    planoBloqueio: null,
    apenasAdmin: false,
    group: "GESTÃO",
  },
  {
    href: "/dashboard/produtos",
    label: "Produtos",
    icon: Package,
    iconTone: "blue",
    requiredLevel: "dono",
    planoBloqueio: null,
    apenasAdmin: false,
    group: "GESTÃO",
  },
  {
    href: "/dashboard/estoque",
    label: "Movimentações",
    icon: ArrowLeftRight,
    iconTone: "blue",
    requiredLevel: null,
    planoBloqueio: null,
    apenasAdmin: false,
    group: "GESTÃO",
  },
  {
    href: "/dashboard/perdas",
    label: "Perdas",
    icon: PackageX,
    iconTone: "red",
    requiredLevel: "dono",
    planoBloqueio: null,
    apenasAdmin: false,
    group: "GESTÃO",
  },
  {
    href: "/dashboard/reposicao",
    label: "Reposição",
    icon: PackagePlus,
    iconTone: "amber",
    requiredLevel: "dono",
    planoBloqueio: null,
    apenasAdmin: false,
    group: "GESTÃO",
  },
  {
    href: "/dashboard/relatorios",
    label: "Relatórios",
    icon: TrendingUp,
    iconTone: "indigo",
    requiredLevel: "dono",
    planoBloqueio: null,
    apenasAdmin: false,
    group: "ANÁLISE",
  },
  {
    href: "/dashboard/raio-x",
    label: "Raio-X Inteligente",
    icon: Sparkles,
    iconTone: "violet",
    requiredLevel: "dono",
    planoBloqueio: null,
    apenasAdmin: false,
    group: "ANÁLISE",
  },
  {
    href: "/dashboard/alertas",
    label: "Alertas",
    icon: AlertCircle,
    iconTone: "red",
    requiredLevel: "dono",
    planoBloqueio: null,
    apenasAdmin: false,
    group: "ANÁLISE",
  },
];

const moreResourcesItems: NavItem[] = [
  {
    href: "/dashboard/pdv",
    label: "Venda rápida",
    icon: ShoppingCart,
    iconTone: "emerald",
    requiredLevel: null,
    planoBloqueio: null,
    apenasAdmin: false,
  },
  {
    href: "/dashboard/vendas",
    label: "Histórico de vendas",
    icon: History,
    iconTone: "blue",
    requiredLevel: "dono",
    planoBloqueio: null,
    apenasAdmin: false,
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: Users,
    iconTone: "indigo",
    requiredLevel: "dono",
    planoBloqueio: "iniciante",
    apenasAdmin: false,
  },
  {
    href: "/dashboard/equipe",
    label: "Equipe",
    icon: Users,
    iconTone: "blue",
    requiredLevel: "dono",
    planoBloqueio: null,
    apenasAdmin: false,
  },
  {
    href: "/dashboard/ajuda",
    label: "Ajuda",
    icon: HelpCircle,
    iconTone: "gray",
    requiredLevel: null,
    planoBloqueio: null,
    apenasAdmin: false,
  },
];

const footerItems: NavItem[] = [
  {
    href: "/dashboard/perfil",
    label: "Perfil",
    icon: UserCircle,
    iconTone: "gray",
    requiredLevel: null,
    planoBloqueio: null,
    apenasAdmin: false,
  },
  {
    href: "/dashboard/admin",
    label: "Admin",
    icon: Shield,
    iconTone: "amber",
    requiredLevel: "dono",
    planoBloqueio: null,
    apenasAdmin: true,
  },
];

const mobileMainPaths = [
  "/dashboard",
  "/dashboard/produtos",
  "/dashboard/estoque",
  "/dashboard/alertas",
];

const ICON_TONES: Record<TomIcone, string> = {
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDono } = useMembro();
  const { isIniciante } = usePlano();
  const { isAdmin } = useIsAdmin();

  const [moreResourcesOpen, setMoreResourcesOpen] = useState(false);
  const [saindo, setSaindo] = useState(false);

useEffect(() => {
  if (!moreResourcesOpen) return;

  const fecharComEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setMoreResourcesOpen(false);
    }
  };

  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const overflowAnterior = document.body.style.overflow;

  if (mobile) {
    document.body.style.overflow = "hidden";
  }

  window.addEventListener("keydown", fecharComEscape);

  return () => {
    if (mobile) {
      document.body.style.overflow = overflowAnterior;
    }

    window.removeEventListener("keydown", fecharComEscape);
  };
}, [moreResourcesOpen]);

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const isBloqueadoPorPlano = (item: NavItem) =>
    item.planoBloqueio === "iniciante" && isIniciante;

  const canAccess = (item: NavItem) => {
    if (item.apenasAdmin && !isAdmin) return false;
    if (item.requiredLevel === null) return true;
    return item.requiredLevel === "dono" && isDono;
  };

  const handleLogout = async () => {
    if (saindo) return;

    setSaindo(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao sair:", error);
        return;
      }

      setMoreResourcesOpen(false);
      router.replace("/login");
      router.refresh();
    } finally {
      setSaindo(false);
    }
  };

  const mobileMainItems = navigationItems.filter(
    (item) =>
      mobileMainPaths.includes(item.href) &&
      canAccess(item) &&
      !item.apenasAdmin,
  );

  const perdasMobile = navigationItems.find(
    (item) => item.href === "/dashboard/perdas",
  );

  const raioXMobile = navigationItems.find(
    (item) => item.href === "/dashboard/raio-x",
  );

  const mobileMoreItems: NavItem[] = [
    ...(perdasMobile && canAccess(perdasMobile) ? [perdasMobile] : []),
    ...(raioXMobile && canAccess(raioXMobile) ? [raioXMobile] : []),
    ...moreResourcesItems.filter((item) => canAccess(item)),
    ...footerItems.filter(
      (item) => item.href === "/dashboard/perfil" || canAccess(item),
    ),
  ];

  const renderNavItem = (item: NavItem, compact = false) => {
    const Icon = item.icon;
    const bloqueado = isBloqueadoPorPlano(item);
    const ativo = isActive(item.href);
    const isRaioX = item.href === "/dashboard/raio-x";
    const isAlertas = item.href === "/dashboard/alertas";

    if (bloqueado) {
      return (
        <Link
          key={item.href}
          href="/assinar?plano=profissional"
          title="Disponível no plano Profissional"
          className={`flex items-center gap-3 rounded-xl text-gray-500 transition-colors hover:bg-amber-50 dark:text-gray-400 dark:hover:bg-amber-900/10 ${
            compact ? "px-3 py-2" : "px-3 py-2.5"
          }`}
        >
          <span className={`flex shrink-0 items-center justify-center rounded-lg ${ICON_TONES[item.iconTone]} ${compact ? "h-8 w-8" : "h-9 w-9"}`}>
            <Icon aria-hidden="true" size={compact ? 16 : 18} />
          </span>
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">PRO</span>
          <Lock aria-hidden="true" size={11} className="text-amber-500" />
        </Link>
      );
    }

    const activeClass = isRaioX
      ? "bg-violet-600 text-white shadow-sm shadow-violet-900/20"
      : isAlertas
        ? "bg-red-600 text-white shadow-sm shadow-red-900/20"
        : "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20";

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={ativo ? "page" : undefined}
        className={`group flex items-center gap-3 rounded-xl transition-all ${
          compact ? "px-3 py-2" : "px-3 py-2.5"
        } ${
          ativo
            ? activeClass
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        }`}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-lg transition-colors ${
            compact ? "h-8 w-8" : "h-9 w-9"
          } ${ativo ? "bg-white/15 text-white" : ICON_TONES[item.iconTone]}`}
        >
          <Icon aria-hidden="true" size={compact ? 16 : 18} />
        </span>
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="fixed left-0 top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-56 flex-col border-r border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 md:flex">
        <nav className="flex-1 space-y-4 overflow-y-auto p-4">
          {(["GESTÃO", "ANÁLISE"] as const).map((groupName) => {
            const groupItems = navigationItems.filter(
              (item) => item.group === groupName && canAccess(item),
            );

            if (groupItems.length === 0) return null;

            return (
              <section key={groupName} aria-labelledby={`grupo-${groupName}`}>
                <h2
                  id={`grupo-${groupName}`}
                  className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {groupName}
                </h2>

                <div className="space-y-1">
                  {groupItems.map((item) => renderNavItem(item))}
                </div>
              </section>
            );
          })}

          {moreResourcesItems.some((item) => canAccess(item)) && (
            <section>
              <button
                type="button"
                aria-expanded={moreResourcesOpen}
                aria-controls="desktop-more-resources"
                onClick={() => setMoreResourcesOpen((aberto) => !aberto)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <MoreHorizontal aria-hidden="true" size={20} />
                <span className="flex-1 text-left text-sm font-medium">
                  Mais recursos
                </span>
                <ChevronDown
                  aria-hidden="true"
                  size={18}
                  className={`transition-transform ${
                    moreResourcesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {moreResourcesOpen && (
                <div
                  id="desktop-more-resources"
                  className="ml-2 mt-1 space-y-1 border-l-2 border-gray-200 pl-2 dark:border-gray-700"
                >
                  {moreResourcesItems
                    .filter((item) => canAccess(item))
                    .map((item) => renderNavItem(item, true))}
                </div>
              )}
            </section>
          )}
        </nav>

        <div className="space-y-1 border-t border-gray-200 p-4 dark:border-gray-800">
          {footerItems.map((item) => {
            if (!canAccess(item)) return null;

            const Icon = item.icon;
            const ativo = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
                  ativo
                    ? item.apenasAdmin
                      ? "bg-amber-500 text-white"
                      : "bg-primary text-white"
                    : item.apenasAdmin
                      ? "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/10"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <Icon aria-hidden="true" size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={saindo}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/10"
          >
            <LogOut aria-hidden="true" size={20} />
            <span className="text-sm font-medium">
              {saindo ? "Saindo..." : "Sair"}
            </span>
          </button>
        </div>
      </aside>

      {moreResourcesOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/65 px-4 pb-24 pt-20 backdrop-blur-sm md:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMoreResourcesOpen(false);
            }
          }}
        >
          <section
            id="mobile-more-resources"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-white/95 shadow-2xl dark:border-gray-700/80 dark:bg-gray-900/95"
          >
            <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  NAVEGAÇÃO
                </p>
                <h2
                  id="mobile-more-title"
                  className="mt-0.5 text-lg font-extrabold text-gray-900 dark:text-white"
                >
                  Mais recursos
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMoreResourcesOpen(false)}
                aria-label="Fechar menu de recursos"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <ChevronDown aria-hidden="true" size={20} />
              </button>
            </header>

            <div className="max-h-[62vh] overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {mobileMoreItems.map((item) => {
                  const Icon = item.icon;
                  const bloqueado = isBloqueadoPorPlano(item);
                  const destino = bloqueado
                    ? "/assinar?plano=profissional"
                    : item.href;
                  const ativo = isActive(item.href);
                  const isRaioX = item.href === "/dashboard/raio-x";
                  const isAlertas = item.href === "/dashboard/alertas";

                  return (
                    <Link
                      key={`${item.label}-${destino}`}
                      href={destino}
                      onClick={() => setMoreResourcesOpen(false)}
                      aria-current={ativo ? "page" : undefined}
                      className={`relative flex min-h-28 flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                        ativo
                          ? isRaioX
                            ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-900/20"
                            : isAlertas
                              ? "border-red-500 bg-red-600 text-white shadow-lg shadow-red-900/20"
                              : "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                          : "border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:border-gray-700"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          ativo
                            ? "bg-white/15 text-white"
                            : ICON_TONES[item.iconTone]
                        }`}
                      >
                        <Icon aria-hidden="true" size={21} />
                      </span>

                      <span className="mt-3 flex w-full items-end gap-2">
                        <span className="min-w-0 flex-1 text-sm font-bold leading-tight">
                          {item.label}
                        </span>

                        {bloqueado && (
                          <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            PRO
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={saindo}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/70 dark:bg-red-900/15 dark:text-red-400 dark:hover:bg-red-900/25"
              >
                <LogOut aria-hidden="true" size={18} />
                {saindo ? "Saindo..." : "Sair da conta"}
              </button>
            </div>
          </section>
        </div>
      )}

      <nav
        aria-label="Navegação principal no celular"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 md:hidden"
      >
        <div className="flex items-center justify-around">
          {mobileMainItems.map((item) => {
            const Icon = item.icon;
            const ativo = isActive(item.href);
            const labelMobile =
              item.href === "/dashboard"
                ? "Início"
                : item.href === "/dashboard/estoque"
                  ? "Estoque"
                  : item.label;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                onClick={() => setMoreResourcesOpen(false)}
                className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-3 transition-colors ${
                  ativo
                    ? item.href === "/dashboard/alertas"
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <Icon aria-hidden="true" size={22} />
                <span className="max-w-full truncate text-[10px] font-medium">
                  {labelMobile}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            aria-expanded={moreResourcesOpen}
            aria-controls="mobile-more-resources"
            onClick={() => setMoreResourcesOpen((aberto) => !aberto)}
            className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-3 transition-colors ${
              moreResourcesOpen
                ? "text-gray-950 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <MoreHorizontal aria-hidden="true" size={22} />
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
