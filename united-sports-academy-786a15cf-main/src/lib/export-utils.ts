import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type ExportRow = Record<string, unknown>;

export function exportCSV(rows: ExportRow[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${filename}.csv`);
}

export function exportExcel(rows: ExportRow[], filename: string, sheet = "Sheet1") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPDF(rows: ExportRow[], filename: string, title?: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  if (title) doc.text(title, 14, 14);
  if (rows.length) {
    const headers = Object.keys(rows[0]);
    autoTable(doc, {
      startY: title ? 20 : 10,
      head: [headers],
      body: rows.map((r) => headers.map((h) => (r[h] === null || r[h] === undefined ? "" : String(r[h])))),
      styles: { fontSize: 8 },
    });
  }
  doc.save(`${filename}.pdf`);
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
