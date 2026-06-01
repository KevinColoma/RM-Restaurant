const PDFDocument = require('pdfkit');

function generatePdf(title, rows, columns) {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();

  const tableTop = doc.y;
  const colWidth = (doc.page.width - 60) / columns.length;
  let y = tableTop;

  doc.fontSize(10).font('Helvetica-Bold');
  columns.forEach((c, i) => {
    doc.text(c.label, 30 + i * colWidth, y, { width: colWidth, align: 'left' });
  });
  y += 20;

  doc.font('Helvetica').fontSize(9);
  for (const row of rows) {
    if (y > doc.page.height - 40) {
      doc.addPage();
      y = 30;
    }
    let maxH = 0;
    const cells = columns.map((c, i) => {
      const val = c.getValue(row);
      const text = val == null ? '' : String(val);
      const h = doc.heightOfString(text, { width: colWidth - 5 });
      if (h > maxH) maxH = h;
      return { text, x: 30 + i * colWidth };
    });
    cells.forEach((cell, i) => {
      doc.text(cell.text, cell.x, y, { width: colWidth - 5, align: 'left' });
    });
    y += Math.max(18, maxH + 4);
  }

  doc.end();
  return doc;
}

module.exports = { generatePdf };
