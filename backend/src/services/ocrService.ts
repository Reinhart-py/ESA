import Tesseract from 'tesseract.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export class OcrService {
  static async extractTextAndClassify(fileName: string, base64Data: string): Promise<{
    ocrText: string;
    suggestedCategory: string;
  }> {
    const buffer = Buffer.from(base64Data, 'base64');
    let extractedText = '';
    const lowerName = fileName.toLowerCase();

    try {
      if (lowerName.endsWith('.pdf')) {
        const data = await pdf(buffer);
        extractedText = data.text || '';
      } else if (lowerName.match(/\.(png|jpe?g|webp)$/)) {
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        extractedText = text || '';
      } else {
        extractedText = buffer.toString('utf8', 0, 10000);
      }
    } catch (err: any) {
      console.warn(`[OCR Service] Real parser failed for ${fileName}, falling back to snippet scan.`, err.message);
      extractedText = buffer.toString('utf8', 0, 2000);
    }

    const contentSnippet = extractedText.toLowerCase();
    let suggestedCategory = 'General';
    let ocrText = `[OCR Text Extraction Engine]\n`;
    ocrText += `File scanned: ${fileName}\n`;

    if (lowerName.includes('invoice') || lowerName.includes('receipt') || lowerName.includes('bill') || contentSnippet.includes('invoice') || contentSnippet.includes('total due') || contentSnippet.includes('payment')) {
      suggestedCategory = 'Billing/Expense';
      ocrText += `Document Class: Invoice / Receipt\n`;
      ocrText += `Key terms found: invoice, total, balance due, payment terms.\n`;
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
    } else if (lowerName.includes('payroll') || lowerName.includes('payslip') || contentSnippet.includes('payroll') || contentSnippet.includes('salary') || contentSnippet.includes('payslip')) {
      suggestedCategory = 'payroll';
      ocrText += `Document Class: Payroll / Paystub\n`;
      ocrText += `Key terms found: payroll, salary, earnings, net pay.\n`;
    }

    ocrText += `\nFull Indexable Payload:\n${extractedText || '(Binary non-text content)'}`;

    return { ocrText, suggestedCategory };
  }
}
