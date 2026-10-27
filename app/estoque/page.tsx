"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency, parseCurrencyToCents } from "@/lib/utils";
import { Package, Plus, Minus, AlertTriangle, ArrowUpDown } from "lucide-react";

export default function EstoquePage() {
  const [items, setItems] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    unit: "kg",
    quantity: "",
    minQuantity: "5",
    cost: "",
  });

  async function loadItems() {
    try {
      const res = await fetch("/api/inventory");
      const d = await res.json();
      setItems(d.items || []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleAdjust(id: string, delta: number) {
    try {
      await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, delta }),
      });
      loadItems();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          unit: form.unit,
          quantity: parseFloat(form.quantity.replace(",", ".")) || 0,
          minQuantity: parseFloat(form.minQuantity.replace(",", ".")) || 0,
          cost: parseCurrencyToCents(form.cost),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      setForm({ name: "", unit: "kg", quantity: "", minQuantity: "5", cost: "" });
      loadItems();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Estoque de Insumos</h1>
            <p className="text-xs text-gray-500">Controle de carnes, pães, queijos, embalagens e bebidas</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-sm shadow-red-200 self-start sm:self-auto"
          >
            <Plus size={16} />
            Cadastrar Insumo
          </button>
        </div>

        {/* Cards no Mobile para Estoque de Insumos */}
        <div className="md:hidden space-y-3">
          {items.map((i) => {
            const isLow = i.quantity <= i.minQuantity;
            return (
              <div key={i.id} className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">{i.name}</h3>
                    <div className="text-[11px] text-gray-500 font-medium">
                      Mínimo: {i.minQuantity} {i.unit} • Custo: {formatCurrency(i.cost)}
                    </div>
                  </div>
                  {isLow ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                      <AlertTriangle size={12} />
                      Baixo
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      Normal
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Qtd Atual</span>
                    <span className="font-black text-lg text-gray-900">
                      {i.quantity} <span className="text-xs font-normal text-gray-500">{i.unit}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                    <button
                      onClick={() => handleAdjust(i.id, -1)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-white shadow-xs text-gray-700 active:scale-95 font-bold"
                      title="Subtrair 1"
                    >
                      <Minus size={15} />
                    </button>
                    <button
                      onClick={() => handleAdjust(i.id, 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-white shadow-xs active:scale-95 font-bold"
                      title="Adicionar 1"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
              Nenhum insumo cadastrado.
            </div>
          )}
        </div>

        {/* Tabela de Insumos Desktop */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Insumo</th>
                  <th className="py-3 px-4">Qtd Atual</th>
                  <th className="py-3 px-4">Mínimo</th>
                  <th className="py-3 px-4">Custo Unitário</th>
                  <th className="py-3 px-4">Alerta</th>
                  <th className="py-3 px-4 text-right">Ajuste Rápido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((i) => {
                  const isLow = i.quantity <= i.minQuantity;
                  return (
                    <tr key={i.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">{i.name}</td>
                      <td className="py-3 px-4 font-extrabold text-base text-gray-900">
                        {i.quantity} <span className="text-xs font-normal text-gray-500">{i.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {i.minQuantity} {i.unit}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-gray-700">
                        {formatCurrency(i.cost)}
                      </td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            <AlertTriangle size={12} />
                            Estoque Baixo
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAdjust(i.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95"
                            title="Subtrair 1"
                          >
                            <Minus size={13} />
                          </button>
                          <button
                            onClick={() => handleAdjust(i.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95"
                            title="Adicionar 1"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Cadastrar Insumo */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-lg text-gray-900">Novo Insumo no Estoque</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700">Nome do Insumo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Queijo Cheddar Fatiado"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700">Unidade</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                  >
                    <option value="kg">Quilogramas (kg)</option>
                    <option value="un">Unidades (un)</option>
                    <option value="pct">Pacotes (pct)</option>
                    <option value="l">Litros (l)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700">Qtd Inicial</label>
                  <input
                    type="text"
                    required
                    placeholder="10"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700">Estoque Mínimo (Alerta)</label>
                  <input
                    type="text"
                    required
                    placeholder="5"
                    value={form.minQuantity}
                    onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">Custo Unitário (R$)</label>
                  <input
                    type="text"
                    placeholder="35,00"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm shadow-red-200"
              >
                Cadastrar Insumo
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
