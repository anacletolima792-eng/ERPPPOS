import React, { useEffect, useState } from 'react';
import { X, Printer, Share2, Check, SlidersHorizontal, ExternalLink, Download, RotateCcw } from 'lucide-react';
import { Sale, StoreSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getStoreSettings } from '../services/firestoreService';
import { generatePrintReceiptUrl } from '../utils/printReceiptHelper';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [copied, setCopied] = useState(false);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [printSuccessNotice, setPrintSuccessNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getStoreSettings().then(setStoreSettings).catch(console.error);
      setPrintSuccessNotice(false);
      if (sale) {
        try {
          sessionStorage.setItem('pdv_current_print_sale', JSON.stringify(sale));
        } catch (e) {}
      }
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  const isReturned = sale.status === 'returned';

  const buildItemsHtml = () => {
    return sale.items
      .map(
        (item, idx) => `
        <div style="margin-bottom: 3px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;">
              ${idx + 1}. ${item.productName}
            </span>
            <span>${formatCurrency(item.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.9em; padding-left: 6px; color: #222;">
            <span>${item.quantity} ${item.unit || 'UN'} x ${formatCurrency(item.unitPrice)}</span>
            ${item.discount > 0 ? `<span>-desc ${formatCurrency(item.discount)}</span>` : ''}
          </div>
        </div>
      `
      )
      .join('');
  };

  const buildReceiptInnerHtml = () => {
    const storeName = storeSettings?.storeName || 'ERP & PDV EXPRESS';
    const cnpj = storeSettings?.cnpj ? `CNPJ: ${storeSettings.cnpj}` : '';
    const address = storeSettings?.address || '';
    const phone = storeSettings?.phone ? `Tel: ${storeSettings.phone}` : '';
    const footerMsg = isReturned
      ? 'Itens repostos ao estoque com sucesso.'
      : storeSettings?.receiptFooter || 'Obrigado pela preferência! Volte sempre.';

    const changeHtml =
      !isReturned && sale.paymentMethod === 'dinheiro'
        ? `
        <div style="display: flex; justify-content: space-between; font-size: 0.95em;">
          <span>VALOR RECEBIDO:</span>
          <span>${formatCurrency(sale.amountPaid)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>TROCO:</span>
          <span>${formatCurrency(sale.change)}</span>
        </div>
      `
        : '';

    return `
      <div style="text-align: center; margin-bottom: 6px;">
        <div style="font-size: 1.2em; font-weight: 900; text-transform: uppercase;">${storeName}</div>
        ${cnpj ? `<div style="font-size: 0.9em;">${cnpj}</div>` : ''}
        ${address ? `<div style="font-size: 0.85em;">${address}</div>` : ''}
        ${phone ? `<div style="font-size: 0.85em;">${phone}</div>` : ''}
        <div style="margin-top: 4px; font-weight: bold; letter-spacing: 1px; font-size: 0.9em;">
          ${isReturned ? '*** COMPROVANTE DE DEVOLUÇÃO AO ESTOQUE ***' : '*** CUPOM NÃO FISCAL ***'}
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <div style="display: flex; justify-content: space-between; margin: 2px 0;">
        <span>DOC: #${sale.saleNumber}</span>
        <span>${formatDate(sale.createdAt)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 2px 0;">
        <span>OP: ${sale.operatorName}</span>
        <span>CLI: ${sale.customerName || 'Consumidor Final'}</span>
      </div>
      ${
        isReturned && sale.returnReason
          ? `<div style="margin: 2px 0; font-size: 0.9em;"><strong>MOTIVO:</strong> ${sale.returnReason}</div>`
          : ''
      }

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 0.9em; margin-bottom: 3px;">
        <span>${isReturned ? 'ITEM REPOSTO / DESCRIÇÃO' : 'QTD ITEM / DESCRIÇÃO'}</span>
        <span>TOTAL</span>
      </div>

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      ${buildItemsHtml()}

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <div style="display: flex; justify-content: space-between; margin: 2px 0;">
        <span>QTD TOTAL ITENS:</span>
        <span>${sale.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 2px 0;">
        <span>SUBTOTAL:</span>
        <span>${formatCurrency(sale.subtotal)}</span>
      </div>
      ${
        sale.discount > 0
          ? `
      <div style="display: flex; justify-content: space-between; margin: 2px 0; color: #000;">
        <span>DESCONTO:</span>
        <span>-${formatCurrency(sale.discount)}</span>
      </div>`
          : ''
      }

      <div style="display: flex; justify-content: space-between; font-size: 1.15em; font-weight: 900; margin: 4px 0; padding: 3px 0; border-top: 1px solid #000; border-bottom: 1px solid #000;">
        <span>${isReturned ? 'TOTAL ESTORNADO:' : 'TOTAL A PAGAR:'}</span>
        <span>${isReturned ? `- ${formatCurrency(sale.total)}` : formatCurrency(sale.total)}</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin: 2px 0;">
        <span>${isReturned ? 'FORMA ESTORNO:' : 'FORMA PGTO:'}</span>
        <span style="font-weight: bold; text-transform: uppercase;">${sale.paymentMethod}</span>
      </div>
      ${changeHtml}

      ${sale.notes ? `<div style="margin-top: 4px; font-size: 0.9em;">Obs: ${sale.notes}</div>` : ''}

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <div style="text-align: center; margin-top: 6px;">
        <p>${footerMsg}</p>
        <p style="font-size: 0.8em; margin-top: 4px; color: #444;">Sistema ERP/PDV Express</p>
      </div>
    `;
  };

  const printUrl = generatePrintReceiptUrl(sale, storeSettings, paperWidth);

  const handlePrint = () => {
    setPrintSuccessNotice(true);

    try {
      sessionStorage.setItem('pdv_current_print_sale', JSON.stringify(sale));
    } catch (e) {}

    const isInIframe = window.self !== window.top;

    // 1. Prepare dedicated #print-root element
    let printRoot = document.getElementById('print-root');
    if (!printRoot) {
      printRoot = document.createElement('div');
      printRoot.id = 'print-root';
      document.body.appendChild(printRoot);
    }

    const targetWidth = paperWidth === '80mm' ? '78mm' : '56mm';
    document.documentElement.style.setProperty('--print-width', targetWidth);

    printRoot.innerHTML = `
      <div style="width: ${targetWidth}; margin: 0 auto; padding: 2mm; font-family: 'Courier New', Courier, monospace; font-size: ${
      paperWidth === '80mm' ? '11px' : '9.5px'
    }; line-height: 1.3; color: #000;">
        ${buildReceiptInnerHtml()}
      </div>
    `;

    // 2. Hidden Iframe Print Strategy (bypasses some browser modal restrictions)
    try {
      let printIframe = document.getElementById('receipt-print-iframe') as HTMLIFrameElement;
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'receipt-print-iframe';
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
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Cupom #${sale.saleNumber}</title>
              <style>
                @page { size: ${paperWidth} auto; margin: 0mm !important; }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                  font-family: 'Courier New', Courier, monospace;
                  font-size: ${paperWidth === '80mm' ? '11px' : '9.5px'};
                  line-height: 1.3;
                  color: #000;
                  background: #fff;
                  width: ${targetWidth};
                  margin: 0 auto;
                  padding: 2mm;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              </style>
            </head>
            <body>
              ${buildReceiptInnerHtml()}
            </body>
          </html>
        `);
        doc.close();
        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (e) {
            console.warn('Iframe print warning:', e);
          }
        }, 250);
      }
    } catch (e) {
      console.warn('Print iframe error:', e);
    }

    // 3. Trigger native print dialog directly (only when opened in a top-level window)
    if (!isInIframe) {
      try {
        window.print();
      } catch (err) {
        console.warn('Direct print error:', err);
      }
    } else {
      // In sandboxed preview iframes, direct window.print() can blank or lock the preview frame in Chromium.
      // Opening the dedicated print receipt tab safely provides guaranteed native printing.
      try {
        window.open(printUrl, '_blank');
      } catch (e) {
        console.warn('Iframe window.open warning:', e);
      }
    }
  };

  const handleOpenPrintWindow = () => {
    try {
      sessionStorage.setItem('pdv_current_print_sale', JSON.stringify(sale));
    } catch (e) {}
    window.open(printUrl, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text =
      (isReturned
        ? `*COMPROVANTE DE DEVOLUÇÃO AO ESTOQUE - ${storeSettings?.storeName || 'PDV Express'}*\n`
        : `*COMPROVANTE DE VENDA - ${storeSettings?.storeName || 'PDV Express'}*\n`) +
      `Doc: #${sale.saleNumber}\n` +
      `Data: ${formatDate(sale.createdAt)}\n` +
      `Cliente: ${sale.customerName || 'Consumidor Final'}\n` +
      (isReturned && sale.returnReason ? `Motivo: ${sale.returnReason}\n` : '') +
      `----------------------------\n` +
      sale.items.map((i) => `${i.quantity}x ${i.productName} = ${formatCurrency(i.total)}`).join('\n') +
      `\n----------------------------\n` +
      `Subtotal: ${formatCurrency(sale.subtotal)}\n` +
      (sale.discount > 0 ? `Desconto: -${formatCurrency(sale.discount)}\n` : '') +
      (isReturned
        ? `*TOTAL ESTORNADO: -${formatCurrency(sale.total)}*\n`
        : `*TOTAL: ${formatCurrency(sale.total)}*\n`) +
      `Forma: ${sale.paymentMethod.toUpperCase()}\n` +
      `\n${isReturned ? 'Itens repostos ao estoque com sucesso.' : storeSettings?.receiptFooter || 'Obrigado pela preferência!'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const text =
      `================================\n` +
      `   ${storeSettings?.storeName || 'ERP & PDV EXPRESS'}\n` +
      (storeSettings?.cnpj ? `   CNPJ: ${storeSettings.cnpj}\n` : '') +
      (storeSettings?.address ? `   ${storeSettings.address}\n` : '') +
      (storeSettings?.phone ? `   Tel: ${storeSettings.phone}\n` : '') +
      (isReturned
        ? `  *** COMPROVANTE DE DEVOLUÇÃO ***\n`
        : `     *** CUPOM NÃO FISCAL ***\n`) +
      `================================\n` +
      `DOC: #${sale.saleNumber}\n` +
      `DATA: ${formatDate(sale.createdAt)}\n` +
      `OP: ${sale.operatorName}\n` +
      `CLI: ${sale.customerName || 'Consumidor Final'}\n` +
      (isReturned && sale.returnReason ? `MOTIVO: ${sale.returnReason}\n` : '') +
      `--------------------------------\n` +
      (isReturned ? `ITEM REPOSTO / QTD x PRECO TOTAL\n` : `ITEM / QTD x PRECO        TOTAL\n`) +
      `--------------------------------\n` +
      sale.items
        .map(
          (i, idx) =>
            `${idx + 1}. ${i.productName.slice(0, 20)}\n` +
            `   ${i.quantity} ${i.unit || 'UN'} x ${formatCurrency(i.unitPrice)} = ${formatCurrency(i.total)}`
        )
        .join('\n') +
      `\n--------------------------------\n` +
      `QTD TOTAL ITENS: ${sale.items.reduce((acc, i) => acc + i.quantity, 0)}\n` +
      `SUBTOTAL: ${formatCurrency(sale.subtotal)}\n` +
      (sale.discount > 0 ? `DESCONTO: -${formatCurrency(sale.discount)}\n` : '') +
      (isReturned
        ? `TOTAL ESTORNADO: -${formatCurrency(sale.total)}\n`
        : `TOTAL A PAGAR: ${formatCurrency(sale.total)}\n`) +
      `FORMA: ${sale.paymentMethod.toUpperCase()}\n` +
      (!isReturned && sale.paymentMethod === 'dinheiro'
        ? `VALOR RECEBIDO: ${formatCurrency(sale.amountPaid)}\nTROCO: ${formatCurrency(sale.change)}\n`
        : '') +
      `================================\n` +
      `   ${isReturned ? 'Itens repostos ao estoque.' : storeSettings?.receiptFooter || 'Obrigado pela preferência!'}\n` +
      `================================\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isReturned ? `comprovante-devolucao-${sale.saleNumber}.txt` : `cupom-venda-${sale.saleNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold ${
                isReturned ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            >
              {isReturned ? <RotateCcw className="w-4 h-4" /> : '✓'}
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                {isReturned ? 'Comprovante de Devolução' : 'Comprovante de Venda'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isReturned
                  ? `Devolução ao Estoque #${sale.saleNumber}`
                  : `Cupom Não-Fiscal #${sale.saleNumber}`}
              </p>
            </div>
          </div>

          <button
            id="btn-close-receipt"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Size selector */}
        <div className="px-5 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            Formato:
          </span>
          <div className="flex items-center gap-1 bg-white p-0.5 border border-slate-200 rounded-lg shadow-2xs">
            <button
              type="button"
              id="btn-format-80mm"
              onClick={() => setPaperWidth('80mm')}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                paperWidth === '80mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80mm (Padrão)
            </button>
            <button
              type="button"
              id="btn-format-58mm"
              onClick={() => setPaperWidth('58mm')}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                paperWidth === '58mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              58mm
            </button>
          </div>
        </div>

        {/* Thermal Slip Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100/70">
          <div
            id="thermal-receipt"
            className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 font-mono text-xs text-slate-900 mx-auto transition-all ${
              paperWidth === '80mm' ? 'max-w-[340px]' : 'max-w-[260px] text-[11px]'
            }`}
          >
            {/* Header Store Info */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-0.5">
              <h3 className="font-extrabold text-sm uppercase tracking-tight font-sans text-slate-950">
                {storeSettings?.storeName || 'ERP & PDV EXPRESS'}
              </h3>
              {storeSettings?.cnpj && (
                <p className="text-[11px] text-slate-600">CNPJ: {storeSettings.cnpj}</p>
              )}
              {storeSettings?.address && (
                <p className="text-[10px] text-slate-500">{storeSettings.address}</p>
              )}
              {storeSettings?.phone && (
                <p className="text-[10px] text-slate-500">Tel: {storeSettings.phone}</p>
              )}
              <div className="pt-1 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                {isReturned ? '*** COMPROVANTE DE DEVOLUÇÃO AO ESTOQUE ***' : '*** CUPOM NÃO FISCAL ***'}
              </div>
            </div>

            {/* Sale metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>DOC: #{sale.saleNumber}</span>
                <span>{formatDate(sale.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>OP: {sale.operatorName}</span>
                <span>CLI: {sale.customerName || 'Balcão'}</span>
              </div>
              {isReturned && sale.returnReason && (
                <div className="pt-1 text-[10px] text-amber-800 font-medium">
                  <strong>MOTIVO:</strong> {sale.returnReason}
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
              <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                <span>{isReturned ? 'ITEM REPOSTO / DESCRIÇÃO' : 'ITEM / DESCRIÇÃO'}</span>
                <span>TOTAL</span>
              </div>

              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span className="truncate max-w-[180px]">
                      {idx + 1}. {item.productName}
                    </span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between pl-3">
                    <span>
                      {item.quantity} {item.unit || 'UN'} x {formatCurrency(item.unitPrice)}
                    </span>
                    {item.discount > 0 && (
                      <span className="text-red-500">-desc {formatCurrency(item.discount)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals and Payment */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>QTD ITENS:</span>
                <span>{sale.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>SUBTOTAL</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>DESCONTO</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                <span>{isReturned ? 'TOTAL ESTORNADO' : 'TOTAL A PAGAR'}</span>
                <span className={isReturned ? 'text-amber-700' : ''}>
                  {isReturned ? `- ${formatCurrency(sale.total)}` : formatCurrency(sale.total)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 text-slate-600">
                <span>{isReturned ? 'FORMA ESTORNO:' : 'FORMA PGTO:'}</span>
                <span className="font-bold uppercase">{sale.paymentMethod}</span>
              </div>
              {!isReturned && sale.paymentMethod === 'dinheiro' && (
                <>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>VALOR RECEBIDO:</span>
                    <span>{formatCurrency(sale.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                    <span>TROCO:</span>
                    <span>{formatCurrency(sale.change)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer Message */}
            <div className="pt-3 text-center text-[11px] text-slate-500 space-y-1">
              <p>
                {isReturned
                  ? 'Itens repostos ao estoque com sucesso.'
                  : storeSettings?.receiptFooter || 'Obrigado pela preferência! Volte sempre.'}
              </p>
              <p className="text-[9px] text-slate-400">Sistema ERP/PDV Web • Firestore Powered</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2.5">
          {printSuccessNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 min-w-0">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold truncate">Impressão enviada!</span>
              </div>
              <a
                href={printUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-bold underline text-[11px] shrink-0"
              >
                Abrir em nova aba ↗
              </a>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-print-receipt"
              onClick={handlePrint}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Cupom ({paperWidth})</span>
            </button>

            <a
              href={printUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="btn-open-print-tab"
              title="Abrir cupom em nova aba para imprimir ou salvar em PDF"
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-copy-receipt"
              onClick={handleShareWhatsApp}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado para WhatsApp!' : 'Copiar WhatsApp'}</span>
            </button>

            <button
              type="button"
              id="btn-download-txt-receipt"
              onClick={handleDownloadTxt}
              title="Baixar cupom em formato de texto para impressoras seriais/bluetooth"
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar TXT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

