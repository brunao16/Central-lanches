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
    .notes { font-size: 11px; font-style: italic; padding-left: 10px; }
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
    <div class="item-row">
      <span><b>${it.quantity}x</b> ${it.name}</span>
      ${!isKitchen ? `<span>${formatCurrency(it.price * it.quantity)}</span>` : ""}
    </div>
    ${it.notes ? `<div class="notes">Obs: ${it.notes}</div>` : ""}
  `
    )
    .join("")}

  ${
    order.notes
      ? `
    <div class="divider"></div>
    <div><b>Observação Geral:</b> ${order.notes}</div>
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
