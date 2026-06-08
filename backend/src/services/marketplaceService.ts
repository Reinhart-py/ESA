import { MarketplaceRepository } from '../repositories/marketplaceRepository.js';
import { ProfessionalRepository } from '../repositories/professionalRepository.js';

export class MarketplaceService {
  static async postServiceRequest(
    tenantId: string,
    title: string,
    description: string,
    category: string,
    budgetCents: number
  ) {
    return await MarketplaceRepository.createRequest({
      tenant_id: tenantId,
      title,
      description,
      category,
      budget_cents: budgetCents
    });
  }

  static async submitQuotation(
    requestId: string,
    proId: string,
    amountCents: number,
    proposal: string
  ) {
    const profile = await ProfessionalRepository.getProfile(proId);
    if (!profile || !profile.is_verified) {
      throw new Error('Only verified professionals can submit quotation bids.');
    }

    const request = await MarketplaceRepository.getRequestById(requestId);
    if (request.status !== 'open') {
      throw new Error('This service request is no longer accepting bids.');
    }

    return await MarketplaceRepository.createQuote({
      request_id: requestId,
      professional_id: proId,
      amount_cents: amountCents,
      proposal
    });
  }

  static async acceptQuotation(quoteId: string, tenantId: string) {
    const quote = await MarketplaceRepository.getQuoteById(quoteId);
    if (!quote || quote.status !== 'pending') {
      throw new Error('Quotation is not in pending state.');
    }

    const request = await MarketplaceRepository.getRequestById(quote.request_id);
    if (request.tenant_id !== tenantId) {
      throw new Error('Unauthorized: Request does not belong to this tenant.');
    }

    // Accept this quote
    await MarketplaceRepository.updateQuoteStatus(quoteId, 'accepted');

    // Reject all other quotes for this request
    const allQuotes = await MarketplaceRepository.getQuotesForRequest(quote.request_id);
    for (const q of allQuotes) {
      if (q.id !== quoteId && q.status === 'pending') {
        await MarketplaceRepository.updateQuoteStatus(q.id, 'rejected');
      }
    }

    // Set request status to assigned
    await MarketplaceRepository.updateRequestStatus(quote.request_id, 'assigned');

    // Create contract
    const terms = `EAC Solutions Marketplace Engagement Contract.\n\n` +
      `This contract binds the Client Company and Professional Practitioner for the request "${request.title}".\n` +
      `Total Cost: $${(quote.amount_cents / 100).toFixed(2)}\n\n` +
      `Proposal Details:\n${quote.proposal}`;

    return await MarketplaceRepository.createContract({
      tenant_id: tenantId,
      request_id: quote.request_id,
      quotation_id: quoteId,
      professional_id: quote.professional_id,
      amount_cents: quote.amount_cents,
      terms
    });
  }

  static async signContract(
    contractId: string,
    userId: string,
    role: 'client' | 'professional',
    signature: string
  ) {
    const contract = await MarketplaceRepository.getContractById(contractId);
    if (!contract) {
      throw new Error('Contract not found.');
    }

    if (role === 'client' && contract.tenant_id !== (await ProfessionalRepository.getProfile(userId).then(p => p?.tenant_id) || contract.tenant_id)) {
      // Basic check
    }

    if (role === 'professional' && contract.professional_id !== userId) {
      throw new Error('Unauthorized: You are not the assigned professional.');
    }

    return await MarketplaceRepository.signContract(contractId, role, signature);
  }
}
