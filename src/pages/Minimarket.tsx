import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { formatRp } from '@/lib/wib';
import { apiPost } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ShoppingCart, Trash2, CreditCard, QrCode, Printer, ChevronsUpDown, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import qrisUser from '@/assets/qris-user.png';

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    prev = curr;
  }
  return prev[n];
}

function isSubsequence(query: string, text: string): boolean {
  let qi = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] === query[qi]) qi++;
  }
  return qi === query.length;
}

function searchScore(p: any, q: string): number {
  if (!q || !q.trim()) return 1;
  const name = String(p.nama || '').toLowerCase();
  const bc = String(p.barcode || '').toLowerCase();
  const kat = String(p.kategori || '').toLowerCase();
  const qlo = q.toLowerCase().trim();
  if (name === qlo || bc === qlo) return 100;
  if (name.startsWith(qlo) || bc.startsWith(qlo)) return 80;
  if (name.includes(qlo) || bc.includes(qlo)) return 60;
  const words = qlo.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every(w => name.includes(w))) return 55;
  if (words.some(w => name.includes(w))) return 40;
  const nameWords = name.split(/\s+/);
  if (nameWords.some((w: string) => w.startsWith(qlo))) return 45;
  if (words.some(qw => nameWords.some((nw: string) => nw.startsWith(qw)))) return 35;
  if (kat.includes(qlo)) return 30;
  if (qlo.length >= 3 && isSubsequence(qlo, name)) return 25;
  const maxDist = qlo.length <= 3 ? 1 : 2;
  for (const nw of nameWords) {
    if (levenshtein(qlo, nw.slice(0, qlo.length + 1)) <= maxDist) return 20;
  }
  if (qlo.length >= 4 && levenshtein(qlo, name.slice(0, qlo.length + 2)) <= maxDist) return 15;
  return 0;
}

function highlight(text: string, q: string): string {
  if (!q) return text;
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let result = text;
  for (const w of words) {
    const regex = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    result = result.replace(regex, '<mark class="bg-primary/20 text-primary rounded px-0.5">$1</mark>');
  }
  return result;
}

function printStruk(trx: { items: { nama: string; qty: number; subtotal: number }[]; total: number }) {
  const win = window.open('', '', 'width=350,height=600');
  if (!win) return;
  const itemsHtml = trx.items.map(i => `<tr><td>${i.nama}</td><td style="text-align:center;">${i.qty}</td><td style="text-align:right;">${formatRp(i.subtotal)}</td></tr>`).join('');
  win.document.write(`<html><head><title>Struk</title><style>body{font-family:monospace;padding:10px;width:280px}h2{text-align:center;margin-bottom:5px}.center{text-align:center;font-size:12px}table{width:100%;font-size:12px;margin-top:10px}td{padding:3px 0}.line{border-top:1px dashed #000;margin:6px 0}.total{font-weight:bold;font-size:14px}</style></head><body><h2>YASA SHOP</h2><div class="center">Minimarket Yasa Sejati</div><div class="line"></div><table>${itemsHtml}</table><div class="line"></div><table><tr><td>Total</td><td style="text-align:right" class="total">${formatRp(trx.total)}</td></tr></table><div class="line"></div><div class="center">Terima kasih 🙏</div><scr` + `ipt>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}</scr` + `ipt></body></html>`);
  win.document.close();
}

