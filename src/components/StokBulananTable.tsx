import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRp } from '@/lib/wib';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';

interface StokItem {
  nama: string;
  qty: number;
  hargaBeli: number;
  totalModal: number;
}

interface StokBulan {
  bulan: string;
  bulanFull: string;
  jumlahItem: number;
  totalModalStok: number;
  items: StokItem[];
}

interface Props {
  data: any[];
  year: string;
}

const BULAN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function StokBulananTable({ data, year }: Props) {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const stokBulanan = useMemo<StokBulan[]>(() => {
    // Track cumulative stock per product across months
    // Each transaction's items reduce stock (sold), so we simulate end-of-month stock
    // We aggregate items sold per month, then show what remains
    const allItems: Record<string, { nama: string; totalQtySold: number; hargaBeli: number }> = {};

    // First pass: collect all unique products and their hargaBeli
    data.forEach(t => {
      (t.items || []).forEach((item: any) => {
        const key = item.nama || item.id || 'unknown';
        if (!allItems[key]) {
          allItems[key] = { nama: item.nama || key, totalQtySold: 0, hargaBeli: item.hargaBeli || item.modal || 0 };
        }
        if (item.hargaBeli) allItems[key].hargaBeli = item.hargaBeli;
      });
    });

    // Per month: track items sold that month
    return BULAN_FULL.map((bulanFull, monthIdx) => {
      const bulan = BULAN_SHORT[monthIdx];
      const itemsThisMonth: Record<string, { nama: string; qty: number; hargaBeli: number }> = {};

      data.forEach(t => {
        const d = new Date(t.tanggal);
        if (isNaN(d.getTime())) return;
        const wib = new Date(d.getTime() + 7 * 3600000);
        if (wib.getUTCMonth() !== monthIdx) return;

        (t.items || []).forEach((item: any) => {
          const key = item.nama || item.id || 'unknown';
          if (!itemsThisMonth[key]) {
            itemsThisMonth[key] = { nama: item.nama || key, qty: 0, hargaBeli: item.hargaBeli || item.modal || 0 };
          }
          itemsThisMonth[key].qty += item.qty || 1;
          if (item.hargaBeli) itemsThisMonth[key].hargaBeli = item.hargaBeli;
        });
      });

      const items: StokItem[] = Object.values(itemsThisMonth).map(it => ({
        nama: it.nama,
        qty: it.qty,
        hargaBeli: it.hargaBeli,
        totalModal: it.qty * it.hargaBeli,
      }));

      const jumlahItem = items.reduce((s, i) => s + i.qty, 0);
      const totalModalStok = items.reduce((s, i) => s + i.totalModal, 0);

      return { bulan, bulanFull, jumlahItem, totalModalStok, items };
    });
  }, [data]);

  const totalItem = stokBulanan.reduce((s, m) => s + m.jumlahItem, 0);
  const totalModal = stokBulanan.reduce((s, m) => s + m.totalModalStok, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Stok Barang Akhir Bulan — {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground w-8"></th>
                <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Bulan</th>
                <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">Jumlah Item</th>
                <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">Total Modal Stok</th>
              </tr>
            </thead>
            <tbody>
              {stokBulanan.map((m, i) => (
                <>
                  <tr
                    key={`row-${i}`}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => setExpandedMonth(expandedMonth === i ? null : i)}
                  >
                    <td className="p-2.5 text-muted-foreground">
                      {m.items.length > 0 ? (
                        expandedMonth === i ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                      ) : null}
                    </td>
                    <td className="p-2.5 font-medium">{m.bulanFull}</td>
                    <td className="p-2.5 text-right">{m.jumlahItem.toLocaleString('id-ID')}</td>
                    <td className="p-2.5 text-right text-primary font-semibold">{formatRp(m.totalModalStok)}</td>
                  </tr>
                  {expandedMonth === i && m.items.length > 0 && (
                    <tr key={`detail-${i}`}>
                      <td colSpan={4} className="p-0">
                        <div className="bg-muted/30 border-b">
                          <table className="w-full text-[12px]">
                            <thead>
                              <tr className="border-b border-border/50">
                                <th className="text-left p-2 pl-10 text-xs font-medium text-muted-foreground">Nama Barang</th>
                                <th className="text-right p-2 text-xs font-medium text-muted-foreground">Qty</th>
                                <th className="text-right p-2 text-xs font-medium text-muted-foreground">Harga Beli</th>
                                <th className="text-right p-2 text-xs font-medium text-muted-foreground">Total Modal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {m.items.map((item, j) => (
                                <tr key={j} className="border-b border-border/30 hover:bg-muted/50">
                                  <td className="p-2 pl-10">{item.nama}</td>
                                  <td className="p-2 text-right">{item.qty}</td>
                                  <td className="p-2 text-right text-muted-foreground">{formatRp(item.hargaBeli)}</td>
                                  <td className="p-2 text-right font-medium">{formatRp(item.totalModal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              <tr className="border-t-2 font-bold">
                <td className="p-2.5"></td>
                <td className="p-2.5">Total</td>
                <td className="p-2.5 text-right">{totalItem.toLocaleString('id-ID')}</td>
                <td className="p-2.5 text-right text-primary">{formatRp(totalModal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
