'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  MapPin, 
  Banknote, 
  QrCode,
  CreditCard,
  Clock, 
  Store,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function CartAndCheckoutPage() {
  const router = useRouter();
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    subtotalCents, 
    discountCents,
    deliveryFeeCents, 
    totalCents,
    restaurantId,
    restaurantName 
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    if (res.success) {
      setCouponMessage({ type: 'success', text: res.message });
      setCouponInput('');
    } else {
      setCouponMessage({ type: 'error', text: res.message });
    }
  };

  // Dados do Cliente e Endereço
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');

  // Forma de Pagamento (Fase 3: Pix, Cartão ou Dinheiro)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'cash_on_delivery'>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeForReais, setChangeForReais] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !restaurantId) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      let changeForCents = null;
      if (paymentMethod === 'cash_on_delivery' && needsChange && changeForReais) {
        changeForCents = Math.round(parseFloat(changeForReais.replace(',', '.')) * 100);
      }

      const deliveryAddress = {
        name: customerName,
        phone: customerPhone,
        street,
        number,
        neighborhood,
        complement,
        reference,
      };

      // Cálculo de comissão (10% padrão da plataforma)
      const platformFeeCents = Math.round(subtotalCents * 0.10);
      const restaurantNetCents = subtotalCents - platformFeeCents;

      // 1. Criar pedido
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: user?.id || null,
            restaurant_id: restaurantId,
            delivery_address: deliveryAddress,
            subtotal_cents: subtotalCents,
            delivery_fee_cents: deliveryFeeCents,
            discount_cents: discountCents,
            total_cents: totalCents,
            platform_fee_cents: platformFeeCents,
            restaurant_net_cents: restaurantNetCents,
            status: 'pending',
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
            change_for_cents: changeForCents,
            customer_notes: orderNotes,
          },
        ])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Inserir itens
      const orderItems = items.map((i) => ({
        order_id: orderData.id,
        product_id: i.productId,
        product_name: i.name,
        unit_price_cents: i.priceCents,
        quantity: i.quantity,
        total_price_cents: i.priceCents * i.quantity,
        notes: i.notes || null,
      }));

      await supabase.from('order_items').insert(orderItems);

      // 3. Se for Pix, chamar API de integração Asaas
      if (paymentMethod === 'pix') {
        try {
          await fetch('/api/asaas/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderData.id }),
          });
        } catch (apiErr) {
          console.error('Asaas API call warning:', apiErr);
        }
      }

      clearCart();
      router.push(`/pedidos/${orderData.id}`);

    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o seu pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-10 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF0EB] text-[#FF3B00] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Seu carrinho está vazio</h2>
          <p className="text-xs text-gray-500 mt-2 mb-6">
            Adicione pratos de um restaurante para continuar com a compra.
          </p>
          <Link
            href="/"
            className="inline-flex px-6 py-3 bg-[#FF3B00] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-[#E03400] transition-colors"
          >
            Explorar Restaurantes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-6">
          Finalizar Pedido
        </h1>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Dados do Cliente e Endereço */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contato */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="w-6 h-6 rounded-lg bg-[#FFF0EB] text-[#FF3B00] flex items-center justify-center text-xs">1</span>
                <span>Seus Dados de Contato</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="João da Silva"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp para Contato</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(35) 99999-9999"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="w-6 h-6 rounded-lg bg-[#FFF0EB] text-[#FF3B00] flex items-center justify-center text-xs">2</span>
                <span>Endereço de Entrega</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Rua São Paulo"
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">Complemento (opcional)</label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto 102"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Pagamento (Fase 3: Pix, Cartão ou Dinheiro) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="w-6 h-6 rounded-lg bg-[#FFF0EB] text-[#FF3B00] flex items-center justify-center text-xs">3</span>
                <span>Escolha a Forma de Pagamento</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Opção PIX */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'pix'
                      ? 'border-[#FF3B00] bg-[#FFF0EB]/40 shadow-xs'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <QrCode className="w-5 h-5 text-[#FF3B00]" />
                    <span className="text-[10px] font-black uppercase text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      Mais Rápido
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-900">Pix</h4>
                    <p className="text-[11px] text-gray-500">QR Code na tela com confirmação automática</p>
                  </div>
                </button>

                {/* Opção Cartão */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'credit_card'
                      ? 'border-[#FF3B00] bg-[#FFF0EB]/40 shadow-xs'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-900">Cartão</h4>
                    <p className="text-[11px] text-gray-500">Crédito ou Débito na entrega (maquininha)</p>
                  </div>
                </button>

                {/* Opção Dinheiro */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash_on_delivery')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'border-[#FF3B00] bg-[#FFF0EB]/40 shadow-xs'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Banknote className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-900">Dinheiro</h4>
                    <p className="text-[11px] text-gray-500">Pague direto ao entregador na chegada</p>
                  </div>
                </button>
              </div>

              {/* Troco para dinheiro */}
              {paymentMethod === 'cash_on_delivery' && (
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needsChange}
                      onChange={(e) => setNeedsChange(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FF3B00] focus:ring-[#FF3B00]"
                    />
                    <span className="text-xs font-bold text-gray-700">Precisa de troco?</span>
                  </label>

                  {needsChange && (
                    <div className="mt-3 max-w-xs">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Troco para quanto?</label>
                      <input
                        type="text"
                        required={needsChange}
                        value={changeForReais}
                        onChange={(e) => setChangeForReais(e.target.value)}
                        placeholder="Ex: 50,00 ou 100,00"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observações gerais para o restaurante</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ex: Tocar o interfone..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs sticky top-24 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#FF3B00]" />
                <h3 className="font-black text-base text-gray-900">{restaurantName}</h3>
              </div>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
              >
                Limpar
              </button>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 pb-3 border-b border-gray-50">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900">{item.name}</h4>
                    {item.notes && <p className="text-[11px] text-gray-400 mt-0.5 italic">Obs: {item.notes}</p>}
                    <span className="text-xs font-black text-[#FF3B00] block mt-1">
                      R$ {((item.priceCents * item.quantity) / 100).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border border-gray-100 rounded-xl p-1 bg-gray-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white text-gray-600 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white text-gray-600 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-300 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Campo de Cupom de Desconto */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700 block mb-1.5">Cupom de Desconto</span>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl border border-green-200 text-xs">
                  <div className="flex items-center gap-2 text-green-700 font-bold">
                    <span>{appliedCoupon.code}</span>
                    <span className="text-[11px] font-medium text-green-600">
                      ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% OFF` : `R$ ${(appliedCoupon.discountValue/100).toFixed(2).replace('.', ',')} OFF`})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-red-500 hover:text-red-700 font-bold text-[11px] cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Ex: BEMVINDO10"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold uppercase focus:outline-hidden focus:border-[#FF3B00]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              )}
              {couponMessage && (
                <p className={`text-[11px] font-semibold mt-1.5 ${couponMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                  {couponMessage.text}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>R$ {(subtotalCents / 100).toFixed(2).replace('.', ',')}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Desconto Cupom</span>
                  <span>- R$ {(discountCents / 100).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Taxa de Entrega</span>
                <span>R$ {(deliveryFeeCents / 100).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-xl text-[#FF3B00]">
                  R$ {(totalCents / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#FF3B00] hover:bg-[#E03400] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF3B00]/25 transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>
                    {paymentMethod === 'pix' ? 'Gerar Pix e Fazer Pedido' : 'Confirmar e Fazer Pedido'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
