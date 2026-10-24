'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // Porcentagem (ex: 10 para 10%) ou centavos (ex: 500 para R$ 5,00)
  minOrderCents: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  notes?: string;
  restaurantId: string;
  restaurantName: string;
  deliveryFeeCents: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  restaurantId: string | null;
  restaurantName: string | null;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Cupons padrão da plataforma
const AVAILABLE_COUPONS: Coupon[] = [
  { code: 'BEMVINDO10', discountType: 'percentage', discountValue: 10, minOrderCents: 2000 },
  { code: 'UAI5', discountType: 'fixed', discountValue: 500, minOrderCents: 2500 },
  { code: 'CENTRAL5', discountType: 'fixed', discountValue: 500, minOrderCents: 2500 }, // compatibilidade
  { code: 'PRIMEIRACOMPRA', discountType: 'percentage', discountValue: 15, minOrderCents: 3000 },
];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('@uaifood_cart') || localStorage.getItem('@central_lanches_cart');
      if (saved) setItems(JSON.parse(saved));
      const savedCoupon = localStorage.getItem('@uaifood_coupon') || localStorage.getItem('@central_lanches_coupon');
      if (savedCoupon) setAppliedCoupon(JSON.parse(savedCoupon));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('@uaifood_cart', JSON.stringify(items));
      if (appliedCoupon) {
        localStorage.setItem('@uaifood_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('@uaifood_coupon');
      }
    } catch (e) {
      console.error(e);
    }
  }, [items, appliedCoupon]);

  const addItem = (item: Omit<CartItem, 'id'>) => {
    if (items.length > 0 && items[0].restaurantId !== item.restaurantId) {
      const confirmClear = window.confirm(
        'Você já tem itens de outro restaurante no carrinho. Deseja limpar para pedir deste estabelecimento?'
      );
      if (!confirmClear) return;
      setItems([{ ...item, id: `${item.productId}-${Date.now()}` }]);
      return;
    }

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === item.productId && (i.notes || '') === (item.notes || '')
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += item.quantity;
        return next;
      }

      return [...prev, { ...item, id: `${item.productId}-${Date.now()}` }];
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const subtotalCents = items.reduce((acc, i) => acc + i.priceCents * i.quantity, 0);

  const applyCoupon = (code: string) => {
    const found = AVAILABLE_COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!found) {
      return { success: false, message: 'Cupom inválido ou expirado.' };
    }
    if (subtotalCents < found.minOrderCents) {
      const minReais = (found.minOrderCents / 100).toFixed(2).replace('.', ',');
      return { success: false, message: `Válido apenas para pedidos acima de R$ ${minReais}.` };
    }
    setAppliedCoupon(found);
    return { success: true, message: `Cupom ${found.code} aplicado com sucesso!` };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  // Cálculo do desconto
  let discountCents = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountCents = Math.round((subtotalCents * appliedCoupon.discountValue) / 100);
    } else {
      discountCents = appliedCoupon.discountValue;
    }
  }

  const deliveryFeeCents = items.length > 0 ? items[0].deliveryFeeCents : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents + deliveryFeeCents);
  const restaurantId = items.length > 0 ? items[0].restaurantId : null;
  const restaurantName = items.length > 0 ? items[0].restaurantName : null;
  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
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
        restaurantName,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart deve ser usado dentro de um CartProvider');
  return context;
}
