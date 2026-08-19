/**
 * Dependency-free report exporters.
 *
 * - `downloadCSV` serializes rows to RFC-4180-ish CSV and triggers a download.
 * - `printReport` opens a styled, print-friendly window and invokes the browser
 *   print dialog so the user can "Save as PDF" without a heavy client lib.
 */

const escapeCsv = (value) => {
  const s = value == null ? '' : String(value);
  // Quote when the field contains a delimiter, quote, or newline.
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

/**
 * Trigger a CSV download.
 * @param {string}   filename  e.g. "revenue-report.csv"
 * @param {string[]} headers   Column headers.
 * @param {Array<Array<string|number>>} rows  Row cells, aligned to headers.
 */
export const downloadCSV = (filename, headers, rows) => {
  const lines = [headers, ...rows].map((cols) => cols.map(escapeCsv).join(','));
  // Prepend BOM so Excel reads UTF-8 (₹ etc.) correctly.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/**
 * Open a print-friendly window with the given title + inner HTML body and
 * trigger the print dialog (users can choose "Save as PDF").
 * @param {string} title       Document + heading title.
 * @param {string} bodyHtml    Trusted HTML for the report body.
 */
export const printReport = (title, bodyHtml) => {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');
  if (!win) {
    // Popup blocked — surface to caller so it can toast.
    return false;
  }

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
      color: #1a2130; margin: 40px; }
    h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 26px; margin: 0 0 4px; }
    .muted { color: #5a6475; font-size: 13px; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
    .stat { border: 1px solid #ebdcd0; border-radius: 10px; padding: 14px 16px; }
    .stat .label { color: #5a6475; font-size: 12px; }
    .stat .value { font-size: 20px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ebdcd0; }
    th { color: #5a6475; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; }
    td.num, th.num { text-align: right; }
    .foot { margin-top: 28px; color: #a0aab8; font-size: 11px; }
    @media print { body { margin: 16px; } @page { margin: 16mm; } }
  </style>
</head>
<body>${bodyHtml}
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.focus(); window.print(); }, 200);
    });
  <\/script>
</body>
</html>`);
  win.document.close();
  return true;
};
