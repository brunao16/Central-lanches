'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Store, MapPin, Search, Bike } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface NavbarProps {
  currentCity?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentCity = 'Passos - MG' }) => {
  const { cartCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & City */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF3B00] to-[#FF6B3D] flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              U
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg leading-tight tracking-tight text-gray-900">
                Uai<span className="text-[#FF3B00]">Food</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Delivery Regional</span>
            </div>
          </Link>

          <button className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-[#FF3B00]" />
            <span>{currentCity}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/entregador"
            className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 px-3.5 py-2 rounded-xl transition-all border border-gray-200"
          >
            <Bike className="w-4 h-4 text-purple-600" />
            <span>Área do Entregador</span>
          </Link>

          <Link
            href="/painel/restaurante"
            className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-[#FF3B00] bg-gray-50 hover:bg-[#FFF0EB] px-3.5 py-2 rounded-xl transition-all border border-gray-200 hover:border-[#FF3B00]/30"
          >
            <Store className="w-4 h-4 text-[#FF3B00]" />
            <span className="hidden md:inline">Área do Restaurante</span>
          </Link>

          <Link
            href="/carrinho"
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-[#FFF0EB] border border-gray-200 text-gray-700 hover:text-[#FF3B00] transition-all"
            aria-label="Carrinho de Compras"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF3B00] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs animate-scale-in">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
