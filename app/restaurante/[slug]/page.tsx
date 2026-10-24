'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
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
        // Fallback para restaurante modelo de demonstração
        if (slug === 'uai-burguer-cia') {
          setRestaurant({
            id: 'a0000000-0000-0000-0000-000000000001',
            name: 'Uai Burguer & Cia',
            slug: 'uai-burguer-cia',
            description: 'Os melhores smash burgers artesanais com muito cheddar cremoso e bacon crocante.',
            delivery_fee_cents: 400,
            delivery_time_min: 25,
            delivery_time_max: 45,
            min_order_cents: 2000,
            is_open: true,
            phone: '35999998888',
            image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
          });
          setCategories([
            { id: 'b0000000-0000-0000-0000-000000000001', name: 'Hambúrgueres Artesanais' },
            { id: 'b0000000-0000-0000-0000-000000000002', name: 'Porções & Acompanhamentos' },
            { id: 'b0000000-0000-0000-0000-000000000003', name: 'Bebidas Geladas' },
          ]);
          setProducts([
            {
              id: 'c0000000-0000-0000-0000-000000000001',
              category_id: 'b0000000-0000-0000-0000-000000000001',
              name: 'Uai Cheddar Bacon Burger',
              description: 'Pão brioche selado na manteiga, blend 180g de carne nobre, cheddar cremoso e fatias de bacon crocante.',
              price_cents: 2890,
              is_available: true,
              image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'c0000000-0000-0000-0000-000000000002',
              category_id: 'b0000000-0000-0000-0000-000000000001',
              name: 'Smash Duplo da Casa',
              description: 'Dois blends prensados de 90g, queijo prato duplo derretido, cebola chapeada e maionese artesanal.',
              price_cents: 2490,
              is_available: true,
              image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'c0000000-0000-0000-0000-000000000003',
              category_id: 'b0000000-0000-0000-0000-000000000002',
              name: 'Batata Rústica com Cheddar e Bacon (400g)',
              description: 'Batata crocante temperada com páprica, coberta com cheddar derretido e cubos de bacon.',
              price_cents: 2600,
              is_available: true,
              image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'c0000000-0000-0000-0000-000000000004',
              category_id: 'b0000000-0000-0000-0000-000000000003',
              name: 'Coca-Cola Original 350ml Lata',
              description: 'Refrigerante bem gelado para acompanhar o lanche.',
              price_cents: 600,
              is_available: true,
              image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
            },
          ]);
          setLoading(false);
          return;
        }

        if (slug === 'pizzaria-bella-fornada') {
          setRestaurant({
            id: 'a0000000-0000-0000-0000-000000000002',
            name: 'Pizzaria Bella Fornada',
            slug: 'pizzaria-bella-fornada',
            description: 'Pizzas artesanais assadas no forno a lenha, massa fininha e borda recheada.',
            delivery_fee_cents: 500,
            delivery_time_min: 35,
            delivery_time_max: 55,
            min_order_cents: 3500,
            is_open: true,
            phone: '35988887777',
            image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
          });
          setCategories([
            { id: 'b0000000-0000-0000-0000-000000000010', name: 'Pizzas Grandes (8 Fatias)' },
            { id: 'b0000000-0000-0000-0000-000000000011', name: 'Bebidas' },
          ]);
          setProducts([
            {
              id: 'c0000000-0000-0000-0000-000000000010',
              category_id: 'b0000000-0000-0000-0000-000000000010',
              name: 'Pizza Calabresa Especial com Catupiry',
              description: 'Molho artesanal de tomate pelado, mussarela premium, calabresa fatiada, cebola roxa e borda de Catupiry original.',
              price_cents: 5290,
              is_available: true,
              image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'c0000000-0000-0000-0000-000000000011',
              category_id: 'b0000000-0000-0000-0000-000000000010',
              name: 'Pizza Frango com Catupiry',
              description: 'Peito de frango desfiado temperado com ervas finas, mussarela gratinada e Catupiry.',
              price_cents: 5490,
              is_available: true,
              image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'c0000000-0000-0000-0000-000000000012',
              category_id: 'b0000000-0000-0000-0000-000000000011',
              name: 'Guaraná Antarctica 2 Litros',
              description: 'Garrafa família bem gelada.',
              price_cents: 1200,
              is_available: true,
              image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
            },
          ]);
          setLoading(false);
          return;
        }

        if (slug === 'acai-delicias-do-vale') {
          setRestaurant({
            id: 'a0000000-0000-0000-0000-000000000003',
            name: 'Açaí & Delícias do Vale',
            slug: 'acai-delicias-do-vale',
            description: 'Açaí cremoso batido na hora com mais de 25 adicionais e frutas frescas.',
            delivery_fee_cents: 0,
            delivery_time_min: 20,
            delivery_time_max: 35,
            min_order_cents: 1500,
            is_open: true,
            phone: '35977776666',
            image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=1200&q=80',
          });
          setCategories([
            { id: 'b0000000-0000-0000-0000-000000000020', name: 'Copos & Tigelas' },
          ]);
          setProducts([
            {
              id: 'c0000000-0000-0000-0000-000000000020',
              category_id: 'b0000000-0000-0000-0000-000000000020',
              name: 'Copo Supremo 500ml',
              description: 'Açaí puro batido com banana, camadas de leite condensado, leite Ninho, morangos frescos e Nutella.',
              price_cents: 2200,
              is_available: true,
              image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80',
            },
          ]);
          setLoading(false);
          return;
        }
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
    <div className="min-h-screen bg-gray-50 flex flex-col pb-28">
      <Navbar />

      {/* Header do Restaurante */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos restaurantes</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {restaurant.image_url ? (
                <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-md border-2 border-white shrink-0">
                  <img
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-[#FFF0EB] text-[#FF3B00] flex items-center justify-center font-black text-3xl shadow-xs shrink-0">
                  <Store className="w-10 h-10" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{restaurant.name}</h1>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    restaurant.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {restaurant.is_open ? 'Aberto' : 'Fechado'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-lg">{restaurant.description}</p>
              </div>
            </div>

            {/* Badges de tempo e taxa */}
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-3.5 rounded-2xl">
              <div className="flex flex-col text-center px-3 border-r border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Tempo</span>
                <span className="text-xs font-black text-gray-800">{restaurant.delivery_time_min}-{restaurant.delivery_time_max} min</span>
              </div>
              <div className="flex flex-col text-center px-3 border-r border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Entrega</span>
                <span className="text-xs font-black text-[#FF3B00]">
                  R$ {(restaurant.delivery_fee_cents / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex flex-col text-center px-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Pedido Mínimo</span>
                <span className="text-xs font-black text-gray-800">
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
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
            <p className="text-sm text-gray-500">Este restaurante ainda não adicionou pratos no cardápio.</p>
          </div>
        ) : (
          categories.map((cat) => {
            const catProducts = products.filter(p => p.category_id === cat.id);
            if (catProducts.length === 0) return null;

            return (
              <section key={cat.id} className="space-y-4">
                <h2 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-2 flex items-center justify-between">
                  <span>{cat.name}</span>
                  <span className="text-xs font-semibold text-gray-400">{catProducts.length} itens</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catProducts.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setQuantity(1);
                        setItemNotes('');
                      }}
                      className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs hover:border-[#FF3B00]/40 hover:shadow-md transition-all cursor-pointer flex justify-between gap-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-gray-900 group-hover:text-[#FF3B00] transition-colors">{prod.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{prod.description}</p>
                        <span className="inline-block mt-3 font-black text-base text-[#FF3B00]">
                          R$ {(prod.price_cents / 100).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      {prod.image_url ? (
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-xs relative">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#FF3B00] shadow-xs">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#FF3B00] hover:bg-[#FFF0EB] transition-colors shrink-0">
                          <Plus className="w-5 h-5" />
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
        <div className="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-40">
          <div className="bg-[#FF3B00] text-white p-4 rounded-3xl shadow-xl shadow-[#FF3B00]/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-sm">
                {cartCount}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white/80">Total com entrega</span>
                <span className="font-black text-lg">
                  R$ {(totalCents / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/carrinho')}
              className="px-6 py-2.5 bg-white text-[#FF3B00] font-black text-xs rounded-2xl shadow-sm hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Ver Carrinho & Pedir
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal Adicionar ao Carrinho */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-1">{selectedProduct.name}</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedProduct.description}</p>
            <div className="text-lg font-black text-[#FF3B00] mb-6">
              R$ {(selectedProduct.price_cents / 100).toFixed(2).replace('.', ',')}
            </div>

            <div className="space-y-2 mb-6">
              <label className="block text-xs font-bold text-gray-700">Observações sobre o pedido</label>
              <textarea
                rows={2}
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Ex: sem cebola, maionese à parte, ponto bem passado..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-xs"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-2xl p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:bg-white cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:bg-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3.5 bg-[#FF3B00] hover:bg-[#E03400] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF3B00]/25 cursor-pointer"
              >
                <span>Adicionar</span>
                <span>•</span>
                <span>R$ {((selectedProduct.price_cents * quantity) / 100).toFixed(2).replace('.', ',')}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="w-full mt-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer text-center"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
