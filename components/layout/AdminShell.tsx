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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Caixa / PDV", href: "/caixa", icon: ShoppingBag },
  { name: "Cozinha", href: "/cozinha", icon: ChefHat },
  { name: "Delivery", href: "/delivery", icon: Bike },
  { name: "Cardápio", href: "/cardapio", icon: UtensilsCrossed },
  { name: "QR Mesas", href: "/mesas", icon: UtensilsCrossed },
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
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row pb-20 md:pb-0">
      {/* Topo Mobile com Menu Drawer */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm shadow-xs">
            CL
          </div>
          <div>
            <h1 className="font-extrabold text-gray-900 text-sm leading-tight">Central Lanches</h1>
            <p className="text-[10px] font-semibold text-primary uppercase">{currentPage}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 active:scale-95 rounded-xl border border-gray-200"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Drawer Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-base shadow-sm">
                  CL
                </div>
                <div>
                  <h2 className="font-black text-gray-900 text-sm leading-tight">Central Lanches</h2>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Gestão Completa</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
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
                      "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-red-50 text-primary font-bold shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-100"
                    )}
                  >
                    <Icon size={19} className={isActive ? "text-primary" : "text-gray-400"} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="p-3 border-t border-gray-100 space-y-2">
              <a
                href="/motoboy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors border border-gray-200"
              >
                <span>🛵 Painel do Motoboy</span>
                <ExternalLink size={14} />
              </a>
              <a
                href="/menu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-red-50 hover:text-primary rounded-xl transition-colors border border-gray-200"
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
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
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

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 z-30">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-md shadow-red-200">
            CL
          </div>
          <div>
            <h1 className="font-extrabold text-gray-900 tracking-tight leading-none text-base">Central Lanches</h1>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Gestão & Caixa</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150",
                  isActive
                    ? "bg-red-50 text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Icon size={18} className={isActive ? "text-primary" : "text-gray-400"} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Links rápidos externos */}
        <div className="p-4 border-t border-gray-100 space-y-1.5">
          <a
            href="/motoboy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors border border-gray-200"
          >
            <span className="flex items-center gap-2">
              🛵 Painel do Motoboy
            </span>
            <ExternalLink size={14} />
          </a>
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-red-50 hover:text-primary rounded-lg transition-colors border border-gray-200"
          >
            <span className="flex items-center gap-2">
              🍔 Ver Cardápio Online
            </span>
            <ExternalLink size={14} />
          </a>
          <button
            onClick={async () => {
              if (confirm("Deseja sair do sistema?")) {
                await fetch("/api/auth/login", { method: "DELETE" });
                window.location.href = "/login";
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
          >
            <span className="flex items-center gap-2">
              <LogOut size={14} />
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
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around z-40 md:hidden px-1 shadow-lg">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[11px] font-medium",
            pathname === "/" ? "text-primary font-bold" : "text-gray-500"
          )}
        >
          <LayoutDashboard size={20} />
          Início
        </Link>
        <Link
          href="/caixa"
          className={cn(
            "flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[11px] font-medium",
            pathname === "/caixa" ? "text-primary font-bold" : "text-gray-500"
          )}
        >
          <ShoppingBag size={20} />
          Caixa
        </Link>
        <Link
          href="/cozinha"
          className={cn(
            "flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[11px] font-medium",
            pathname === "/cozinha" ? "text-primary font-bold" : "text-gray-500"
          )}
        >
          <ChefHat size={20} />
          Cozinha
        </Link>
        <Link
          href="/delivery"
          className={cn(
            "flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[11px] font-medium",
            pathname === "/delivery" ? "text-primary font-bold" : "text-gray-500"
          )}
        >
          <Bike size={20} />
          Delivery
        </Link>
        <Link
          href="/pedidos"
          className={cn(
            "flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[11px] font-medium",
            pathname === "/pedidos" ? "text-primary font-bold" : "text-gray-500"
          )}
        >
          <Receipt size={20} />
          Pedidos
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 text-[11px] font-medium text-gray-500 hover:text-primary"
        >
          <Menu size={20} />
          Mais
        </button>
      </nav>
    </div>
  );
}
