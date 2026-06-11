import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client.ts';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare, Terminal } from 'lucide-react';

interface ChatMessage {
  id?: string;
  user_query: string;
  ai_response: string;
  created_at?: string;
}

export default function AICopilotPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingQuery, setSendingQuery] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get('/ai/chat/history');
      setMessages(res.data || []);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendingQuery]);

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setSendingQuery(true);
    setInputQuery('');
    try {
      const res = await apiClient.post('/ai/chat', { query: queryText });
      
      // Append query and reply to local messages list
      setMessages(prev => [...prev, {
        user_query: queryText,
        ai_response: res.data.ai_response
      }]);
    } catch (err) {
      console.error('Error sending AI chat query:', err);
      alert('AI Co-pilot failed to respond. Please verify server connectivity.');
    } finally {
      setSendingQuery(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuery(inputQuery);
  };

  const promptSuggestions = [
    'What is my compliance standing?',
    'Are there any tax obligations due soon?',
    'Show my recent recorded expenses',
    'How do I record a new journal entry?'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      
      {/* Panel Title */}
      <div style={{ padding: '1rem 1.5rem', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} style={{ color: '#00a896' }} />
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>AI Financial & Compliance Co-pilot</h3>
        </div>
        <button 
          onClick={fetchHistory}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
        >
          <RefreshCwIcon size={12} /> Sync History
        </button>
      </div>

      {/* Messages Feed */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#0f172a' }}>
        {loadingHistory ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '2rem' }}>Recalling past interactions...</div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: '#64748b', padding: '2rem' }}>
            <Bot size={48} style={{ color: '#00a896', marginBottom: '1rem' }} />
            <h4 style={{ color: '#cbd5e1', margin: '0 0 0.5rem 0' }}>Welcome to your workspace Co-pilot</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '380px' }}>
              I can analyze your ledgers, check country compliance rules, calculate risk standing, and recommend operational actions.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* User Bubble */}
              <div style={{ alignSelf: 'flex-end', background: '#3b82f6', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '16px 16px 2px 16px', maxWidth: '75%', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>{msg.user_query}</div>
                <User size={14} style={{ marginTop: '0.15rem', opacity: 0.8 }} />
              </div>

              {/* Bot Bubble */}
              <div style={{ alignSelf: 'flex-start', background: '#1e293b', color: '#cbd5e1', padding: '0.75rem 1.25rem', borderRadius: '16px 16px 16px 2px', maxWidth: '75%', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Bot size={16} style={{ color: '#00a896', marginTop: '0.2rem' }} />
                <div style={{ flex: 1, lineHeight: '1.4' }}>
                  {msg.ai_response.split('\n').map((line, lIdx) => {
                    // Primitive markdown bold rendering
                    let content: React.ReactNode = line;
                    if (line.includes('**')) {
                      const parts = line.split('**');
                      content = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: '#fff' }}>{part}</strong> : part);
                    }
                    return <div key={lIdx} style={{ marginBottom: '0.4rem' }}>{content}</div>;
                  })}
                </div>
              </div>
            </div>
          ))
        )}

        {sendingQuery && (
          <div style={{ alignSelf: 'flex-start', background: '#1e293b', color: '#94a3b8', padding: '0.75rem 1.25rem', borderRadius: '16px 16px 16px 2px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <Loader2 size={14} className="animate-spin" style={{ color: '#00a896' }} />
            <span>Co-pilot is checking workspace data...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Pills */}
      <div style={{ padding: '0.75rem 1.5rem', background: '#1e293b', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {promptSuggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(s)}
            disabled={sendingQuery}
            style={{ padding: '0.35rem 0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Query input form */}
      <div style={{ padding: '1rem 1.5rem', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Ask AI Co-pilot about compliance, tax dates, or ledgers..."
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            disabled={sendingQuery}
            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#fff', fontSize: '0.9rem' }}
          />
          <button
            type="submit"
            disabled={sendingQuery || !inputQuery.trim()}
            style={{ padding: '0.75rem 1.5rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'bold' }}
          >
            <Send size={16} /> Send
          </button>
        </form>
      </div>

    </div>
  );
}

// Small helper inside this component
function RefreshCwIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
