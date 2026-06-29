import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import PDFDocument from 'pdfkit';
import type { Dealer, Order, OrderItem } from '@prisma/client';
import { getCompanyProfile } from '../common/config/company.config';
import { getUploadRoot } from '../common/utils/file-storage.util';

export type OrderForProforma = Order & {
  dealer: Dealer;
  items: OrderItem[];
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAGE_BOTTOM = PAGE_HEIGHT - MARGIN;

const BRAND_GREEN = '#7ab82e';
const BRAND_GREEN_DARK = '#5a9420';
const TEXT_PRIMARY = '#1d1d1f';
const TEXT_SECONDARY = '#6e6e73';
const TEXT_MUTED = '#86868b';
const BORDER = '#e5e5ea';
const BORDER_STRONG = '#c7c7cc';
const SURFACE = '#f5f5f7';
const SURFACE_GREEN = '#f3f9eb';

const TABLE_COLUMNS = [
  { key: 'partNo', label: 'Part No', width: 64, align: 'left' as const },
  { key: 'partName', label: 'Part Name', width: 230, align: 'left' as const },
  { key: 'qty', label: 'Qty', width: 32, align: 'center' as const },
  { key: 'unit', label: 'Unit (₹)', width: 66, align: 'right' as const },
  { key: 'gst', label: 'GST (₹)', width: 58, align: 'right' as const },
  { key: 'total', label: 'Total (₹)', width: 67, align: 'right' as const },
];

function money(value: unknown) {
  const num = Number(value);
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildProformaInvoiceNo(orderNo: string, referenceDate: Date = new Date()) {
  const year = String(referenceDate.getFullYear()).slice(-2);
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  const sequence = orderNo.replace(/\D/g, '').slice(-4).padStart(4, '0');
  return `PI-${year}${month}${day}-${sequence}`;
}

export function isLegacyProformaInvoiceNo(invoiceNo: string) {
  return invoiceNo.startsWith('PI-ORD-');
}

export function resolveProformaInvoiceNo(
  orderNo: string,
  createdAt: Date,
  existingInvoiceNo?: string | null,
) {
  if (existingInvoiceNo && !isLegacyProformaInvoiceNo(existingInvoiceNo)) {
    return existingInvoiceNo;
  }
  return buildProformaInvoiceNo(orderNo, createdAt);
}

type PdfContext = {
  doc: InstanceType<typeof PDFDocument>;
  y: number;
};

function columnOffsets() {
  const offsets: number[] = [];
  let x = MARGIN;
  for (const col of TABLE_COLUMNS) {
    offsets.push(x);
    x += col.width;
  }
  return offsets;
}

function ensureSpace(ctx: PdfContext, needed: number) {
  if (ctx.y + needed > PAGE_BOTTOM) {
    ctx.doc.addPage();
    ctx.y = MARGIN;
    return true;
  }
  return false;
}

function setFill(doc: InstanceType<typeof PDFDocument>, color: string) {
  doc.fillColor(color);
}

function textHeight(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  width: number,
  options: { bold?: boolean; size?: number } = {},
) {
  doc.font(options.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(options.size ?? 9);
  return doc.heightOfString(text || '—', { width });
}

function drawBoundedText(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  x: number,
  y: number,
  width: number,
  options: {
    align?: 'left' | 'center' | 'right';
    font?: string;
    size?: number;
    color?: string;
    bold?: boolean;
    singleLine?: boolean;
  } = {},
) {
  const font = options.bold ? 'Helvetica-Bold' : options.font ?? 'Helvetica';
  const size = options.size ?? 9;
  setFill(doc, options.color ?? TEXT_PRIMARY);
  doc.font(font).fontSize(size);
  doc.text(text || '—', x, y, {
    width,
    align: options.align ?? 'left',
    lineBreak: !options.singleLine,
    ellipsis: options.singleLine,
    height: options.singleLine ? size * 1.35 : undefined,
  });
}

function drawRect(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: { fill?: string; stroke?: string },
) {
  doc.save();
  if (options?.fill) {
    doc.fillColor(options.fill).rect(x, y, w, h).fill();
  }
  if (options?.stroke) {
    doc.strokeColor(options.stroke).rect(x, y, w, h).stroke();
  }
  doc.restore();
}

function drawHLine(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  w: number,
  color = BORDER,
) {
  doc.save().strokeColor(color).moveTo(x, y).lineTo(x + w, y).stroke().restore();
}

function drawVLine(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y1: number,
  y2: number,
  color = BORDER,
) {
  doc.save().strokeColor(color).moveTo(x, y1).lineTo(x, y2).stroke().restore();
}

function drawCellText(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  x: number,
  y: number,
  width: number,
  options: {
    align?: 'left' | 'center' | 'right';
    font?: string;
    size?: number;
    color?: string;
    bold?: boolean;
    singleLine?: boolean;
  } = {},
) {
  const padX = 8;
  drawBoundedText(doc, text, x + padX, y, width - padX * 2, {
    align: options.align ?? 'left',
    font: options.font,
    size: options.size ?? 9,
    color: options.color ?? TEXT_PRIMARY,
    bold: options.bold,
    singleLine: options.singleLine ?? options.align !== 'left',
  });
}

function drawSectionLabel(
  doc: InstanceType<typeof PDFDocument>,
  label: string,
  x: number,
  y: number,
) {
  setFill(doc, TEXT_MUTED);
  doc.font('Helvetica-Bold').fontSize(7.5);
  doc.text(label.toUpperCase(), x, y, { lineBreak: false });
}

function drawCompanyHeader(ctx: PdfContext, company: ReturnType<typeof getCompanyProfile>) {
  const { doc } = ctx;
  const headerHeight = 92;
  const top = ctx.y;

  drawRect(doc, MARGIN, top, CONTENT_WIDTH, headerHeight, { fill: BRAND_GREEN });
  drawHLine(doc, MARGIN, top + headerHeight, CONTENT_WIDTH, BRAND_GREEN_DARK);

  setFill(doc, '#ffffff');
  doc.font('Helvetica-Bold').fontSize(17);
  drawBoundedText(doc, company.legalName, MARGIN + 18, top + 16, CONTENT_WIDTH - 36, { singleLine: true });

  doc.font('Helvetica').fontSize(8.5);
  drawBoundedText(
    doc,
    `${company.addressLine1}, ${company.addressLine2}`,
    MARGIN + 18,
    top + 38,
    CONTENT_WIDTH - 36,
  );

  doc.fontSize(8);
  drawBoundedText(
    doc,
    `GSTIN ${company.gstin}  ·  PAN ${company.pan}  ·  ${company.email}  ·  ${company.phone}`,
    MARGIN + 18,
    top + 54,
    CONTENT_WIDTH - 36,
  );

  setFill(doc, TEXT_PRIMARY);
  ctx.y = top + headerHeight + 22;

  doc.font('Helvetica-Bold').fontSize(13);
  doc.text('PROFORMA INVOICE', MARGIN, ctx.y, { width: CONTENT_WIDTH, align: 'center', lineBreak: false });
  ctx.y += 18;
  drawHLine(doc, MARGIN + CONTENT_WIDTH * 0.32, ctx.y, CONTENT_WIDTH * 0.36, BRAND_GREEN);
  ctx.y += 16;
}

function drawMetaAndBillTo(
  ctx: PdfContext,
  order: OrderForProforma,
  invoiceNo: string,
  company: ReturnType<typeof getCompanyProfile>,
) {
  const { doc } = ctx;
  const boxTop = ctx.y;
  const leftWidth = Math.floor(CONTENT_WIDTH * 0.54);
  const rightWidth = CONTENT_WIDTH - leftWidth;
  const leftPad = 14;
  const leftTextWidth = leftWidth - leftPad * 2;
  const rightX = MARGIN + leftWidth + leftPad;
  const metaLabelWidth = 88;
  const metaValueWidth = rightWidth - leftPad - metaLabelWidth - 8;

  const billLines = [
    `Code: ${order.dealer.dealerCode}`,
    order.dealer.email,
    order.dealer.gstNumber ? `GSTIN: ${order.dealer.gstNumber}` : null,
    order.contactPerson ? `Contact: ${order.contactPerson}` : null,
    order.mobile ? `Mobile: ${order.mobile}` : null,
    order.email ? `Order email: ${order.email}` : null,
  ].filter(Boolean) as string[];

  const dateStr = order.createdAt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const metaRows: [string, string][] = [
    ['Proforma No', invoiceNo],
    ['Order No', order.orderNo],
    ['Date', dateStr],
    ['Supplier GSTIN', company.gstin],
  ];

  const dealerNameHeight = textHeight(doc, order.dealer.dealerName, leftTextWidth, { bold: true, size: 11 });
  const billLinesHeight = billLines.reduce(
    (sum, line) => sum + textHeight(doc, line, leftTextWidth, { size: 8.5 }) + 2,
    0,
  );
  const leftContentHeight = 30 + dealerNameHeight + 6 + billLinesHeight;

  const metaRowsHeight = metaRows.reduce((sum, [label, value]) => {
    const labelH = textHeight(doc, label, metaLabelWidth, { size: 8.5 });
    const valueH = textHeight(doc, value, metaValueWidth, { bold: true, size: 8.5 });
    return sum + Math.max(labelH, valueH) + 4;
  }, 0);
  const rightContentHeight = 30 + metaRowsHeight;

  const boxHeight = Math.max(120, 22 + Math.max(leftContentHeight, rightContentHeight) + 12);

  drawRect(doc, MARGIN, boxTop, CONTENT_WIDTH, boxHeight, { stroke: BORDER_STRONG });
  drawRect(doc, MARGIN, boxTop, CONTENT_WIDTH, 22, { fill: SURFACE });

  drawSectionLabel(doc, 'Bill To', MARGIN + leftPad, boxTop + 7);
  drawSectionLabel(doc, 'Document Details', rightX, boxTop + 7);
  drawVLine(doc, MARGIN + leftWidth, boxTop, boxTop + boxHeight, BORDER);

  drawBoundedText(doc, order.dealer.dealerName, MARGIN + leftPad, boxTop + 30, leftTextWidth, {
    bold: true,
    size: 11,
    singleLine: true,
  });

  let billY = boxTop + 30 + dealerNameHeight + 6;
  for (const line of billLines) {
    const lineHeight = textHeight(doc, line, leftTextWidth, { size: 8.5 });
    drawBoundedText(doc, line, MARGIN + leftPad, billY, leftTextWidth, {
      size: 8.5,
      color: TEXT_SECONDARY,
    });
    billY += lineHeight + 2;
  }

  let metaY = boxTop + 30;
  for (const [label, value] of metaRows) {
    drawBoundedText(doc, label, rightX, metaY, metaLabelWidth, {
      size: 8.5,
      color: TEXT_MUTED,
      singleLine: true,
    });
    drawBoundedText(doc, value, rightX + metaLabelWidth + 8, metaY, metaValueWidth, {
      bold: true,
      size: 8.5,
      align: 'right',
    });
    const rowHeight = Math.max(
      textHeight(doc, label, metaLabelWidth, { size: 8.5 }),
      textHeight(doc, value, metaValueWidth, { bold: true, size: 8.5 }),
    );
    metaY += rowHeight + 4;
  }

  ctx.y = boxTop + boxHeight + 14;

  if (order.shippingAddress) {
    const shipTop = ctx.y;
    const shipPad = 14;
    const shipTextWidth = CONTENT_WIDTH - shipPad * 2;
    const addressHeight = textHeight(doc, order.shippingAddress, shipTextWidth, { size: 8.5 });
    const shipHeight = Math.max(48, 22 + addressHeight + 14);
    drawRect(doc, MARGIN, shipTop, CONTENT_WIDTH, shipHeight, { fill: SURFACE, stroke: BORDER });
    drawSectionLabel(doc, 'Shipping Address', MARGIN + shipPad, shipTop + 8);
    drawBoundedText(doc, order.shippingAddress, MARGIN + shipPad, shipTop + 22, shipTextWidth, {
      size: 8.5,
    });
    ctx.y = shipTop + shipHeight + 14;
  }
}

const TABLE_HEADER_HEIGHT = 26;
const TABLE_MIN_ROW_HEIGHT = 28;
const colOffsets = columnOffsets();

function drawTableHeaderRow(ctx: PdfContext, y: number) {
  const { doc } = ctx;
  drawRect(doc, MARGIN, y, CONTENT_WIDTH, TABLE_HEADER_HEIGHT, { fill: '#eef0f3', stroke: BORDER });
  setFill(doc, TEXT_MUTED);
  doc.font('Helvetica-Bold').fontSize(7.5);

  TABLE_COLUMNS.forEach((col, i) => {
    drawBoundedText(doc, col.label.toUpperCase(), colOffsets[i] + 8, y + 9, col.width - 16, {
      align: col.align,
      size: 7.5,
      color: TEXT_MUTED,
      bold: true,
      singleLine: true,
    });
  });
}

function measureRowHeight(doc: InstanceType<typeof PDFDocument>, item: OrderItem) {
  doc.font('Helvetica').fontSize(9);
  const nameHeight = doc.heightOfString(item.partName, { width: TABLE_COLUMNS[1].width - 16 });
  doc.fontSize(8.5);
  const partNoHeight = doc.heightOfString(item.partNumber, { width: TABLE_COLUMNS[0].width - 16 });
  return Math.max(TABLE_MIN_ROW_HEIGHT, Math.ceil(Math.max(nameHeight, partNoHeight)) + 16);
}

function drawTableRow(
  ctx: PdfContext,
  item: OrderItem,
  y: number,
  rowHeight: number,
  stripe: boolean,
) {
  const { doc } = ctx;

  if (stripe) {
    drawRect(doc, MARGIN, y, CONTENT_WIDTH, rowHeight, { fill: '#fafbfc' });
  }
  drawHLine(doc, MARGIN, y + rowHeight, CONTENT_WIDTH, BORDER);

  const values = [
    item.partNumber,
    item.partName,
    String(item.quantity),
    money(item.unitPrice),
    money(item.gstAmount),
    money(item.totalAmount),
  ];

  const textY = y + 8;

  TABLE_COLUMNS.forEach((col, i) => {
    const isTotal = col.key === 'total';
    const color =
      col.key === 'partNo' || col.key === 'partName' || isTotal ? TEXT_PRIMARY : TEXT_SECONDARY;

    drawCellText(doc, values[i], colOffsets[i], textY, col.width, {
      align: col.align,
      bold: isTotal,
      color,
      size: col.key === 'partName' ? 9 : 8.5,
      singleLine: col.key !== 'partName',
    });
  });

  for (let i = 1; i < colOffsets.length; i += 1) {
    drawVLine(doc, colOffsets[i], y, y + rowHeight, BORDER);
  }
}

function drawItemsTable(ctx: PdfContext, items: OrderItem[]) {
  const { doc } = ctx;
  let tableTop = ctx.y;

  const startTableSection = () => {
    tableTop = ctx.y;
    drawTableHeaderRow(ctx, tableTop);
    ctx.y = tableTop + TABLE_HEADER_HEIGHT;
  };

  ensureSpace(ctx, TABLE_HEADER_HEIGHT + TABLE_MIN_ROW_HEIGHT);
  startTableSection();

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const rowHeight = measureRowHeight(doc, item);

    if (ensureSpace(ctx, rowHeight)) {
      drawVLine(doc, MARGIN, tableTop, ctx.y, BORDER_STRONG);
      drawVLine(doc, MARGIN + CONTENT_WIDTH, tableTop, ctx.y, BORDER_STRONG);
      drawHLine(doc, MARGIN, ctx.y, CONTENT_WIDTH, BORDER_STRONG);
      startTableSection();
    }

    const rowY = ctx.y;
    drawTableRow(ctx, item, rowY, rowHeight, index % 2 === 1);
    ctx.y = rowY + rowHeight;
  }

  const tableBottom = ctx.y;
  drawHLine(doc, MARGIN, tableTop, CONTENT_WIDTH, BORDER_STRONG);
  drawVLine(doc, MARGIN, tableTop, tableBottom, BORDER_STRONG);
  drawVLine(doc, MARGIN + CONTENT_WIDTH, tableTop, tableBottom, BORDER_STRONG);

  ctx.y = tableBottom + 18;
}

function drawTotals(ctx: PdfContext, order: OrderForProforma) {
  const { doc } = ctx;
  const boxWidth = 252;
  const boxX = MARGIN + CONTENT_WIDTH - boxWidth;
  const freight = Number(order.freightCharge);

  const rows: [string, string][] = [
    ['Subtotal', `₹ ${money(order.subtotal)}`],
    ['GST', `₹ ${money(order.gstAmount)}`],
  ];
  if (freight > 0) {
    rows.push(['Freight', `₹ ${money(order.freightCharge)}`]);
  }
  rows.push(['Grand Total', `₹ ${money(order.grandTotal)}`]);

  const boxHeight = 14 + rows.length * 20 + 8;
  ensureSpace(ctx, boxHeight + 8);

  const boxTop = ctx.y;
  drawRect(doc, boxX, boxTop, boxWidth, boxHeight, { stroke: BORDER_STRONG });

  let lineY = boxTop + 12;
  for (const [label, value] of rows) {
    const isGrand = label === 'Grand Total';
    if (isGrand) {
      drawRect(doc, boxX + 1, lineY - 6, boxWidth - 2, 24, { fill: SURFACE_GREEN });
    }

    drawBoundedText(doc, label, boxX + 14, lineY, 100, {
      size: isGrand ? 10 : 9,
      color: isGrand ? BRAND_GREEN_DARK : TEXT_SECONDARY,
      bold: isGrand,
      singleLine: true,
    });
    drawBoundedText(doc, value, boxX + 120, lineY, boxWidth - 134, {
      align: 'right',
      size: isGrand ? 10 : 9,
      color: isGrand ? BRAND_GREEN_DARK : TEXT_PRIMARY,
      bold: isGrand,
      singleLine: true,
    });
    lineY += 20;
  }

  ctx.y = boxTop + boxHeight + 20;
}

function drawBankDetails(ctx: PdfContext, company: ReturnType<typeof getCompanyProfile>) {
  const { doc } = ctx;
  const pad = 14;
  const colSplit = MARGIN + CONTENT_WIDTH / 2;
  const leftX = MARGIN + pad;
  const rightX = colSplit + 8;
  const labelWidth = 88;
  const leftValueWidth = colSplit - leftX - labelWidth - 8;
  const rightValueWidth = MARGIN + CONTENT_WIDTH - rightX - labelWidth - 8 - pad;

  const bankRows: [string, string][] = [
    ['Account Name', company.bankAccountName],
    ['Bank Name', company.bankName || '—'],
    ['Account Number', company.bankAccountNumber || '—'],
    ['IFSC Code', company.bankIfsc || '—'],
    ['Branch', company.bankBranch || '—'],
    ['Account Type', company.bankAccountType || '—'],
  ];

  const rowHeights = bankRows.map(([label, value], index) => {
    const valueWidth = index % 2 === 0 ? leftValueWidth : rightValueWidth;
    return Math.max(
      textHeight(doc, label, labelWidth, { size: 8.5 }),
      textHeight(doc, value, valueWidth, { bold: true, size: 8.5 }),
    );
  });

  const leftRows = [0, 2, 4].map((i) => rowHeights[i] + 3);
  const rightRows = [1, 3, 5].map((i) => rowHeights[i] + 3);
  const gridHeight = Math.max(
    leftRows.reduce((sum, h) => sum + h, 0),
    rightRows.reduce((sum, h) => sum + h, 0),
  );

  const footerNote =
    'Quote the Proforma Invoice No. in your payment reference when remitting funds.';
  const footerHeight = textHeight(doc, footerNote, CONTENT_WIDTH - pad * 2, { size: 7.5 });
  const boxHeight = 24 + gridHeight + footerHeight + 20;
  ensureSpace(ctx, boxHeight + 8);

  const boxTop = ctx.y;
  drawRect(doc, MARGIN, boxTop, CONTENT_WIDTH, boxHeight, { fill: SURFACE_GREEN, stroke: BORDER });
  drawRect(doc, MARGIN, boxTop, CONTENT_WIDTH, 24, { fill: BRAND_GREEN });
  drawBoundedText(doc, 'BANK DETAILS FOR PAYMENT', MARGIN + pad, boxTop + 8, CONTENT_WIDTH - pad * 2, {
    color: '#ffffff',
    bold: true,
    size: 8.5,
    singleLine: true,
  });

  let leftY = boxTop + 34;
  let rightY = boxTop + 34;

  bankRows.forEach(([label, value], index) => {
    const isLeft = index % 2 === 0;
    const x = isLeft ? leftX : rightX;
    const y = isLeft ? leftY : rightY;
    const valueWidth = isLeft ? leftValueWidth : rightValueWidth;

    drawBoundedText(doc, label, x, y, labelWidth, { size: 8.5, color: TEXT_MUTED, singleLine: true });
    drawBoundedText(doc, value, x + labelWidth + 8, y, valueWidth, {
      bold: true,
      size: 8.5,
    });

    if (isLeft) leftY += rowHeights[index] + 3;
    else rightY += rowHeights[index] + 3;
  });

  drawBoundedText(doc, footerNote, MARGIN + pad, boxTop + boxHeight - footerHeight - 8, CONTENT_WIDTH - pad * 2, {
    size: 7.5,
    color: TEXT_MUTED,
  });

  ctx.y = boxTop + boxHeight + 18;
}

function drawFooter(ctx: PdfContext) {
  const { doc } = ctx;
  ensureSpace(ctx, 48);
  drawHLine(doc, MARGIN, ctx.y, CONTENT_WIDTH, BORDER);
  ctx.y += 12;

  setFill(doc, TEXT_MUTED);
  doc.font('Helvetica').fontSize(7.5);
  doc.text(
    'Computer-generated proforma invoice · CEV Engineering Private Limited · No signature required',
    MARGIN,
    ctx.y,
    { width: CONTENT_WIDTH, align: 'center', lineBreak: false },
  );
  ctx.y += 12;
  doc.text('Billing enquiries: customer.cev@knc-korea.com', MARGIN, ctx.y, {
    width: CONTENT_WIDTH,
    align: 'center',
    lineBreak: false,
  });
}

export async function generateProformaInvoicePdf(
  order: OrderForProforma,
  invoiceNo: string,
): Promise<Buffer> {
  const company = getCompanyProfile();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const ctx: PdfContext = { doc, y: MARGIN };

    drawCompanyHeader(ctx, company);
    drawMetaAndBillTo(ctx, order, invoiceNo, company);
    drawItemsTable(ctx, order.items);
    drawTotals(ctx, order);
    drawBankDetails(ctx, company);
    drawFooter(ctx);

    doc.end();
  });
}

export async function saveProformaInvoicePdf(orderId: string, buffer: Buffer) {
  const storedName = `${randomUUID()}.pdf`;
  const dir = join(getUploadRoot(), 'invoices', orderId);
  await mkdir(dir, { recursive: true });

  const diskPath = join(dir, storedName);
  await writeFile(diskPath, buffer);

  return {
    diskPath,
    fileUrl: `/uploads/invoices/${orderId}/${storedName}`,
  };
}
