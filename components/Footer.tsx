'use client';

import React from 'react';
import Link from 'next/link';
import { Bike, Store, ShieldCheck, FileText, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#F3EFEA] border-t border-[#E7E2DA] text-[#57534E] text-xs mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Coluna 1: Sobre & Cidade */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#C84B31] text-white flex items-center justify-center font-bold text-xs">
                U
              </span>
              <span className="font-extrabold text-sm tracking-tight text-[#1C1917] font-[family-name:var(--font-heading)]">
                Uai<span className="text-[#C84B31]">Food</span>
              </span>
            </div>
            <p className="text-[13px] text-[#57534E] leading-relaxed">
              Plataforma de pedidos e entregas para restaurantes, pizzarias e lanchonetes de Passos e região.
            </p>
            <p className="text-[11px] text-[#78716C]">
              Passos, Minas Gerais — Atendimento local
            </p>
          </div>

          {/* Coluna 2: Para Parceiros & Entregadores */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#1C1917] text-xs uppercase tracking-wider font-[family-name:var(--font-heading)]">
              Parceiros
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/cadastro-restaurante"
                  className="hover:text-[#C84B31] transition-colors inline-flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Cadastrar meu restaurante</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/painel/restaurante"
                  className="hover:text-[#C84B31] transition-colors inline-flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Painel do estabelecimento</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/entregador"
                  className="hover:text-[#C84B31] transition-colors inline-flex items-center gap-1.5"
                >
                  <Bike className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Portal do entregador</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-[#C84B31] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Painel de repasses e taxas</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Ajuda e Institucional */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#1C1917] text-xs uppercase tracking-wider font-[family-name:var(--font-heading)]">
              Informações
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/termos"
                  className="hover:text-[#C84B31] transition-colors inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Termos e condições</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="hover:text-[#C84B31] transition-colors inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Privacidade e dados (LGPD)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Contato & Suporte */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#1C1917] text-xs uppercase tracking-wider font-[family-name:var(--font-heading)]">
              Contato
            </h4>
            <p className="text-[12px] text-[#57534E]">
              Dúvidas sobre pedidos ou suporte aos comércios:
            </p>
            <div className="pt-1 space-y-1">
              <a
                href="https://wa.me/5535999998888"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#C84B31] transition-colors inline-flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                <span>WhatsApp: (35) 99999-8888</span>
              </a>
              <div className="inline-flex items-center gap-1.5 text-[#78716C]">
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                <span>suporte@uaifood.com.br</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linha Inferior com CNPJ e Direitos */}
        <div className="pt-6 border-t border-[#E7E2DA] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#78716C]">
          <p>© {new Date().getFullYear()} UaiFood Tecnologia e Delivery Regional. Todos os direitos reservados.</p>
          <p>Operação local independente — CNPJ em conformidade fiscal.</p>
        </div>
      </div>
    </footer>
  );
};
