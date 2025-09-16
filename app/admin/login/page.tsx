'use client';

import React, { useState } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { email, password });
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('API response:', { status: response.status, data });

      if (response.ok) {
        // Store admin session
        localStorage.setItem('admin_token', data.token);
        console.log('Login successful, redirecting...');
        console.log('Token stored:', data.token);
        // Use window.location for more reliable navigation
        console.log('About to redirect to dashboard...');
        console.log('Current URL:', window.location.href);
        console.log('Target URL: /admin/dashboard');
        
        // Try immediate redirect
        window.location.href = '/admin/dashboard';
      } else {
        console.log('Login failed:', data.error);
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: '28rem', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: '#e0e7ff', width: '4rem', height: '4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            🔒
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Admin Access</h1>
          <p style={{ color: '#6b7280' }}>Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', color: '#111827' }}
              placeholder="admin@jokko.com"
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', color: '#111827' }}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              background: loading ? '#9ca3af' : '#4f46e5', 
              color: 'white', 
              padding: '0.75rem 1rem', 
              borderRadius: '0.5rem', 
              fontWeight: '500',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
