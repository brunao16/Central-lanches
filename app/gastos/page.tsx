"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency, parseCurrencyToCents, formatDateTime } from "@/lib/utils";
import { DollarSign, Plus, Calendar, Tag } from "lucide-react";

export default function GastosPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    description: "",
    category: "INSUMOS",
    amount: "",
    paymentMethod: "PIX",
    isRecurring: false,
    notes: "",
  });

  async function loadExpenses() {
    try {
      const res = await fetch("/api/expenses");
      const d = await res.json();
      setExpenses(d.expenses || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          category: form.category,
          amount: parseCurrencyToCents(form.amount),
          paymentMethod: form.paymentMethod,
          isRecurring: form.isRecurring,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      setForm({
        description: "",
        category: "INSUMOS",
        amount: "",
        paymentMethod: "PIX",
        isRecurring: false,
        notes: "",
      });
      loadExpenses();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Controle de Gastos & Despesas</h1>
            <p className="text-xs text-gray-500">Lançamento de insumos, contas de luz, aluguel e fornecedores</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-red-50 text-primary rounded-xl font-black text-sm">
              Total: {formatCurrency(total)}
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-sm shadow-red-200"
            >
              <Plus size={16} />
              Lançar Despesa
            </button>
          </div>
        </div>

        {/* Lista de Despesas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Forma Pagto</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {e.description}
                      {e.isRecurring && (
                        <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          Recorrente Mensal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-gray-600">{e.category}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{formatDateTime(e.date)}</td>
                    <td className="py-3 px-4 text-xs font-medium text-gray-600">{e.paymentMethod}</td>
                    <td className="py-3 px-4 font-black text-gray-900 text-right">
                      {formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Lançar Gasto */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-lg text-gray-900">Lançar Nova Despesa</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de carnes no atacado"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700">Categoria</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                  >
                    <option value="INSUMOS">Insumos / Carnes / Pães</option>
                    <option value="ALUGUEL">Aluguel do Ponto</option>
                    <option value="FUNCIONARIOS">Funcionários / Diárias</option>
                    <option value="ENERGIA_AGUA">Energia / Água / Gás</option>
                    <option value="EQUIPAMENTOS">Equipamentos / Manutenção</option>
                    <option value="MARKETING">Marketing / Panfletos</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700">Valor (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="150,00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Forma de Pagamento</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="PIX">Pix</option>
                  <option value="DINHEIRO">Dinheiro (Caixa)</option>
                  <option value="DEBITO">Débito</option>
                  <option value="CREDITO">Crédito</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700 pt-1">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span>Despesa recorrente todo mês</span>
              </label>
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
                Salvar Despesa
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
