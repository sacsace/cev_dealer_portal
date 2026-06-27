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

export function buildProformaInvoiceNo(orderNo: string) {
  return `PI-${orderNo}`;
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
  } = {},
) {
  const padX = 8;
  const font = options.bold ? 'Helvetica-Bold' : options.font ?? 'Helvetica';
  const size = options.size ?? 9;
  setFill(doc, options.color ?? TEXT_PRIMARY);
  doc.font(font).fontSize(size);
  doc.text(text, x + padX, y, {
    width: width - padX * 2,
    align: options.align ?? 'left',
    lineBreak: true,
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
  doc.text(company.legalName, MARGIN + 18, top + 16, { width: CONTENT_WIDTH - 36, lineBreak: false });

  doc.font('Helvetica').fontSize(8.5);
  doc.text(`${company.addressLine1}, ${company.addressLine2}`, MARGIN + 18, top + 38, {
    width: CONTENT_WIDTH - 36,
    lineBreak: false,
  });

  doc.fontSize(8);
  doc.text(
    `GSTIN ${company.gstin}  ·  PAN ${company.pan}  ·  ${company.email}  ·  ${company.phone}`,
    MARGIN + 18,
    top + 54,
    { width: CONTENT_WIDTH - 36, lineBreak: false },
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
  const boxHeight = 120;

  drawRect(doc, MARGIN, boxTop, CONTENT_WIDTH, boxHeight, { stroke: BORDER_STRONG });
  drawRect(doc, MARGIN, boxTop, CONTENT_WIDTH, 22, { fill: SURFACE });

  drawSectionLabel(doc, 'Bill To', MARGIN + 14, boxTop + 7);
  drawSectionLabel(doc, 'Document Details', MARGIN + leftWidth + 14, boxTop + 7);
  drawVLine(doc, MARGIN + leftWidth, boxTop, boxTop + boxHeight, BORDER);

  setFill(doc, TEXT_PRIMARY);
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(order.dealer.dealerName, MARGIN + 14, boxTop + 30, {
    width: leftWidth - 28,
    lineBreak: false,
  });

  const billLines = [
    `Code: ${order.dealer.dealerCode}`,
    order.dealer.email,
    order.dealer.gstNumber ? `GSTIN: ${order.dealer.gstNumber}` : null,
    order.contactPerson ? `Contact: ${order.contactPerson}` : null,
    order.mobile ? `Mobile: ${order.mobile}` : null,
    order.email ? `Order email: ${order.email}` : null,
  ].filter(Boolean) as string[];

  let billY = boxTop + 46;
  doc.font('Helvetica').fontSize(8.5);
  setFill(doc, TEXT_SECONDARY);
  for (const line of billLines) {
    doc.text(line, MARGIN + 14, billY, { width: leftWidth - 28, lineBreak: false });
    billY += 12;
  }

  const dateStr = order.createdAt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const rightX = MARGIN + leftWidth + 14;
  const metaRows: [string, string][] = [
    ['Proforma No', invoiceNo],
    ['Order No', order.orderNo],
    ['Date', dateStr],
    ['Supplier GSTIN', company.gstin],
  ];

  let metaY = boxTop + 30;
  for (const [label, value] of metaRows) {
    setFill(doc, TEXT_MUTED);
    doc.font('Helvetica').fontSize(8.5);
    doc.text(label, rightX, metaY, { width: 88, lineBreak: false });
    setFill(doc, TEXT_PRIMARY);
    doc.font('Helvetica-Bold').fontSize(8.5);
    doc.text(value, rightX + 92, metaY, { width: rightWidth - 106, lineBreak: false });
    metaY += 16;
  }

  ctx.y = boxTop + boxHeight + 14;

  if (order.shippingAddress) {
    const shipTop = ctx.y;
    const shipHeight = 48;
    drawRect(doc, MARGIN, shipTop, CONTENT_WIDTH, shipHeight, { fill: SURFACE, stroke: BORDER });
    drawSectionLabel(doc, 'Shipping Address', MARGIN + 14, shipTop + 8);
    setFill(doc, TEXT_PRIMARY);
    doc.font('Helvetica').fontSize(8.5);
    doc.text(order.shippingAddress, MARGIN + 14, shipTop + 22, { width: CONTENT_WIDTH - 28 });
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
    doc.text(col.label.toUpperCase(), colOffsets[i] + 8, y + 9, {
      width: col.width - 16,
      align: col.align,
      lineBreak: false,
    });
  });
}

function measureRowHeight(doc: InstanceType<typeof PDFDocument>, item: OrderItem) {
  doc.font('Helvetica').fontSize(9);
  const nameCol = TABLE_COLUMNS[1];
  const nameHeight = doc.heightOfString(item.partName, { width: nameCol.width - 16 });
  return Math.max(TABLE_MIN_ROW_HEIGHT, Math.ceil(nameHeight) + 16);
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
      setFill(doc, BRAND_GREEN_DARK);
      doc.font('Helvetica-Bold').fontSize(10);
    } else {
      setFill(doc, TEXT_SECONDARY);
      doc.font('Helvetica').fontSize(9);
    }

    doc.text(label, boxX + 14, lineY, { width: 100, lineBreak: false });
    setFill(doc, isGrand ? BRAND_GREEN_DARK : TEXT_PRIMARY);
    doc.font(isGrand ? 'Helvetica-Bold' : 'Helvetica').fontSize(isGrand ? 10 : 9);
    doc.text(value, boxX + 120, lineY, { width: boxWidth - 134, align: 'right', lineBreak: false });
    lineY += 20;
  }

  ctx.y = boxTop + boxHeight + 20;
}

