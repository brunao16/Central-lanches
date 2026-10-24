'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Store, MapPin, DollarSign, Clock, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function RegisterRestaurantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [cityId, setCityId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [deliveryFeeReais, setDeliveryFeeReais] = useState('5,00');
  const [deliveryTimeMin, setDeliveryTimeMin] = useState(30);
  const [deliveryTimeMax, setDeliveryTimeMax] = useState(50);
  const [minOrderReais, setMinOrderReais] = useState('20,00');

  useEffect(() => {
    // Carregar cidades e categorias
    const loadInitialData = async () => {
      const { data: cData } = await supabase.from('cities').select('*');
      if (cData && cData.length > 0) {
        setCities(cData);
        setCityId(cData[0].id);
      }

      const { data: catData } = await supabase.from('restaurant_categories').select('*');
      if (catData && catData.length > 0) {
        setCategories(catData);
        setCategoryId(catData[0].id);
      }
    };

    loadInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirecionar para login caso não autenticado
        router.push('/login');
        return;
      }

      // 2. Formatar valores em centavos
      const feeCents = Math.round(parseFloat(deliveryFeeReais.replace(',', '.')) * 100) || 500;
      const minCents = Math.round(parseFloat(minOrderReais.replace(',', '.')) * 100) || 2000;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

      // 3. Cadastrar restaurante via endpoint seguro do servidor
      const selectedCityObj = cities.find(c => c.id === cityId);
      const chosenCityName = selectedCityObj?.name || 'Minas Gerais';

      const res = await fetch('/api/restaurant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          cnpj,
          phone,
          description,
          street,
          number,
          neighborhood,
          city: chosenCityName,
          state: 'MG',
          deliveryFeeCents: feeCents,
          deliveryTimeMin: Number(deliveryTimeMin),
          deliveryTimeMax: Number(deliveryTimeMax),
          minOrderCents: minCents,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao cadastrar o restaurante.');
      }

      setSuccessMsg('Restaurante cadastrado com sucesso! Abrindo o painel...');
      setTimeout(() => {
        router.push('/painel/restaurante');
      }, 1500);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar o restaurante. Verifique os dados.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10 w-full">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF0EB] text-[#FF3B00] flex items-center justify-center">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Cadastrar Novo Restaurante
              </h1>
              <p className="text-sm text-gray-500">
                Preencha os dados básicos do seu estabelecimento para começar a receber pedidos.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Principais */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <span>1. Dados do Estabelecimento</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Restaurante / Lanchonete</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Central Burguer"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(35) 99999-9999"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Categoria Principal</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm bg-white"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Descrição Curta</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Os melhores smash burgers e porções artesanais da cidade!"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <span>2. Localização</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rua / Avenida</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Rua das Palmeiras"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Número</label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Centro"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cidade de Atuação</label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm bg-white"
                  >
                    <option value="">Selecione a cidade</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name} - {city.state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Configurações de Entrega */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <span>3. Taxa e Tempo de Entrega</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Taxa Padrão (R$)</label>
                  <input
                    type="text"
                    required
                    value={deliveryFeeReais}
                    onChange={(e) => setDeliveryFeeReais(e.target.value)}
                    placeholder="5,00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tempo Mínimo (min)</label>
                  <input
                    type="number"
                    required
                    value={deliveryTimeMin}
                    onChange={(e) => setDeliveryTimeMin(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tempo Máximo (min)</label>
                  <input
                    type="number"
                    required
                    value={deliveryTimeMax}
                    onChange={(e) => setDeliveryTimeMax(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#FF3B00] hover:bg-[#E03400] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF3B00]/25 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Concluir Cadastro e Ir para o Painel</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
