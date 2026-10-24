'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { 
  Search, 
  Clock, 
  Bike, 
  Star, 
  Store, 
  ChevronRight,
  SlidersHorizontal,
  X,
  Ticket
} from 'lucide-react';

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Filtros rápidos
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyFreeDelivery, setOnlyFreeDelivery] = useState(false);
  const [sortByFastest, setSortByFastest] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // Categorias
      const { data: catData } = await supabase.from('restaurant_categories').select('*');
      if (catData && catData.length > 0) {
        setCategories(catData);
      } else {
        setCategories([
          { id: 'cat-burguer', name: 'Lanches' },
          { id: 'cat-pizza', name: 'Pizzas' },
          { id: 'cat-porcoes', name: 'Porções' },
          { id: 'cat-marmita', name: 'Almoço & Marmitex' },
          { id: 'cat-acai', name: 'Açaí & Sobremesas' },
          { id: 'cat-bebidas', name: 'Bebidas' },
        ]);
      }

      // Restaurantes reais cadastrados e aprovados
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('status', 'approved');

      setRestaurants(restData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = r.name.toLowerCase().includes(term) || 
                          (r.description && r.description.toLowerCase().includes(term)) ||
                          (r.category_name && r.category_name.toLowerCase().includes(term));
    const matchesCategory = !selectedCategory || r.category_id === selectedCategory;
    const matchesOpen = !onlyOpen || r.is_open;
    const matchesFreeDelivery = !onlyFreeDelivery || r.delivery_fee_cents === 0;

    return matchesSearch && matchesCategory && matchesOpen && matchesFreeDelivery;
  }).sort((a, b) => {
    if (sortByFastest) {
      return a.delivery_time_min - b.delivery_time_min;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col font-sans">
      <Navbar />

      {/* Faixa Discreta e Específica de Cupom */}
      <aside aria-label="Aviso de promoção" className="bg-[#FBF0ED] border-b border-[#E8BFB6]/70 text-[#C84B31] py-2 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <p className="font-medium text-[12px]">
              Primeiro pedido? Use o cupom <span className="font-bold underline tracking-wide">BEMVINDO10</span> para 10% de desconto.
            </p>
          </div>
          <span className="hidden md:inline text-[11px] text-[#78716C]">
            Válido para pedidos acima de R$ 20,00
          </span>
        </div>
      </aside>

      {/* Primeira Dobra: Busca Direta e Categorias */}
      <section className="border-b border-[#E7E2DA] bg-white py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Campo de Busca Rápido */}
          <div className="max-w-2xl">
            <label htmlFor="search-input" className="sr-only">Buscar restaurante ou prato</label>
            <div className="relative flex items-center bg-[#FAF8F5] rounded-xl border border-[#E7E2DA] focus-within:border-[#C84B31] focus-within:ring-1 focus-within:ring-[#C84B31] transition-all">
              <Search className="w-4 h-4 text-[#78716C] ml-3.5 shrink-0" aria-hidden="true" />
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por lanchonete, restaurante, pizza ou sua cidade em MG..."
                className="w-full px-3 py-2.5 text-sm bg-transparent text-[#1C1917] placeholder-[#78716C] focus:outline-hidden"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpar busca"
                  className="mr-3 p-1 rounded-md text-[#78716C] hover:text-[#1C1917] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Categorias em Pílulas Sóbrias */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Categorias de comida">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === null
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-[#F3EFEA] text-[#57534E] hover:bg-[#E7E2DA]'
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#1C1917] text-white'
                      : 'bg-[#F3EFEA] text-[#57534E] hover:bg-[#E7E2DA]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Conteúdo Principal: Filtros Rápidos + Grid de Restaurantes */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        {/* Barra de Filtros Rápidos */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E7E2DA]">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1C1917] font-[family-name:var(--font-heading)]">
              Restaurantes em Passos
            </h1>
            <p className="text-xs text-[#57534E] mt-0.5">
              {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'estabelecimento disponível' : 'estabelecimentos disponíveis'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                onlyOpen
                  ? 'border-[#C84B31] bg-[#FBF0ED] text-[#C84B31]'
                  : 'border-[#E7E2DA] bg-white text-[#57534E] hover:border-[#D6CEC4]'
              }`}
            >
              Aberto agora
            </button>

            <button
              type="button"
              onClick={() => setOnlyFreeDelivery(!onlyFreeDelivery)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                onlyFreeDelivery
                  ? 'border-[#C84B31] bg-[#FBF0ED] text-[#C84B31]'
                  : 'border-[#E7E2DA] bg-white text-[#57534E] hover:border-[#D6CEC4]'
              }`}
            >
              Entrega grátis
            </button>

            <button
              type="button"
              onClick={() => setSortByFastest(!sortByFastest)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                sortByFastest
                  ? 'border-[#C84B31] bg-[#FBF0ED] text-[#C84B31]'
                  : 'border-[#E7E2DA] bg-white text-[#57534E] hover:border-[#D6CEC4]'
              }`}
            >
              Mais rápidos
            </button>
          </div>
        </div>

        {/* Estado de Carregamento com Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-[#E7E2DA] p-4 space-y-3 animate-pulse">
                <div className="w-full h-44 bg-[#F3EFEA] rounded-lg" />
                <div className="h-4 bg-[#F3EFEA] rounded-sm w-3/4" />
                <div className="h-3 bg-[#F3EFEA] rounded-sm w-1/2" />
                <div className="h-3 bg-[#F3EFEA] rounded-sm w-1/3 pt-2" />
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          /* Estado Vazio Construtivo e Útil */
          <div className="bg-white rounded-2xl border border-[#E7E2DA] p-10 text-center max-w-lg mx-auto my-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#F3EFEA] text-[#78716C] flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#1C1917] font-[family-name:var(--font-heading)]">
                Nenhum resultado para estes filtros
              </h2>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Estamos expandindo os estabelecimentos cadastrados em Passos. Quer indicar seu restaurante ou lanchonete favorita?
              </p>
            </div>
            <Link
              href="/cadastro-restaurante"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C1917] hover:bg-[#C84B31] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Store className="w-4 h-4" aria-hidden="true" />
              <span>Indicar ou cadastrar restaurante</span>
            </Link>
          </div>
        ) : (
          /* Grid de Restaurantes Editorial e Limpo */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((rest) => (
              <article
                key={rest.id}
                className="group bg-white rounded-xl border border-[#E7E2DA] hover:border-[#D6CEC4] transition-all flex flex-col justify-between overflow-hidden"
              >
                <Link
                  href={`/restaurante/${rest.slug}`}
                  className="flex-1 flex flex-col focus-visible:outline-2 focus-visible:outline-[#C84B31]"
                >
                  {/* Fotografia Gastronômica Real */}
                  <div className="h-44 relative bg-[#F3EFEA] overflow-hidden">
                    {rest.image_url ? (
                      <img
                        src={rest.image_url}
                        alt={`Fachada ou pratos de ${rest.name}`}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#78716C]">
                        <Store className="w-8 h-8" aria-hidden="true" />
                      </div>
                    )}

                    {/* Status Aberto/Fechado sutil */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs ${
                        rest.is_open 
                          ? 'bg-white/95 text-[#2A6A4E] border border-[#2A6A4E]/20' 
                          : 'bg-white/95 text-[#78716C] border border-[#E7E2DA]'
                      }`}>
                        {rest.is_open ? 'Aberto' : 'Fechado no momento'}
                      </span>
                    </div>

                    {/* Nota Real (exibe apenas se houver avaliação) */}
                    {rest.rating && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/95 text-[#1C1917] px-2 py-0.5 rounded-md shadow-xs border border-[#E7E2DA]">
                          <Star className="w-3 h-3 fill-[#C84B31] text-[#C84B31]" aria-hidden="true" />
                          <span>{rest.rating}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Informações Concretas e Locais */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-base font-bold text-[#1C1917] group-hover:text-[#C84B31] transition-colors font-[family-name:var(--font-heading)]">
                          {rest.name}
                        </h2>
                      </div>
                      <p className="text-xs text-[#57534E] line-clamp-2 mt-1 leading-relaxed">
                        {rest.description || 'Cardápio completo de pratos e lanches.'}
                      </p>
                    </div>

                    {/* Detalhes Concretos: Tempo, Frete e Bairro */}
                    <div className="pt-3 border-t border-[#E7E2DA] flex items-center justify-between text-xs text-[#57534E]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#78716C]" aria-hidden="true" />
                        <span>{rest.delivery_time_min}–{rest.delivery_time_max} min</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-medium">
                        <Bike className="w-3.5 h-3.5 text-[#C84B31]" aria-hidden="true" />
                        <span className={rest.delivery_fee_cents === 0 ? 'text-[#2A6A4E] font-semibold' : 'text-[#1C1917]'}>
                          {rest.delivery_fee_cents === 0
                            ? 'Entrega grátis'
                            : `R$ ${(rest.delivery_fee_cents / 100).toFixed(2).replace('.', ',')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="px-4 pb-4 pt-1">
                  <Link
                    href={`/restaurante/${rest.slug}`}
                    className="w-full py-2 bg-[#F3EFEA] hover:bg-[#E7E2DA] text-[#1C1917] font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#C84B31]"
                  >
                    <span>Ver cardápio</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#78716C]" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Rodapé Completo */}
      <Footer />
    </div>
  );
}
