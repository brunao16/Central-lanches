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
  Percent
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      // 1. Buscar todos os restaurantes
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      setRestaurants(restData || []);

      // 2. Buscar todos os pedidos para estatísticas de faturamento e comissão
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
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

  // Métricas
  const totalVolumeCents = orders.reduce((acc, o) => acc + (o.total_cents || 0), 0);
  const totalPlatformFeesCents = orders.reduce((acc, o) => acc + (o.platform_fee_cents || 0), 0);
  const totalRestaurantNetCents = orders.reduce((acc, o) => acc + (o.restaurant_net_cents || 0), 0);

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
                Painel do Administrador Geral
              </h1>
              <p className="text-xs text-gray-500">
                Gestão central de estabelecimentos, aprovações, faturamento e comissões da plataforma.
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Métricas e Comissões */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Faturamento Bruto
            </span>
            <span className="text-2xl font-black text-gray-900">
              R$ {(totalVolumeCents / 100).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-gray-400 mt-2 block">
              Volume total movimentado
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-[#FF3B00] uppercase tracking-wider block mb-1">
              Sua Comissão (Lucro)
            </span>
            <span className="text-2xl font-black text-[#FF3B00]">
              R$ {(totalPlatformFeesCents / 100).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-gray-400 mt-2 block">
              Média de 10% por pedido
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Repasse a Restaurantes
            </span>
            <span className="text-2xl font-black text-green-600">
              R$ {(totalRestaurantNetCents / 100).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-gray-400 mt-2 block">
              Líquido dos parceiros
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Total de Pedidos
            </span>
            <span className="text-2xl font-black text-gray-900">
              {orders.length}
            </span>
            <span className="text-[11px] text-gray-400 mt-2 block">
              {restaurants.length} restaurantes parceiros
            </span>
          </div>
        </div>

        {/* Gestão e Aprovação de Restaurantes */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-900">Restaurantes Cadastrados</h2>
              <p className="text-xs text-gray-500">Aprove novos cadastros e personalize a porcentagem de comissão individual.</p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou CNPJ..."
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
                  <th className="pb-3 px-2">Comissão</th>
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
      </main>
    </div>
  );
}
