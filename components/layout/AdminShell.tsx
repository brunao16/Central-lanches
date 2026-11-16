"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  Bike,
  UtensilsCrossed,
  Receipt,
  DollarSign,
  Package,
  Users,
  FileSpreadsheet,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  QrCode,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import GlobalOrderNotifier from "@/components/GlobalOrderNotifier";

const navigation = [
  { name: "Painel Geral", href: "/", icon: LayoutDashboard },
  { name: "Caixa / PDV", href: "/caixa", icon: ShoppingBag, badge: "F2" },
  { name: "Cozinha KDS", href: "/cozinha", icon: ChefHat },
  { name: "Delivery", href: "/delivery", icon: Bike },
  { name: "Cardápio", href: "/cardapio", icon: UtensilsCrossed },
  { name: "QR Mesas", href: "/mesas", icon: QrCode },
  { name: "Pedidos", href: "/pedidos", icon: Receipt },
  { name: "Gastos", href: "/gastos", icon: DollarSign },
  { name: "Estoque", href: "/estoque", icon: Package },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Relatórios", href: "/relatorios", icon: FileSpreadsheet },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPage = navigation.find((item) => item.href === pathname)?.name || "Central Lanches";

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col md:flex-row pb-20 md:pb-0 text-slate-800">
      <GlobalOrderNotifier />

      {/* Topo Mobile */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-xs shadow-sm shadow-red-500/20">
            <Flame size={16} />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm leading-tight">Central Lanches</h1>
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{currentPage}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 active:scale-95 rounded-xl border border-slate-200 bg-slate-50"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Drawer Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-red-500/20">
                  <Flame size={18} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-sm leading-tight">Central Lanches</h2>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Gestão Pro</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all",
                      isActive
                        ? "bg-red-50 text-red-600 shadow-xs border border-red-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={isActive ? "text-red-600" : "text-slate-400"} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-500 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
              <a
                href="/motoboy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors border border-slate-200/80 shadow-xs"
              >
                <span>🛵 Painel do Motoboy</span>
                <ExternalLink size={14} />
              </a>
              <a
                href="/menu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-slate-200/80 shadow-xs"
              >
                <span>🍔 Cardápio Online</span>
                <ExternalLink size={14} />
              </a>
              <button
                onClick={async () => {
                  if (confirm("Deseja sair do sistema?")) {
                    await fetch("/api/auth/login", { method: "DELETE" });
                    window.location.href = "/login";
                  }
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100 bg-white"
              >
                <span className="flex items-center gap-2">
                  <LogOut size={14} />
                  Sair do Sistema
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop Profissional */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/80 z-30">
        <div className="flex items-center gap-3 px-6 h-18 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-500/20">
            <Flame size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight leading-none text-base">Central Lanches</h1>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Gestão Pro</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-150",
                  isActive
                    ? "bg-red-50 text-red-600 shadow-xs border border-red-100/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? "text-red-600" : "text-slate-400"} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 text-slate-500 font-mono">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-3.5 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <a
            href="/motoboy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors border border-slate-200 shadow-xs"
          >
            <span>🛵 Painel do Motoboy</span>
            <ExternalLink size={13} className="text-slate-400" />
          </a>
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-slate-200 shadow-xs"
          >
            <span>🍔 Ver Cardápio Online</span>
            <ExternalLink size={13} className="text-slate-400" />
          </a>
          <button
            onClick={async () => {
              if (confirm("Deseja sair do sistema?")) {
                await fetch("/api/auth/login", { method: "DELETE" });
                window.location.href = "/login";
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100 bg-white"
          >
            <span className="flex items-center gap-2">
              <LogOut size={13} />
              Sair do Sistema
            </span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 md:pl-64 flex flex-col min-w-0">
        {children}
      </main>

      {/* Barra de Navegação Inferior para Celular */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around z-40 md:hidden px-1 shadow-lg">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[10px] font-bold transition-colors",
            pathname === "/" ? "text-red-600" : "text-slate-400"
          )}
        >
          <LayoutDashboard size={20} />
          Início
        </Link>
        <Link
          href="/caixa"
          className={cn(
            "flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[10px] font-bold transition-colors",
            pathname === "/caixa" ? "text-red-600" : "text-slate-400"
          )}
        >
          <ShoppingBag size={20} />
          Caixa
        </Link>
        <Link
          href="/cozinha"
          className={cn(
            "flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[10px] font-bold transition-colors",
            pathname === "/cozinha" ? "text-red-600" : "text-slate-400"
          )}
        >
          <ChefHat size={20} />
          Cozinha
        </Link>
        <Link
          href="/delivery"
          className={cn(
            "flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[10px] font-bold transition-colors",
            pathname === "/delivery" ? "text-red-600" : "text-slate-400"
          )}
        >
          <Bike size={20} />
          Delivery
        </Link>
        <Link
          href="/pedidos"
          className={cn(
            "flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[10px] font-bold transition-colors",
            pathname === "/pedidos" ? "text-red-600" : "text-slate-400"
          )}
        >
          <Receipt size={20} />
          Pedidos
        </Link>
      </nav>
    </div>
  );
}
