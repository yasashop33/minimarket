import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { apiPost } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';

export default function Anggota() {
  const { members, loadMembers } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nama, setNama] = useState('');
  const [hp, setHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [loading, setLoading] = useState(false);

  const openAdd = () => { setEditId(null); setNama(''); setHp(''); setAlamat(''); setModalOpen(true); };
  const openEdit = (m: any) => { setEditId(m.id); setNama(m.nama); setHp(m.hp || ''); setAlamat(m.alamat || ''); setModalOpen(true); };

  const handleSave = async () => {
    if (!nama.trim()) return toast.warning('Nama wajib diisi');
    setLoading(true);
    try {
      if (editId) {
        await apiPost('editAnggota', { id: editId, nama, hp, alamat });
        toast.success('Anggota diperbarui');
      } else {
        await apiPost('addAnggota', { nama, hp, alamat });
        toast.success('Anggota ditambahkan');
      }
      setModalOpen(false);
      await loadMembers();
    } catch (e: any) { toast.error('Gagal: ' + e.message); }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus anggota ini?')) return;
    try {
      await apiPost('deleteAnggota', { id });
      toast.success('Anggota dihapus');
      await loadMembers();
    } catch (e: any) { toast.error('Gagal: ' + e.message); }
  };

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      <div className="p-5 px-7">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Anggota</h1>
          <Button onClick={openAdd} className="gap-1.5" size="sm">
            <Plus className="h-[15px] w-[15px]" /> Tambah
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base">
              <Users className="h-[18px] w-[18px] text-primary" /> Daftar Anggota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {members.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-5">Belum ada anggota</div>
              ) : members.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-card border rounded-[10px] px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold">{m.nama}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.hp || ''} {m.alamat ? '· ' + m.alamat : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(m)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-info/10 text-info transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-destructive/10 text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Anggota' : 'Tambah Anggota'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nama</Label><Input value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama anggota" /></div>
            <div className="space-y-1"><Label>No. HP</Label><Input value={hp} onChange={e => setHp(e.target.value)} placeholder="08xxxxxxxxxx" /></div>
            <div className="space-y-1"><Label>Alamat</Label><Input value={alamat} onChange={e => setAlamat(e.target.value)} placeholder="Alamat" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={loading}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
