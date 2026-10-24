'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { 
  Store, 
  Clock, 
  Bike, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Check, 
  ArrowLeft,
  Loader2 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function RestaurantStorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { addItem, cartCount, totalCents, restaurantId: cartRestId } = useCart();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Produto
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (slug) {
      loadStorefront();
    }
  }, [slug]);

  const loadStorefront = async () => {
    try {
      setLoading(true);

      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!restData) {
        setRestaurant(null);
        setLoading(false);
        return;
      }

      setRestaurant(restData);

      const { data: catData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restData.id)
        .order('display_order', { ascending: true });

      setCategories(catData || []);

      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restData.id)
        .eq('is_available', true);

      setProducts(prodData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !restaurant) return;

    addItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      priceCents: selectedProduct.price_cents,
      quantity,
      notes: itemNotes,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      deliveryFeeCents: restaurant.delivery_fee_cents,
      deliveryTimeMin: restaurant.delivery_time_min,
      deliveryTimeMax: restaurant.delivery_time_max,
    });

    setToastMessage(`Adicionado: ${quantity}x ${selectedProduct.name}`);
    setTimeout(() => setToastMessage(''), 2500);

    setSelectedProduct(null);
    setQuantity(1);
    setItemNotes('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF3B00] animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Restaurante não encontrado</h2>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-5 py-2.5 bg-[#FF3B00] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Voltar para a Vitrine
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col font-sans pb-28">
      <Navbar />

      {/* Header do Restaurante */}
      <div className="bg-white border-b border-[#E7E2DA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#57534E] hover:text-[#1C1917] mb-5 transition-colors focus-visible:outline-2 focus-visible:outline-[#C84B31]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a lista de restaurantes</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {restaurant.image_url ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E7E2DA] shrink-0 bg-[#F3EFEA]">
                  <img
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#F3EFEA] text-[#78716C] flex items-center justify-center font-bold text-2xl shrink-0">
                  <Store className="w-8 h-8" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1C1917] font-[family-name:var(--font-heading)]">
                    {restaurant.name}
                  </h1>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                    restaurant.is_open 
                      ? 'bg-[#EDF7F1] text-[#2A6A4E] border-[#2A6A4E]/20' 
                      : 'bg-[#F3EFEA] text-[#78716C] border-[#E7E2DA]'
                  }`}>
                    {restaurant.is_open ? 'Aberto agora' : 'Fechado no momento'}
                  </span>
                </div>
                <p className="text-xs text-[#57534E] max-w-lg leading-relaxed">{restaurant.description}</p>
              </div>
            </div>

            {/* Badges de tempo e taxa */}
            <div className="flex items-center gap-4 bg-[#FAF8F5] border border-[#E7E2DA] p-3 rounded-xl text-xs">
              <div className="flex flex-col px-2 border-r border-[#E7E2DA]">
                <span className="text-[10px] text-[#78716C] uppercase font-semibold">Tempo médio</span>
                <span className="text-xs font-bold text-[#1C1917] mt-0.5">{restaurant.delivery_time_min}–{restaurant.delivery_time_max} min</span>
              </div>
              <div className="flex flex-col px-2 border-r border-[#E7E2DA]">
                <span className="text-[10px] text-[#78716C] uppercase font-semibold">Entrega</span>
                <span className="text-xs font-bold text-[#C84B31] mt-0.5">
                  {restaurant.delivery_fee_cents === 0
                    ? 'Grátis'
                    : `R$ ${(restaurant.delivery_fee_cents / 100).toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              <div className="flex flex-col px-2">
                <span className="text-[10px] text-[#78716C] uppercase font-semibold">Pedido Mínimo</span>
                <span className="text-xs font-bold text-[#1C1917] mt-0.5">
                  R$ {(restaurant.min_order_cents / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cardápio */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-10">
        {categories.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-[#E7E2DA]">
            <p className="text-xs text-[#57534E]">Nenhum item disponível no momento neste cardápio.</p>
          </div>
        ) : (
          categories.map((cat) => {
            const catProducts = products.filter(p => p.category_id === cat.id);
            if (catProducts.length === 0) return null;

            return (
              <section key={cat.id} className="space-y-4">
                <div className="border-b border-[#E7E2DA] pb-2 flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#1C1917] font-[family-name:var(--font-heading)]">
                    {cat.name}
                  </h2>
                  <span className="text-xs text-[#78716C]">{catProducts.length} itens</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catProducts.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setQuantity(1);
                        setItemNotes('');
                      }}
                      className="group bg-white p-4 rounded-xl border border-[#E7E2DA] hover:border-[#D6CEC4] transition-all cursor-pointer flex justify-between gap-4 focus-visible:outline-2 focus-visible:outline-[#C84B31]"
                    >
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-sm text-[#1C1917] group-hover:text-[#C84B31] transition-colors">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-[#57534E] mt-1 line-clamp-2 leading-relaxed">
                            {prod.description}
                          </p>
                        </div>
                        <span className="mt-3 font-bold text-sm text-[#1C1917]">
                          R$ {(prod.price_cents / 100).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {prod.image_url ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-[#E7E2DA] bg-[#F3EFEA] relative">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-[#F3EFEA] flex items-center justify-center text-[#78716C] group-hover:text-[#C84B31] transition-colors shrink-0">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* Barra Flutuante de Carrinho Global */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40">
          <div className="bg-[#1C1917] text-white p-3.5 rounded-xl shadow-lg border border-black/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-md bg-[#C84B31] text-white flex items-center justify-center font-bold text-xs">
                {cartCount}
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] text-[#A8A29E]">Total da sacola</span>
                <span className="font-bold text-sm">
                  R$ {(totalCents / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/carrinho')}
              className="px-4 py-2 bg-[#C84B31] hover:bg-[#A83C25] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Ver sacola
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#1C1917] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md flex items-center gap-2 border border-white/10">
          <Check className="w-3.5 h-3.5 text-[#2A6A4E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal Adicionar ao Carrinho */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#E7E2DA] space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#1C1917] font-[family-name:var(--font-heading)]">
                {selectedProduct.name}
              </h3>
              <p className="text-xs text-[#57534E] mt-1 leading-relaxed">{selectedProduct.description}</p>
              <div className="text-base font-bold text-[#C84B31] mt-2">
                R$ {(selectedProduct.price_cents / 100).toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="notes" className="block text-xs font-semibold text-[#1C1917]">Observações para a cozinha</label>
              <textarea
                id="notes"
                rows={2}
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Ex: sem cebola, maionese à parte, ponto bem passado..."
                className="w-full p-2.5 text-xs bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg focus:outline-hidden focus:border-[#C84B31] text-[#1C1917] placeholder-[#78716C]"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#E7E2DA] rounded-lg p-1 bg-[#FAF8F5]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-xs text-[#1C1917]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-2.5 bg-[#C84B31] hover:bg-[#A83C25] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Adicionar</span>
                <span>•</span>
                <span>R$ {((selectedProduct.price_cents * quantity) / 100).toFixed(2).replace('.', ',')}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="w-full py-1.5 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] cursor-pointer text-center"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
