import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type Row = Record<string, string | number | boolean | null | undefined>;

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

export function exportCSV(rows: Row[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename.endsWith(".csv") ? filename : filename + ".csv");
}

export function exportXLSX(sheets: { name: string; rows: Row[] }[], filename: string) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : filename + ".xlsx");
}

export function exportPDF(opts: {
  title: string;
  subtitle?: string;
  sections: { heading: string; rows: Row[] }[];
  filename: string;
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  // Header band
  doc.setFillColor(11, 25, 44);
  doc.rect(0, 0, pageW, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(opts.title, 40, 32);
  doc.setFontSize(10);
  doc.setTextColor(180, 220, 240);
  doc.text(opts.subtitle ?? `Generated ${new Date().toLocaleString()}`, 40, 50);

  let y = 90;
  for (const sec of opts.sections) {
    doc.setTextColor(11, 25, 44);
    doc.setFontSize(13);
    doc.text(sec.heading, 40, y);
    y += 6;
    if (sec.rows.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(120, 130, 140);
      doc.text("No records.", 40, y + 14);
      y += 30; continue;
    }
    const headers = Object.keys(sec.rows[0]);
    autoTable(doc, {
      startY: y + 6,
      head: [headers],
      body: sec.rows.map(r => headers.map(h => (r[h] == null ? "" : String(r[h])))),
      styles: { fontSize: 8, cellPadding: 4, textColor: [30, 41, 59] },
      headStyles: { fillColor: [0, 141, 218], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      margin: { left: 40, right: 40 },
    });
    // @ts-ignore - autoTable adds lastAutoTable to doc
    y = (doc as any).lastAutoTable.finalY + 24;
    if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 60; }
  }
  doc.save(opts.filename.endsWith(".pdf") ? opts.filename : opts.filename + ".pdf");
}
