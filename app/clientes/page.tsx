"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatDateTime } from "@/lib/utils";
import { Users, Award, Search, ShoppingBag } from "lucide-react";

export default function ClientesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCustomers(query = "") {
    setLoading(true);
    try {
      const url = query ? `/api/customers?search=${encodeURIComponent(query)}` : "/api/customers";
      const res = await fetch(url);
      const d = await res.json();
      setCustomers(d.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadCustomers(search);
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Clientes & Programa Fidelidade</h1>
            <p className="text-xs text-gray-500">Histórico de compras e acúmulo de pontos (1 ponto a cada R$ 10)</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou fone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Cards no Mobile para Clientes & Fidelidade */}
        <div className="md:hidden space-y-3">
          {customers.map((c) => {
            const promoMsg = `Olá, ${c.name}! 🍔 Sentimos sua falta na Central Lanches! Que tal pedir seu lanche favorito hoje? Use o cupom *CENTRAL5* e ganhe R$ 5,00 de desconto: https://central-lanches-theta.vercel.app/menu`;
            const cleanPhone = (c.phone || "").replace(/\D/g, "");
            const waUrl = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(promoMsg)}` : "#";

            return (
              <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">{c.name}</h3>
                    <div className="text-[11px] text-gray-500 font-semibold">{c.phone || "Sem telefone"}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                    <Award size={13} className="text-amber-500" />
                    {c.points} pts
                  </span>
                </div>

                <div className="text-xs text-gray-500 pt-1 border-t border-gray-100 flex items-center justify-between">
                  <span>{c._count?.orders || 0} pedidos feitos</span>
                  <span className="text-[11px] text-gray-400">{formatDateTime(c.createdAt)}</span>
                </div>

                {c.address && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-xl">
                    📍 {c.address}
                  </div>
                )}

                {cleanPhone && (
                  <div className="pt-1">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      <span>Enviar Cupom no WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
          {customers.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
              Nenhum cliente cadastrado.
            </div>
          )}
        </div>

        {/* Lista de Clientes Desktop */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">WhatsApp / Telefone</th>
                  <th className="py-3 px-4">Endereço Principal</th>
                  <th className="py-3 px-4">Total de Pedidos</th>
                  <th className="py-3 px-4">Pontos Fidelidade</th>
                  <th className="py-3 px-4">Cadastrado em</th>
                  <th className="py-3 px-4 text-right">Ações & Fidelidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => {
                  const promoMsg = `Olá, ${c.name}! 🍔 Sentimos sua falta na Central Lanches! Que tal pedir seu lanche favorito hoje? Use o cupom *CENTRAL5* e ganhe R$ 5,00 de desconto: https://central-lanches-theta.vercel.app/menu`;
                  const cleanPhone = (c.phone || "").replace(/\D/g, "");
                  const waUrl = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(promoMsg)}` : "#";

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">{c.name}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-gray-600">{c.phone}</td>
                      <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">
                        {c.address || "Não informado"}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-gray-700">
                        {c._count?.orders || 0} pedidos
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                          <Award size={14} className="text-amber-500" />
                          {c.points} pts
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">
                        {formatDateTime(c.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {cleanPhone ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold active:scale-95 transition-all"
                            title="Enviar cupom promocional no WhatsApp"
                          >
                            <span>WhatsApp Promo</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
