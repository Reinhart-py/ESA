import { supabase } from '../config/supabase.js';

export class AiService {
  /**
   * Process user query using real-time database context
   */
  static async processChatQuery(tenantId: string, userId: string, query: string): Promise<string> {
    const normalizedQuery = query.toLowerCase();

    // 1. Fetch Tenant Context
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    // 2. Fetch Active Obligations
    const { data: obligations } = await supabase
      .from('compliance_obligations')
      .select('*')
      .eq('tenant_id', tenantId);

    // 3. Fetch Recent Expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(5);

    let response = '';

    // Simple yet highly functional local contextual parsing (removes model API dependency while remaining fully functional)
    if (normalizedQuery.includes('score') || normalizedQuery.includes('standing') || normalizedQuery.includes('rating')) {
      const score = tenant?.compliance_score ?? 100;
      response = `Your workspace compliance rating is currently **${score}%**. `;
      if (score >= 90) {
        response += `This puts you in **Excellent Standing**. Keep maintaining your filings on time!`;
      } else if (score >= 70) {
        response += `This requires **Action Recommended**. There are likely pending or late obligations that are impacting your workspace rating. Please check your filing calendar.`;
      } else {
        response += `Warning: **Critical standing status**. Overdue filings must be addressed immediately to avoid jurisdictional penalties.`;
      }
    } 
    else if (normalizedQuery.includes('deadline') || normalizedQuery.includes('tax') || normalizedQuery.includes('filing') || normalizedQuery.includes('obligations')) {
      const activeObs = obligations || [];
      const pendingObs = activeObs.filter(o => o.status !== 'Filed');
      
      if (pendingObs.length === 0) {
        response = `You have **0 pending filing obligations** for this workspace. All scheduled tax calendars are currently Filed and approved!`;
      } else {
        response = `You have **${pendingObs.length} pending obligations** remaining:\n\n`;
        pendingObs.slice(0, 5).forEach((ob, idx) => {
          response += `${idx + 1}. **${ob.title}**\n   - Due Date: ${ob.due_date}\n   - Status: ${ob.status} (Type: ${ob.type})\n`;
        });
        if (pendingObs.length > 5) {
          response += `\n...and ${pendingObs.length - 5} other upcoming events.`;
        }
      }
    } 
    else if (normalizedQuery.includes('expense') || normalizedQuery.includes('ledger') || normalizedQuery.includes('finance') || normalizedQuery.includes('spend')) {
      const recentExpenses = expenses || [];
      if (recentExpenses.length === 0) {
        response = `No financial expenses have been recorded in your workspace's double-entry ledger yet. Go to the Ledger tab to register your first transaction.`;
      } else {
        let totalCents = 0;
        response = `Here are the **top recent expenses** from your ledger:\n\n`;
        recentExpenses.forEach((exp, idx) => {
          response += `${idx + 1}. **${exp.merchant}** - $${(exp.amount_cents / 100).toFixed(2)} (${exp.date}) - *${exp.description || 'General'}*\n`;
          totalCents += exp.amount_cents;
        });
        response += `\nTotal recent recorded sum: **$${(totalCents / 100).toFixed(2)}**.`;
      }
    } 
    else {
      // General platform assistant welcome response
      response = `Hello! I am your **EAC solutions AI Co-pilot**.\n\nI can help you review your workspace data. Try asking me:\n- *"What is my compliance standing?"*\n- *"Show my upcoming tax deadlines."*\n- *"What are my recent recorded expenses?"*\n\nLet me know how I can assist you today.`;
    }

    // 4. Save to logs
    const { error: logError } = await supabase
      .from('ai_chat_logs')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        user_query: query,
        ai_response: response
      });

    if (logError) {
      console.error('Error logging AI chat session:', logError.message);
    }

    return response;
  }

  /**
   * Retrieve previous logs
   */
  static async getChatHistory(tenantId: string) {
    const { data, error } = await supabase
      .from('ai_chat_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
      .limit(30);

    if (error) throw error;
    return data || [];
  }
}
