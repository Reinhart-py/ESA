import { supabase } from '../config/supabase.js';

export class MarketplaceRepository {
  // Service Requests
  static async createRequest(request: {
    tenant_id: string;
    title: string;
    description: string;
    category: string;
    budget_cents: number;
  }) {
    const { data, error } = await supabase
      .from('service_requests')
      .insert(request)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async listRequests(status = 'open') {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        tenants (
          name,
          business_type
        )
      `)
      .eq('status', status);

    if (error) throw error;
    return data || [];
  }

  static async getRequestById(id: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateRequestStatus(id: string, status: 'open' | 'assigned' | 'closed') {
    const { data, error } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Quotations
  static async createQuote(quote: {
    request_id: string;
    professional_id: string;
    amount_cents: number;
    proposal: string;
  }) {
    const { data, error } = await supabase
      .from('quotations')
      .insert(quote)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getQuotesForRequest(requestId: string) {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        professional:users!quotations_professional_id_fkey (
          full_name,
          email
        )
      `)
      .eq('request_id', requestId);

    if (error) throw error;
    return data || [];
  }

  static async getQuoteById(id: string) {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateQuoteStatus(id: string, status: 'pending' | 'accepted' | 'rejected') {
    const { data, error } = await supabase
      .from('quotations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Contracts
  static async createContract(contract: {
    tenant_id: string;
    request_id: string;
    quotation_id: string;
    professional_id: string;
    amount_cents: number;
    terms: string;
  }) {
    const { data, error } = await supabase
      .from('contracts')
      .insert(contract)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getContractById(id: string) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async listContractsForTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        professional:users!contracts_professional_id_fkey (
          full_name,
          email
        ),
        request:service_requests (
          title
        )
      `)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
  }

  static async listContractsForProfessional(proId: string) {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        tenants (
          name
        ),
        request:service_requests (
          title
        )
      `)
      .eq('professional_id', proId);

    if (error) throw error;
    return data || [];
  }

  static async signContract(
    id: string,
    role: 'client' | 'professional',
    signature: string
  ) {
    const updateObj: any = {};
    if (role === 'client') {
      updateObj.client_signature = signature;
      updateObj.client_signed_at = new Date().toISOString();
    } else {
      updateObj.professional_signature = signature;
      updateObj.professional_signed_at = new Date().toISOString();
    }

    const { data: currentContract } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (currentContract) {
      const isClientSigned = role === 'client' || !!currentContract.client_signature;
      const isProSigned = role === 'professional' || !!currentContract.professional_signature;
      if (isClientSigned && isProSigned) {
        updateObj.status = 'signed';
      }
    }

    const { data, error } = await supabase
      .from('contracts')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
