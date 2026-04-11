const MONTH_NAMES_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (!hasValue(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseDate(val: unknown): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val;

  if (typeof val === 'number') {
    if (val > 25569 && val < 100000) {
      const ms = (val - 25569) * 86400000;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof val !== 'string') return null;

  const s = val.trim();

  const isoLike = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?)?(?:\s*(Z|([+-])(\d{2}):?(\d{2})))?$/
  );

  if (isoLike) {
    const year = Number(isoLike[1]);
    const month = Number(isoLike[2]) - 1;
    const day = Number(isoLike[3]);
    const hour = Number(isoLike[4] || '0');
    const minute = Number(isoLike[5] || '0');
    const second = Number(isoLike[6] || '0');
    const ms = Number((isoLike[7] || '0').padEnd(3, '0'));
    const zone = isoLike[8];
    const sign = isoLike[9] as '+' | '-' | undefined;
    const offsetHour = Number(isoLike[10] || '0');
    const offsetMinute = Number(isoLike[11] || '0');

    if (zone === 'Z') {
      return new Date(Date.UTC(year, month, day, hour, minute, second, ms));
    }

    if (sign) {
      const totalOffsetMs = ((offsetHour * 60 + offsetMinute) * (sign === '+' ? 1 : -1)) * 60000;
      return new Date(Date.UTC(year, month, day, hour, minute, second, ms) - totalOffsetMs);
    }

    return new Date(Date.UTC(year, month, day, hour - 7, minute, second, ms));
  }

  const dmy = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    const hour = Number(dmy[4] || '0');
    const minute = Number(dmy[5] || '0');
    const second = Number(dmy[6] || '0');
    return new Date(Date.UTC(year, month, day, hour - 7, minute, second));
  }

  if (/^\d{10,13}$/.test(s)) {
    const timestamp = s.length === 10 ? Number(s) * 1000 : Number(s);
    const d = new Date(timestamp);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

const wibFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatDate(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return String(value);

  const parts = wibFormatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  return `${get('day')} ${get('month')} ${get('year')}, ${get('hour')}.${get('minute')} WIB`;
}

export function getTodayWIB(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now);
}

export function formatRp(n: number): string {
  return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
}

function getField(obj: any, ...keys: string[]) {
  for (const key of keys) {
    if (hasValue(obj?.[key])) return obj[key];
  }
  return undefined;
}

export function normalizeTrx(t: any) {
  const tanggal = getField(t, 'tanggal', 'date', 'waktu', 'timestamp', 'created_at', 'createdAt');
  const total = toFiniteNumber(getField(t, 'total', 'totalHarga', 'grandTotal', 'amount'));
  const modal = toFiniteNumber(getField(t, 'modal', 'totalModal', 'cost'));
  const parsedLaba = toOptionalNumber(getField(t, 'laba', 'profit', 'keuntungan'));
  const anggotaId = toOptionalNumber(getField(t, 'anggotaId', 'memberId', 'anggota_id'));
  const anggotaNamaRaw = getField(t, 'anggotaNama', 'memberName', 'namaAnggota', 'anggota_nama');

  let rawItems = getField(t, 'items', 'detail', 'produk', 'barang') || [];
  if (typeof rawItems === 'string') {
    try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; }
  }
  if (!Array.isArray(rawItems)) rawItems = [];

  const normItems = rawItems.map((item: any) => {
    const qtyValue = toFiniteNumber(getField(item, 'qty', 'jumlah', 'quantity'), 1);
    const hargaBeli = toFiniteNumber(getField(item, 'hargaBeli', 'modal', 'cost', 'hpp'));
    return {
      id: toOptionalNumber(getField(item, 'id', 'produkId', 'productId')),
      produkId: toOptionalNumber(getField(item, 'produkId', 'id', 'productId')),
      nama: String(getField(item, 'nama', 'name', 'namaProduk', 'namaBarang', 'produk', 'item') || '(tanpa nama)'),
      qty: qtyValue > 0 ? qtyValue : 1,
      subtotal: toFiniteNumber(getField(item, 'subtotal', 'hargaJual', 'harga', 'price', 'total')),
      modal: hargaBeli,
      hargaBeli,
    };
  });

  const modalFromItems = normItems.reduce((sum: number, item: any) => sum + (item.modal * item.qty), 0);
  const finalModal = modal > 0 ? modal : modalFromItems;
  const finalLaba = parsedLaba ?? (total - finalModal);

  return {
    tanggal,
    total,
    modal: finalModal,
    laba: finalLaba,
    items: normItems,
    anggotaId,
    anggotaNama: hasValue(anggotaNamaRaw) ? String(anggotaNamaRaw) : undefined,
    _raw: t,
  };
}
