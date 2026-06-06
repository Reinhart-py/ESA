import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Contact Our Advisory Desk</h2>
      <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: '3rem' }}>Get in touch with an accountant or schedule a physical meeting at our district offices.</p>
      
      <div className="grid-cols-2" style={{ gap: '3rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Direct Office Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'rgba(0,128,128,0.1)', color: '#008080', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>General Inquiries</p>
                <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>corporate@eacsolutions.com</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'rgba(0,128,128,0.1)', color: '#008080', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>Direct Hotlines</p>
                <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>+1 (555) 019-0000 / +1 (555) 019-2831</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'rgba(0,128,128,0.1)', color: '#008080', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>HQ Location</p>
                <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Financial District, Suite 400, New York</span>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem' }}>Drop us a line</h3>
          {sent && <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', display: 'block', textAlign: 'center', borderRadius: 6 }}>Message sent successfully! Our team will reply shortly.</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Your Full Name" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              required 
            />
            <input 
              type="email" 
              className="form-input" 
              placeholder="Email Address" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              required 
            />
            <textarea 
              className="form-input" 
              rows={4} 
              placeholder="How can our financial team assist you?" 
              value={form.message} 
              onChange={e => setForm({...form, message: e.target.value})} 
              required
            ></textarea>
            <button type="submit" className="btn btn-teal w-full">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
}
