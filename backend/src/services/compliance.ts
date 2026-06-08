import { ComplianceRepository } from '../repositories/complianceRepository.js';

export class ComplianceEngine {
  /**
   * Automatically calculates the next due date based on tax obligation rules
   */
  static getNextDueDate(type: string, referenceDate: Date = new Date()): Date {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth(); // 0-indexed

    switch (type) {
      case 'GST':
        // GST is due on the 20th of the following month
        return new Date(year, month + 1, 20);
      case 'TDS':
        // TDS is due on the 7th of the following month
        return new Date(year, month + 1, 7);
      case 'VAT':
        // VAT is due quarterly (on the 25th of the month following the quarter end)
        const currentQuarter = Math.floor(month / 3);
        const nextQuarterEndMonth = (currentQuarter + 1) * 3;
        return new Date(year, nextQuarterEndMonth, 25);
      case 'Corporate Tax':
        // Corporate Tax filing is typically due 6 months after the financial year end (e.g. Dec 31 -> June 30)
        return new Date(year, 5, 30);
      case 'Payroll Tax':
        // Payroll Tax is due monthly on the 15th
        return new Date(year, month + 1, 15);
      default:
        // Default to 30 days from reference date
        const defaultDate = new Date(referenceDate);
        defaultDate.setDate(defaultDate.getDate() + 30);
        return defaultDate;
    }
  }

  /**
   * Computes risk score based on percentage of fulfilled obligations vs late obligations
   */
  static calculateComplianceScore(obligations: any[]): number {
    if (obligations.length === 0) return 100;

    const totalWeight = obligations.reduce((acc, ob) => acc + (ob.compliance_score_impact || 10), 0);
    const lateDeductions = obligations
      .filter(ob => ob.status === 'Late')
      .reduce((acc, ob) => acc + (ob.compliance_score_impact || 10), 0);

    const score = 100 - (lateDeductions / totalWeight) * 100;
    return Math.max(0, Math.round(score));
  }
}
