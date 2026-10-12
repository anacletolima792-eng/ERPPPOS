import { Sale, Product } from '../types';

export interface DetectedIntent {
  type: 'status' | 'payment' | 'amount' | 'discount' | 'date' | 'product' | 'customer';
  label: string;
  description?: string;
}

export interface ParsedSearchQuery {
  rawQuery: string;
  normalizedQuery: string;
  statusIntent?: 'completed' | 'canceled' | 'returned';
  paymentIntent?: string;
  hasDiscountIntent?: boolean;
  minAmount?: number;
  maxAmount?: number;
  exactAmount?: number;
  dateIntent?: 'today' | 'yesterday' | 'month';
  residualTokens: string[];
  detectedIntents: DetectedIntent[];
}

/**
 * Remove diacritics/accents and normalize text for robust fuzzy & semantic comparison
 */
export const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/ç/g, 'c')
    .replace(/[^\w\s.,><=]/g, ' ') // keep letters, numbers, spaces, comparator symbols
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Standard Levenshtein distance for typo-tolerant fuzzy matching
 */
export const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const v0 = new Int32Array(b.length + 1);
  const v1 = new Int32Array(b.length + 1);

  for (let i = 0; i <= b.length; i++) v0[i] = i;

  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }

  return v1[b.length];
};

/**
 * Partial, substring or fuzzy match
 */
