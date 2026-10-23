import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ArrowLeft, Shield } from 'lucide-react';

export default function TermsPage() {
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
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Termos de Uso</h1>
              <p className="text-xs text-gray-400">Última atualização: Outubro de 2026</p>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900">1. Objeto da Plataforma</h2>
            <p>
              O <strong>Central Lanches</strong> é uma plataforma tecnológica de intermediação que conecta consumidores a estabelecimentos gastronômicos locais (restaurantes, lanchonetes e pizzarias). A plataforma atua facilitando a exibição de cardápios, o recebimento de pedidos e a liquidação dos pagamentos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900">2. Responsabilidade sobre os Produtos e Entregas</h2>
            <p>
              A qualidade, preparo, acondicionamento, prazo de entrega e conformidade com as exigências da Vigilância Sanitária são de responsabilidade integral do restaurante parceiro cadastrado.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900">3. Pagamentos e Repasses</h2>
            <p>
              Os pagamentos efetuados eletronicamente (Pix ou Cartão) são processados de forma segura via intermediador bancário homologado (Asaas). A divisão de valores (split) e dedução da comissão da plataforma ocorrem de acordo com as taxas pré-acordadas no cadastro do restaurante.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900">4. Cancelamentos e Reembolsos</h2>
            <p>
              O cliente poderá solicitar o cancelamento antes do início do preparo do pedido pelo estabelecimento. Caso ocorra divergência relevante no pedido recebido, o consumidor poderá contatar o suporte ou o restaurante diretamente para solução amigável.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
