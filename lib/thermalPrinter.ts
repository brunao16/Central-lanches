/**
 * Impressão de Comanda Térmica (58mm / 80mm) para Cozinha e Motoboy
 */

export function printThermalOrder(order: any, restaurantName: string) {
  const printWindow = window.open('', '_blank', 'width=380,height=600');
  if (!printWindow) return;

  const dateStr = new Date(order.created_at || Date.now()).toLocaleString('pt-BR');
  const itemsHtml = (order.order_items || [])
    .map(
      (it: any) => `
      <tr>
        <td style="padding: 4px 0; font-size: 13px; font-weight: bold;">
          ${it.quantity}x ${it.product_name}
          ${it.notes ? `<div style="font-size: 11px; font-weight: normal; color: #555;">Obs: ${it.notes}</div>` : ''}
        </td>
        <td style="padding: 4px 0; text-align: right; font-size: 13px;">
          R$ ${((it.total_price_cents || 0) / 100).toFixed(2).replace('.', ',')}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Comanda #${order.order_number || order.id.slice(0, 6)}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 76mm;
            margin: 0 auto;
            padding: 8px 0;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="font-size: 16px;" class="bold">${restaurantName.toUpperCase()}</div>
          <div style="font-size: 11px;">UAIFOOD DELIVERY</div>
        </div>
        <div class="divider"></div>
        <div class="text-center" style="font-size: 18px; font-weight: bold; padding: 4px 0;">
          PEDIDO #${order.order_number || order.id.slice(0, 6)}
        </div>
        <div style="font-size: 11px;">Data: ${dateStr}</div>
        <div class="divider"></div>

        <div style="font-size: 12px; margin-bottom: 4px;">
          <div class="bold">CLIENTE:</div>
          <div>${order.delivery_address?.name || 'Cliente'}</div>
          <div>Tel: ${order.delivery_address?.phone || '-'}</div>
        </div>
        <div style="font-size: 12px; margin-bottom: 4px;">
          <div class="bold">ENDEREÇO DE ENTREGA:</div>
          <div>${order.delivery_address?.street || ''}, ${order.delivery_address?.number || ''}</div>
          <div>Bairro: ${order.delivery_address?.neighborhood || ''}</div>
          ${order.delivery_address?.complement ? `<div>Compl: ${order.delivery_address.complement}</div>` : ''}
          ${order.delivery_address?.reference ? `<div>Ref: ${order.delivery_address.reference}</div>` : ''}
        </div>
        <div class="divider"></div>

        <div class="bold" style="font-size: 12px; margin-bottom: 4px;">ITENS:</div>
        <table>
          ${itemsHtml}
        </table>
        <div class="divider"></div>

        <table>
          <tr>
            <td style="font-size: 12px;">Subtotal:</td>
            <td style="text-align: right; font-size: 12px;">R$ ${((order.subtotal_cents || 0) / 100).toFixed(2).replace('.', ',')}</td>
          </tr>
          ${
            order.discount_cents > 0
              ? `<tr>
                  <td style="font-size: 12px;">Desconto:</td>
                  <td style="text-align: right; font-size: 12px;">- R$ ${(order.discount_cents / 100).toFixed(2).replace('.', ',')}</td>
                </tr>`
              : ''
          }
          <tr>
            <td style="font-size: 12px;">Taxa Entrega:</td>
            <td style="text-align: right; font-size: 12px;">R$ ${((order.delivery_fee_cents || 0) / 100).toFixed(2).replace('.', ',')}</td>
          </tr>
          <tr style="font-size: 15px; font-weight: bold;">
            <td style="padding-top: 4px;">TOTAL:</td>
            <td style="text-align: right; padding-top: 4px;">R$ ${((order.total_cents || 0) / 100).toFixed(2).replace('.', ',')}</td>
          </tr>
        </table>
        <div class="divider"></div>

        <div style="font-size: 12px;">
          <div><span class="bold">PAGAMENTO:</span> ${
            order.payment_method === 'pix' ? 'PIX ONLINE' : order.payment_method === 'credit_card' ? 'CARTÃO NA ENTREGA' : 'DINHEIRO NA ENTREGA'
          }</div>
          ${
            order.change_for_cents
              ? `<div><span class="bold">TROCO PARA:</span> R$ ${(order.change_for_cents / 100).toFixed(2).replace('.', ',')}</div>`
              : ''
          }
          ${
            order.customer_notes
              ? `<div style="margin-top: 4px;"><span class="bold">OBS CLIENTE:</span> ${order.customer_notes}</div>`
              : ''
          }
        </div>
        <div class="divider"></div>
        <div class="text-center" style="font-size: 11px; margin-top: 8px;">
          Obrigado pela preferência!<br />
          www.centrallanches.com.br
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
