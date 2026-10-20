export function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return '"' + (/^[\s]*[=+@-]/.test(text) ? "'" : "") + text.replaceAll('"', '""') + '"';
}
