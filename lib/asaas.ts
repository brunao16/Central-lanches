/**
 * Asaas Integration Utility
 * Documentação: https://docs.asaas.com
 */

const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';
const ASAAS_PRODUCTION_URL = 'https://api.asaas.com/v3';

export const getAsaasBaseUrl = () => {
  return process.env.ASAAS_ENVIRONMENT === 'production'
    ? ASAAS_PRODUCTION_URL
    : ASAAS_SANDBOX_URL;
};

export const getAsaasApiKey = () => {
  const key = process.env.ASAAS_API_KEY;
  if (!key && process.env.ASAAS_ENVIRONMENT === 'production') {
    throw new Error('A variável ASAAS_API_KEY é obrigatória em ambiente de produção.');
  }
  return key || '';
};

/**
 * Cria ou busca um cliente no Asaas
 */
export async function getOrCreateAsaasCustomer({
  name,
  cpfCnpj,
  phone,
  email,
}: {
  name: string;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
}) {
  const apiKey = getAsaasApiKey();
  const baseUrl = getAsaasBaseUrl();

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development' || process.env.ASAAS_SIMULATOR === 'true') {
      return { id: `cus_simulated_${Date.now()}` };
    }
    throw new Error('ASAAS_API_KEY não configurada no servidor.');
  }

  try {
    const res = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        name,
        cpfCnpj: cpfCnpj ? cpfCnpj.replace(/\D/g, '') : undefined,
        mobilePhone: phone ? phone.replace(/\D/g, '') : undefined,
        email: email || `${Date.now()}@uaifood.com.br`,
        notificationDisabled: true,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Erro getOrCreateAsaasCustomer:', err);
    throw err;
  }
}

/**
 * Cria uma cobrança Pix no Asaas com split
 */
export async function createAsaasPixPayment({
  customerId,
  valueReais,
  description,
  externalReference,
  restaurantWalletId,
  platformFeeReais,
}: {
  customerId: string;
  valueReais: number;
  description: string;
  externalReference: string;
  restaurantWalletId?: string;
  platformFeeReais?: number;
}) {
  const apiKey = getAsaasApiKey();
  const baseUrl = getAsaasBaseUrl();

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development' || process.env.ASAAS_SIMULATOR === 'true') {
      return {
        id: `pay_sim_${Date.now()}`,
        value: valueReais,
        netValue: valueReais - (platformFeeReais || 0),
        status: 'PENDING',
        pix: {
          encodedImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          payload: `00020126580014br.gov.bcb.pix0136uaifood-sandbox-${Date.now()}520400005303986540${valueReais.toFixed(2)}5802BR5907UaiFood6006Passos62070503***6304ABCD`,
          expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      };
    }
    throw new Error('Chave ASAAS_API_KEY ausente.');
  }

  // Configuração do Split com o estabelecimento
  const splits = [];
  if (restaurantWalletId && platformFeeReais) {
    splits.push({
      walletId: restaurantWalletId,
      fixedValue: Number((valueReais - platformFeeReais).toFixed(2)),
    });
  }

  const today = new Date().toISOString().split('T')[0];

  const bodyPayload: Record<string, unknown> = {
    customer: customerId,
    billingType: 'PIX',
    value: valueReais,
    dueDate: today,
    description,
    externalReference,
  };

  if (splits.length > 0) {
    bodyPayload.split = splits;
  }

  const res = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: JSON.stringify(bodyPayload),
  });

  const payment = await res.json();

  if (payment.id) {
    // Obter QR Code e payload copia-e-cola oficial do Pix
    const qrRes = await fetch(`${baseUrl}/payments/${payment.id}/pixQrCode`, {
      headers: { 'access_token': apiKey },
    });
    const qrData = await qrRes.json();

    return {
      ...payment,
      pix: qrData,
    };
  }

  return payment;
}

/**
 * Consulta status de pagamento no Asaas diretamente
 */
export async function getAsaasPaymentStatus(paymentId: string) {
  const apiKey = getAsaasApiKey();
  const baseUrl = getAsaasBaseUrl();

  if (!apiKey) return null;

  const res = await fetch(`${baseUrl}/payments/${paymentId}`, {
    headers: { 'access_token': apiKey },
  });

  if (!res.ok) return null;
  return await res.json();
}
