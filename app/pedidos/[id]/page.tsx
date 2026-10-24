'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { 
  CheckCircle2, 
  Clock, 
  Store, 
  MapPin, 
  Banknote, 
  QrCode,
  Copy,
  Check,
  CreditCard,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Star
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const handleCancelOrder = async () => {
    const reason = window.prompt('Por qual motivo você deseja cancelar o pedido?');
    if (!reason || !reason.trim()) return;

    try {
      setCanceling(true);
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Não foi possível cancelar o pedido.');
        return;
      }
      setOrder((prev: any) => ({ ...prev, status: 'canceled', cancellation_reason: `Cancelado pelo cliente: ${reason.trim()}` }));
      alert('Pedido cancelado com sucesso.');
    } catch {
      alert('Erro de conexão ao cancelar o pedido.');
    } finally {
      setCanceling(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();

      // Realtime listener para atualização de status e pagamento
      const channel = supabase
        .channel(`order-track-${orderId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          (payload) => {
            setOrder((prev: any) => ({ ...prev, ...payload.new }));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);

      const { data: oData, error: oErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (oErr || !oData) {
        setOrder(null);
        setLoading(false);
        return;
      }

      setOrder(oData);

      // Se for pagamento Pix e ainda não estiver pago, carregar o Pix do Asaas
      if (oData.payment_method === 'pix' && oData.payment_status !== 'paid') {
        try {
          const res = await fetch('/api/asaas/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: oData.id }),
          });
          const payRes = await res.json();
          if (payRes.pix) {
            setPixData(payRes.pix);
          }
        } catch (e) {
          console.error('Erro ao buscar dados do Pix:', e);
        }
      }

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      setOrderItems(itemsData || []);

      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', oData.restaurant_id)
        .single();

      setRestaurant(restData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyPixPayload = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'confirmed': return 2;
      case 'preparing': return 3;
      case 'out_for_delivery': return 4;
      case 'delivered': return 5;
      default: return 1;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Aguardando confirmação do restaurante';
      case 'confirmed': return 'Pedido aceito pelo restaurante';
      case 'preparing': return 'Na cozinha sendo preparado';
      case 'out_for_delivery': return 'Saiu para entrega';
      case 'delivered': return 'Entregue com sucesso';
      case 'canceled': return 'Pedido cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF3B00] animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
          <h2 className="text-lg font-bold text-gray-900">Pedido não encontrado</h2>
          <Link
            href="/"
            className="mt-4 inline-block px-5 py-2.5 bg-[#FF3B00] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Voltar para a Vitrine
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);
  const isPixPending = order.payment_method === 'pix' && order.payment_status !== 'paid';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        {/* Banner Pix Pendente (com QR Code e Copia-e-Cola) */}
        {isPixPending && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FF3B00] shadow-lg text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>Aguardando Pagamento Pix</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Pague via Pix para liberar a preparação do seu pedido
            </h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Assim que você pagar no aplicativo do seu banco, o pedido será confirmado automaticamente na tela.
            </p>

            {/* QR Code */}
            {pixData?.encodedImage && (
              <div className="flex justify-center my-4">
                <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
                  <img
                    src={`data:image/png;base64,${pixData.encodedImage}`}
                    alt="QR Code Pix"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Copia e Cola */}
            {pixData?.payload && (
              <div className="max-w-md mx-auto">
                <button
                  onClick={copyPixPayload}
                  className="w-full py-3.5 px-4 bg-[#FF3B00] hover:bg-[#E03400] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-[#FF3B00]/25 transition-all cursor-pointer"
                >
                  {copiedPix ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPix ? 'Código Pix Copiado!' : 'Copiar Chave Copia e Cola do Pix'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Linha do Tempo do Pedido */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            Pedido Realizado com Sucesso!
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Pedido #{order.order_number || order.id.slice(0, 8)} • {restaurant?.name}
          </p>

          <div className="mt-8 pt-6 border-t border-gray-100 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-gray-900 uppercase tracking-wide">
                Status Atual:
              </span>
              <span className="text-xs font-bold text-[#FF3B00]">
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className={`h-2 rounded-full ${currentStep >= 1 ? 'bg-[#FF3B00]' : 'bg-gray-200'}`} />
              <div className={`h-2 rounded-full ${currentStep >= 3 ? 'bg-[#FF3B00]' : 'bg-gray-200'}`} />
              <div className={`h-2 rounded-full ${currentStep >= 4 ? 'bg-[#FF3B00]' : 'bg-gray-200'}`} />
              <div className={`h-2 rounded-full ${currentStep >= 5 ? 'bg-green-600' : 'bg-gray-200'}`} />
            </div>

            <div className="flex justify-between text-[11px] text-gray-500 font-bold mt-2">
              <span>Recebido</span>
              <span>Preparando</span>
              <span>A caminho</span>
              <span>Entregue</span>
            </div>

            {/* Cancelamento pelo Cliente quando Pendente */}
            {order.status === 'pending' && (
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-gray-500">Errou algo ou desistiu do pedido?</span>
                <button
                  onClick={handleCancelOrder}
                  disabled={canceling}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-rose-200 disabled:opacity-50"
                >
                  {canceling ? 'Cancelando...' : 'Cancelar Pedido'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Avaliação do Restaurante (Quando Entregue) */}
        {order.status === 'delivered' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 bg-amber-50/20 shadow-xs text-center space-y-4">
            <h3 className="font-black text-base text-gray-900">Como foi a sua experiência?</h3>
            <p className="text-xs text-gray-500">Avalie o lanche e a agilidade da entrega do {restaurant?.name}.</p>

            {ratingSubmitted ? (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Obrigado pela sua avaliação! Sua nota ajuda outros clientes.</span>
              </div>
            ) : (
              <div className="space-y-4 max-w-sm mx-auto">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= ratingStars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Deixe um elogio ou observação sobre o pedido..."
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#FF3B00]"
                />

                <button
                  type="button"
                  onClick={() => setRatingSubmitted(true)}
                  className="w-full py-2.5 bg-[#FF3B00] hover:bg-[#E03400] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Enviar Avaliação
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resumo do Pedido */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
            Resumo do Pedido
          </h2>

          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div>
                  <span className="font-bold text-gray-900">{item.quantity}x {item.product_name}</span>
                  {item.notes && <p className="text-xs text-gray-400 italic">Obs: {item.notes}</p>}
                </div>
                <span className="font-bold text-gray-800">
                  R$ {(item.total_price_cents / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>R$ {(order.subtotal_cents / 100).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Taxa de Entrega</span>
              <span>R$ {(order.delivery_fee_cents / 100).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-[#FF3B00]">
                R$ {(order.total_cents / 100).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Endereço */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF3B00]" />
              <span>Endereço de Entrega</span>
            </h3>
            <p className="text-xs text-gray-600">
              {order.delivery_address?.street}, {order.delivery_address?.number} - {order.delivery_address?.neighborhood}
            </p>
          </div>

          {/* Pagamento */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {order.payment_method === 'pix' ? (
                <QrCode className="w-5 h-5 text-[#FF3B00]" />
              ) : order.payment_method === 'credit_card' ? (
                <CreditCard className="w-5 h-5 text-gray-500" />
              ) : (
                <Banknote className="w-5 h-5 text-gray-500" />
              )}
              <span className="text-xs font-bold text-gray-800">
                {order.payment_method === 'pix'
                  ? 'Pix Instantâneo'
                  : order.payment_method === 'credit_card'
                  ? 'Cartão na Entrega'
                  : 'Dinheiro na Entrega'}
              </span>
            </div>

            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              order.payment_status === 'paid'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
            </span>
          </div>
        </div>

        {/* Ações: WhatsApp do Restaurante */}
        {restaurant?.phone && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Precisa falar com o restaurante?</h3>
              <p className="text-xs text-gray-500">Envie uma mensagem com o resumo do seu pedido no WhatsApp.</p>
            </div>
            <a
              href={`https://wa.me/55${restaurant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Olá, ${restaurant.name}! Gostaria de informações sobre o meu Pedido #${order.order_number || order.id.slice(0, 6)} no valor de R$ ${(order.total_cents / 100).toFixed(2).replace('.', ',')}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-[#25D366]/20 transition-all shrink-0 cursor-pointer"
            >
              <span>Enviar Pedido no WhatsApp</span>
            </a>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a página inicial</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
