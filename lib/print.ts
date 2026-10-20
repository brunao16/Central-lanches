"use client";
import { escapeHtml } from "@/lib/format";

export function printComanda(items: any[], tableNum?: string, employee?: string, note?: string) {
  const lines = items.map((it: any) => {
    const obs = it.note ? `<div style="font-size:12px;font-style:italic;color:#333;margin-left:12px">↳ Obs: ${escapeHtml(it.note)}</div>` : "";
    return `<div style="display:flex;justify-content:space-between;font-weight:bold;font-size:15px;margin:4px 0">
      <span>${it.qty || 1}x ${escapeHtml(it.name)}</span>
    </div>${obs}`;
  }).join("");

  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Comanda - Cozinha</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; width: 72mm; margin: 4mm auto; color: #000; font-size: 13px; line-height: 1.3; }
    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
    .title { font-size: 18px; font-weight: 900; }
    .badge { display: inline-block; background: #000; color: #fff; font-size: 16px; font-weight: 800; padding: 3px 8px; border-radius: 4px; margin-top: 4px; }
    .items { border-bottom: 2px dashed #000; padding: 8px 0; }
    .footer { text-align: center; font-size: 11px; margin-top: 8px; }
    .note-box { background: #eee; padding: 6px; border-radius: 4px; margin-top: 8px; font-weight: bold; border-left: 3px solid #000; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🍔 CENTRAL LANCHES</div>
    <div style="font-size: 14px; font-weight: bold;">*** COMANDA DE COZINHA ***</div>
    ${tableNum ? `<div class="badge">MESA ${escapeHtml(tableNum)}</div>` : `<div class="badge">BALCÃO / DELIVERY</div>`}
    <div style="font-size: 11px; margin-top: 4px;">Data: ${now}</div>
    ${employee ? `<div style="font-size: 11px;">Atendente: ${escapeHtml(employee)}</div>` : ""}
  </div>

  <div class="items">
    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px;">Itens do Pedido:</div>
    ${lines}
  </div>

  ${note ? `<div class="note-box">⚠️ OBS DO PEDIDO:<br>${escapeHtml(note)}</div>` : ""}

  <div class="footer">
    --- FIM DA COMANDA ---
  </div>
  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=380,height=500");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function printRecibo(sale: { id: string; lines: string; total: number; payment: string; received: number; created: string; employee?: string; branch?: string; note?: string | null; tip?: number; discount?: number }) {
  const items = JSON.parse(sale.lines);
  const lines = items.map((it: any) => {
    const sub = (it.price * it.qty) / 100;
    return `<tr>
      <td style="padding:2px 0;font-weight:bold">${it.qty}x</td>
      <td style="padding:2px 4px">${escapeHtml(it.name)}</td>
      <td style="padding:2px 0;text-align:right">R$ ${sub.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const total = sale.total / 100;
  const received = sale.received / 100;
  const change = Math.max(0, received - total);
  const tip = sale.tip ? sale.tip / 100 : 0;
  const discount = sale.discount ? sale.discount / 100 : 0;
  const now = new Date(sale.created).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cupom #${sale.id.slice(-6).toUpperCase()}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; width: 72mm; margin: 4mm auto; color: #000; font-size: 12px; line-height: 1.3; }
    .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
    .title { font-size: 18px; font-weight: 900; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .totals { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin: 6px 0; }
    .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
    .grand-total { font-size: 16px; font-weight: 900; margin: 4px 0; }
    .footer { text-align: center; font-size: 11px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🍔 CENTRAL LANCHES</div>
    <div style="font-size: 11px; font-weight: bold;">CUPOM NÃO FISCAL</div>
    <div style="font-size: 11px;">Data: ${now}</div>
    <div style="font-size: 11px; font-weight: bold;">Pedido: #${escapeHtml(sale.id.slice(-6).toUpperCase())}</div>
    ${sale.employee ? `<div style="font-size: 11px;">Atendente: ${escapeHtml(sale.employee)}</div>` : ""}
  </div>

  <table>
    <thead>
      <tr style="border-bottom: 1px solid #000; font-size: 11px; text-transform: uppercase;">
        <th style="text-align:left;width:24px">Qtd</th>
        <th style="text-align:left">Item</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lines}
    </tbody>
  </table>

  <div class="totals">
    ${discount > 0 ? `<div class="total-row"><span>Desconto:</span><span>- R$ ${discount.toFixed(2)}</span></div>` : ""}
    ${tip > 0 ? `<div class="total-row"><span>Gorjeta:</span><span>+ R$ ${tip.toFixed(2)}</span></div>` : ""}
    <div class="total-row grand-total">
      <span>TOTAL:</span>
      <span>R$ ${total.toFixed(2)}</span>
    </div>
    <div class="total-row"><span>Pagamento:</span><span>${escapeHtml(sale.payment)}</span></div>
    <div class="total-row"><span>Recebido:</span><span>R$ ${received.toFixed(2)}</span></div>
    ${change > 0 ? `<div class="total-row" style="font-weight:bold"><span>Troco:</span><span>R$ ${change.toFixed(2)}</span></div>` : ""}
  </div>

  ${sale.note ? `<div style="font-size: 11px; margin: 4px 0;"><strong>Obs:</strong> ${escapeHtml(sale.note)}</div>` : ""}

  <div class="footer">
    Obrigado pela preferência!<br>
    Volte sempre! 😊
  </div>
  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=380,height=600");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