function MemberCombobox({ members, value, onChange }: { members: any[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase().trim();
    return members.filter((m: any) => {
      const nama = String(m.nama || '').toLowerCase();
      return nama.includes(q) || nama.split(/\s+/).some((w: string) => w.startsWith(q));
    });
  }, [members, search]);

  const selectedName = value && value !== 'none'
    ? members.find((m: any) => String(m.id) === value)?.nama || 'Tanpa anggota'
    : 'Tanpa anggota';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal text-[13px] h-10">
          <span className="truncate">{selectedName}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Ketik nama anggota..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Tidak ditemukan</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => { onChange('none'); setOpen(false); setSearch(''); }}>
                <Check className={cn("mr-2 h-4 w-4", (!value || value === 'none') ? "opacity-100" : "opacity-0")} />
                Tanpa anggota
              </CommandItem>
              {filtered.map((m: any) => (
                <CommandItem key={m.id} onSelect={() => { onChange(String(m.id)); setOpen(false); setSearch(''); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === String(m.id) ? "opacity-100" : "opacity-0")} />
                  {m.nama}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CartPanel({ cart, members, selectedMember, setSelectedMember, cartTotal, cartCount, changeQty, removeFromCart, handleCheckout }: any) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3.5 shrink-0">
        <div className="flex items-center gap-2 text-[17px] font-bold">
          <ShoppingCart className="h-[18px] w-[18px] text-primary" />
          Keranjang
        </div>
        <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">{cartCount} item</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 mb-3">
        {cart.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">Keranjang kosong</div>
        ) : (
          cart.map((c: any) => (
            <div key={c.id} className="flex items-center gap-2 py-2.5 border-b">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{c.nama}</div>
                <div className="text-xs text-muted-foreground">{formatRp(c.hargaJual)}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => changeQty(c.id, -1)} className="w-[26px] h-[26px] border rounded-md bg-background flex items-center justify-center text-sm font-bold hover:bg-primary/10 hover:border-primary transition-colors">−</button>
                <span className="text-[13px] font-semibold min-w-[20px] text-center">{c.qty}</span>
                <button onClick={() => changeQty(c.id, 1)} className="w-[26px] h-[26px] border rounded-md bg-background flex items-center justify-center text-sm font-bold hover:bg-primary/10 hover:border-primary transition-colors">+</button>
                <button onClick={() => removeFromCart(c.id)} className="w-[26px] h-[26px] flex items-center justify-center text-destructive rounded-md hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-[13px] font-bold min-w-[64px] text-right">{formatRp(c.hargaJual * c.qty)}</div>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0">
        <div className="mb-3">
          <label className="text-xs text-muted-foreground block mb-1">Anggota (opsional)</label>
          <MemberCombobox members={members} value={selectedMember} onChange={setSelectedMember} />
        </div>

        <div className="flex items-center justify-between text-base font-bold mb-3.5 pt-2.5 border-t-2">
          <span>Total</span>
          <span className="text-lg text-primary">{formatRp(cartTotal)}</span>
        </div>

        <Button onClick={handleCheckout} disabled={cart.length === 0} className="w-full h-14 text-[17px] font-bold gap-2.5 rounded-xl">
          <CreditCard className="h-5 w-5" />
          Checkout
        </Button>
      </div>
    </div>
  );
}

export default function Minimarket() {
  const { products, members, cart, addToCart, changeQty, removeFromCart, clearCart, loadProducts, setProducts } = useStore();
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [qrisOpen, setQrisOpen] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [filteredProducts, setFilteredProducts] = useState(products);
  const isMobile = useIsMobile();

  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);
  const bufferTimer = useRef<any>(null);

  useEffect(() => {
    const q = search;
    const filtered = products
      .map(p => ({ p, score: searchScore(p, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || a.p.nama.localeCompare(b.p.nama))
      .map(x => x.p);
    setFilteredProducts(filtered);
  }, [search, products]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isOtherInput = active && active !== searchRef.current && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
      if (isOtherInput) return;

      const now = Date.now();
      const gap = now - lastKeyTime.current;
      lastKeyTime.current = now;

      if (e.key === 'Enter' || e.key === 'Tab') {
        if (barcodeBuffer.current.length >= 3) {
          e.preventDefault();
          processBarcode(barcodeBuffer.current.trim());
        }
        barcodeBuffer.current = '';
        clearTimeout(bufferTimer.current);
        return;
      }

      if (e.key.length === 1) {
        if (gap > 80 && barcodeBuffer.current.length > 0) barcodeBuffer.current = '';
        barcodeBuffer.current += e.key;
        clearTimeout(bufferTimer.current);
        bufferTimer.current = setTimeout(() => {
          if (barcodeBuffer.current.length >= 8) {
            processBarcode(barcodeBuffer.current.trim());
            barcodeBuffer.current = '';
          } else {
            barcodeBuffer.current = '';
          }
        }, 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const processBarcode = useCallback((code: string) => {
    const prod = products.find(p => (p.barcode || '') === code);
    if (prod) {
      if (prod.stok <= 0) { toast.warning(`Stok ${prod.nama} habis!`); setSearch(''); return; }
      addToCart(prod.id);
      toast.success(`${prod.nama} ditambahkan ke keranjang`);
      setSearch('');
    } else {
      toast.error(`Barcode ${code} tidak ditemukan`);
      setSearch(code);
    }
  }, [products, addToCart]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !scanMode) {
      const matches = products.filter(p => searchScore(p, search) > 0);
      if (matches.length === 1 && matches[0].stok > 0) {
        addToCart(matches[0].id);
        setSearch('');
      }
    }
  };

  const cartTotal = cart.reduce((s, c) => s + c.hargaJual * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const handleCheckout = () => { setCartOpen(false); setQrisOpen(true); };

  const confirmQris = async () => {
    const items = cart.map(c => ({ id: c.id, qty: c.qty, hargaJual: c.hargaJual, hargaBeli: c.hargaBeli, nama: c.nama }));
    const cartSnapshot = [...cart];
    setQrisOpen(false);

    const kurangiStokLokal = () => {
      setProducts(prev => prev.map(p => {
        const cartItem = cartSnapshot.find(c => c.id === p.id);
        return cartItem ? { ...p, stok: Math.max(0, p.stok - cartItem.qty) } : p;
      }));
    };

    try {
      await apiPost('checkout', { items, anggotaId: selectedMember, total: cartTotal });
      toast.success('Pembayaran berhasil & transaksi disimpan');
      clearCart();
      kurangiStokLokal();
      await loadProducts();
    } catch (e: any) {
      kurangiStokLokal();
      clearCart();
      toast.warning('Transaksi disimpan lokal (API: ' + e.message + ')');
    }
  };

  const pendingStruk = {
    items: cart.map(c => ({ nama: c.nama, qty: c.qty, subtotal: c.hargaJual * c.qty })),
    total: cartTotal,
  };

  const cartPanelProps = { cart, members, selectedMember, setSelectedMember, cartTotal, cartCount, changeQty, removeFromCart, handleCheckout };

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 sm:pl-7 overflow-hidden">
        <h1 className="text-lg sm:text-xl font-bold mb-3">Minimarket</h1>
        <div className="flex gap-2 mb-3">
          <Input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={scanMode ? 'Menunggu scan barcode...' : 'Cari produk atau barcode...'}
            className="flex-1"
          />
          <Button
            variant={scanMode ? 'default' : 'outline'}
            onClick={() => { setScanMode(!scanMode); searchRef.current?.focus(); }}
            className="px-4 gap-2 h-10"
          >
            <QrCode className="h-4 w-4" />
            <span>{scanMode ? 'Scan Aktif' : 'Scan Barcode'}</span>
          </Button>
        </div>

        {scanMode && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-primary mb-2.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Mode Scan Aktif
            <button className="ml-auto text-base" onClick={() => setScanMode(false)}>✕</button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2 sm:gap-3 overflow-y-auto flex-1 pr-1 content-start pb-16 md:pb-0">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground text-sm py-8">
              {search ? <>Produk "<strong>{search}</strong>" tidak ditemukan</> : 'Belum ada produk tersedia'}
            </div>
          ) : (
            filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => p.stok > 0 && addToCart(p.id)}
                className={`bg-card border rounded-lg p-3 sm:p-3.5 text-center cursor-pointer transition-all hover:shadow-md hover:border-primary hover:-translate-y-0.5 select-none ${p.stok <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-[10px] flex items-center justify-center mx-auto mb-2 text-lg sm:text-xl">📦</div>
                <div
                  className="text-[12px] sm:text-[13px] font-semibold mb-1 line-clamp-2 min-h-[2.2em] leading-tight"
                  dangerouslySetInnerHTML={{ __html: highlight(p.nama, search) }}
                />
                <div className="text-[12px] sm:text-[13px] font-bold text-primary">{formatRp(p.hargaJual)}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Stok: {p.stok}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Desktop: Cart sidebar */}
      {!isMobile && (
      <div className="w-80 min-w-[280px] bg-card border-l flex flex-col p-5 h-full overflow-hidden">
          <CartPanel {...cartPanelProps} />
        </div>
      )}

      {/* Mobile: Floating cart button + Sheet */}
      {isMobile && (
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <button className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] flex flex-col p-4">
            <SheetHeader className="pb-0">
              <SheetTitle className="sr-only">Keranjang</SheetTitle>
            </SheetHeader>
            <CartPanel {...cartPanelProps} />
          </SheetContent>
        </Sheet>
      )}

      {/* QRIS Modal */}
      <Dialog open={qrisOpen} onOpenChange={setQrisOpen}>
        <DialogContent className="sm:max-w-md max-h-[95vh] flex flex-col p-4 sm:p-6 gap-2">
          <DialogHeader className="pb-0">
            <DialogTitle className="text-center text-base">Pembayaran QRIS</DialogTitle>
          </DialogHeader>
          <div className="text-center flex-1 min-h-0 overflow-y-auto">
            <div className="text-lg sm:text-xl font-bold text-primary mb-2">{formatRp(cartTotal)}</div>
            <div className="space-y-0.5 mb-2 max-h-[60px] overflow-y-auto">
              {cart.map(c => (
                <div key={c.id} className="flex justify-between text-xs border-b py-0.5">
                  <span>{c.nama} <span className="text-muted-foreground">×{c.qty}</span></span>
                  <span className="font-semibold">{formatRp(c.hargaJual * c.qty)}</span>
                </div>
              ))}
            </div>
            <img
              src={qrisUser}
              alt="QRIS Minimarket Yasa Sejati"
              className="max-h-[200px] sm:max-h-[280px] w-auto max-w-full rounded-lg border bg-card mx-auto mb-2 object-contain"
              loading="lazy"
            />
            <p className="text-[11px] sm:text-xs text-muted-foreground mb-2">Scan QR code di atas menggunakan e-wallet atau mobile banking</p>
          </div>
          <div className="shrink-0 flex flex-col gap-1.5">
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => printStruk(pendingStruk)}>
              <Printer className="h-3.5 w-3.5" />
              Cetak Nota
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setQrisOpen(false)}>Batal</Button>
              <Button size="sm" className="flex-1" onClick={confirmQris}>✅ Sudah Bayar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