export const isPartialOrFuzzyMatch = (target: string, token: string): boolean => {
  if (!target || !token) return false;
  const normTarget = normalizeText(target);
  const normToken = normalizeText(token);

  if (!normTarget || !normToken) return false;

  // Direct substring inclusion (correspondência parcial)
  if (normTarget.includes(normToken)) return true;

  // Words inside target
  const words = normTarget.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(normToken) || normToken.startsWith(word)) return true;

    // Fuzzy tolerance if token length >= 4
    if (normToken.length >= 4 && word.length >= 3) {
      const maxDistance = normToken.length <= 5 ? 1 : 2;
      if (levenshtein(word, normToken) <= maxDistance) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Parses user input into semantic intents and residual search terms
 */
export const parseSearchQuery = (query: string): ParsedSearchQuery => {
  const rawQuery = query || '';
  const normalizedQuery = normalizeText(rawQuery);
  const detectedIntents: DetectedIntent[] = [];

  let statusIntent: 'completed' | 'canceled' | 'returned' | undefined;
  let paymentIntent: string | undefined;
  let hasDiscountIntent = false;
  let minAmount: number | undefined;
  let maxAmount: number | undefined;
  let exactAmount: number | undefined;
  let dateIntent: 'today' | 'yesterday' | 'month' | undefined;

  let workingQuery = normalizedQuery;

  // 1. Check Amount Intent: > 100, >= 50, < 30, <= 80, maior que 50, menor que 100
  const greaterMatch = workingQuery.match(/(?:maior que|acima de|mais de|>|>=)\s*r?\$?\s*(\d+(?:[.,]\d+)?)/i);
  if (greaterMatch) {
    const val = parseFloat(greaterMatch[1].replace(',', '.'));
    if (!isNaN(val)) {
      minAmount = val;
      detectedIntents.push({
        type: 'amount',
        label: `Valor > R$ ${val.toFixed(2).replace('.', ',')}`,
        description: `Vendas com total superior a R$ ${val}`,
      });
      workingQuery = workingQuery.replace(greaterMatch[0], ' ');
    }
  }

  const lesserMatch = workingQuery.match(/(?:menor que|abaixo de|menos de|<|<=)\s*r?\$?\s*(\d+(?:[.,]\d+)?)/i);
  if (lesserMatch) {
    const val = parseFloat(lesserMatch[1].replace(',', '.'));
    if (!isNaN(val)) {
      maxAmount = val;
      detectedIntents.push({
        type: 'amount',
        label: `Valor < R$ ${val.toFixed(2).replace('.', ',')}`,
        description: `Vendas com total inferior a R$ ${val}`,
      });
      workingQuery = workingQuery.replace(lesserMatch[0], ' ');
    }
  }

  // 2. Check Discount Intent
  const discountRegex = /\b(com desconto|descontos|desconto|promocao|promocao)\b/i;
  if (discountRegex.test(workingQuery)) {
    hasDiscountIntent = true;
    detectedIntents.push({
      type: 'discount',
      label: 'Com Desconto',
      description: 'Vendas que receberam desconto',
    });
    workingQuery = workingQuery.replace(discountRegex, ' ');
  }

  // 3. Check Status Intent
  const canceledRegex = /\b(canceladas|cancelados|cancelada|cancelado|anulada|anulado)\b/i;
  const returnedRegex = /\b(devolucao|devolucoes|devolvida|devolvidas|devolvido|estorno|estornos|estornada|troca)\b/i;
  const completedRegex = /\b(concluida|concluidas|concluido|concluidos|finalizada|finalizadas|paga|pagas)\b/i;

  if (canceledRegex.test(workingQuery)) {
    statusIntent = 'canceled';
    detectedIntents.push({
      type: 'status',
      label: 'Status: Canceladas',
      description: 'Filtrando vendas canceladas',
    });
    workingQuery = workingQuery.replace(canceledRegex, ' ');
  } else if (returnedRegex.test(workingQuery)) {
    statusIntent = 'returned';
    detectedIntents.push({
      type: 'status',
      label: 'Status: Devoluções',
      description: 'Filtrando devoluções e estornos',
    });
    workingQuery = workingQuery.replace(returnedRegex, ' ');
  } else if (completedRegex.test(workingQuery)) {
    statusIntent = 'completed';
    detectedIntents.push({
      type: 'status',
      label: 'Status: Concluídas',
      description: 'Filtrando vendas concluídas',
    });
    workingQuery = workingQuery.replace(completedRegex, ' ');
  }

  // 4. Check Payment Intent
  const pixRegex = /\b(pix|chave pix|qrcode)\b/i;
  const dinheiroRegex = /\b(dinheiro|especie|cedula|cash)\b/i;
  const creditoRegex = /\b(credito|cartao de credito|cartao credito|parcelado|visa|master)\b/i;
  const debitoRegex = /\b(debito|cartao de debito|cartao debito)\b/i;
  const prazoRegex = /\b(a prazo|prazo|fiado|crediario|faturado)\b/i;

  if (pixRegex.test(workingQuery)) {
    paymentIntent = 'pix';
    detectedIntents.push({
      type: 'payment',
      label: 'Pagamento: PIX',
      description: 'Vendas pagas via PIX',
    });
    workingQuery = workingQuery.replace(pixRegex, ' ');
  } else if (dinheiroRegex.test(workingQuery)) {
    paymentIntent = 'dinheiro';
    detectedIntents.push({
      type: 'payment',
      label: 'Pagamento: Dinheiro',
      description: 'Vendas pagas em dinheiro',
    });
    workingQuery = workingQuery.replace(dinheiroRegex, ' ');
  } else if (creditoRegex.test(workingQuery)) {
    paymentIntent = 'credito';
    detectedIntents.push({
      type: 'payment',
      label: 'Pagamento: Cartão de Crédito',
      description: 'Vendas pagas em cartão de crédito',
    });
    workingQuery = workingQuery.replace(creditoRegex, ' ');
  } else if (debitoRegex.test(workingQuery)) {
    paymentIntent = 'debito';
    detectedIntents.push({
      type: 'payment',
      label: 'Pagamento: Cartão de Débito',
      description: 'Vendas pagas em débito',
    });
    workingQuery = workingQuery.replace(debitoRegex, ' ');
  } else if (prazoRegex.test(workingQuery)) {
    paymentIntent = 'prazo';
    detectedIntents.push({
      type: 'payment',
      label: 'Pagamento: A Prazo',
      description: 'Vendas a prazo ou fiado',
    });
    workingQuery = workingQuery.replace(prazoRegex, ' ');
  }

  // 5. Date Intent
  const hojeRegex = /\b(hoje)\b/i;
  const ontemRegex = /\b(ontem)\b/i;
  const mesRegex = /\b(este mes|mes atual|mes)\b/i;

  if (hojeRegex.test(workingQuery)) {
    dateIntent = 'today';
    detectedIntents.push({
      type: 'date',
      label: 'Data: Hoje',
      description: 'Vendas realizadas hoje',
    });
    workingQuery = workingQuery.replace(hojeRegex, ' ');
  } else if (ontemRegex.test(workingQuery)) {
    dateIntent = 'yesterday';
    detectedIntents.push({
      type: 'date',
      label: 'Data: Ontem',
      description: 'Vendas realizadas ontem',
    });
    workingQuery = workingQuery.replace(ontemRegex, ' ');
  } else if (mesRegex.test(workingQuery)) {
    dateIntent = 'month';
    detectedIntents.push({
      type: 'date',
      label: 'Data: Mês Atual',
      description: 'Vendas deste mês',
    });
    workingQuery = workingQuery.replace(mesRegex, ' ');
  }

  // Remaining tokens for entity/partial matching
  const residualTokens = workingQuery
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  return {
    rawQuery,
    normalizedQuery,
    statusIntent,
    paymentIntent,
    hasDiscountIntent,
    minAmount,
    maxAmount,
    exactAmount,
    dateIntent,
    residualTokens,
    detectedIntents,
  };
};

/**
 * Executes semantic search with partial match and intent on sales list
 */
export const filterSalesSemantically = (
  sales: Sale[],
  searchQuery: string
): { filtered: Sale[]; parsed: ParsedSearchQuery } => {
  const parsed = parseSearchQuery(searchQuery);

  if (!parsed.rawQuery.trim()) {
    return { filtered: sales, parsed };
  }

  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const filtered = sales.filter((sale) => {
    // 1. Status Intent Check
    if (parsed.statusIntent && sale.status !== parsed.statusIntent) {
      return false;
    }

    // 2. Payment Intent Check
    if (parsed.paymentIntent && sale.paymentMethod !== parsed.paymentIntent) {
      return false;
    }

    // 3. Discount Intent Check
    if (parsed.hasDiscountIntent && (!sale.discount || sale.discount <= 0)) {
      return false;
    }

    // 4. Amount Intent Check
    if (parsed.minAmount !== undefined && sale.total < parsed.minAmount) {
      return false;
    }
    if (parsed.maxAmount !== undefined && sale.total > parsed.maxAmount) {
      return false;
    }

    // 5. Date Intent Check
    if (parsed.dateIntent) {
      const saleDate = new Date(sale.createdAt);
      if (parsed.dateIntent === 'today') {
        if (saleDate.toDateString() !== now.toDateString()) return false;
      } else if (parsed.dateIntent === 'yesterday') {
        if (saleDate.toDateString() !== yesterday.toDateString()) return false;
      } else if (parsed.dateIntent === 'month') {
        if (
          saleDate.getMonth() !== now.getMonth() ||
          saleDate.getFullYear() !== now.getFullYear()
        ) {
          return false;
        }
      }
    }

    // 6. Partial Match & Entity Search for residual tokens
    // All residual tokens must match something in the sale (conjunction for precision)
    if (parsed.residualTokens.length > 0) {
      const saleNum = sale.saleNumber || '';
      const cleanSaleNum = saleNum.replace(/[^\w]/g, '');
      const custName = sale.customerName || 'Balcão Consumidor';
      const opName = sale.operatorName || '';
      const notes = sale.notes || '';
      const cancelReason = sale.cancelReason || '';
      const returnReason = sale.returnReason || '';
      const totalFormatted = sale.total ? sale.total.toFixed(2).replace('.', ',') : '';
      const totalRaw = sale.total ? sale.total.toString() : '';

      // Product items names & codes
      const itemNames = (sale.items || []).map((i) => i.productName || '').join(' ');
      const itemCodes = (sale.items || []).map((i) => i.productCode || '').join(' ');

      const combinedSearchableString = [
        saleNum,
        cleanSaleNum,
        custName,
        opName,
        itemNames,
        itemCodes,
        notes,
        cancelReason,
        returnReason,
        totalFormatted,
        totalRaw,
      ].join(' ');

      const matchesAllTokens = parsed.residualTokens.every((token) => {
        return isPartialOrFuzzyMatch(combinedSearchableString, token);
      });

      if (!matchesAllTokens) {
        return false;
      }
    }

    return true;
  });

  return { filtered, parsed };
};

/**
 * Semantic & partial product matching for PDV & Inventory
 */
export const filterProductsSemantically = (
  products: Product[],
  searchQuery: string
): Product[] => {
  if (!searchQuery || !searchQuery.trim()) return products;

  const parsed = parseSearchQuery(searchQuery);

  return products.filter((p) => {
    // Amount range intent
    if (parsed.minAmount !== undefined && p.price < parsed.minAmount) return false;
    if (parsed.maxAmount !== undefined && p.price > parsed.maxAmount) return false;

    // Residual tokens partial/fuzzy match
    const searchable = [
      p.name || '',
      p.code || '',
      p.barcode || '',
      p.categoryName || '',
      p.price.toFixed(2).replace('.', ','),
      p.unit || '',
    ].join(' ');

    if (parsed.residualTokens.length > 0) {
      return parsed.residualTokens.every((token) =>
        isPartialOrFuzzyMatch(searchable, token)
      );
    }

    return true;
  });
};
