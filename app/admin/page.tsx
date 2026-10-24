'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { 
  ShieldCheck, 
  Store, 
  DollarSign, 
  ShoppingBag, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Users,
  Search,
  Loader2,
  Percent,
  Banknote,
  CreditCard,
  FileText,
  Calendar,
  ArrowUpRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'geral' | 'repasses_online' | 'boletos_entrega'>('geral');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      setRestaurants(restData || []);

      const { data: orderData } = await supabase
        .from('orders')
        .select('*, restaurants(name, cnpj, phone)')
        .order('created_at', { ascending: false });

      setOrders(orderData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateRestaurantStatus = async (restaurantId: string, status: string) => {
    await supabase.from('restaurants').update({ status }).eq('id', restaurantId);
    setRestaurants(restaurants.map(r => r.id === restaurantId ? { ...r, status } : r));
  };

  const updateCommission = async (restaurantId: string, newRate: number) => {
    await supabase.from('restaurants').update({ commission_rate_percent: newRate }).eq('id', restaurantId);
    setRestaurants(restaurants.map(r => r.id === restaurantId ? { ...r, commission_rate_percent: newRate } : r));
  };

  // Separação de Pedidos: ONLINE vs PAGAMENTO NA ENTREGA (Modelo UaiRango)
  const onlineOrders = orders.filter(o => o.payment_method === 'pix');
  const deliveryOrders = orders.filter(o => o.payment_method === 'cash_on_delivery' || o.payment_method === 'credit_card');

  // 1. Métrica Pagamento na Entrega (Boleto Mensal de 10%)
  const totalDeliveryVolumeCents = deliveryOrders.reduce((acc, o) => acc + (o.total_cents || 0), 0);
  const totalBoletoCommissionCents = Math.round(totalDeliveryVolumeCents * 0.10); // 10% a cobrar no boleto

  // 2. Métrica Pagamento Online (Repasse Semanal com taxas)
  // Taxas: 10% plataforma + 3,5% taxa bancária + R$ 2,00 por transferência
  const totalOnlineVolumeCents = onlineOrders.reduce((acc, o) => acc + (o.total_cents || 0), 0);
  const onlinePlatform10Cents = Math.round(totalOnlineVolumeCents * 0.10);
  const onlineBankFeeCents = Math.round(totalOnlineVolumeCents * 0.035); // 3.5%
  const totalOnlineDeductionsCents = onlinePlatform10Cents + onlineBankFeeCents;
  const netOnlineRepasseCents = Math.max(0, totalOnlineVolumeCents - totalOnlineDeductionsCents);

  // Volume Total Global
  const totalVolumeCents = orders.reduce((acc, o) => acc + (o.total_cents || 0), 0);
  const totalProfitCents = onlinePlatform10Cents + totalBoletoCommissionCents;

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.cnpj?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF3B00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Header do Admin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black">
              <ShieldCheck className="w-6 h-6 text-[#FF3B00]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Painel Financeiro & Administrativo
              </h1>
              <p className="text-xs text-gray-500">
                Modelo UaiRango: Boletos Mensais para pedidos na entrega e Repasses Semanais para pagamentos online.
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Faturamento Global
            </span>
            <span className="text-2xl font-black text-gray-900">
              R$ {(totalVolumeCents / 100).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-gray-400 mt-2 block">
              {orders.length} pedidos totais
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-[#FF3B00] uppercase tracking-wider block mb-1">
              Seu Lucro Líquido (10%)
            </span>
            <span className="text-2xl font-black text-[#FF3B00]">
              R$ {(totalProfitCents / 100).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-gray-400 mt-2 block">
              Comissão Central Lanches
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
              A Repassar (Online)
            </span>
            <span className="text-2xl font-black text-blue-600">
              R$ {(netOnlineRepasseCents / 100).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-gray-400 mt-2 block">
              Toda Quarta-feira (-10% -3,5% -R$2)
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
              A Cobrar no Boleto
            </span>
            <span className="text-2xl font-black text-amber-600">
              R$ {(totalBoletoCommissionCents / 100).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-gray-400 mt-2 block">
              1º dia útil do mês (pedidos na entrega)
            </span>
          </div>
        </div>

        {/* Seletor de Abas */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'geral'
                ? 'bg-[#FF3B00] text-white shadow-md shadow-[#FF3B00]/25'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Gestão de Restaurantes
          </button>

          <button
            onClick={() => setActiveTab('boletos_entrega')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'boletos_entrega'
                ? 'bg-[#FF3B00] text-white shadow-md shadow-[#FF3B00]/25'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Boletos Mensais (Pedidos na Entrega)</span>
          </button>

          <button
            onClick={() => setActiveTab('repasses_online')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'repasses_online'
                ? 'bg-[#FF3B00] text-white shadow-md shadow-[#FF3B00]/25'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Repasses Semanais (Pagamento Online)</span>
          </button>
        </div>

        {/* ABA 1: BOLETOS MENSAIS (Pedidos pagos direto ao restaurante) */}
        {activeTab === 'boletos_entrega' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
            <div className="border-l-4 border-amber-500 pl-4 py-1">
              <h2 className="text-base font-black text-gray-900">
                Boletos Mensais de Comissão (10%)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Regra: Quando o cliente paga em dinheiro ou máquina de cartão na entrega, o dinheiro entra 100% no bolso do restaurante. No 1º dia útil de cada mês, é gerado um boleto de 10% referente às vendas do mês.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase">
                    <th className="pb-3 px-2">Restaurante</th>
                    <th className="pb-3 px-2">Vendas na Entrega</th>
                    <th className="pb-3 px-2">Comissão (10%)</th>
                    <th className="pb-3 px-2">Vencimento Boleto</th>
                    <th className="pb-3 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {restaurants.map((rest) => {
                    const restDeliveryOrders = deliveryOrders.filter(o => o.restaurant_id === rest.id);
                    const restVolume = restDeliveryOrders.reduce((acc, o) => acc + (o.total_cents || 0), 0);
                    const restBoleto = Math.round(restVolume * 0.10);

                    return (
                      <tr key={rest.id} className="hover:bg-gray-50/50">
                        <td className="py-4 px-2">
                          <span className="font-bold text-gray-900 block">{rest.name}</span>
                          <span className="text-[11px] text-gray-400">{restDeliveryOrders.length} pedidos em dinheiro/maquininha</span>
                        </td>
                        <td className="py-4 px-2 font-bold text-gray-700">
                          R$ {(restVolume / 100).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-4 px-2 font-black text-amber-600">
                          R$ {(restBoleto / 100).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-4 px-2 text-gray-500">
                          1º dia útil do mês
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => alert(`Boleto de R$ ${(restBoleto / 100).toFixed(2).replace('.', ',')} emitido para ${rest.name} via Asaas!`)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Gerar Boleto Asaas
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 2: REPASSES SEMANAIS (Pagamento Online Pix) */}
        {activeTab === 'repasses_online' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
            <div className="border-l-4 border-blue-500 pl-4 py-1">
              <h2 className="text-base font-black text-gray-900">
                Repasses Semanais (Quarta-feira)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Regra: Vendas pagas online (Pix) de segunda a domingo. Deduz-se: <strong>10% (UaiRango)</strong> + <strong>3,5% (taxa bancária)</strong> + <strong>R$ 2,00 (transferência)</strong>. O valor líquido restante é transferido ao restaurante na quarta-feira seguinte.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase">
                    <th className="pb-3 px-2">Restaurante</th>
                    <th className="pb-3 px-2">Vendas Online (Bruto)</th>
                    <th className="pb-3 px-2">Taxas (10% + 3,5% + R$2)</th>
                    <th className="pb-3 px-2">Valor Líquido a Repassar</th>
                    <th className="pb-3 px-2 text-right">Repasse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {restaurants.map((rest) => {
                    const restOnlineOrders = onlineOrders.filter(o => o.restaurant_id === rest.id);
                    const brutoCents = restOnlineOrders.reduce((acc, o) => acc + (o.total_cents || 0), 0);
                    
                    const taxa10Cents = Math.round(brutoCents * 0.10);
                    const taxaBancoCents = Math.round(brutoCents * 0.035);
                    const taxaTransferenciaCents = brutoCents > 0 ? 200 : 0; // R$ 2,00
                    const totalTaxasCents = taxa10Cents + taxaBancoCents + taxaTransferenciaCents;
                    const liquidoCents = Math.max(0, brutoCents - totalTaxasCents);

                    return (
                      <tr key={rest.id} className="hover:bg-gray-50/50">
                        <td className="py-4 px-2">
                          <span className="font-bold text-gray-900 block">{rest.name}</span>
                          <span className="text-[11px] text-gray-400">{restOnlineOrders.length} pedidos Pix online</span>
                        </td>
                        <td className="py-4 px-2 font-bold text-gray-700">
                          R$ {(brutoCents / 100).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-4 px-2 text-red-600 font-semibold">
                          - R$ {(totalTaxasCents / 100).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-4 px-2 font-black text-green-600 text-sm">
                          R$ {(liquidoCents / 100).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => alert(`Repasse de R$ ${(liquidoCents / 100).toFixed(2).replace('.', ',')} agendado para Quarta-feira via Pix/TED!`)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Agendar Quarta
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA GERAL: LISTA DE RESTAURANTES */}
        {activeTab === 'geral' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">Restaurantes Cadastrados</h2>
                <p className="text-xs text-gray-500">Aprove novos cadastros e personalize a comissão individual.</p>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar restaurante..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#FF3B00]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase">
                    <th className="pb-3 px-2">Restaurante</th>
                    <th className="pb-3 px-2">CNPJ / Contato</th>
                    <th className="pb-3 px-2">Comissão Base</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredRestaurants.map((rest) => (
                    <tr key={rest.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-2">
                        <span className="font-bold text-gray-900 block">{rest.name}</span>
                        <span className="text-[11px] text-gray-400">{rest.address_neighborhood || 'Centro'}</span>
                      </td>
                      <td className="py-4 px-2 text-gray-600">
                        <span className="block">{rest.cnpj}</span>
                        <span className="text-[11px] text-gray-400">{rest.phone}</span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            defaultValue={rest.commission_rate_percent || 10}
                            onBlur={(e) => updateCommission(rest.id, Number(e.target.value))}
                            className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-xs font-bold text-center"
                          />
                          <span className="text-gray-500 font-bold">%</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          rest.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : rest.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {rest.status === 'approved' ? 'Aprovado' : rest.status === 'pending' ? 'Pendente' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right space-x-2">
                        {rest.status !== 'approved' && (
                          <button
                            onClick={() => updateRestaurantStatus(rest.id, 'approved')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Aprovar
                          </button>
                        )}
                        {rest.status !== 'suspended' && (
                          <button
                            onClick={() => updateRestaurantStatus(rest.id, 'suspended')}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Bloquear
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
