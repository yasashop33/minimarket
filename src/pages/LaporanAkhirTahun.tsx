import { useState, useMemo, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import { formatRp, normalizeTrx, parseDate } from '@/lib/wib';
import { downloadExcel } from '@/lib/exportExcel';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarDays, Download, TrendingUp, FileText } from 'lucide-react';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Cell, Tooltip, Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import StokBulananTable from '@/components/StokBulananTable';
import LossProfitBulanan from '@/components/LossProfitBulanan';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Year options from 2026 to 2040
const yearOptions = Array.from({ length: 15 }, (_, i) => 2026 + i);

export default function LaporanAkhirTahun() {
  const [year, setYear] = useState('2026');
  const [data, setData] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    try {
      const raw = await apiGet('getTransaksi', { from, to });
      const trxs = (Array.isArray(raw) ? raw : []).map(normalizeTrx);
      setData(trxs);
      setLoaded(true);
    } catch {
      const demo: any[] = [];
      for (let m = 0; m < 12; m++) {
        const count = Math.floor(Math.random() * 5) + 2;
        for (let i = 0; i < count; i++) {
          const names = ['Ari', 'Budi', 'Citra', 'Dewi', 'Eka', 'Faisal', 'Gita'];
          demo.push({
            tanggal: `${year}-${String(m + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T10:00:00`,
            total: Math.floor(Math.random() * 50000) + 10000,
            modal: Math.floor(Math.random() * 30000) + 5000,
            laba: Math.floor(Math.random() * 20000) + 2000,
            items: [{ nama: 'Produk', qty: 1, subtotal: 10000 }],
            anggotaId: i + 1,
            anggotaNama: names[i % names.length],
          });
        }
      }
      setData(demo.map(normalizeTrx));
      setLoaded(true);
    }
    setLoading(false);
  };

  const monthlyData = useMemo(() => {
    const months = BULAN.map((nama, i) => ({ bulan: BULAN_SHORT[i], bulanFull: nama, laba: 0, penjualan: 0, modal: 0 }));
    data.forEach(t => {
      const d = parseDate(t.tanggal);
      if (!d) return;
      const wib = new Date(d.getTime() + 7 * 3600000);
      const m = wib.getUTCMonth();
      months[m].laba += t.laba || 0;
      months[m].penjualan += t.total || 0;
      months[m].modal += t.modal || 0;
    });
    return months;
  }, [data]);

  const topAnggota = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(t => {
      const nama = t.anggotaNama;
      if (nama) map[nama] = (map[nama] || 0) + (t.laba || 0);
    });
    return Object.entries(map)
      .map(([nama, laba]) => ({ nama, laba }))
      .sort((a, b) => b.laba - a.laba)
      .slice(0, 5);
  }, [data]);

  const totalLaba = monthlyData.reduce((s, m) => s + m.laba, 0);
  const totalPenjualan = monthlyData.reduce((s, m) => s + m.penjualan, 0);
  const totalModal = monthlyData.reduce((s, m) => s + m.modal, 0);

  const fmtRpPlain = (n: number) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

  const handleDownloadPDF = useCallback(() => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 15;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN KEUANGAN USAHA', pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(13);
    doc.text('MINI MARKET YASA SEJATI', pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: Januari - Desember ${year}`, pageWidth / 2, y, { align: 'center' });
    y += 3;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Ringkasan Keuangan
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('I. RINGKASAN KEUANGAN', margin, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Keterangan', 'Jumlah']],
      body: [
        ['Total Penjualan', fmtRpPlain(totalPenjualan)],
        ['Total Modal (HPP)', fmtRpPlain(totalModal)],
        ['Total Laba Kotor', fmtRpPlain(totalLaba)],
      ],
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 1: { halign: 'right' } },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Laporan Laba Rugi per Bulan
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('II. LAPORAN LABA RUGI PER BULAN', margin, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['No', 'Bulan', 'Penjualan', 'Modal (HPP)', 'Laba Kotor']],
      body: [
        ...monthlyData.map((m, i) => [
          String(i + 1),
          m.bulanFull,
          fmtRpPlain(m.penjualan),
          fmtRpPlain(m.modal),
          fmtRpPlain(m.laba),
        ]),
        ['', 'TOTAL', fmtRpPlain(totalPenjualan), fmtRpPlain(totalModal), fmtRpPlain(totalLaba)],
      ],
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
      didParseCell: (data) => {
        // Bold the total row
        if (data.row.index === monthlyData.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [220, 240, 220];
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      y = 15;
    }

    // Top Anggota
    if (topAnggota.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('III. KONTRIBUSI LABA PER ANGGOTA (TOP 5)', margin, y);
      y += 7;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['No', 'Nama Anggota', 'Total Laba']],
        body: topAnggota.map((a, i) => [
          String(i + 1),
          a.nama,
          fmtRpPlain(a.laba),
        ]),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 2: { halign: 'right' } },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (y > 240) {
      doc.addPage();
      y = 15;
    }

    // Catatan
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const sectionNum = topAnggota.length > 0 ? 'IV' : 'III';
    doc.text(`${sectionNum}. CATATAN`, margin, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const notes = [
      '1. Laporan ini disusun berdasarkan data transaksi yang tercatat dalam sistem kasir.',
      '2. Modal (HPP) dihitung berdasarkan harga beli produk yang terjual.',
      '3. Laba Kotor = Total Penjualan - Total Modal (HPP).',
      '4. Laporan ini belum memperhitungkan biaya operasional (listrik, sewa, gaji, dll).',
    ];
    notes.forEach(note => {
      doc.text(note, margin, y);
      y += 5;
    });

    y += 10;
    if (y > 260) {
      doc.addPage();
      y = 15;
    }

    // Tanda tangan
    const sigX = pageWidth - margin - 60;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tangerang, 31 Desember ${year}`, sigX, y);
    y += 5;
    doc.text('Pemilik Usaha,', sigX, y);
    y += 25;
    doc.setFont('helvetica', 'bold');
    doc.text('____________________', sigX, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Mini Market Yasa Sejati', sigX, y);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Laporan Keuangan Mini Market Yasa Sejati - Tahun ${year} | Halaman ${i} dari ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    doc.save(`Laporan_Keuangan_Yasa_Sejati_${year}.pdf`);
    toast.success('File PDF berhasil diunduh');
  }, [year, monthlyData, totalPenjualan, totalModal, totalLaba, topAnggota]);

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      <div className="p-4 sm:p-5 sm:px-7 flex flex-col gap-4 sm:gap-5">
        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Laporan Akhir Tahun
        </h1>

        {/* Filter */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 sm:items-end flex-wrap">
              <div className="space-y-1 min-w-[140px]">
                <Label className="text-xs">Tahun</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleLoad} disabled={loading} className="w-full sm:w-auto">Tampilkan</Button>
              {loaded && (
                <>
                  <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={() => {
                    downloadExcel(`Laporan_Akhir_Tahun_${year}.xlsx`, [{
                      name: 'Laba Per Bulan',
                      headers: ['Bulan', 'Penjualan', 'Modal', 'Laba'],
                      rows: monthlyData.map(m => [m.bulanFull, m.penjualan, m.modal, m.laba]),
                    }, {
                      name: 'Top Anggota',
                      headers: ['Nama Anggota', 'Total Laba'],
                      rows: topAnggota.map(a => [a.nama, a.laba]),
                    }]);
                    toast.success('File Excel berhasil diunduh');
                  }}>
                    <Download className="h-4 w-4" /> Unduh Excel
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={handleDownloadPDF}>
                    <FileText className="h-4 w-4" /> Unduh PDF
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {!loaded ? (
          <div className="text-center text-muted-foreground text-sm py-10">Pilih tahun dan klik Tampilkan</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />Total Penjualan {year}
                  </div>
                  <div className="text-lg sm:text-[22px] font-bold text-primary">{formatRp(totalPenjualan)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-warning" />Total Modal {year}
                  </div>
                  <div className="text-lg sm:text-[22px] font-bold text-warning">{formatRp(totalModal)}</div>
                </CardContent>
              </Card>
              <Card className="col-span-2 lg:col-span-1">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />Total Laba {year}
                  </div>
                  <div className="text-lg sm:text-[22px] font-bold text-primary">{formatRp(totalLaba)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Table laba per bulan */}
            <Card>
              <CardHeader><CardTitle className="text-base">Laba Per Bulan — {year}</CardTitle></CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Bulan</th>
                        <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">Penjualan</th>
                        <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">Modal</th>
                        <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">Laba</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((m, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="p-2.5 font-medium">{m.bulanFull}</td>
                          <td className="p-2.5 text-right">{formatRp(m.penjualan)}</td>
                          <td className="p-2.5 text-right text-muted-foreground">{formatRp(m.modal)}</td>
                          <td className={`p-2.5 text-right font-bold ${m.laba >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatRp(m.laba)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 font-bold">
                        <td className="p-2.5">Total</td>
                        <td className="p-2.5 text-right">{formatRp(totalPenjualan)}</td>
                        <td className="p-2.5 text-right text-muted-foreground">{formatRp(totalModal)}</td>
                        <td className="p-2.5 text-right text-primary">{formatRp(totalLaba)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Stok Barang Akhir Bulan */}
            <StokBulananTable data={data} year={year} />

            {/* Loss Profit Bulanan */}
            <LossProfitBulanan data={data} year={year} />

            {/* Line chart with Penjualan, Modal, Laba */}
            <Card>
              <CardHeader><CardTitle className="text-base">Grafik Penjualan, Modal & Laba Per Bulan</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{
                  penjualan: { label: 'Penjualan', color: 'hsl(217, 91%, 60%)' },
                  modal: { label: 'Modal', color: 'hsl(38, 92%, 50%)' },
                  laba: { label: 'Laba', color: 'hsl(var(--primary))' },
                }} className="h-[300px] w-full">
                  <LineChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="bulan" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatRp(Number(value))} />} />
                    <Legend />
                    <Line type="monotone" dataKey="penjualan" name="Penjualan" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="modal" name="Modal" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="laba" name="Laba" stroke="hsl(160, 84%, 39%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(160, 84%, 39%)' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Bar chart top anggota */}
            <Card>
              <CardHeader><CardTitle className="text-base">Top 5 Anggota Penyumbang Laba</CardTitle></CardHeader>
              <CardContent>
                {topAnggota.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-5">Tidak ada data anggota di periode ini</div>
                ) : (
                  <ChartContainer config={{ laba: { label: 'Laba', color: 'hsl(var(--primary))' } }} className="h-[250px] w-full">
                    <BarChart data={topAnggota} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis type="category" dataKey="nama" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatRp(value)} labelFormatter={(label) => `Anggota: ${label}`} contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                      <Bar dataKey="laba" radius={[0, 6, 6, 0]} barSize={28}>
                        {topAnggota.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
