'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { 
  Search, 
  MapPin, 
  Clock, 
  Bike, 
  Star, 
  Store, 
  UtensilsCrossed, 
  ChevronRight,
  Flame,
  Percent
} from 'lucide-react';

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // 1. Categorias com fallback demonstrativo
      const { data: catData } = await supabase.from('restaurant_categories').select('*');
      if (catData && catData.length > 0) {
        setCategories(catData);
      } else {
        setCategories([
          { id: 'cat-burguer', name: 'Hambúrguer' },
          { id: 'cat-pizza', name: 'Pizza' },
          { id: 'cat-marmita', name: 'Marmitex' },
          { id: 'cat-acai', name: 'Açaí' },
          { id: 'cat-bebidas', name: 'Bebidas' },
        ]);
      }

      // 2. Restaurantes com fallback de demonstração para apresentação comercial
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('status', 'approved');

      if (restData && restData.length > 0) {
        setRestaurants(restData);
      } else {
        setRestaurants([
          {
            id: 'rest-demo-1',
            name: 'Uai Burguer & Cia',
            slug: 'uai-burguer-cia',
            description: 'Os melhores smash burgers artesanais com muito cheddar cremoso e bacon crocante.',
            delivery_fee_cents: 400,
            delivery_time_min: 25,
            delivery_time_max: 45,
            is_open: true,
            status: 'approved',
            category_id: 'cat-burguer',
          },
          {
            id: 'rest-demo-2',
            name: 'Pizzaria Bella Fornada',
            slug: 'pizzaria-bella-fornada',
            description: 'Pizzas artesanais assadas no forno a lenha, massa fininha e borda recheada.',
            delivery_fee_cents: 500,
            delivery_time_min: 35,
            delivery_time_max: 55,
            is_open: true,
            status: 'approved',
            category_id: 'cat-pizza',
          },
          {
            id: 'rest-demo-3',
            name: 'Açaí & Delícias do Vale',
            slug: 'acai-delicias-do-vale',
            description: 'Açaí cremoso batido na hora com mais de 25 adicionais e frutas frescas.',
            delivery_fee_cents: 0, // Entrega grátis
            delivery_time_min: 20,
            delivery_time_max: 35,
            is_open: true,
            status: 'approved',
            category_id: 'cat-acai',
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || r.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50/50 border-b border-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF0EB] text-[#FF3B00] text-xs font-bold tracking-wide">
            <Flame className="w-4 h-4" />
            <span>O MELHOR DELIVERY DA SUA CIDADE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Seus pratos e lanches favoritos, <span className="text-[#FF3B00]">rápidos na sua porta.</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            Peça dos melhores restaurantes, hamburguerias e pizzarias com entrega ágil e sem complicação.
          </p>

          {/* Barra de Busca */}
          <div className="pt-2 max-w-xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-200 p-1.5 focus-within:border-[#FF3B00] transition-all">
              <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busque por restaurante ou comida..."
                className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-hidden text-gray-800 placeholder-gray-400 font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 font-bold cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === null
                  ? 'bg-[#FF3B00] text-white shadow-md shadow-[#FF3B00]/25'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#FF3B00] text-white shadow-md shadow-[#FF3B00]/25'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Lista de Restaurantes */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Restaurantes Disponíveis</span>
            <span className="text-xs font-semibold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
              {filteredRestaurants.length}
            </span>
          </h2>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">Nenhum restaurante encontrado</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
              Que tal cadastrar o primeiro restaurante da sua cidade agora mesmo?
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF3B00] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-[#E03400] transition-colors"
            >
              <Store className="w-4 h-4" />
              <span>Cadastrar meu Restaurante</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((rest) => (
              <div
                key={rest.id}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-xl hover:border-gray-200 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Banner / Cover */}
                  <div className="h-36 bg-gradient-to-r from-orange-100 to-amber-100 relative p-4 flex items-start justify-between">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs ${
                      rest.is_open ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'
                    }`}>
                      {rest.is_open ? 'ABERTO' : 'FECHADO'}
                    </span>

                    <span className="flex items-center gap-1 text-[11px] font-bold bg-white/90 backdrop-blur-xs px-2 py-1 rounded-full text-gray-800 shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      4.9
                    </span>
                  </div>

                  {/* Detalhes */}
                  <div className="p-5">
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-[#FF3B00] transition-colors">
                      {rest.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {rest.description || 'Lanches, porções e bebidas especiais.'}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{rest.delivery_time_min}-{rest.delivery_time_max} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-[#FF3B00]" />
                        <span>
                          {rest.delivery_fee_cents === 0
                            ? 'Entrega Grátis'
                            : `R$ ${(rest.delivery_fee_cents / 100).toFixed(2).replace('.', ',')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/restaurante/${rest.slug}`}
                    className="w-full py-2.5 bg-gray-50 group-hover:bg-[#FFF0EB] group-hover:text-[#FF3B00] text-gray-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Ver Cardápio & Pedir</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
