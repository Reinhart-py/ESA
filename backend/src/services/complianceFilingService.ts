import { ComplianceFilingRepository } from '../repositories/complianceFilingRepository.js';
import { ComplianceRepository } from '../repositories/complianceRepository.js';
import { supabase } from '../config/supabase.js';

export class ComplianceFilingService {
  /**
   * Subscribe a tenant to a regional compliance pack and pre-populate obligations
   */
  static async subscribeToPack(tenantId: string, packId: string) {
    // 1. Fetch compliance pack details
    const { data: pack, error: packError } = await supabase
      .from('compliance_packs')
      .select('*')
      .eq('id', packId)
      .single();

    if (packError || !pack) {
      throw new Error(packError?.message || 'Compliance pack not found');
    }

    const rules = pack.rules || [];
    const createdObligations = [];
    const currentYear = new Date().getFullYear();

    // 2. Insert compliance obligations according to rules
    for (const rule of rules) {
      const dueDateString = `${currentYear}-${String(rule.due_month).padStart(2, '0')}-${String(rule.due_day).padStart(2, '0')}`;
      
      const ob = await ComplianceRepository.createObligation({
        tenant_id: tenantId,
        title: `${pack.country_code} ${rule.title} (${currentYear})`,
        due_date: dueDateString,
        type: rule.type,
        assigned_specialist_id: null,
        notes: `Automatically generated via ${pack.name} (${pack.authority})`
      });

      createdObligations.push(ob);

      // Pre-initialize empty filing submission
      await ComplianceFilingRepository.createFilingSubmission({
        tenant_id: tenantId,
        obligation_id: ob.id,
        status: 'Draft',
        evidence_file_id: null,
        comments: null
      });
    }

    return createdObligations;
  }

  /**
   * Submit document evidence for a filing obligation
   */
  static async submitEvidence(
    tenantId: string,
    submissionId: string,
    evidenceFileId: string,
    comments?: string
  ) {
    // 1. Update submission status to Under Review
    const submission = await ComplianceFilingRepository.updateFilingSubmission(
      submissionId,
      tenantId,
      {
        status: 'Under Review',
        evidence_file_id: evidenceFileId,
        comments: comments || null
      }
    );

    // 2. Set the parent obligation status to Needs Review
    await ComplianceRepository.updateObligationStatus(
      submission.obligation_id,
      tenantId,
      'Needs Review'
    );

    return submission;
  }

  /**
   * Review a submitted filing (Auditors / Accountants desk tool)
   */
  static async reviewSubmission(
    tenantId: string,
    submissionId: string,
    reviewerId: string,
    action: 'approve' | 'reject',
    reviewerComments?: string
  ) {
    const status = action === 'approve' ? 'Approved' : 'Rejected';
    
    // 1. Update submission details
    const submission = await ComplianceFilingRepository.updateFilingSubmission(
      submissionId,
      tenantId,
      {
        status,
        comments: reviewerComments || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      }
    );

    // 2. Adjust obligation status correspondingly
    // Approved submission -> Filed obligation
    // Rejected submission -> Needs Review / Late
    const obStatus = action === 'approve' ? 'Filed' : 'Needs Review';
    await ComplianceRepository.updateObligationStatus(
      submission.obligation_id,
      tenantId,
      obStatus
    );

    return submission;
  }
}
