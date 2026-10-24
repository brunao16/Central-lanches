'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, MapPin } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface NavbarProps {
  currentCity?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentCity = 'Minas Gerais, MG' }) => {
  const { cartCount, subtotalCents } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-xs border-b border-[#E7E2DA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Identidade / Marca Autoral */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group" aria-label="UaiFood Página Inicial">
            <span className="w-8 h-8 rounded-lg bg-[#C84B31] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:bg-[#A83C25] transition-colors">
              U
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#1C1917] font-[family-name:var(--font-heading)]">
                Uai<span className="text-[#C84B31]">Food</span>
              </span>
            </div>
          </Link>

          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#57534E] bg-[#F3EFEA] border border-[#E7E2DA] px-2.5 py-1 rounded-md font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#C84B31] shrink-0" aria-hidden="true" />
            <span>{currentCity}</span>
          </div>
        </div>

        {/* Acesso ao Carrinho */}
        <div className="flex items-center gap-3">
          <Link
            href="/carrinho"
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#E7E2DA] bg-white text-[#1C1917] hover:border-[#C84B31] hover:text-[#C84B31] transition-all text-xs font-semibold focus-visible:outline-2 focus-visible:outline-[#C84B31]"
            aria-label={`Carrinho de compras com ${cartCount} itens`}
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-[#C84B31]" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-[#C84B31] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span>
              {cartCount === 0 ? 'Sacola vazia' : `Sacola (${cartCount})`}
            </span>
            {subtotalCents > 0 && (
              <span className="hidden sm:inline text-[#57534E] font-medium border-l border-[#E7E2DA] pl-2">
                R$ {(subtotalCents / 100).toFixed(2).replace('.', ',')}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
