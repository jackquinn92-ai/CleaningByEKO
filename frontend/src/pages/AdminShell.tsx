import React, { useEffect, useState } from 'react';

const AdminShell: React.FC = () => {
  const [token, setToken] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState('');

  const login = async () => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError('Invalid credentials');
      return;
    }
    const data = await res.json();
    setToken(data.token);
    setError('');
  };

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const res = await fetch('/api/admin/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTickets(await res.json());
      }
    };
    load();
  }, [token]);

  if (!token) {
    return (
      <div className="card">
        <h2>Admin login</h2>
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button onClick={login}>Login</button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Tickets</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Ref</th>
            <th>Company</th>
            <th>Site</th>
            <th>Guard</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.created_at || t.createdAt).toLocaleString()}</td>
              <td>{t.ref}</td>
              <td>{t.company_name || t.companyName}</td>
              <td>{t.site_name || t.siteName}</td>
              <td>{t.guard_name || t.guardName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminShell;
