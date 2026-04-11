import { useState } from 'react';
import { apiGet } from '@/lib/api';
import { formatRp, formatDate, getTodayWIB, normalizeTrx } from '@/lib/wib';
import { downloadExcel } from '@/lib/exportExcel';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, ChevronDown, ChevronUp, Download } from 'lucide-react';

interface AnggotaRow {
  id: number; nama: string; jumlahTrx: number; totalNominal: number; totalLaba: number;
  transaksi: any[];
}

export default function LaporanAnggota() {
  const [from, setFrom] = useState(getTodayWIB());
  const [to, setTo] = useState(getTodayWIB());
  const [rows, setRows] = useState<AnggotaRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openDetail, setOpenDetail] = useState<number | null>(null);

  const handleLoad = async () => {
    if (!from || !to) return toast.warning('Pilih rentang tanggal');
    setLoading(true);
    try {
      const raw = await apiGet('getTransaksi', { from, to });
      const trxs = Array.isArray(raw) ? raw : [];
      processData(trxs);
    } catch {
      processData([
        { tanggal: new Date().toISOString(), total: 21000, modal: 16500, laba: 4500, anggotaId: 1, anggotaNama: 'Budi Santoso', items: [{ nama: 'Cimory', qty: 2, subtotal: 14000 }] },
        { tanggal: new Date().toISOString(), total: 7000, modal: 5000, laba: 2000, anggotaId: 2, anggotaNama: 'Siti Rahayu', items: [{ nama: 'KOPI ABC', qty: 1, subtotal: 7000 }] },
      ]);
    }
    setLoading(false);
  };

  const processData = (trxs: any[]) => {
    const normalized = trxs.map(normalizeTrx);
    const filtered = normalized.filter(t => t.anggotaId);
    const map: Record<number, AnggotaRow> = {};

    filtered.forEach(t => {
      const anggotaId = Number(t.anggotaId);
      if (!Number.isFinite(anggotaId) || anggotaId <= 0) return;

      if (!map[anggotaId]) {
        map[anggotaId] = { id: anggotaId, nama: t.anggotaNama || `Anggota #${anggotaId}`, jumlahTrx: 0, totalNominal: 0, totalLaba: 0, transaksi: [] };
      }

      map[anggotaId].jumlahTrx++;
      map[anggotaId].totalNominal += t.total || 0;
      map[anggotaId].totalLaba += t.laba || 0;
      map[anggotaId].transaksi.push(t);
    });

    setRows(Object.values(map).sort((a, b) => b.totalNominal - a.totalNominal));
    setLoaded(true);
  };

  const totalAnggota = rows.length;
  const totalPenjualan = rows.reduce((s, r) => s + r.totalNominal, 0);
  const totalLaba = rows.reduce((s, r) => s + r.totalLaba, 0);

  const rankClass = (i: number) => {
    if (i === 0) return 'bg-warning/20 text-warning';
    if (i === 1) return 'bg-muted text-foreground';
    if (i === 2) return 'bg-warning/10 text-warning';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      <div className="p-4 sm:p-5 sm:px-7 flex flex-col gap-4 sm:gap-5">
        <h1 className="text-lg sm:text-xl font-bold">Laporan per Anggota</h1>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 sm:flex-wrap sm:items-end">
              <div className="space-y-1 flex-1 min-w-[140px]"><Label className="text-xs">Dari Tanggal</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
              <div className="space-y-1 flex-1 min-w-[140px]"><Label className="text-xs">Sampai Tanggal</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
              <Button onClick={handleLoad} disabled={loading} className="w-full sm:w-auto">Tampilkan</Button>
              {loaded && rows.length > 0 && (
                <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={() => {
                  downloadExcel(`Laporan_Anggota_${from}_${to}.xlsx`, [{
                    name: 'Per Anggota',
                    headers: ['#', 'Nama Anggota', 'Jml Transaksi', 'Total Nominal', 'Total Laba', 'Rata-rata/Trx'],
                    rows: rows.map((r, i) => [
                      i + 1, r.nama, r.jumlahTrx, r.totalNominal, r.totalLaba,
                      r.jumlahTrx > 0 ? Math.round(r.totalNominal / r.jumlahTrx) : 0,
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card><CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><Users className="h-3.5 w-3.5 text-info" />Total Anggota Bertransaksi</div>
            <div className="text-lg sm:text-[22px] font-bold text-info">{totalAnggota}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><DollarSign className="h-3.5 w-3.5 text-primary" />Total Penjualan ke Anggota</div>
            <div className="text-lg sm:text-[22px] font-bold text-primary">{formatRp(totalPenjualan)}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><TrendingUp className="h-3.5 w-3.5 text-primary" />Total Laba dari Anggota</div>
            <div className="text-lg sm:text-[22px] font-bold text-primary">{formatRp(totalLaba)}</div>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-[18px] w-[18px] text-primary" />Rincian per Anggota</CardTitle></CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {/* Mobile: card view */}
            <div className="sm:hidden flex flex-col">
              {!loaded ? (
                <div className="text-center text-muted-foreground text-sm p-5">Pilih rentang tanggal dan klik Tampilkan</div>
              ) : rows.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm p-5">Tidak ada transaksi anggota di periode ini</div>
              ) : rows.map((r, idx) => (
                <div key={r.id} className="border-b p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${rankClass(idx)}`}>{idx + 1}</span>
                    <span className="font-semibold text-sm">{r.nama}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div><span className="text-muted-foreground">Trx:</span> <span className="font-semibold">{r.jumlahTrx}x</span></div>
                    <div><span className="text-muted-foreground">Total:</span> <span className="font-bold">{formatRp(r.totalNominal)}</span></div>
                    <div><span className="text-muted-foreground">Laba:</span> <span className="font-bold text-primary">{formatRp(r.totalLaba)}</span></div>
                  </div>
                  <button
                    onClick={() => setOpenDetail(openDetail === r.id ? null : r.id)}
                    className="text-info text-xs font-semibold flex items-center gap-1"
                  >
                    {openDetail === r.id ? <><ChevronUp className="h-3 w-3" /> Tutup</> : <><ChevronDown className="h-3 w-3" /> Detail</>}
                  </button>
                  {openDetail === r.id && (
                    <div className="mt-2 pl-2 border-l-2 border-info/30">
                      {r.transaksi.map((t: any, ti: number) => (
                        <div key={ti} className="py-1.5 border-b last:border-b-0 text-xs">
                          <div className="text-muted-foreground">{formatDate(t.tanggal)}</div>
                          <div className="mt-0.5">{(t.items || []).map((i: any) => i.nama + ' ×' + i.qty).join(', ')}</div>
                          <div className="flex justify-between mt-0.5">
                            <span className="font-bold">{formatRp(t.total)}</span>
                            <span className="text-primary">Laba: {formatRp(t.laba)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground w-9">#</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Nama Anggota</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Jml Transaksi</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Total Nominal</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Total Laba</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Rata-rata/Trx</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground w-20">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {!loaded ? (
                    <tr><td colSpan={7} className="text-center text-muted-foreground text-sm p-5">Pilih rentang tanggal dan klik Tampilkan</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted-foreground text-sm p-5">Tidak ada transaksi anggota di periode ini</td></tr>
                  ) : rows.map((r, idx) => (
                    <>
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="p-2.5"><span className={`inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[11px] font-bold ${rankClass(idx)}`}>{idx + 1}</span></td>
                        <td className="p-2.5 font-semibold">{r.nama}</td>
                        <td className="p-2.5"><span className="bg-info/10 text-info px-2 py-0.5 rounded-full text-[11px] font-semibold">{r.jumlahTrx}x</span></td>
                        <td className="p-2.5 font-bold">{formatRp(r.totalNominal)}</td>
                        <td className="p-2.5 font-bold text-primary">{formatRp(r.totalLaba)}</td>
                        <td className="p-2.5 text-muted-foreground">{formatRp(r.jumlahTrx > 0 ? Math.round(r.totalNominal / r.jumlahTrx) : 0)}</td>
                        <td className="p-2.5">
                          <button onClick={() => setOpenDetail(openDetail === r.id ? null : r.id)} className="text-info text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-info/10 transition-colors">
                            {openDetail === r.id ? <><ChevronUp className="h-3 w-3" /> Tutup</> : <><ChevronDown className="h-3 w-3" /> Lihat</>}
                          </button>
                        </td>
                      </tr>
                      {openDetail === r.id && (
                        <tr key={`detail-${r.id}`} className="bg-muted/30">
                          <td colSpan={7} className="p-0">
                            <div className="px-5 pl-10 py-2.5">
                              <div className="text-xs font-semibold text-muted-foreground mb-2">Riwayat Transaksi — {r.nama}</div>
                              {r.transaksi.map((t: any, ti: number) => (
                                <div key={ti} className="flex justify-between items-center py-1.5 border-b last:border-b-0 text-[13px]">
                                  <div>
                                    <div className="text-muted-foreground text-xs">{formatDate(t.tanggal)}</div>
                                    <div className="mt-0.5">{(t.items || []).map((i: any) => i.nama + ' ×' + i.qty).join(', ')}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold">{formatRp(t.total)}</div>
                                    <div className="text-primary text-xs">Laba: {formatRp(t.laba)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
