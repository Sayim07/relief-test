import QRCode from 'qrcode';
import { ReceiptQRData } from '@/lib/types/database';

/**
 * Generate QR code image from data
 */
export async function generateQRCodeImage(data: ReceiptQRData): Promise<string> {
  try {
    const qrDataString = JSON.stringify(data);
    const qrCodeDataUrl = await QRCode.toDataURL(qrDataString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as SVG
 */
export async function generateQRCodeSVG(data: ReceiptQRData): Promise<string> {
  try {
    const qrDataString = JSON.stringify(data);
    const qrCodeSVG = await QRCode.toString(qrDataString, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 1,
    });
    return qrCodeSVG;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}
