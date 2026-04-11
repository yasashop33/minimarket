import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { apiGet, apiPost, Product, Member, CartItem } from '@/lib/api';

interface StoreContextType {
  products: Product[];
  members: Member[];
  cart: CartItem[];
  loading: boolean;
  loadingText: string;
  loadProducts: () => Promise<void>;
  loadMembers: () => Promise<void>;
  addToCart: (id: number) => void;
  changeQty: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      const data = await apiGet<Product[]>('getProduk');
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([
        { id: 1, nama: 'Cimory Chocomalt', barcode: '8995517001019', kategori: 'Minuman', hargaBeli: 5500, hargaJual: 7000, stok: 9 },
        { id: 2, nama: 'KOPI ABC', barcode: '8999999001001', kategori: 'Minuman', hargaBeli: 5000, hargaJual: 7000, stok: 27 },
      ]);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const data = await apiGet<Member[]>('getAnggota');
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([{ id: 1, nama: 'Ari', hp: '082121', alamat: 'Jl. Pahlawan' }]);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadProducts(), loadMembers()]);
  }, [loadProducts, loadMembers]);

  const addToCart = useCallback((id: number) => {
    const p = products.find(x => x.id === id);
    if (!p || p.stok <= 0) return;
    setCart(prev => {
      const existing = prev.find(c => c.id === id);
      if (existing) {
        if (existing.qty >= p.stok) return prev;
        return prev.map(c => c.id === id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...p, qty: 1 }];
    });
  }, [products]);

  const changeQty = useCallback((id: number, delta: number) => {
    setCart(prev => {
      const item = prev.find(c => c.id === id);
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) return prev.filter(c => c.id !== id);
      return prev.map(c => c.id === id ? { ...c, qty: newQty } : c);
    });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart(prev => prev.filter(c => c.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  return (
    <StoreContext.Provider value={{
      products, members, cart, loading, loadingText,
      loadProducts, loadMembers, addToCart, changeQty, removeFromCart, clearCart, setProducts,
    }}>
      {children}
    </StoreContext.Provider>
  );
}
