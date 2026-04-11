import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_PASSWORD = 'yasa';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [open, setOpen] = useState(true);
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setUnlocked(true);
      setOpen(false);
      toast.success('Akses diberikan');
    } else {
      toast.error('Akses anda ditolak');
      setPassword('');
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) window.history.back(); }}>
      <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Akses Terbatas Khusus Admin
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">Masukkan password admin untuk mengakses halaman ini.</p>
          <div className="space-y-1">
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                className="pl-9"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Masukkan password..."
                autoFocus
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => window.history.back()}>Batal</Button>
          <Button onClick={handleSubmit}>Masuk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
