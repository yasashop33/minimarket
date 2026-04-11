import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/contexts/StoreContext";
import { Layout } from "@/components/Layout";
import Minimarket from "@/pages/Minimarket";
import UpdateStok from "@/pages/UpdateStok";
import AdminGuard from "@/components/AdminGuard";
import Anggota from "@/pages/Anggota";
import Laporan from "@/pages/Laporan";
import LaporanAnggota from "@/pages/LaporanAnggota";
import LossProfit from "@/pages/LossProfit";
import LaporanAkhirTahun from "@/pages/LaporanAkhirTahun";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <StoreProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Minimarket />} />
              <Route path="/stok" element={<AdminGuard><UpdateStok /></AdminGuard>} />
              <Route path="/anggota" element={<Anggota />} />
              <Route path="/laporan" element={<Laporan />} />
              <Route path="/laporan-anggota" element={<LaporanAnggota />} />
              <Route path="/loss-profit" element={<LossProfit />} />
              <Route path="/laporan-tahunan" element={<LaporanAkhirTahun />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </StoreProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
