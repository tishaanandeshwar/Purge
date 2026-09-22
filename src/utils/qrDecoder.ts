import jsQR from 'jsqr';

/**
 * Decodes a QR code from ImageData using jsQR
 */
export function decodeQrFromImageData(imageData: ImageData): string | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    return code ? code.data : null;
  } catch (err) {
    console.error('Error running jsQR:', err);
    return null;
  }
}

/**
 * Decodes a QR code from an HTMLImageElement or Canvas with multi-scale fallback
 */
export async function decodeQrFromImageElement(img: HTMLImageElement): Promise<string | null> {
  // 1. Attempt native BarcodeDetector if supported by the browser (fastest & highly accurate)
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const detected = await barcodeDetector.detect(img);
      if (detected && detected.length > 0 && detected[0].rawValue) {
        return detected[0].rawValue;
      }
    } catch {
      // Fall through to jsQR
    }
  }

  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;
  if (!naturalWidth || !naturalHeight) return null;

  // Scales to attempt (original, 1000px max, 650px max)
  const scales = [1];
  const maxDim = Math.max(naturalWidth, naturalHeight);
  if (maxDim > 1200) {
    scales.push(1000 / maxDim);
  }
  if (maxDim > 800) {
    scales.push(650 / maxDim);
  }

  for (const scale of scales) {
    const width = Math.round(naturalWidth * scale);
    const height = Math.round(naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) continue;

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const decoded = decodeQrFromImageData(imageData);
    if (decoded) {
      return decoded;
    }
  }

  return null;
}

/**
 * Decodes a QR code from a File object (e.g. from file input or drag-and-drop)
 */
export function decodeQrFromFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = async () => {
        try {
          const result = await decodeQrFromImageElement(img);
          resolve(result);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Curated high-fidelity QR sample presets for demonstration and testing
 */
export interface SampleQrPreset {
  id: string;
  name: string;
  type: string;
  payload: string;
  description: string;
}

export const SAMPLE_QR_PRESETS: SampleQrPreset[] = [
  {
    id: 'upi-scam',
    name: 'UPI "Refund" Scam QR',
    type: 'UPI Trap',
    payload: 'upi://pay?pa=refund_desk9281@okaxis&pn=Electricity_Refund_Office&am=4999&cu=INR&tn=RefundProcessing',
    description: 'Deceptive QR claiming to credit ₹4,999 refund, but actually debits ₹4,999 from victim.'
  },
  {
    id: 'phishing-url',
    name: 'Phishing Banking Login QR',
    type: 'Malicious Link',
    payload: 'https://secure-hdfc-kyc-update.xyz/login/verify-pan.php?session=9821',
    description: 'Directs victim to a spoofed internet banking portal to harvest credentials and OTPs.'
  },
  {
    id: 'trading-scam',
    name: 'Crypto 300% Guarantee QR',
    type: 'Ponzi Scam',
    payload: 'https://vip-signals-crypto-double.top/register?ref=guaranteed300pct',
    description: 'Promotes an unregistered Telegram pump-and-dump group promising 300% profits.'
  },
  {
    id: 'safe-url',
    name: 'Safe Official Website QR',
    type: 'Safe URL',
    payload: 'https://www.google.com',
    description: 'Authentic high-reputation domain with valid security credentials.'
  },
  {
    id: 'safe-wifi',
    name: 'Safe WiFi Network QR',
    type: 'Safe Config',
    payload: 'WIFI:T:WPA;S:Airport_Free_HighSpeed_WiFi;P:Welcome2026;;',
    description: 'Standard IEEE 802.11 WiFi network pairing credentials.'
  }
];
