import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Calendar } from 'lucide-react';

export default function Booking() {
  const { bookConsultation } = useContext(AppContext);
  const [form, setForm] = useState({ service: 'Corporate Tax Advisory', date: '', time: '', notes: '' });
  const [status, setStatus] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.time) {
      alert('Please select date and time.');
      return;
    }
    const booked = bookConsultation(form.service, form.date, form.time, form.notes);
    setStatus(`Consultation confirmed for ${booked.date} at ${booked.time}.`);
    setForm({ service: 'Corporate Tax Advisory', date: '', time: '', notes: '' });
  };

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: 800, margin: '0 auto' }}>
      <div className="premium-card" style={{ padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Calendar size={48} color="#008080" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Book a Discovery Call</h2>
          <p style={{ color: '#6B7280' }}>Select a service and date below to meet with our advisory team.</p>
        </div>

        {status && (
          <div className="badge badge-success" style={{ width: '100%', padding: '1rem', display: 'block', fontSize: '0.95rem', marginBottom: '2rem', textAlign: 'center', borderRadius: 8 }}>
            {status}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Service</label>
            <select 
              className="form-input" 
              value={form.service} 
              onChange={e => setForm({...form, service: e.target.value})}
            >
              <option>Corporate Tax Advisory</option>
              <option>GST Registration / Consultation</option>
              <option>Monthly Bookkeeping Setup</option>
              <option>Internal Audit & Control Review</option>
              <option>Virtual CFO Advisory Services</option>
            </select>
          </div>

          <div className="grid-cols-2">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Choose Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={form.date} 
                onChange={e => setForm({...form, date: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Preferred Time Slot</label>
              <select 
                className="form-input" 
                value={form.time} 
                onChange={e => setForm({...form, time: e.target.value})}
                required
              >
                <option value="">Select Time</option>
                <option>09:00 AM - 10:00 AM</option>
                <option>11:00 AM - 12:00 PM</option>
                <option>02:00 PM - 03:00 PM</option>
                <option>04:00 PM - 05:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Additional Business Details (Optional)</label>
            <textarea 
              className="form-input" 
              rows={4} 
              placeholder="Briefly describe your business transaction volume and primary filing requirements..."
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
            ></textarea>
          </div>

          <button type="submit" className="btn btn-teal w-full" style={{ padding: '0.8rem' }}>Confirm Appointment Booking</button>
        </form>
      </div>
    </div>
  );
}
