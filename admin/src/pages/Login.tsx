import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, width: 360, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ marginTop: 0 }}>Weblign Admin Login</h2>
        {error ? <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div> : null}
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
