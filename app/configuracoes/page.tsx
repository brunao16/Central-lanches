"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency, parseCurrencyToCents } from "@/lib/utils";
import { Settings, Save, Store, QrCode } from "lucide-react";

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    restaurantName: "Central Lanches",
    phone: "(85) 98888-7777",
    address: "Av. Principal, 500 - Centro",
    pixKey: "85988887777",
    openingHours: "Terça a Domingo das 18h às 23h30",
    deliveryFee: "5,00",
    rewardThreshold: 100,
    rewardDiscount: "15,00",
  });

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const d = await res.json();
      if (d.setting) {
        setForm({
          restaurantName: d.setting.restaurantName,
          phone: d.setting.phone,
          address: d.setting.address,
          pixKey: d.setting.pixKey,
          openingHours: d.setting.openingHours,
          deliveryFee: (d.setting.deliveryFee / 100).toFixed(2).replace(".", ","),
          rewardThreshold: d.setting.rewardThreshold,
          rewardDiscount: (d.setting.rewardDiscount / 100).toFixed(2).replace(".", ","),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: form.restaurantName,
          phone: form.phone,
          address: form.address,
          pixKey: form.pixKey,
          openingHours: form.openingHours,
          deliveryFee: parseCurrencyToCents(form.deliveryFee),
          rewardThreshold: Number(form.rewardThreshold),
          rewardDiscount: parseCurrencyToCents(form.rewardDiscount),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      alert("Configurações salvas com sucesso!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Configurações da Lanchonete</h1>
          <p className="text-xs text-gray-500">Dados cadastrais, horário, chave Pix e programa de fidelidade</p>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 font-bold text-gray-900 pb-2 border-b border-gray-100 text-sm">
            <Store className="text-primary" size={18} />
            <span>Dados do Estabelecimento</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700">Nome da Lanchonete</label>
              <input
                type="text"
                required
                value={form.restaurantName}
                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">Telefone / WhatsApp</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-gray-700">Endereço Completo</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">Chave Pix (para QR Code)</label>
              <input
                type="text"
                required
                value={form.pixKey}
                onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">Horário de Funcionamento</label>
              <input
                type="text"
                required
                value={form.openingHours}
                onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">Taxa Padrão de Entrega (R$)</label>
              <input
                type="text"
                required
                value={form.deliveryFee}
                onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">Desconto de Recompensa (R$)</label>
              <input
                type="text"
                required
                value={form.rewardDiscount}
                onChange={(e) => setForm({ ...form, rewardDiscount: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-md shadow-red-200 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
