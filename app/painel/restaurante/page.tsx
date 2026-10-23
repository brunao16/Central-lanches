'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Store, 
  UtensilsCrossed, 
  Plus, 
  Power, 
  DollarSign, 
  Clock, 
  ShoppingBag, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  Bell,
  Check,
  Bike,
  Printer
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { printThermalOrder } from '@/lib/thermalPrinter';

export default function RestaurantDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'cardapio' | 'pedidos'>('pedidos');
  
  // Modais de Criação
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Formulário Nova Categoria
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Formulário Novo Produto
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategoryId, setNewProdCategoryId] = useState('');

  // Status Aberto/Fechado
  const [isOpen, setIsOpen] = useState(false);

  // Alerta sonoro de novo pedido (Web Audio API nativo sem precisar de arquivo mp3 externo)
  const playOrderAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota Lá (A5)
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.3); // Sobe para Mi (E6)
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('AudioContext not allowed or supported:', e);
    }
  };

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Buscar restaurante do usuário
      const { data: restData, error: restErr } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (restErr || !restData) {
        router.push('/cadastro-restaurante');
        return;
      }

      setRestaurant(restData);
      setIsOpen(restData.is_open);

      // 2. Buscar categorias de cardápio
      const { data: catData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restData.id)
        .order('display_order', { ascending: true });

      setCategories(catData || []);
      if (catData && catData.length > 0) {
        setNewProdCategoryId(catData[0].id);
      }

      // 3. Buscar produtos
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restData.id)
        .order('created_at', { ascending: false });

      setProducts(prodData || []);

      // 4. Buscar pedidos recentes
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('restaurant_id', restData.id)
        .order('created_at', { ascending: false });

      setOrders(ordersData || []);

      // Inscrever em novos pedidos em tempo real com alerta sonoro
      const orderChannel = supabase
        .channel(`restaurant-orders-${restData.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restData.id}` },
          () => {
            playOrderAlert();
            loadOrders(restData.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(orderChannel);
      };

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (restId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', restId)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const toggleRestaurantOpen = async () => {
    if (!restaurant) return;
    const nextState = !isOpen;
    setIsOpen(nextState);

    await supabase
      .from('restaurants')
      .update({ is_open: nextState })
      .eq('id', restaurant.id);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !restaurant) return;

    const { data } = await supabase
      .from('menu_categories')
      .insert([
        {
          restaurant_id: restaurant.id,
          name: newCategoryName.trim(),
          display_order: categories.length + 1,
        },
      ])
      .select()
      .single();

    if (data) {
      setCategories([...categories, data]);
      setNewCategoryName('');
      setShowCategoryModal(false);
      if (!newProdCategoryId) setNewProdCategoryId(data.id);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !restaurant || !newProdCategoryId) return;

    const priceCents = Math.round(parseFloat(newProdPrice.replace(',', '.')) * 100);

    const { data } = await supabase
      .from('products')
      .insert([
        {
          restaurant_id: restaurant.id,
          category_id: newProdCategoryId,
          name: newProdName.trim(),
          description: newProdDesc.trim(),
          price_cents: priceCents,
          is_available: true,
        },
      ])
      .select()
      .single();

    if (data) {
      setProducts([data, ...products]);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice('');
      setShowProductModal(false);
    }
  };

  const toggleProductAvailability = async (productId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setProducts(products.map(p => p.id === productId ? { ...p, is_available: nextStatus } : p));
    await supabase.from('products').update({ is_available: nextStatus }).eq('id', productId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF3B00] animate-spin" />
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF0EB] text-[#FF3B00] flex items-center justify-center font-black text-2xl">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900">{restaurant?.name}</h1>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isOpen ? 'ABERTO' : 'FECHADO'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Taxa de entrega: R$ {(restaurant?.delivery_fee_cents / 100).toFixed(2).replace('.', ',')} • Tempo: {restaurant?.delivery_time_min}-{restaurant?.delivery_time_max} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleRestaurantOpen}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                isOpen
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-600/20'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isOpen ? 'Fechar Loja' : 'Abrir Loja Agora'}</span>
            </button>
          </div>
        </div>

        {/* Tabs de Navegação */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all cursor-pointer ${
              activeTab === 'pedidos'
                ? 'bg-[#FF3B00] text-white shadow-md shadow-[#FF3B00]/25'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Pedidos em Tempo Real</span>
            {pendingOrders.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[#FF3B00] text-xs flex items-center justify-center font-bold">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cardapio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all cursor-pointer ${
              activeTab === 'cardapio'
                ? 'bg-[#FF3B00] text-white shadow-md shadow-[#FF3B00]/25'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Gestão do Cardápio</span>
          </button>
        </div>

        {/* ABA: PEDIDOS EM TEMPO REAL */}
        {activeTab === 'pedidos' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800">Nenhum pedido recebido ainda</h3>
                <p className="text-xs text-gray-500 mt-1">Os pedidos feitos pelos clientes aparecerão aqui instantaneamente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                        <span className="font-black text-sm text-gray-900">
                          Pedido #{o.order_number || o.id.slice(0, 6)}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          o.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          o.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                          o.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-700' :
                          o.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {o.status === 'pending' ? 'NOVO' : o.status}
                        </span>
                      </div>

                      {/* Itens */}
                      <div className="space-y-1.5 mb-4">
                        {o.order_items?.map((it: any) => (
                          <div key={it.id} className="text-xs text-gray-700 flex justify-between">
                            <span>{it.quantity}x {it.product_name}</span>
                            <span className="font-semibold">R$ {(it.total_price_cents / 100).toFixed(2).replace('.', ',')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Endereço */}
                      <div className="p-3 bg-gray-50 rounded-2xl text-[11px] text-gray-600 mb-4">
                        <p className="font-bold text-gray-800">{o.delivery_address?.name} ({o.delivery_address?.phone})</p>
                        <p>{o.delivery_address?.street}, {o.delivery_address?.number} - {o.delivery_address?.neighborhood}</p>
                        {o.delivery_address?.complement && <p>Compl: {o.delivery_address.complement}</p>}
                        {o.change_for_cents && (
                          <p className="text-[#FF3B00] font-bold mt-1">
                            Troco para: R$ {(o.change_for_cents / 100).toFixed(2).replace('.', ',')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações de Status & Impressão */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center text-xs font-black text-gray-900 mb-3">
                        <div className="flex items-center gap-2">
                          <span>Total:</span>
                          <span className="text-sm text-[#FF3B00]">R$ {(o.total_cents / 100).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => printThermalOrder(o, restaurant?.name || 'Central Lanches')}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir Comanda</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {o.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(o.id, 'preparing')}
                            className="col-span-2 py-2.5 bg-[#FF3B00] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#E03400] cursor-pointer"
                          >
                            Aceitar & Preparar
                          </button>
                        )}
                        {o.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(o.id, 'out_for_delivery')}
                            className="col-span-2 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-purple-700 cursor-pointer"
                          >
                            Despachar para Entrega
                          </button>
                        )}
                        {o.status === 'out_for_delivery' && (
                          <button
                            onClick={() => updateOrderStatus(o.id, 'delivered')}
                            className="col-span-2 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-green-700 cursor-pointer"
                          >
                            Marcar como Entregue
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: GESTÃO DO CARDÁPIO */}
        {activeTab === 'cardapio' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Gestão do Cardápio</h2>
                <p className="text-xs text-gray-500">Adicione categorias e produtos. Pause itens a qualquer momento.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Categoria</span>
                </button>

                <button
                  onClick={() => setShowProductModal(true)}
                  disabled={categories.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FF3B00] hover:bg-[#E03400] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Prato / Lanche</span>
                </button>
              </div>
            </div>

            {/* Categorias e Produtos */}
            <div className="space-y-8">
              {categories.map((cat) => {
                const categoryProducts = products.filter(p => p.category_id === cat.id);
                return (
                  <div key={cat.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                    <h3 className="text-base font-black text-gray-900 pb-4 border-b border-gray-100 mb-4">
                      {cat.name} ({categoryProducts.length} itens)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            prod.is_available ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{prod.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{prod.description}</p>
                            </div>
                            <span className="font-black text-sm text-[#FF3B00]">
                              R$ {(prod.price_cents / 100).toFixed(2).replace('.', ',')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-3">
                            <span className={`text-[11px] font-bold ${prod.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                              {prod.is_available ? 'Disponível' : 'Pausado'}
                            </span>

                            <button
                              onClick={() => toggleProductAvailability(prod.id, prod.is_available)}
                              className="text-xs font-bold text-gray-600 hover:text-[#FF3B00] cursor-pointer"
                            >
                              {prod.is_available ? 'Pausar' : 'Ativar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal Categoria */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 mb-4">Nova Categoria</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Hambúrgueres Artesanais"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF3B00] text-white text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Produto */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 mb-4">Novo Prato / Lanche</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Categoria</label>
                <select
                  value={newProdCategoryId}
                  onChange={(e) => setNewProdCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Item</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ex: X-Bacon Supremo"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Preço (R$)</label>
                <input
                  type="text"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  placeholder="29,90"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Ingredientes..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#FF3B00] text-white text-xs font-bold"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
