import * as ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';

/** Enum → Türkçe okunur etiket eşlemeleri (dışa aktarma için). */
const PROPERTY_TYPE_TR: Record<string, string> = {
  APARTMENT: 'Daire',
  VILLA: 'Villa',
  LAND: 'Arsa',
  HOTEL: 'Otel',
  SHOP: 'Dükkan',
  OFFICE: 'Ofis',
};

const LISTING_TYPE_TR: Record<string, string> = {
  SALE: 'Satılık',
  RENT: 'Kiralık',
};

const VISIBILITY_TR: Record<string, string> = {
  PUBLIC: 'Herkese Açık',
  HIDDEN: 'Gizli',
};

const DEMAND_STATUS_TR: Record<string, string> = {
  ACTIVE: 'Aktif',
  CLOSED: 'Kapalı',
};

function mapEnum(map: Record<string, string>, value?: string | null): string {
  if (!value) return '';
  return map[value] ?? value;
}

function mapList(map: Record<string, string>, values?: string[] | null): string {
  if (!values || values.length === 0) return '';
  return values.map((v) => map[v] ?? v).join(', ');
}

function joinList(values?: string[] | null): string {
  if (!values || values.length === 0) return '';
  return values.join(', ');
}

function money(value: Prisma.Decimal | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const n = typeof value === 'number' ? value : Number(value.toString());
  return new Intl.NumberFormat('tr-TR').format(n);
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(d));
}

export interface ExportColumn {
  header: string;
  /** Genişlik ipucu (XLSX) */
  width: number;
  value: (row: any) => string;
}

export const PORTFOLIO_COLUMNS: ExportColumn[] = [
  { header: 'Başlık', width: 28, value: (r) => r.title ?? '' },
  { header: 'Tür', width: 12, value: (r) => mapEnum(PROPERTY_TYPE_TR, r.type) },
  { header: 'İlan Tipi', width: 12, value: (r) => mapEnum(LISTING_TYPE_TR, r.listingType) },
  { header: 'İl', width: 14, value: (r) => r.city ?? '' },
  { header: 'İlçe', width: 16, value: (r) => r.district ?? '' },
  { header: 'Mahalle', width: 18, value: (r) => r.neighborhood ?? '' },
  { header: 'm²', width: 8, value: (r) => (r.areaSqm ?? '').toString() },
  { header: 'Oda', width: 8, value: (r) => r.roomCount ?? '' },
  { header: 'Fiyat (₺)', width: 16, value: (r) => money(r.price) },
  { header: 'Özellikler', width: 30, value: (r) => joinList(r.features) },
  { header: 'Görünürlük', width: 14, value: (r) => mapEnum(VISIBILITY_TR, r.visibility) },
  { header: 'Mülk Sahibi', width: 20, value: (r) => r.ownerName ?? '' },
  { header: 'Telefon', width: 16, value: (r) => r.ownerPhone ?? '' },
  { header: 'Not', width: 30, value: (r) => r.note ?? '' },
  { header: 'Danışman', width: 20, value: (r) => r.createdBy?.fullName ?? '' },
  { header: 'Oluşturulma', width: 14, value: (r) => formatDate(r.createdAt) },
];

export const DEMAND_COLUMNS: ExportColumn[] = [
  { header: 'Müşteri', width: 20, value: (r) => r.customerName ?? '' },
  { header: 'Telefon', width: 16, value: (r) => r.customerPhone ?? '' },
  { header: 'Tür', width: 16, value: (r) => mapList(PROPERTY_TYPE_TR, r.types) },
  { header: 'İlan Tipi', width: 12, value: (r) => mapEnum(LISTING_TYPE_TR, r.listingType) },
  { header: 'Bölgeler', width: 26, value: (r) => joinList(r.regions) },
  { header: 'İlçeler', width: 22, value: (r) => joinList(r.districts) },
  { header: 'Min Bütçe (₺)', width: 16, value: (r) => money(r.minBudget) },
  { header: 'Maks Bütçe (₺)', width: 16, value: (r) => money(r.maxBudget) },
  { header: 'Oda Tercihi', width: 16, value: (r) => joinList(r.roomPreferences) },
  { header: 'Min m²', width: 10, value: (r) => (r.minArea ?? '').toString() },
  { header: 'Maks m²', width: 10, value: (r) => (r.maxArea ?? '').toString() },
  { header: 'Olmazsa Olmaz', width: 24, value: (r) => joinList(r.mustHaveFeatures) },
  { header: 'Tercih Edilen', width: 24, value: (r) => joinList(r.bonusFeatures) },
  { header: 'Durum', width: 10, value: (r) => mapEnum(DEMAND_STATUS_TR, r.status) },
  { header: 'Not', width: 30, value: (r) => r.note ?? '' },
  { header: 'Danışman', width: 20, value: (r) => r.createdBy?.fullName ?? '' },
  { header: 'Oluşturulma', width: 14, value: (r) => formatDate(r.createdAt) },
];

/** Excel/CSV'nin Türkçe karakterleri doğru göstermesi için UTF-8 BOM. */
const BOM = '﻿';

function csvCell(value: string): string {
  // Çift tırnak kaçışı + alan ayırıcı/yeni satır içeriyorsa tırnakla
  const needsQuote = /[",\n\r;]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export function buildCsv(columns: ExportColumn[], rows: any[]): Buffer {
  const lines: string[] = [];
  lines.push(columns.map((c) => csvCell(c.header)).join(';'));
  for (const row of rows) {
    lines.push(columns.map((c) => csvCell(c.value(row))).join(';'));
  }
  return Buffer.from(BOM + lines.join('\r\n'), 'utf-8');
}

export async function buildXlsx(
  columns: ExportColumn[],
  rows: any[],
  sheetName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EstateDesk';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = columns.map((c) => ({ header: c.header, width: c.width }));

  // Başlık satırı stili — adaçayı arka plan, beyaz yazı
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4E604F' },
  };
  headerRow.alignment = { vertical: 'middle' };
  headerRow.height = 22;

  for (const row of rows) {
    sheet.addRow(columns.map((c) => c.value(row)));
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
