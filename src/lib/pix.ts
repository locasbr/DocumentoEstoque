// Gera o código "PIX Copia e Cola" no padrão EMV/BCB
// Funciona com qualquer app de banco

function padId(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
    }
    crc &= 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

interface PixPayloadParams {
  chavePix: string
  nomeRecebedor: string
  cidadeRecebedor: string
  valor?: number            // opcional para QR estático
  identificador?: string    // referência (ex: "ASSINATURA01")
}

export function gerarPixPayload({
  chavePix,
  nomeRecebedor,
  cidadeRecebedor,
  valor,
  identificador = 'ESTOQUESYSTEM',
}: PixPayloadParams): string {
  // Limita a 25 chars conforme padrão
  const nome = nomeRecebedor.substring(0, 25)
  const cidade = cidadeRecebedor.substring(0, 15)
  const id = identificador.substring(0, 25)

  // Monta o Merchant Account Information (ID 26)
  const gui = padId('00', 'br.gov.bcb.pix')
  const chave = padId('01', chavePix)
  const merchantAccount = padId('26', gui + chave)

  let payload = ''
  payload += padId('00', '01')              // Payload Format Indicator
  payload += merchantAccount                 // Merchant Account (PIX)
  payload += padId('52', '0000')            // Merchant Category Code
  payload += padId('53', '986')             // Currency (BRL)

  if (valor && valor > 0) {
    payload += padId('54', valor.toFixed(2)) // Transaction Amount
  }

  payload += padId('58', 'BR')              // Country Code
  payload += padId('59', nome)              // Merchant Name
  payload += padId('60', cidade)            // Merchant City

  // Additional Data Field (ID 62)
  const refLabel = padId('05', id)
  payload += padId('62', refLabel)

  // CRC16 placeholder (ID 63, length 04)
  payload += '6304'

  // Calcula CRC16
  const checksum = crc16(payload)
  payload += checksum

  return payload
}