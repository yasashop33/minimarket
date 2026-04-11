const BASE_URL = 'https://script.google.com/macros/s/AKfycbwG70oOO9u9vRX4-vjMLQ69jUaudzMzvWMkAG5Jg0s53BTmoxaxR3Ee5DC7rkD2HXOL/exec';

export async function apiGet<T = any>(action: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(BASE_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json();
  if (json?.status === 'error') throw new Error(json.message || 'API error');
  if (json?.status === 'ok') return json.data;
  return json;
}

export async function apiPost<T = any>(action: string, body: Record<string, any> = {}): Promise<T> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json();
  if (data.status === 'error') throw new Error(data.message);
  return data.data;
}

export interface Product {
  id: number;
  nama: string;
  barcode?: string;
  kategori?: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
}

export interface Member {
  id: number;
  nama: string;
  hp?: string;
  alamat?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface TransactionItem {
  nama: string;
  qty: number;
  subtotal: number;
  modal?: number;
  hargaBeli?: number;
  id?: number;
  produkId?: number;
}

export interface Transaction {
  tanggal: string;
  total: number;
  modal: number;
  laba: number;
  items: TransactionItem[];
  anggotaId?: number;
  anggotaNama?: string;
}
