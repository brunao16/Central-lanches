import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </Link>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-xs space-y-6 text-gray-700 leading-relaxed text-sm">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] text-[#FF3B00] flex items-center justify-center font-black">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Política de Privacidade</h1>
              <p className="text-xs text-gray-400">Em conformidade com a LGPD (Lei nº 13.709/2018)</p>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900">1. Coleta de Dados</h2>
            <p>
              Coletamos dados estritamente necessários para viabilizar a entrega e o pagamento dos seus pedidos: nome completo, telefone de contato WhatsApp, endereço de entrega e histórico de pedidos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900">2. Compartilhamento de Informações</h2>
            <p>
              Os dados de entrega (endereço, nome e telefone) são compartilhados única e exclusivamente com o restaurante responsável pelo preparo e entrega do seu pedido. Não comercializamos seus dados com terceiros.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900">3. Segurança e Armazenamento</h2>
            <p>
              Todas as informações são armazenadas em servidores seguros com criptografia e políticas estritas de segurança de linha (Row Level Security - RLS).
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
