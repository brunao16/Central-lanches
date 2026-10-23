/**
 * Asaas Integration Utility (Sandbox & Production)
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
  return process.env.ASAAS_API_KEY || '';
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
    console.warn('ASAAS_API_KEY não configurada. Usando modo simulador.');
    return { id: `cus_simulated_${Date.now()}` };
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
        email: email || `${Date.now()}@delivery.temp`,
        notificationDisabled: true,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Erro getOrCreateAsaasCustomer:', err);
    return { id: `cus_fallback_${Date.now()}` };
  }
}

/**
 * Cria uma cobrança Pix no Asaas com split opcional
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

  // Configuração do Split caso o restaurante possua walletId cadastrado no Asaas
  const splits = [];
  if (restaurantWalletId && platformFeeReais) {
    splits.push({
      walletId: restaurantWalletId,
      fixedValue: valueReais - platformFeeReais,
    });
  }

  if (!apiKey) {
    // Retorno simulado realista caso a chave de sandbox ainda não tenha sido inserida
    return {
      id: `pay_sim_${Date.now()}`,
      value: valueReais,
      netValue: valueReais - (platformFeeReais || 0),
      status: 'PENDING',
      pix: {
        encodedImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', // 1px dummy
        payload: `00020126580014br.gov.bcb.pix0136central-lanches-sandbox-${Date.now()}520400005303986540${valueReais.toFixed(2)}5802BR5915Central Lanches6009Sao Paulo62070503***6304ABCD`,
        expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const bodyPayload: any = {
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
      // Obter QR Code Pix
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
  } catch (err) {
    console.error('Erro createAsaasPixPayment:', err);
    throw err;
  }
}