function drawBankDetails(ctx: PdfContext, company: ReturnType<typeof getCompanyProfile>) {
  const { doc } = ctx;
  const boxHeight = 118;
  ensureSpace(ctx, boxHeight + 8);

  const boxTop = ctx.y;
  drawRect(doc, MARGIN, boxTop, CONTENT_WIDTH, boxHeight, { fill: SURFACE_GREEN, stroke: BORDER });
  drawRect(doc, MARGIN, boxTop, CONTENT_WIDTH, 24, { fill: BRAND_GREEN });
  setFill(doc, '#ffffff');
  doc.font('Helvetica-Bold').fontSize(8.5);
  doc.text('BANK DETAILS FOR PAYMENT', MARGIN + 14, boxTop + 8, { lineBreak: false });

  const bankRows: [string, string][] = [
    ['Account Name', company.bankAccountName],
    ['Bank Name', company.bankName || '—'],
    ['Account Number', company.bankAccountNumber || '—'],
    ['IFSC Code', company.bankIfsc || '—'],
    ['Branch', company.bankBranch || '—'],
    ['Account Type', company.bankAccountType || '—'],
  ];

  const colSplit = MARGIN + CONTENT_WIDTH / 2;
  let leftY = boxTop + 34;
  let rightY = boxTop + 34;

  doc.font('Helvetica').fontSize(8.5);
  bankRows.forEach(([label, value], index) => {
    const isLeft = index % 2 === 0;
    const x = isLeft ? MARGIN + 14 : colSplit + 8;
    const y = isLeft ? leftY : rightY;

    setFill(doc, TEXT_MUTED);
    doc.text(label, x, y, { width: 88, lineBreak: false });
    setFill(doc, TEXT_PRIMARY);
    doc.font('Helvetica-Bold').fontSize(8.5);
    doc.text(value, x + 92, y, { width: 150, lineBreak: false });
    doc.font('Helvetica');

    if (isLeft) leftY += 15;
    else rightY += 15;
  });

  setFill(doc, TEXT_MUTED);
  doc.fontSize(7.5);
  doc.text(
    'Quote the Proforma Invoice No. in your payment reference when remitting funds.',
    MARGIN + 14,
    boxTop + boxHeight - 16,
    { width: CONTENT_WIDTH - 28, lineBreak: false },
  );

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
