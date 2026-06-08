import { supabase } from '../config/supabase.js';
import { ComplianceRepository } from '../repositories/complianceRepository.js';
import { ComplianceFilingRepository } from '../repositories/complianceFilingRepository.js';

export class ComplianceSchedulerService {
  /**
   * Run a global scheduler sweep:
   * 1. Bootstrap default templates if empty.
   * 2. Ensure each tenant has obligations populated based on templates for their country.
   * 3. Sweep active obligations to flag Late status and dispatch alerts.
   * 4. Re-calculate active compliance score.
   */
  static async runGlobalSweep() {
    console.log('[Compliance Scheduler] Starting Global Compliance Sweep...');
    
    // 1. Bootstrap templates
    await this.bootstrapDefaultTemplates();

    // 2. Fetch all tenants
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*');

    if (tenantError) throw tenantError;

    const summary = {
      tenantsChecked: tenants?.length || 0,
      obligationsCreated: 0,
      alertsCreated: 0
    };

    for (const tenant of tenants || []) {
      const countryCode = tenant.country || 'US';

      // Get templates for tenant's country
      const templates = await ComplianceRepository.getTemplatesByCountry(countryCode);

      // Create missing obligations
      const currentYear = new Date().getFullYear();
      const now = new Date();

      for (const temp of templates) {
        // Calculate target due dates for this year
        let targetDates: Date[] = [];
        if (temp.frequency === 'Monthly') {
          for (let m = 0; m < 12; m++) {
            targetDates.push(new Date(currentYear, m, temp.day_offset));
          }
        } else if (temp.frequency === 'Quarterly') {
          const quarters = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct offsets
          for (const q of quarters) {
            targetDates.push(new Date(currentYear, q + (temp.month_offset || 0), temp.day_offset));
          }
        } else {
          targetDates.push(new Date(currentYear, temp.month_offset || 0, temp.day_offset));
        }

        for (const dueDate of targetDates) {
          const dueDateStr = dueDate.toISOString().split('T')[0];

          // Check if obligation already exists for tenant
          const { data: existing } = await supabase
            .from('compliance_obligations')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('title', temp.title)
            .eq('due_date', dueDateStr);

          if (!existing || existing.length === 0) {
            // Create obligation
            const ob = await ComplianceRepository.createObligation({
              tenant_id: tenant.id,
              title: temp.title,
              due_date: dueDateStr,
              type: temp.type,
              assigned_specialist_id: null,
              notes: temp.description || `Scheduled recurring obligation: ${temp.title}`,
              compliance_score_impact: temp.compliance_score_impact
            });

            summary.obligationsCreated++;

            // Create submission log
            await ComplianceFilingRepository.createFilingSubmission({
              tenant_id: tenant.id,
              obligation_id: ob.id,
              status: 'Draft',
              evidence_file_id: null,
              comments: null
            });
          }
        }
      }

      // 3. Sweep obligations to flag Late status and dispatch alerts
      const obligations = await ComplianceRepository.getObligationsByTenant(tenant.id);
      for (const ob of obligations) {
        const isFiled = ob.status === 'Filed';
        const isLate = ob.status === 'Late';
        const dueDate = new Date(ob.due_date);
        
        // Late Check
        if (!isFiled && !isLate && dueDate < now) {
          await ComplianceRepository.updateObligationStatus(ob.id, tenant.id, 'Late');
          
          // Log Late Alert
          await ComplianceRepository.createAlert({
            tenant_id: tenant.id,
            obligation_id: ob.id,
            alert_type: 'Late'
          });
          summary.alertsCreated++;
        } 
        // Warning Check (< 3 days remaining)
        else if (!isFiled && !isLate) {
          const diffTime = dueDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays <= 3) {
            // Check if warning alert already sent recently
            const { data: alertExists } = await supabase
              .from('compliance_alerts')
              .select('id')
              .eq('tenant_id', tenant.id)
              .eq('obligation_id', ob.id)
              .eq('alert_type', 'Warning');

            if (!alertExists || alertExists.length === 0) {
              await ComplianceRepository.createAlert({
                tenant_id: tenant.id,
                obligation_id: ob.id,
                alert_type: 'Warning'
              });
              summary.alertsCreated++;
            }
          }
        }
      }

      // 4. Update live compliance score
      await ComplianceRepository.calculateComplianceScore(tenant.id);
    }

