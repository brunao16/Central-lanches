'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { 
  Bike, 
  MapPin, 
  Navigation, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Store, 
  Loader2,
  DollarSign
} from 'lucide-react';

export default function DeliveryCourierPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveryOrders();

    // Inscrição em tempo real para atualizações de entregas
    const channel = supabase
      .channel('delivery-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadDeliveryOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDeliveryOrders = async () => {
    try {
      setLoading(true);

      // Buscar pedidos prontos ou em rota de entrega
      const { data } = await supabase
        .from('orders')
        .select('*, restaurants(name, phone, address_street, address_number, address_neighborhood)')
        .in('status', ['preparing', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsDelivered = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'delivered', updated_at: new Date().toISOString() }).eq('id', orderId);
    setOrders(orders.filter(o => o.id !== orderId));
  };

  const markAsOutForDelivery = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'out_for_delivery', updated_at: new Date().toISOString() }).eq('id', orderId);
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'out_for_delivery' } : o));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        {/* Header Entregador */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Bike className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Painel do Entregador
              </h1>
              <p className="text-xs text-gray-500">
                Visualize corridas disponíveis, abra rotas no GPS e confirme entregas.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-gray-400 uppercase block">Em Rota</span>
            <span className="text-xl font-black text-purple-600">{orders.length} pedidos</span>
          </div>
        </div>

        {/* Lista de Entregas */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">Nenhuma entrega pendente no momento</h3>
            <p className="text-xs text-gray-500 mt-1">Assim que a cozinha despachar um pedido, ele aparecerá aqui com a rota.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const fullCustomerAddress = `${o.delivery_address?.street}, ${o.delivery_address?.number} - ${o.delivery_address?.neighborhood}`;
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullCustomerAddress)}`;

              return (
                <div key={o.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-gray-900">
                        Pedido #{o.order_number || o.id.slice(0, 6)}
                      </span>
                      <span className="text-xs font-bold text-gray-500">• {o.restaurants?.name}</span>
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      o.status === 'out_for_delivery'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {o.status === 'out_for_delivery' ? 'A Caminho' : 'Pronto para Coleta'}
                    </span>
                  </div>

                  {/* Informações da Entrega */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Retirada */}
                    <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Store className="w-3 h-3 text-[#FF3B00]" />
                        <span>Ponto de Retirada (Restaurante)</span>
                      </span>
                      <p className="font-bold text-gray-800">{o.restaurants?.name}</p>
                      <p className="text-gray-500">{o.restaurants?.address_street}, {o.restaurants?.address_number}</p>
                    </div>

                    {/* Destino Cliente */}
                    <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-purple-700 uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-600" />
                        <span>Destino (Cliente)</span>
                      </span>
                      <p className="font-bold text-gray-900">{o.delivery_address?.name}</p>
                      <p className="text-gray-600">{fullCustomerAddress}</p>
                      {o.delivery_address?.complement && (
                        <p className="text-gray-500">Compl: {o.delivery_address.complement}</p>
                      )}
                    </div>
                  </div>

                  {/* Pagamento e Troco */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-gray-500">Receber do cliente: </span>
                      <span className="font-bold text-gray-900">
                        {o.payment_method === 'pix'
                          ? 'Pago Online (Pix)'
                          : o.payment_method === 'credit_card'
                          ? 'Passar Cartão na Maquininha'
                          : `Cobrar em Dinheiro: R$ ${(o.total_cents / 100).toFixed(2).replace('.', ',')}`}
                      </span>
                      {o.change_for_cents && (
                        <span className="text-[#FF3B00] font-bold block">
                          Levar troco para: R$ {(o.change_for_cents / 100).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Navigation className="w-4 h-4 text-purple-600" />
                      <span>Abrir Rota no GPS (Google Maps)</span>
                    </a>

                    {o.status === 'preparing' ? (
                      <button
                        onClick={() => markAsOutForDelivery(o.id)}
                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Iniciar Corrida / Despachar
                      </button>
                    ) : (
                      <button
                        onClick={() => markAsDelivered(o.id)}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Confirmar Entrega Concluída
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
