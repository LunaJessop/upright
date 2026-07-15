/**
 * Escape a CSV cell (RFC 4180-ish).
 */
function escapeCsvCell(value) {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string from headers + row objects.
 * @param {string[]} headers
 * @param {Record<string, unknown>[]} rows
 * @param {(row: Record<string, unknown>, header: string) => unknown} [getValue]
 */
export function rowsToCsv(headers, rows, getValue) {
  const getter =
    getValue ??
    ((row, header) => row[header]);
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(getter(row, h))).join(","));
  }
  return lines.join("\n");
}

/**
 * Trigger a browser download of CSV text.
 */
export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
