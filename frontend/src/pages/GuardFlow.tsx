import React, { useMemo, useState } from 'react';

const garmentList = [
  'jacket',
  'trousers',
  'waistcoat',
  'shirt',
  'dress',
  'skirt',
  'coat',
  'high-vis coat',
  'high-vis vest',
  'tie',
  'top',
  'misc',
  'raincoat',
  'rain jacket',
  'jumpers',
  'aprons',
  'table covers',
];

const GuardFlow: React.FC = () => {
  const [pin, setPin] = useState('');
  const [context, setContext] = useState<any>(null);
  const [form, setForm] = useState({ guardName: '', phone: '', email: '', notes: '', items: {} as Record<string, number> });
  const [showConfirm, setShowConfirm] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [submitted, setSubmitted] = useState<any>(null);
  const [error, setError] = useState('');

  const totalItems = useMemo(
    () => garmentList.reduce((sum, key) => sum + (form.items[key] || 0), 0),
    [form.items]
  );

  const resolvePin = async () => {
    setError('');
    const res = await fetch('/api/pin/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || 'Invalid PIN');
      return;
    }
    const data = await res.json();
    setContext(data);
  };

  const handleSubmit = async () => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, ...form, items: form.items }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || 'Failed to submit');
      return;
    }
    const data = await res.json();
    setSubmitted(data);
  };

  const reset = () => {
    setForm({ guardName: '', phone: '', email: '', notes: '', items: {} });
    setContext(null);
    setShowConfirm(false);
    setPrinted(false);
    setSubmitted(null);
    setError('');
  };

  if (submitted) {
    return (
      <div className="card">
        <h2>Ticket submitted</h2>
        <p>Reference: {submitted.ref}</p>
        <p>Date: {submitted.createdAt}</p>
        <p>
          {submitted.company} — {submitted.site}
        </p>
        <p className="warning">Make sure the ticket has been printed and put in the bag.</p>
        <div className="actions">
          <button onClick={() => window.print()}>Print ticket again</button>
          <button onClick={() => { setForm({ ...form, items: {} }); setSubmitted(null); }}>New ticket (same PIN)</button>
          <button onClick={reset}>Enter different PIN</button>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="card">
        <h2>Enter your PIN</h2>
        <input
          type="tel"
          placeholder="PIN"
          maxLength={10}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        />
        <button onClick={resolvePin}>Proceed</button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <h2>{context.company} — {context.siteName}</h2>
      <p>{context.siteAddress}</p>
      <div className="form-grid">
        <label>
          Guard name
          <input value={form.guardName} onChange={(e) => setForm({ ...form, guardName: e.target.value })} />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <label>
          Work email
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
      </div>

      <div className="items">
        {garmentList.map((g) => (
          <label key={g} className="item-row">
            <span>{g}</span>
            <input
              type="number"
              min={0}
              value={form.items[g] || 0}
              onChange={(e) =>
                setForm({ ...form, items: { ...form.items, [g]: Number(e.target.value) } })
              }
            />
          </label>
        ))}
      </div>

      <label>
        Notes / alterations
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="actions">
        <button disabled={totalItems === 0 || !form.guardName || !form.phone || !form.email} onClick={() => setShowConfirm(true)}>
          Submit ticket
        </button>
      </div>

      {showConfirm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirm ticket</h3>
            <p>{context.company} — {context.siteName}</p>
            <p>{context.siteAddress}</p>
            <p>Guard: {form.guardName}, {form.email}, {form.phone}</p>
            <ul>
              {garmentList.map((g) => (form.items[g] || 0) > 0 && <li key={g}>{g}: {form.items[g]}</li>)}
            </ul>
            {form.notes && <p>Notes: {form.notes}</p>}
            <p className="warning">Once submitted, this ticket cannot be edited. Any adjustments incur a £10 admin fee.</p>
            <label className="checkbox">
              <input type="checkbox" checked={printed} onChange={(e) => setPrinted(e.target.checked)} />
              I confirm I will print the ticket and put it in the bag.
            </label>
            <div className="actions">
              <button onClick={() => { window.print(); setPrinted(true); }}>Print ticket</button>
              <button disabled={!printed} onClick={() => { setShowConfirm(false); handleSubmit(); }}>Finish & submit</button>
              <button onClick={() => setShowConfirm(false)}>Back to edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardFlow;
