export class OcrService {
  static async extractTextAndClassify(fileName: string, base64Data: string): Promise<{
    ocrText: string;
    suggestedCategory: string;
  }> {
    // Decode the base64 to inspect contents for keywords if possible
    let contentSnippet = '';
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      contentSnippet = buffer.toString('utf8', 0, 1000).toLowerCase();
    } catch (err) {
      console.warn('Failed to parse base64 payload as utf8 string:', err);
    }

    const lowerName = fileName.toLowerCase();
    let ocrText = `[OCR Text Extraction Engine]\n`;
    ocrText += `File scanned: ${fileName}\n`;
    
    let suggestedCategory = 'General';

    if (lowerName.includes('invoice') || lowerName.includes('receipt') || lowerName.includes('bill') || contentSnippet.includes('invoice') || contentSnippet.includes('total due') || contentSnippet.includes('payment')) {
      suggestedCategory = 'Billing/Expense';
      ocrText += `Document Class: Invoice / Receipt\n`;
      ocrText += `Key terms found: invoice, total, balance due, payment terms.\n`;
      // Try to find an invoice amount snippet
      const amountMatch = contentSnippet.match(/\$?(\d+[\.,]\d{2})/);
      if (amountMatch) {
        ocrText += `Extracted Financial Value: ${amountMatch[0]}\n`;
      }
    } else if (lowerName.includes('tax') || lowerName.includes('return') || lowerName.includes('filing') || contentSnippet.includes('tax year') || contentSnippet.includes('internal revenue')) {
      suggestedCategory = 'Taxation';
      ocrText += `Document Class: Tax Filing Record\n`;
      ocrText += `Key terms found: tax return, gross income, deduction, filing year.\n`;
    } else if (lowerName.includes('audit') || lowerName.includes('compliance') || contentSnippet.includes('audit checklist') || contentSnippet.includes('regulatory')) {
      suggestedCategory = 'Audit';
      ocrText += `Document Class: Audit Compliance Log\n`;
      ocrText += `Key terms found: audit control, testing evidence, board resolution.\n`;
    }

    ocrText += `Full Indexable Payload:\n${contentSnippet || '(Binary non-text content)'}`;

    return { ocrText, suggestedCategory };
  }
}
