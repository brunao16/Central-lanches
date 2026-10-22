// Gerador de Payload Pix Padrão BR Code (EMV-QRCPS-MPM) Banco Central do Brasil

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16Ccitt(str: string): string {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePixPayload({
  pixKey,
  merchantName = "Central Lanches",
  merchantCity = "Brasil",
  amountCents,
  txId = "***",
}: {
  pixKey: string;
  merchantName?: string;
  merchantCity?: string;
  amountCents?: number;
  txId?: string;
}): string {
  // Limpa chave
  const cleanKey = pixKey.trim();
  const cleanName = merchantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 25);
  const cleanCity = merchantCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 15);

  // Merchant Account Info
  const gui = emvField("00", "br.gov.bcb.pix");
  const keyField = emvField("01", cleanKey);
  const merchantAccountInfo = emvField("26", `${gui}${keyField}`);

  // Base fields
  let payload =
    emvField("00", "01") + // Payload Format Indicator
    merchantAccountInfo +
    emvField("52", "0000") + // Merchant Category Code
    emvField("53", "986") + // Transaction Currency (986 = BRL)
    (amountCents && amountCents > 0
      ? emvField("54", (amountCents / 100).toFixed(2))
      : "") + // Transaction Amount
    emvField("58", "BR") + // Country Code
    emvField("59", cleanName) + // Merchant Name
    emvField("60", cleanCity) + // Merchant City
    emvField("62", emvField("05", txId || "***")) + // Additional Data Field (TxID)
    "6304"; // CRC16 placeholder

  const crc = crc16Ccitt(payload);
  return `${payload}${crc}`;
}
