"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency, parseCurrencyToCents } from "@/lib/utils";
import { Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";

export default function CardapioAdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    costPrice: "",
    categoryId: "",
    imageUrl: "",
    active: true,
  });

  async function loadData() {
    try {
      const res = await fetch("/api/products");
      const d = await res.json();
      setCategories(d.categories || []);
      setProducts(d.products || []);
      if (d.categories?.[0] && !form.categoryId) {
        setForm((prev) => ({ ...prev, categoryId: d.categories[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseCurrencyToCents(form.price),
          costPrice: parseCurrencyToCents(form.costPrice),
          categoryId: form.categoryId,
          imageUrl: form.imageUrl || undefined,
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      setForm({
        name: "",
        description: "",
        price: "",
        costPrice: "",
        categoryId: categories[0]?.id || "",
        imageUrl: "",
        active: true,
      });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Gestão do Cardápio</h1>
            <p className="text-xs text-gray-500">Cadastre e edite lanches, porções, bebidas e preços</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-sm shadow-red-200"
          >
            <Plus size={16} />
            Novo Produto
          </button>
        </div>

        {/* Cards no Mobile para Gestão do Cardápio */}
        <div className="md:hidden space-y-3">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-primary text-xl flex-shrink-0">
                    🍔
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-gray-900 truncate">{p.name}</div>
                  <div className="text-[11px] text-gray-500 font-medium">{p.category?.name} • Custo: {formatCurrency(p.costPrice || 0)}</div>
                  <div className="font-black text-sm text-primary mt-0.5">{formatCurrency(p.price)}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                  {p.active ? "Ativo" : "Pausado"}
                </span>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
              Nenhum produto cadastrado.
            </div>
          )}
        </div>

        {/* Tabela de Produtos Desktop */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Preço Venda</th>
                  <th className="py-3 px-4">Preço Custo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-primary text-base">
                          🍔
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400 line-clamp-1">{p.description}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-gray-600">
                      {p.category?.name}
                    </td>
                    <td className="py-3 px-4 font-black text-gray-900">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {formatCurrency(p.costPrice || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                        {p.active ? "Ativo" : "Pausado"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Novo Produto */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-lg text-gray-900">Cadastrar Novo Produto</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700">Nome do Produto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: X-Bacon Especial"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">Categoria</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700">Preço Venda (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="25,00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">Custo Estimado (R$)</label>
                  <input
                    type="text"
                    placeholder="10,00"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Descrição / Ingredientes</label>
                <textarea
                  rows={2}
                  placeholder="Pão brioche, blend 160g, cheddar, bacon crocante..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">URL da Foto (opcional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                />
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
                Salvar Produto
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
