import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export async function generateQRCodeDataUrl(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const { width = 400, margin = 2, color } = options;

  return QRCode.toDataURL(text, {
    width,
    margin,
    color: {
      dark: color?.dark || '#111827',
      light: color?.light || '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}

export async function generateQRCodeSvg(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const { width = 400, margin = 2, color } = options;

  return QRCode.toString(text, {
    type: 'svg',
    width,
    margin,
    color: {
      dark: color?.dark || '#111827',
      light: color?.light || '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}

export function buildPublicMenuUrl(baseUrl: string, cafeSlug: string, tableNumber?: string): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  if (tableNumber) {
    return `${cleanBase}/c/${cafeSlug}?table=${encodeURIComponent(tableNumber)}`;
  }
  return `${cleanBase}/c/${cafeSlug}`;
}

export function buildQrRedirectUrl(baseUrl: string, token: string): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}/qr/${token}`;
}
