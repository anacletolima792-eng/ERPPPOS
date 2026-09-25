import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  Printer,
  Share2,
  Copy,
  Calendar,
  User,
  Clock,
  ArrowRight,
  Trash2,
  Search,
  ShoppingBag,
  Check,
  RotateCcw,
  DollarSign,
  AlertCircle,
  Eye,
  Phone,
  Mail,
  FileCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CartItem, Customer, Product, Quote, QuoteStatus, SaleItem, StoreSettings } from '../types';
import { formatCurrency, formatDate, formatDateOnly } from '../utils/formatters';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import {
  getStoredQuotes,
  subscribeQuotes,
  saveQuoteTransaction,
  updateQuoteStatus,
  deleteQuote,
  getStoreSettings,
} from '../services/firestoreService';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout?: () => void;
  products?: Product[];
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  onOpenCheckout,
  products = [],
}) => {
  const { items, customer, setCustomer, subtotal, totalDiscount, total, clearCart, loadCart } = useCart();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // Form state for creating quote
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerDocument, setCustomerDocument] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [validityDays, setValidityDays] = useState<number>(7);
  const [customValidDate, setCustomValidDate] = useState<string>('');
  const [paymentCondition, setPaymentCondition] = useState<string>('À vista / PIX');
  const [notes, setNotes] = useState<string>(
    'Orçamento válido pelo período estipulado. Preços e disponibilidade sujeitos a confirmação.'
  );

  // Status after creation
  const [createdQuote, setCreatedQuote] = useState<Quote | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // List view state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteStatus>('all');
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState<Quote | null>(null);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      getStoreSettings().then(setStoreSettings).catch(console.error);
      setCreatedQuote(null);
      setCopiedText(false);

      if (items.length > 0) {
        setActiveTab('create');
      } else {
        setActiveTab('list');
      }

      // Pre-fill customer
      if (customer) {
        setCustomerName(customer.name || '');
        setCustomerPhone(customer.phone || '');
        setCustomerDocument(customer.document || '');
        setCustomerEmail(customer.email || '');
      } else {
        setCustomerName('Consumidor Final (Balcão)');
        setCustomerPhone('');
        setCustomerDocument('');
        setCustomerEmail('');
      }

      // Default validity calculation (7 days ahead)
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setCustomValidDate(d.toISOString().slice(0, 10));
    }
  }, [isOpen, customer, items.length]);

  // Subscribe to quotes
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeQuotes((data) => {
      setQuotes(data);
    });
    return () => unsub();
  }, [isOpen]);

  // Calculate validity date string
  const calculateValidUntil = (): string => {
    if (validityDays === -1 && customValidDate) {
      return new Date(`${customValidDate}T23:59:59`).toISOString();
    }
    const d = new Date();
    d.setDate(d.getDate() + validityDays);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  };

  const handleSaveQuote = async () => {
    if (items.length === 0) return;

    try {
      setIsSaving(true);
      const validUntil = calculateValidUntil();

      const quoteItems: SaleItem[] = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productCode: item.product.code,
        quantity: item.quantity,
        unit: item.product.unit || 'UN',
        unitPrice: item.unitPrice,
        costPrice: item.product.costPrice || 0,
        discount: item.discount || 0,
        total: item.total,
      }));

      const newQuote = await saveQuoteTransaction({
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        customerId: customer?.id || 'cust-balcao',
        customerName: customerName.trim() || customer?.name || 'Consumidor Final (Balcão)',
        customerPhone: customerPhone.trim() || customer?.phone || undefined,
        customerDocument: customerDocument.trim() || customer?.document || undefined,
        customerEmail: customerEmail.trim() || customer?.email || undefined,
        items: quoteItems,
        subtotal,
        discount: totalDiscount,
        total,
        paymentMethod: paymentCondition,
        validUntil,
        notes: notes.trim() || undefined,
        status: 'pending',
      });

      setCreatedQuote(newQuote);
    } catch (err) {
      console.error('Erro ao salvar orçamento:', err);
      alert('Erro ao salvar orçamento. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const generateWhatsAppMessage = (quote: Quote): string => {
    const storeName = storeSettings?.storeName || 'Loja PDV';
    const lines: string[] = [
      `*PROPOSTA COMERCIAL / ORÇAMENTO*`,
      `*${storeName.toUpperCase()}*`,
      `---------------------------------`,
      `📄 *Orçamento:* #${quote.quoteNumber}`,
      `📅 *Emissão:* ${formatDateOnly(quote.createdAt)}`,
      `⏳ *Validade:* ${formatDateOnly(quote.validUntil)}`,
      `👤 *Cliente:* ${quote.customerName || 'Cliente'}`,
      quote.customerPhone ? `📱 *Telefone:* ${quote.customerPhone}` : '',
      `💼 *Vendedor:* ${quote.operatorName}`,
      `---------------------------------`,
      `*ITENS DO ORÇAMENTO:*`,
    ];

    quote.items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.productName}\n   ${item.quantity} ${item.unit || 'UN'} x ${formatCurrency(item.unitPrice)} = *${formatCurrency(item.total)}*`
      );
    });

    lines.push(`---------------------------------`);
    lines.push(`*Subtotal:* ${formatCurrency(quote.subtotal)}`);
    if (quote.discount > 0) {
      lines.push(`*Desconto:* -${formatCurrency(quote.discount)}`);
    }
    lines.push(`*VALOR TOTAL:* ${formatCurrency(quote.total)}`);
    if (quote.paymentMethod) {
      lines.push(`*Condição:* ${quote.paymentMethod}`);
    }
    if (quote.notes) {
      lines.push(`\n📝 *Observações:* ${quote.notes}`);
    }
    lines.push(`\nFicamos à disposição para esclarecer qualquer dúvida e fechar seu pedido!`);

    return lines.filter(Boolean).join('\n');
  };

  const handleShareWhatsApp = (quote: Quote) => {
    const message = generateWhatsAppMessage(quote);
    const encoded = encodeURIComponent(message);
    const cleanPhone = (quote.customerPhone || '').replace(/\D/g, '');
    let url = `https://wa.me/?text=${encoded}`;
    if (cleanPhone) {
      const formattedNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      url = `https://wa.me/${formattedNumber}?text=${encoded}`;
    }
    window.open(url, '_blank');
  };

  const handleCopyText = (quote: Quote) => {
    const message = generateWhatsAppMessage(quote);
    navigator.clipboard.writeText(message);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handlePrintQuote = (quote: Quote) => {
    const storeName = storeSettings?.storeName || 'ESTABELECIMENTO COMERCIAL';
    const storeCnpj = storeSettings?.cnpj ? `CNPJ: ${storeSettings.cnpj}` : '';
    const storeAddress = storeSettings?.address || '';
    const storePhone = storeSettings?.phone ? `Tel: ${storeSettings.phone}` : '';

    const itemsHtml = quote.items
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px 4px; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 6px 4px;">
            <div style="font-weight: bold; text-transform: uppercase;">${it.productName}</div>
            <div style="font-size: 10px; color: #64748b;">Cód: ${it.productCode} • ${it.quantity} ${it.unit || 'UN'} x ${formatCurrency(it.unitPrice)}</div>
          </td>
          <td style="padding: 6px 4px; text-align: center;">${it.quantity}</td>
          <td style="padding: 6px 4px; text-align: right;">${formatCurrency(it.unitPrice)}</td>
          <td style="padding: 6px 4px; text-align: right; font-weight: bold;">${formatCurrency(it.total)}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Orçamento #${quote.quoteNumber}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            body { margin: 0; padding: 15px; color: #0f172a; font-size: 12px; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; }
            .company { font-size: 16px; font-weight: 900; text-transform: uppercase; }
            .badge { display: inline-block; padding: 4px 8px; background: #e0e7ff; color: #3730a3; font-weight: 800; border-radius: 4px; text-transform: uppercase; font-size: 11px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
            th { background: #f1f5f9; padding: 8px 4px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            .total-row { display: flex; justify-content: flex-end; gap: 20px; font-size: 14px; margin-top: 10px; }
            .total-val { font-size: 20px; font-weight: 900; color: #0284c7; }
            .footer-notes { border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 20px; font-size: 10px; color: #64748b; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
            .sig-line { width: 45%; border-top: 1px solid #0f172a; text-align: center; padding-top: 5px; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company">${storeName}</div>
              <div style="color: #64748b; font-size: 11px;">${storeCnpj} • ${storePhone}</div>
              <div style="color: #64748b; font-size: 11px;">${storeAddress}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">ORÇAMENTO COMERCIAL</span>
              <div style="font-size: 16px; font-weight: 900; margin-top: 4px;">#${quote.quoteNumber}</div>
              <div style="color: #64748b; font-size: 10px;">Emissão: ${formatDate(quote.createdAt)}</div>
              <div style="color: #dc2626; font-size: 11px; font-weight: bold;">Válido até: ${formatDateOnly(quote.validUntil)}</div>
            </div>
          </div>

          <div class="box">
            <div style="display: flex; justify-content: space-between;">
              <div>
                <strong>CLIENTE:</strong> ${quote.customerName || 'Consumidor Final'}<br/>
                ${quote.customerDocument ? `<span>Doc: ${quote.customerDocument}</span> • ` : ''}
                ${quote.customerPhone ? `<span>Tel/WhatsApp: ${quote.customerPhone}</span>` : ''}
                ${quote.customerEmail ? `<br/><span>E-mail: ${quote.customerEmail}</span>` : ''}
              </div>
              <div style="text-align: right;">
                <strong>VENDEDOR / ATENDENTE:</strong><br/>
                ${quote.operatorName}<br/>
                ${quote.paymentMethod ? `<span>Condição: <strong>${quote.paymentMethod}</strong></span>` : ''}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                <th>Descrição do Item</th>
                <th style="text-align: center; width: 60px;">Qtd</th>
                <th style="text-align: right; width: 90px;">Unitário</th>
                <th style="text-align: right; width: 100px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; border-top: 2px solid #e2e8f0; padding-top: 10px;">
            <div>Subtotal: <strong>${formatCurrency(quote.subtotal)}</strong></div>
            ${quote.discount > 0 ? `<div style="color: #dc2626;">Desconto: <strong>-${formatCurrency(quote.discount)}</strong></div>` : ''}
            <div class="total-row">
              <span style="font-weight: 900; align-self: center;">TOTAL DO ORÇAMENTO:</span>
              <span class="total-val">${formatCurrency(quote.total)}</span>
            </div>
          </div>

          ${
            quote.notes
              ? `<div class="box" style="margin-top: 15px; font-size: 11px;">
                  <strong>Observações / Condições:</strong><br/>
                  ${quote.notes}
                </div>`
              : ''
          }

          <div class="footer-notes">
            * Este documento é uma proposta comercial e não possui valor fiscal.<br/>
            * Os preços e condições são válidos exclusivamente até a data limite indicada (${formatDateOnly(quote.validUntil)}).
          </div>

          <div class="signatures">
            <div class="sig-line">${storeName}</div>
            <div class="sig-line">${quote.customerName || 'Assinatura do Cliente'}</div>
          </div>
        </body>
      </html>
    `;

    try {
      let printIframe = document.getElementById('quote-print-iframe') as HTMLIFrameElement;
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'quote-print-iframe';
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        document.body.appendChild(printIframe);
      }
      const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        }, 300);
      }
    } catch (e) {
      console.error('Erro ao imprimir orçamento:', e);
    }
  };

  const handleLoadQuoteIntoCart = (quote: Quote) => {
    const loadedCartItems: CartItem[] = quote.items.map((it) => {
      const fullProd = products.find((p) => p.id === it.productId);
      const product: Product = fullProd || {
        id: it.productId,
        name: it.productName,
        code: it.productCode,
        price: it.unitPrice,
        costPrice: it.costPrice || 0,
        stock: 999,
        minStock: 1,
        unit: it.unit || 'UN',
        createdAt: new Date().toISOString(),
      };

      return {
        product,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount || 0,
        total: it.total,
      };
    });

    const quoteCustomer: Customer = {
      id: quote.customerId || 'cust-balcao',
      name: quote.customerName || 'Consumidor Final (Balcão)',
      phone: quote.customerPhone,
      document: quote.customerDocument,
      email: quote.customerEmail,
    };

    loadCart(loadedCartItems, quoteCustomer, quote.discount || 0);

    // Update status to approved/converted
    updateQuoteStatus(quote.id, 'converted').catch(console.error);

    onClose();
    if (onOpenCheckout) {
      onOpenCheckout();
    }
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const term = searchTerm.toLowerCase().trim();
      const numMatch = (q.quoteNumber || '').toLowerCase().includes(term);
      const nameMatch = (q.customerName || '').toLowerCase().includes(term);
      const opMatch = (q.operatorName || '').toLowerCase().includes(term);
      const matchesSearch = !term || numMatch || nameMatch || opMatch;

      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  const getStatusBadge = (status: QuoteStatus, validUntil: string) => {
    const isExpired = new Date(validUntil).getTime() < Date.now();
    if (status === 'converted') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          Venda Concluída
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          Aprovado
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
          Recusado
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Vencido
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
        Pendente
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                Orçamento de Venda
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Transforme pedidos em propostas formais com impressão e WhatsApp
              </p>
            </div>
          </div>

          <button
            id="btn-close-quote-modal"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setCreatedQuote(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Gerar a Partir do Carrinho ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Orçamentos Salvos ({quotes.length})</span>
          </button>
        </div>

        {/* Tab 1: Create Quote Flow */}
        {activeTab === 'create' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {createdQuote ? (
              /* Success View */
              <div className="py-4 space-y-5 text-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                    Orçamento Gerado com Sucesso!
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    #{createdQuote.quoteNumber}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cliente: <strong className="text-slate-700 dark:text-slate-200">{createdQuote.customerName}</strong> • Total: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{formatCurrency(createdQuote.total)}</strong>
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                    Válido até: {formatDateOnly(createdQuote.validUntil)}
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto pt-2">
                  <button
                    type="button"
                    onClick={() => handlePrintQuote(createdQuote)}
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Printer className="w-4 h-4 text-slate-300" />
                    <span>Imprimir Proposta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(createdQuote)}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Share2 className="w-4 h-4 text-emerald-200" />
                    <span>Enviar WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyText(createdQuote)}
                    className="py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
                    <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>

                {/* Cart Next Action */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg mx-auto flex items-center justify-between gap-3 text-left">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      O que fazer com os itens no carrinho?
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      O orçamento já está salvo e pode ser carregado a qualquer momento.
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        clearCart();
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold text-xs border border-red-200 cursor-pointer"
                    >
                      Limpar Carrinho
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Manter
                    </button>
                  </div>
                </div>
              </div>
            ) : items.length === 0 ? (
              /* Empty Cart Warning */
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-16 h-16 mx-auto stroke-1 text-slate-300 mb-3" />
                <p className="font-bold text-slate-700 dark:text-slate-200 text-base">
                  Nenhum item no carrinho
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Adicione produtos ao carrinho no PDV para transformá-los em orçamento, ou consulte os orçamentos já salvos na aba ao lado.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                >
                  Ver Orçamentos Salvos
                </button>
              </div>
            ) : (
              /* Quote Generation Form */
              <div className="space-y-4">
                {/* Summary Banner */}
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">
                      Total do Orçamento ({items.reduce((acc, i) => acc + i.quantity, 0)} itens)
                    </span>
                    <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
                      {formatCurrency(total)}
                    </div>
                  </div>
                  <div className="text-right text-xs text-indigo-200">
                    <div>Operador: <strong>{currentUser.name}</strong></div>
                    <div>Data: <strong>{formatDateOnly(new Date().toISOString())}</strong></div>
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-600" />
                      Dados do Cliente para a Proposta
                    </label>
                    <span className="text-[11px] text-slate-400">Personalize o destinatário</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">Nome do Cliente</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: João da Silva"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">WhatsApp / Telefone (para envio)</label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">CPF / CNPJ (Opcional)</label>
                      <input
                        type="text"
                        value={customerDocument}
                        onChange={(e) => setCustomerDocument(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">E-mail (Opcional)</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="cliente@email.com"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Validity & Payment Condition */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Validity */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Prazo de Validade da Proposta
                    </label>

                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {[3, 7, 15, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setValidityDays(days)}
                          className={`py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                            validityDays === days
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {days} dias
                        </button>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Válido até:{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {formatDateOnly(calculateValidUntil())}
                      </strong>
                    </div>
                  </div>

                  {/* Payment Condition */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                      Condição de Pagamento Prevista
                    </label>

                    <select
                      value={paymentCondition}
                      onChange={(e) => setPaymentCondition(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="À vista / PIX">À vista / PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Cartão de Crédito à Vista">Cartão de Crédito à Vista</option>
                      <option value="Cartão Parcelado em até 3x">Cartão Parcelado em até 3x</option>
                      <option value="Cartão Parcelado em até 6x">Cartão Parcelado em até 6x</option>
                      <option value="Cartão Parcelado em até 12x">Cartão Parcelado em até 12x</option>
                      <option value="A Prazo / Boleto (30 dias)">A Prazo / Boleto (30 dias)</option>
                    </select>
                  </div>
                </div>

                {/* Items Preview Table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Itens incluídos ({items.length})</span>
                    <span>Subtotal: {formatCurrency(subtotal)}</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((it) => (
                      <div key={it.product.id} className="px-3.5 py-2 flex items-center justify-between text-xs">
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                            {it.product.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {it.quantity} {it.product.unit || 'UN'} x {formatCurrency(it.unitPrice)}
                          </span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white font-mono">
                          {formatCurrency(it.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observações / Notas */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Observações e Condições da Proposta
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                    placeholder="Adicione termos, prazos de entrega, garantia..."
                  />
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    id="btn-confirm-save-quote"
                    type="button"
                    onClick={handleSaveQuote}
                    disabled={isSaving}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                  >
                    <FileCheck className="w-5 h-5" />
                    <span>{isSaving ? 'Gerando Orçamento...' : 'CONFIRMAR E SALVAR ORÇAMENTO'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved Quotes List */}
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-3">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por cliente, nº do orçamento ou operador..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'pending', 'converted', 'approved'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all'
                      ? 'Todos'
                      : st === 'pending'
                      ? 'Pendentes'
                      : st === 'converted'
                      ? 'Convertidos'
                      : 'Aprovados'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quotes List */}
            {filteredQuotes.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  Nenhum orçamento encontrado
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gere orçamentos a partir dos itens do carrinho para consultá-los aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredQuotes.map((q) => {
                  const isExpired = new Date(q.validUntil).getTime() < Date.now();
                  return (
                    <div
                      key={q.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-950 dark:text-white">
                              #{q.quoteNumber}
                            </span>
                            {getStatusBadge(q.status, q.validUntil)}
                          </div>
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                            {q.customerName}
                          </h4>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Emissão: {formatDateOnly(q.createdAt)}</span>
                            <span>•</span>
                            <span className={isExpired ? 'text-red-500 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                              Validade: {formatDateOnly(q.validUntil)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-slate-950 dark:text-white font-mono block">
                            {formatCurrency(q.total)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {q.items.length} {q.items.length === 1 ? 'produto' : 'produtos'}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintQuote(q)}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                            title="Imprimir Proposta"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Imprimir</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(q)}
                            className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Enviar por WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteQuote(q.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Orçamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Convert to Sale / Load Cart */}
                        <button
                          type="button"
                          onClick={() => handleLoadQuoteIntoCart(q)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <span>Carregar no Carrinho</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
