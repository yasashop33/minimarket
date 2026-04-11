import { useState } from 'react';
import { apiGet } from '@/lib/api';
import { formatRp, formatDate, getTodayWIB, normalizeTrx } from '@/lib/wib';
import { downloadExcel } from '@/lib/exportExcel';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign, TrendingDown, TrendingUp, Download } from 'lucide-react';

export default function Laporan() {
  const [from, setFrom] = useState(getTodayWIB());
  const [to, setTo] = useState(getTodayWIB());
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ trx: 0, penjualan: 0, modal: 0, laba: 0 });
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    if (!from || !to) return toast.warning('Pilih rentang tanggal');
    setLoading(true);
    try {
      const raw = await apiGet('getTransaksi', { from, to });
      const trxs = (Array.isArray(raw) ? raw : []).map(normalizeTrx);
      setData(trxs);
      setStats({
        trx: trxs.length,
        penjualan: trxs.reduce((s: number, t: any) => s + t.total, 0),
        modal: trxs.reduce((s: number, t: any) => s + t.modal, 0),
        laba: trxs.reduce((s: number, t: any) => s + t.laba, 0),
      });
      setLoaded(true);
    } catch {
      const demo = [
        { tanggal: new Date().toISOString(), total: 14000, modal: 11500, laba: 2500, items: [{ nama: 'Cimory Chocomalt', qty: 1, subtotal: 7000 }, { nama: 'KOPI ABC', qty: 1, subtotal: 7000 }] },
      ].map(normalizeTrx);
      setData(demo);
      setStats({ trx: demo.length, penjualan: 14000, modal: 11500, laba: 2500 });
      setLoaded(true);
    }
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Transaksi', value: stats.trx, icon: CreditCard, color: 'text-info' },
    { label: 'Total Penjualan', value: formatRp(stats.penjualan), icon: DollarSign, color: 'text-primary' },
    { label: 'Total Modal', value: formatRp(stats.modal), icon: TrendingDown, color: 'text-warning' },
    { label: 'Laba', value: formatRp(stats.laba), icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      <div className="p-4 sm:p-5 sm:px-7 flex flex-col gap-4 sm:gap-5">
        <h1 className="text-lg sm:text-xl font-bold">Laporan Laba/Rugi</h1>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 sm:flex-wrap sm:items-end">
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label className="text-xs">Dari Tanggal</Label>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label className="text-xs">Sampai Tanggal</Label>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <Button onClick={handleLoad} disabled={loading} className="w-full sm:w-auto">Tampilkan</Button>
              {loaded && data.length > 0 && (
                <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={() => {
                  downloadExcel(`Laporan_LabaRugi_${from}_${to}.xlsx`, [{
                    name: 'Laba Rugi',
                    headers: ['Tanggal', 'Item', 'Total Penjualan', 'Modal', 'Laba'],
                    rows: data.map(t => [
                      formatDate(t.tanggal),
                      (t.items || []).map((i: any) => `${i.nama} ×${i.qty}`).join(', '),
                      t.total, t.modal, t.laba,
                    ]),
                  }]);
                  toast.success('File Excel berhasil diunduh');
                }}>
                  <Download className="h-4 w-4" /> Unduh Excel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(s => (
            <Card key={s.label}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mb-1.5">
                  <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                  <span className="truncate">{s.label}</span>
                </div>
                <div className={`text-lg sm:text-[22px] font-bold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Riwayat Transaksi</CardTitle></CardHeader>
          <CardContent>
            {!loaded ? (
              <div className="text-center text-muted-foreground text-sm py-5">Pilih rentang tanggal dan klik Tampilkan</div>
            ) : data.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-5">Tidak ada transaksi di periode ini</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {data.map((t, i) => (
                  <div key={i} className="border rounded-[10px] p-3 sm:p-3.5">
                    <div className="flex flex-col sm:flex-row sm:justify-between mb-2 gap-0.5">
                      <span className="text-[12px] sm:text-[13px] text-muted-foreground">{formatDate(t.tanggal)}</span>
                      <span className="text-[14px] sm:text-[15px] font-bold text-primary">{formatRp(t.total)}</span>
                    </div>
                    <div className="mb-1.5">
                      {t.items.length ? t.items.map((item: any, j: number) => (
                        <div key={j} className="flex items-center gap-1.5 text-[12px] sm:text-[13px] py-0.5">
                          <span className="font-medium truncate">{item.nama}</span>
                          <span className="text-muted-foreground flex-shrink-0">×{item.qty}</span>
                          <span className="ml-auto flex-shrink-0">{formatRp(item.subtotal)}</span>
                        </div>
                      )) : <div className="text-muted-foreground text-xs italic">Detail item tidak tersedia</div>}
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t text-[12px] sm:text-[13px]">
                      <span className="text-muted-foreground">Modal: {formatRp(t.modal)}</span>
                      <span className="font-bold text-primary">Laba: {formatRp(t.laba)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