    console.log('[Compliance Scheduler] Global Compliance Sweep completed:', summary);
    return summary;
  }

  /**
   * Seeding templates
   */
  private static async bootstrapDefaultTemplates() {
    const { data: existingData, error } = await supabase
      .from('compliance_templates')
      .select('id')
      .limit(1);

    if (error) throw error;
    if (existingData && existingData.length > 0) return; // Seeding is already done

    console.log('[Compliance Scheduler] Seeding default compliance templates...');

    const defaults = [
      // US templates
      {
        title: 'US Corporate Income Tax CIT (Form 1120)',
        description: 'Annual corporate tax filing deadline for federal CIT.',
        type: 'Corporate Tax',
        frequency: 'Annually',
        country_code: 'US',
        month_offset: 3, // April
        day_offset: 15,
        compliance_score_impact: 20
      },
      {
        title: 'US Payroll Tax Form 941 (Quarterly)',
        description: 'Employer quarterly federal tax return.',
        type: 'Payroll Tax',
        frequency: 'Quarterly',
        country_code: 'US',
        month_offset: 0,
        day_offset: 30,
        compliance_score_impact: 10
      },
      {
        title: 'US State Sales Tax Filing',
        description: 'Monthly state sales and use tax declaration.',
        type: 'VAT',
        frequency: 'Monthly',
        country_code: 'US',
        month_offset: 0,
        day_offset: 20,
        compliance_score_impact: 10
      },
      // UK templates
      {
        title: 'UK VAT Return (Quarterly)',
        description: 'Quarterly Value Added Tax submission to HMRC.',
        type: 'VAT',
        frequency: 'Quarterly',
        country_code: 'UK',
        month_offset: 0,
        day_offset: 7,
        compliance_score_impact: 15
      },
      {
        title: 'UK Corporation Tax Filing (Form CT600)',
        description: 'Annual company tax return filed to HMRC.',
        type: 'Corporate Tax',
        frequency: 'Annually',
        country_code: 'UK',
        month_offset: 11, // Dec
        day_offset: 31,
        compliance_score_impact: 20
      },
      {
        title: 'UK PAYE Submission',
        description: 'Monthly payroll tax and NI submission.',
        type: 'Payroll Tax',
        frequency: 'Monthly',
        country_code: 'UK',
        month_offset: 0,
        day_offset: 19,
        compliance_score_impact: 10
      },
      // IN templates
      {
        title: 'IN GST Return (GSTR-3B)',
        description: 'Monthly self-declared summary GST return.',
        type: 'GST',
        frequency: 'Monthly',
        country_code: 'IN',
        month_offset: 0,
        day_offset: 20,
        compliance_score_impact: 15
      },
      {
        title: 'IN TDS Payment (GSTR-7)',
        description: 'Monthly Tax Deducted at Source certificate payment.',
        type: 'TDS',
        frequency: 'Monthly',
        country_code: 'IN',
        month_offset: 0,
        day_offset: 7,
        compliance_score_impact: 10
      },
      {
        title: 'IN Corporate Income Tax (ITR-6)',
        description: 'Annual income tax return for corporate assessment.',
        type: 'Corporate Tax',
        frequency: 'Annually',
        country_code: 'IN',
        month_offset: 9, // Oct
        day_offset: 31,
        compliance_score_impact: 20
      }
    ];

    for (const item of defaults) {
      await ComplianceRepository.createTemplate(item);
    }
  }
}
