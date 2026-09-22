"use client";

export function printComanda(items: any[], tableNum?: string, employee?: string, note?: string) {
  const lines = items.map((it: any) => `  ${it.qty || 1}x ${it.name}`).join("\n");
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const content = `
═══════════════════════════
   CENTRAL LANCHES
   COMANDA DE PEDIDO
═══════════════════════════
Data: ${now}
${tableNum ? `Mesa: ${tableNum}` : ""}
${employee ? `Atendente: ${employee}` : ""}
───────────────────────────
ITENS:
${lines}
───────────────────────────
${note ? `Obs: ${note}` : ""}
═══════════════════════════
`.trim();

  const win = window.open("", "_blank", "width=320,height=400");
  if (!win) return;
  win.document.write(`<pre style="font-family:'Courier New',monospace;font-size:14px;margin:0;white-space:pre">${content}</pre>`);
  win.document.close();
  win.print();
}

export function printRecibo(sale: { id: string; lines: string; total: number; payment: string; received: number; created: string; employee?: string; branch?: string; note?: string | null; tip?: number; discount?: number }) {
  const items = JSON.parse(sale.lines);
  const lines = items.map((it: any) => {
    const sub = (it.price * it.qty) / 100;
    return `  ${String(it.qty).padStart(3)}x ${it.name.padEnd(22)} R$ ${sub.toFixed(2).padStart(7)}`;
  }).join("\n");
  const total = sale.total / 100;
  const received = sale.received / 100;
  const change = received - total;
  const tip = sale.tip ? sale.tip / 100 : 0;
  const discount = sale.discount ? sale.discount / 100 : 0;
  const now = new Date(sale.created).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const content = `
╔═══════════════════════════════╗
║      CENTRAL LANCHES          ║
║   Seu lanche, nossa paixão   ║
╚═══════════════════════════════╝
Data: ${now}
Venda: #${sale.id.slice(-6).toUpperCase()}
${sale.employee ? `Atendente: ${sale.employee}` : ""}
${sale.branch ? `Filial: ${sale.branch}` : ""}
───────────────────────────────
${lines}
───────────────────────────────
${discount > 0 ? `Desconto:       - R$ ${discount.toFixed(2).padStart(7)}` : ""}
${tip > 0 ? `Gorjeta:         R$ ${tip.toFixed(2).padStart(7)}` : ""}
TOTAL:           R$ ${total.toFixed(2).padStart(7)}
───────────────────────────────
Pagamento: ${sale.payment}
Recebido:  R$ ${received.toFixed(2)}
Troco:     R$ ${change.toFixed(2).padStart(7)}
───────────────────────────────
${sale.note ? `Obs: ${sale.note}` : ""}
╔═══════════════════════════════╗
║    Obrigado pela preferência! ║
║       Volte sempre!           ║
╚═══════════════════════════════╝
`.trim();

  const win = window.open("", "_blank", "width=340,height=600");
  if (!win) return;
  win.document.write(`<pre style="font-family:'Courier New',monospace;font-size:13px;margin:0;white-space:pre">${content}</pre>`);
  win.document.close();
  win.print();
}
