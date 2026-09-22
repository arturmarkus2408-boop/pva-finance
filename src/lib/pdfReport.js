// Настоящий PDF-файл отчёта — чтобы его можно было отправить в Telegram и другие
// приложения через меню «Поделиться». Библиотеки и шрифт грузятся только при первом
// нажатии, поэтому само приложение от этого не тяжелеет.
// Шрифт DejaVu Sans (свободная лицензия, public/fonts/DejaVu-LICENSE.txt) нужен,
// потому что встроенные шрифты PDF не умеют кириллицу.

let cache = null;

const toBase64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
};

// Заранее загрузить всё нужное (вызывается при открытии вкладки «Отчёт»),
// чтобы потом PDF собирался мгновенно и телефон не отменял «Поделиться» из-за паузы.
export const preloadPdfTools = () => {
  if (!cache) {
    cache = Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
      fetch('/fonts/DejaVuSans.ttf').then(r => { if (!r.ok) throw new Error('font'); return r.arrayBuffer(); }),
      fetch('/fonts/DejaVuSans-Bold.ttf').then(r => { if (!r.ok) throw new Error('font'); return r.arrayBuffer(); })
    ]).then(([jspdfMod, autoMod, reg, bold]) => ({
      jsPDF: jspdfMod.jsPDF || jspdfMod.default,
      autoTable: autoMod.default || autoMod.autoTable,
      reg: toBase64(reg),
      bold: toBase64(bold)
    })).catch(err => { cache = null; throw err; });
  }
  return cache;
};

// report = { title, subtitle, kpis: [{label, value, tone}], head: [..], rows: [[..]], rowTones: ['income'|'expense'], footer }
export const buildReportPdf = async (report) => {
  const { jsPDF, autoTable, reg, bold } = await preloadPdfTools();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.addFileToVFS('DejaVuSans.ttf', reg);
  doc.addFont('DejaVuSans.ttf', 'DejaVu', 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', bold);
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVu', 'bold');
  doc.setFont('DejaVu', 'normal');

  const W = doc.internal.pageSize.getWidth();
  const M = 12;
  doc.setTextColor(27, 40, 69);
  doc.setFont('DejaVu', 'bold'); doc.setFontSize(16);
  doc.text(report.title, M, 16);
  doc.setFont('DejaVu', 'normal'); doc.setFontSize(9); doc.setTextColor(107, 114, 128);
  if (report.subtitle) doc.text(report.subtitle, M, 22);

  // Итоговые показатели — четыре плашки в ряд
  const kpis = report.kpis || [];
  const gap = 3;
  const boxW = (W - M * 2 - gap * (kpis.length - 1)) / Math.max(kpis.length, 1);
  kpis.forEach((k, i) => {
    const x = M + i * (boxW + gap);
    doc.setDrawColor(229, 231, 235); doc.roundedRect(x, 27, boxW, 16, 2, 2);
    const col = k.tone === 'income' ? [30, 92, 58] : k.tone === 'expense' ? [139, 32, 32] : [27, 40, 69];
    doc.setFontSize(7); doc.setTextColor(...col); doc.text(String(k.label).toUpperCase(), x + 3, 32);
    doc.setFont('DejaVu', 'bold'); doc.setFontSize(10);
    doc.text(String(k.value), x + 3, 39, { maxWidth: boxW - 6 });
    doc.setFont('DejaVu', 'normal');
  });

  autoTable(doc, {
    startY: 48,
    head: [report.head],
    body: report.rows,
    margin: { left: M, right: M },
    styles: { font: 'DejaVu', fontSize: 8, cellPadding: 2, textColor: [27, 40, 69], overflow: 'linebreak' },
    headStyles: { font: 'DejaVu', fontStyle: 'bold', fillColor: [27, 40, 69], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles: { 0: { cellWidth: 23 }, [report.head.length - 1]: { halign: 'right', cellWidth: 32 } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === report.head.length - 1) {
        const tone = (report.rowTones || [])[data.row.index];
        data.cell.styles.textColor = tone === 'income' ? [30, 92, 58] : [139, 32, 32];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  if (report.footer) {
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(7); doc.setTextColor(156, 163, 175);
      doc.text(report.footer + '  ·  ' + p + '/' + pages, W - M, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
    }
  }
  return doc.output('blob');
};
