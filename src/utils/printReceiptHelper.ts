import { Sale, StoreSettings } from '../types';

export interface PrintReceiptPayload {
  sale: Sale;
  settings?: StoreSettings | null;
}

/**
 * Safely encode sale and store settings into a URL-friendly hash string.
 * Uses UTF-8 safe encoding so that accented characters (e.g. Portuguese names, products)
 * and special symbols are never corrupted.
 */
export const encodeReceiptHash = (sale: Sale, settings?: StoreSettings | null): string => {
  try {
    const payload: PrintReceiptPayload = {
      sale,
      settings: settings || null,
    };
    const jsonString = JSON.stringify(payload);
    // Encode unicode properly before base64
    const utf8Encoded = encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    return btoa(utf8Encoded);
  } catch (error) {
    console.warn('Failed to encode receipt data for print URL:', error);
    return '';
  }
};

/**
 * Safely decode the print payload from a base64 encoded hash string.
 */
export const decodeReceiptHash = (hashString: string): PrintReceiptPayload | null => {
  try {
    if (!hashString) return null;

    // Extract data param if present like "#data=..." or raw hash
    let cleanHash = hashString.startsWith('#') ? hashString.slice(1) : hashString;
    if (cleanHash.includes('data=')) {
      const parts = cleanHash.split('&');
      const dataPart = parts.find((p) => p.startsWith('data='));
      if (dataPart) {
        cleanHash = dataPart.replace('data=', '');
      }
    }

    cleanHash = decodeURIComponent(cleanHash);
    const raw = atob(cleanHash);
    const jsonString = decodeURIComponent(
      Array.prototype.map.call(raw, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );

    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.sale && Array.isArray(parsed.sale.items)) {
      return {
        sale: parsed.sale,
        settings: parsed.settings || null,
      };
    }

    // Direct sale object fallback
    if (parsed && Array.isArray(parsed.items) && parsed.total !== undefined) {
      return {
        sale: parsed as Sale,
        settings: null,
      };
    }

    return null;
  } catch (error) {
    console.warn('Failed to decode receipt data from URL:', error);
    return null;
  }
};

/**
 * Constructs a fully standalone, zero-dependency print URL for a sale.
 */
export const generatePrintReceiptUrl = (
  sale: Sale,
  settings: StoreSettings | null,
  paperWidth: '80mm' | '58mm' = '80mm'
): string => {
  const hashData = encodeReceiptHash(sale, settings);
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const query = `?printSale=${encodeURIComponent(sale.id || sale.saleNumber)}&width=${paperWidth}`;
  return `${baseUrl}${query}#data=${encodeURIComponent(hashData)}`;
};
