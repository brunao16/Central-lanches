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
  amountReceived?: number | null;
  changeDue?: number | null;
  notes?: string | null;
}

export type PrintTarget = "CUSTOMER" | "KITCHEN" | "DELIVERY";

export function printReceipt(order: PrintOrderData, target: PrintTarget = "CUSTOMER") {
  const isKitchen = target === "KITCHEN";
  const isDelivery = target === "DELIVERY" || order.type === "DELIVERY";
  const dateStr = new Date(order.createdAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Cria ou reutiliza um iframe invisível para impressão limpa sem depender de popup bloqueado
  let printIframe = document.getElementById("print-receipt-iframe") as HTMLIFrameElement;
  if (!printIframe) {
    printIframe = document.createElement("iframe");
    printIframe.id = "print-receipt-iframe";
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0px";
    printIframe.style.height = "0px";
    printIframe.style.border = "none";
    document.body.appendChild(printIframe);
  }

  // Define título e estilo baseado no modelo de comanda
  let headerTitle = "CENTRAL LANCHES";
  let subheader = "VIA BALCAO / CLIENTE";
  if (isKitchen) {
    headerTitle = "--- COZINHA (KDS) ---";
    subheader = "PREPARO NA CHAPA";
  } else if (target === "DELIVERY" || isDelivery) {
    headerTitle = "CENTRAL LANCHES";
    subheader = "--- VIA ENTREGA / MOTOBOY ---";
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pedido #${order.code}</title>
  <style>
    @page {
      margin: 0mm !important;
      size: auto;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html {
      margin: 0 !important;
      padding: 0 !important;
      width: 100%;
    }
    body {
      font-family: monospace, 'Courier New', Courier;
      font-size: 10px;
      line-height: 1.15;
      width: 44mm;
      max-width: 44mm;
      margin: 0 !important;
      padding: 0 1.5mm 0 1mm !important;
      color: #000;
      background: #fff;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .title { font-size: 11px; font-weight: bold; margin-bottom: 1px; }
    .divider { border-top: 1px dashed #000; margin: 3px 0; }
    .tag { font-size: 13px; font-weight: 900; border: 1.5px solid #000; display: inline-block; padding: 2px 4px; margin: 2px 0; }
    .item-row { display: flex; justify-content: space-between; align-items: flex-start; margin: 2px 0; }
    .item-name { flex: 1; padding-right: 2px; }
    .obs-item { font-size: 9px; font-weight: bold; text-transform: uppercase; background: #000; color: #fff; padding: 1px 2px; display: inline-block; margin-top: 1px; border-radius: 2px; }
    .badge-destaque { font-size: 10px; font-weight: bold; border: 1px solid #000; padding: 2px; margin: 2px 0; text-align: center; }
    .box-endereco { border: 1px solid #000; padding: 3px; margin: 2px 0; font-size: 9.5px; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="title">${headerTitle}</div>
    <div style="font-size: 8.5px; font-weight: bold;">${subheader}</div>
    <div class="tag">PEDIDO #${order.code}</div>
    <div style="font-size: 10.5px; font-weight: bold;">
      ${order.type === "MESA" ? `MESA ${order.tableNumber || "S/N"}` : order.type}
    </div>
    <div style="font-size: 9px;">${dateStr}</div>
  </div>

  <div class="divider"></div>

  ${/* BLOCO DE DADOS DO CLIENTE / ENDEREÇO */ ""}
  ${
    isKitchen
      ? (order.tableNumber ? `<div class="bold text-center">LOCAL: MESA ${order.tableNumber}</div><div class="divider"></div>` : "")
      : `
      <div style="font-size: 9.5px; line-height: 1.2;">
        ${order.customerName ? `<div><b>Cliente:</b> ${order.customerName}</div>` : ""}
        ${order.customerPhone ? `<div><b>Tel:</b> ${order.customerPhone}</div>` : ""}
      </div>
      ${
        order.deliveryAddress
          ? `
          <div class="box-endereco">
            <b>ENTREGA:</b><br/>
            ${order.deliveryAddress}
          </div>
        `
          : ""
      }
      <div class="divider"></div>
    `
  }

  ${/* LISTA DE ITENS */ ""}
  <div class="bold" style="font-size: 10.5px; margin-bottom: 2px;">
    ${isKitchen ? "ITENS PARA PRODUCAO:" : "ITENS DO PEDIDO:"}
  </div>

  ${order.items
    .map(
      (it) => `
    <div class="item-row" style="font-size: ${isKitchen ? "10.5px" : "10px"};">
      <div class="item-name">
        <b style="font-size: 11px;">${it.quantity}x</b> ${it.name}
      </div>
      ${!isKitchen ? `<div class="bold">${formatCurrency(it.price * it.quantity)}</div>` : ""}
    </div>
    ${
      it.notes
        ? `<div style="margin-bottom: 2px;"><span class="obs-item">⚠️ OBS: ${it.notes}</span></div>`
        : ""
    }
  `
    )
    .join("")}

  ${
    order.notes
      ? `
    <div class="divider"></div>
    <div class="badge-destaque">OBS GERAL: ${order.notes}</div>
  `
      : ""
  }

  ${/* BLOCO FINANCEIRO (SOMENTE FORA DA COZINHA) */ ""}
  ${
    !isKitchen
      ? `
    <div class="divider"></div>
    <div class="item-row" style="font-size: 9.5px;">
      <span>Subtotal:</span>
      <span>${formatCurrency(order.subtotal)}</span>
    </div>
    ${
      order.deliveryFee
        ? `
      <div class="item-row" style="font-size: 9.5px;">
        <span>Taxa Entrega:</span>
        <span>${formatCurrency(order.deliveryFee)}</span>
      </div>
    `
        : ""
    }
    ${
      order.discount
        ? `
      <div class="item-row" style="font-size: 9.5px;">
        <span>Desconto:</span>
        <span>-${formatCurrency(order.discount)}</span>
      </div>
    `
        : ""
    }
    <div class="item-row bold" style="font-size: 11.5px; margin-top: 2px;">
      <span>TOTAL:</span>
      <span>${formatCurrency(order.total)}</span>
    </div>
    <div class="divider"></div>
    <div class="text-center" style="font-size: 9.5px;">
      <div>Pagamento: <b>${order.paymentMethod}</b></div>
      ${order.changeDue && order.changeDue > 0 ? `<div style="font-weight:bold; margin-top:1px;">LEVAR TROCO: ${formatCurrency(order.changeDue)}</div>` : ""}
      <div style="margin-top: 3px; font-size: 8.5px;">Agradecemos a preferência!</div>
    </div>
  `
      : `
    <div class="divider"></div>
    <div class="text-center bold" style="font-size: 9px;">*** FIM DA COMANDA ***</div>
  `
  }
  
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
    };
  </script>
</body>
</html>
  `;

  try {
    const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      return;
    }
  } catch (err) {
    console.error("Erro ao usar iframe para impressão, tentando popup:", err);
  }

  // Fallback para popup caso o iframe falhe
  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
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
    @page { margin: 0; size: auto; }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, Consolas, monospace;
      font-size: 11px;
      line-height: 1.2;
      width: 100%;
      max-width: 72mm;
      margin: 0 auto;
      padding: 4px 6px;
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
