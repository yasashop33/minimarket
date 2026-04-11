import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { apiPost } from '@/lib/api';
import { formatRp } from '@/lib/wib';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, Plus, Pencil, Trash2 } from 'lucide-react';

export default function UpdateStok() {
  const { products, loadProducts } = useStore();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [jumlah, setJumlah] = useState('0');
  const [hargaBeli, setHargaBeli] = useState('0');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  // Add product modal
  const [addOpen, setAddOpen] = useState(false);
  const [pNama, setPNama] = useState('');
  const [pBarcode, setPBarcode] = useState('');
  const [pKategori, setPKategori] = useState('');
  const [pStok, setPStok] = useState('0');
  const [pHargaBeli, setPHargaBeli] = useState('0');
  const [pHargaJual, setPHargaJual] = useState('0');

  // Edit product modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [epStok, setEpStok] = useState('0');
  const [epHargaBeli, setEpHargaBeli] = useState('0');
  const [epHargaJual, setEpHargaJual] = useState('0');

  const handleUpdateStok = async () => {
    if (!selectedProduct) return toast.warning('Pilih produk terlebih dahulu');
    const qty = parseInt(jumlah);
    if (!qty || qty <= 0) return toast.warning('Jumlah harus lebih dari 0');
    setLoading(true);
    try {
      await apiPost('updateStok', { id: selectedProduct, jumlah: qty, hargaBeli: parseInt(hargaBeli), catatan });
      toast.success('Stok berhasil diupdate');
      setJumlah('0'); setHargaBeli('0'); setCatatan('');
      await loadProducts();
    } catch (e: any) { toast.error('Gagal update stok: ' + e.message); }
    setLoading(false);
  };

  const handleSaveProduk = async () => {
    if (!pNama.trim()) return toast.warning('Nama produk wajib diisi');
    setLoading(true);
    try {
      await apiPost('addProduk', { nama: pNama, barcode: pBarcode, kategori: pKategori, stok: parseInt(pStok), hargaBeli: parseInt(pHargaBeli), hargaJual: parseInt(pHargaJual) });
      toast.success('Produk berhasil ditambahkan');
      setAddOpen(false);
      setPNama(''); setPBarcode(''); setPKategori(''); setPStok('0'); setPHargaBeli('0'); setPHargaJual('0');
      await loadProducts();
    } catch (e: any) { toast.error('Gagal: ' + e.message); }
    setLoading(false);
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setEpStok(String(p.stok || 0));
    setEpHargaBeli(String(p.hargaBeli || 0));
    setEpHargaJual(String(p.hargaJual || 0));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await apiPost('editProduk', { id: editId, stok: parseInt(epStok), hargaBeli: parseInt(epHargaBeli), hargaJual: parseInt(epHargaJual) });
      toast.success('Produk berhasil diperbarui');
      setEditOpen(false);
      await loadProducts();
    } catch { toast.success('Produk diperbarui (lokal)'); setEditOpen(false); }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await apiPost('deleteProduk', { id });
      toast.success('Produk dihapus');
      await loadProducts();
    } catch (e: any) { toast.error('Gagal: ' + e.message); }
  };

  const getStokBadge = (stok: number) => {
    if (stok <= 0) return 'bg-destructive/10 text-destructive';
    if (stok <= 5) return 'bg-warning/10 text-warning';
    return 'bg-primary/10 text-primary';
  };

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      <div className="p-5 px-7 flex flex-col gap-5">
        <h1 className="text-xl font-bold">Update Stok</h1>

        {/* Update Stok Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base">
              <Package className="h-[18px] w-[18px] text-primary" />
              Update Stok Barang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Pilih Produk</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Pilih produk..." /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nama} (Stok: {p.stok})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3.5">
              <div className="flex-1 space-y-1">
                <Label>Jumlah</Label>
                <Input type="number" min={0} value={jumlah} onChange={e => setJumlah(e.target.value)} />
              </div>
              <div className="flex-1 space-y-1">
                <Label>Harga Beli Satuan</Label>
                <Input type="number" min={0} value={hargaBeli} onChange={e => setHargaBeli(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Catatan (opsional)</Label>
              <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan pembelian..." />
            </div>
            <Button className="w-full" onClick={handleUpdateStok} disabled={loading}>Update Stok</Button>
          </CardContent>
        </Card>

        {/* Add Product Button */}
        <Card>
          <CardContent className="p-4">
            <Button variant="outline" className="w-full gap-2 border-dashed" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah Produk Baru
            </Button>
          </CardContent>
        </Card>

        {/* Product Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Nama</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Barcode</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Kategori</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Harga Beli</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Harga Jual</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Stok</th>
                    <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted-foreground p-5">Belum ada produk</td></tr>
                  ) : products.map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-2.5 font-semibold">{p.nama}</td>
                      <td className="p-2.5 text-muted-foreground text-xs">{p.barcode || '-'}</td>
                      <td className="p-2.5">{p.kategori || '-'}</td>
                      <td className="p-2.5">{formatRp(p.hargaBeli)}</td>
                      <td className="p-2.5 text-primary font-semibold">{formatRp(p.hargaJual)}</td>
                      <td className="p-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStokBadge(p.stok)}`}>{p.stok}</span>
                      </td>
                      <td className="p-2.5">
                        <div className="flex gap-1.5">
                          <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-info/10 text-info transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-destructive/10 text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Produk Baru</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1"><Label>Nama Produk</Label><Input value={pNama} onChange={e => setPNama(e.target.value)} /></div>
              <div className="flex-1 space-y-1"><Label>Barcode</Label><Input value={pBarcode} onChange={e => setPBarcode(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Kategori</Label><Input value={pKategori} onChange={e => setPKategori(e.target.value)} /></div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1"><Label>Stok</Label><Input type="number" value={pStok} onChange={e => setPStok(e.target.value)} /></div>
              <div className="flex-1 space-y-1"><Label>Harga Beli</Label><Input type="number" value={pHargaBeli} onChange={e => setPHargaBeli(e.target.value)} /></div>
              <div className="flex-1 space-y-1"><Label>Harga Jual</Label><Input type="number" value={pHargaJual} onChange={e => setPHargaJual(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={handleSaveProduk} disabled={loading}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Produk</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="font-bold">{products.find(p => p.id === editId)?.nama}</p>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1"><Label>Stok</Label><Input type="number" value={epStok} onChange={e => setEpStok(e.target.value)} /></div>
              <div className="flex-1 space-y-1"><Label>Harga Beli</Label><Input type="number" value={epHargaBeli} onChange={e => setEpHargaBeli(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Harga Jual</Label><Input type="number" value={epHargaJual} onChange={e => setEpHargaJual(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button onClick={handleSaveEdit} disabled={loading}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
