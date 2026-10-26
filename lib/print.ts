import { formatCurrency } from "./utils";

export interface PrintOrderData {
  code: string;
  type: string;
  tableNumber?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  createdAt: string | Date;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    notes?: string | null;
  }>;
  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  notes?: string | null;
}

export function printReceipt(order: PrintOrderData, target: "CUSTOMER" | "KITCHEN" = "CUSTOMER") {
  const isKitchen = target === "KITCHEN";
  const dateStr = new Date(order.createdAt).toLocaleString("pt-BR");

  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pedido #${order.code}</title>
  <style>
    @page { margin: 0; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.25;
      width: 76mm;
      margin: 0 auto;
      padding: 10px;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .title { font-size: 16px; margin-bottom: 2px; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .item-row { display: flex; justify-content: space-between; margin: 4px 0; }
    .notes { font-size: 13px; font-weight: bold; text-transform: uppercase; padding: 3px 6px; margin-top: 3px; background: #eee; border-left: 3px solid #000; }
    .tag { font-size: 18px; padding: 4px; border: 1px solid #000; display: inline-block; margin: 6px 0; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="title bold">${isKitchen ? "--- COMANDA COZINHA ---" : "CENTRAL LANCHES"}</div>
    <div>${isKitchen ? "" : "Av. Principal - (Central Lanches)"}</div>
    <div class="bold tag">PEDIDO #${order.code}</div>
    <div>${order.type}${order.tableNumber ? ` - MESA ${order.tableNumber}` : ""}</div>
    <div>${dateStr}</div>
  </div>

  <div class="divider"></div>

  ${
    order.customerName || order.customerPhone || order.deliveryAddress
      ? `
    <div>
      ${order.customerName ? `<div><b>Cliente:</b> ${order.customerName}</div>` : ""}
      ${order.customerPhone ? `<div><b>Telefone:</b> ${order.customerPhone}</div>` : ""}
      ${order.deliveryAddress ? `<div><b>Endereço:</b> ${order.deliveryAddress}</div>` : ""}
    </div>
    <div class="divider"></div>
  `
      : ""
  }

  <div class="bold">ITENS DO PEDIDO:</div>
  ${order.items
    .map(
      (it) => `
    <div class="item-row" style="margin-top: 6px;">
      <span><b style="font-size: 14px;">${it.quantity}x</b> <b style="font-size: 14px;">${it.name}</b></span>
      ${!isKitchen ? `<span>${formatCurrency(it.price * it.quantity)}</span>` : ""}
    </div>
    ${it.notes ? `<div class="notes">OBS: ${it.notes.toUpperCase()}</div>` : ""}
  `
    )
    .join("")}

  ${
    order.notes
      ? `
    <div class="divider"></div>
    <div class="notes" style="font-size: 14px; padding: 5px;">OBS GERAL: ${order.notes.toUpperCase()}</div>
  `
      : ""
  }

  ${
    !isKitchen
      ? `
    <div class="divider"></div>
    <div class="item-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(order.subtotal)}</span>
    </div>
    ${
      order.deliveryFee
        ? `
      <div class="item-row">
        <span>Taxa Entrega:</span>
        <span>${formatCurrency(order.deliveryFee)}</span>
      </div>
    `
        : ""
    }
    ${
      order.discount
        ? `
      <div class="item-row">
        <span>Desconto:</span>
        <span>-${formatCurrency(order.discount)}</span>
      </div>
    `
        : ""
    }
    <div class="item-row bold" style="font-size: 15px; margin-top: 4px;">
      <span>TOTAL:</span>
      <span>${formatCurrency(order.total)}</span>
    </div>
    <div class="divider"></div>
    <div class="text-center">
      <div>Forma de Pagamento: <b>${order.paymentMethod}</b></div>
      <br/>
      <div>Agradecemos a preferência!</div>
    </div>
  `
      : `
    <div class="divider"></div>
    <div class="text-center bold">CENTRAL LANCHES - AGILIDADE & QUALIDADE</div>
  `
  }

  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export interface PrintRegisterCloseData {
  openedAt: string | Date;
  closedAt: string | Date;
  initialAmount: number;
  finalAmount: number;
  expectedAmount: number;
  salesTotal: number;
  suppliesTotal: number;
  bleedsTotal: number;
  salesCount: number;
  payments: Record<string, number>;
}

export function printRegisterCloseReceipt(data: PrintRegisterCloseData) {
  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (!printWindow) return;

  const diff = data.finalAmount - data.expectedAmount;
  const openedStr = new Date(data.openedAt).toLocaleString("pt-BR");
  const closedStr = new Date(data.closedAt).toLocaleString("pt-BR");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Fechamento de Caixa</title>
  <style>
    @page { margin: 0; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.25;
      width: 76mm;
      margin: 0 auto;
      padding: 10px;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .bold { font-weight: bold; }
    .title { font-size: 16px; margin-bottom: 2px; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .item-row { display: flex; justify-content: space-between; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="title bold">CENTRAL LANCHES</div>
    <div class="bold">FECHAMENTO DE CAIXA (CUPOM Z)</div>
    <div style="font-size: 11px; margin-top: 4px;">Abertura: ${openedStr}</div>
    <div style="font-size: 11px;">Fechamento: ${closedStr}</div>
  </div>

  <div class="divider"></div>

  <div class="item-row">
    <span>Fundo Inicial:</span>
    <span>${formatCurrency(data.initialAmount)}</span>
  </div>
  <div class="item-row">
    <span>Total Vendas (${data.salesCount} ped.):</span>
    <span class="bold">${formatCurrency(data.salesTotal)}</span>
  </div>
  <div class="item-row">
    <span>Entradas (Suprimentos):</span>
    <span>+${formatCurrency(data.suppliesTotal)}</span>
  </div>
  <div class="item-row">
    <span>Saídas (Sangrias):</span>
    <span>-${formatCurrency(data.bleedsTotal)}</span>
  </div>

  <div class="divider"></div>

  <div class="bold">RECEBIMENTO POR FORMA:</div>
  ${Object.entries(data.payments)
    .map(
      ([method, total]) => `
    <div class="item-row">
      <span>${method}:</span>
      <span>${formatCurrency(total)}</span>
    </div>
  `
    )
    .join("")}

  <div class="divider"></div>

  <div class="item-row bold">
    <span>Valor Esperado em Gaveta:</span>
    <span>${formatCurrency(data.expectedAmount)}</span>
  </div>
  <div class="item-row bold" style="font-size: 14px;">
    <span>Valor Contado:</span>
    <span>${formatCurrency(data.finalAmount)}</span>
  </div>
  <div class="item-row bold" style="color: ${diff === 0 ? "#000" : diff > 0 ? "blue" : "red"}">
    <span>Diferença:</span>
    <span>${diff > 0 ? "+" : ""}${formatCurrency(diff)} (${diff === 0 ? "Exato" : diff > 0 ? "Sobra" : "Falta"})</span>
  </div>

  <div class="divider"></div>
  <br/>
  <div class="text-center">
    <div>___________________________________</div>
    <div style="font-size: 11px; margin-top: 4px;">Assinatura do Operador de Caixa</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
