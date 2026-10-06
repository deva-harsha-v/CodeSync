import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Icons } from '../common/Icons';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile, token?: string) => void;
  onBackToLanding: () => void;
  users: UserProfile[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToLanding, users }) => {
  const [activeTab, setActiveTab] = useState<'personas' | 'credentials'>('personas');
  const [email, setEmail] = useState('maya.patel@canteen.edu');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Developer' | 'Reviewer' | 'Viewer'>('Developer');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Demo Persona Quick Selection
  const handleSelectPersona = (persona: UserProfile) => {
    const token = `demo_token_${persona.id}_${Date.now()}`;
    localStorage.setItem('codesync_token', token);
    localStorage.setItem('codesync_user', JSON.stringify(persona));
    onLoginSuccess(persona, token);
  };

  // Handle Production Email/Password Submit
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName, role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        localStorage.setItem('codesync_token', data.token);
        localStorage.setItem('codesync_user', JSON.stringify(data.user));
        onLoginSuccess(data.user, data.token);
      } else {
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        localStorage.setItem('codesync_token', data.token);
        localStorage.setItem('codesync_user', JSON.stringify(data.user));
        onLoginSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            <Icons.Zap size={22} color="var(--accent-blue)" />
            <span>CodeSync</span>
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Authentication & Persona Selection</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
            Choose a demonstration persona or authenticate with project credentials.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="login-tabs">
          <button
            className={`login-tab ${activeTab === 'personas' ? 'active' : ''}`}
            onClick={() => setActiveTab('personas')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Icons.User size={13} color={activeTab === 'personas' ? 'var(--text-main)' : 'var(--text-muted)'} />
            <span>Demo Personas (1-Click)</span>
          </button>
          <button
            className={`login-tab ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => setActiveTab('credentials')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Icons.Lock size={13} color={activeTab === 'credentials' ? 'var(--text-main)' : 'var(--text-muted)'} />
            <span>Production Auth (JWT)</span>
          </button>
        </div>

        {error && (
          <div className="login-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.TriangleAlert size={14} color="var(--color-high)" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Demo Persona Login */}
        {activeTab === 'personas' && (
          <div>
            <div className="demo-notice-box">
              <strong>Demonstration Mode:</strong> Each persona represents a pre-configured role in the
              Smart Canteen project with distinct ownership boundaries and permissions.
            </div>

            <div className="persona-list">
              {users.map((persona) => (
                <div
                  key={persona.id}
                  className="persona-card"
                  onClick={() => handleSelectPersona(persona)}
                >
                  <img
                    src={persona.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${persona.id}`}
                    alt={persona.full_name}
                    className="persona-avatar"
                  />
                  <div className="persona-info">
                    <div className="persona-name">{persona.full_name}</div>
                    <div className="persona-email">{persona.email}</div>
                  </div>
                  <span className={`role-badge role-${persona.role}`}>
                    {persona.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Production Credentials Auth */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isRegister && (
              <>
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Assigned Project Role</label>
                  <select
                    className="form-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                  >
                    <option value="Admin">Admin / Project Owner</option>
                    <option value="Developer">Developer</option>
                    <option value="Reviewer">Reviewer</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="form-label">Campus / Corporate Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@canteen.edu"
                required
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                Default demo accounts password: <code>password123</code>
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '8px' }} disabled={loading}>
              {loading ? 'Authenticating...' : isRegister ? 'Create Account & Enter' : 'Sign In with JWT Session'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '12px' }}>
              {isRegister ? (
                <span>
                  Already registered?{' '}
                  <a href="#login" onClick={(e) => { e.preventDefault(); setIsRegister(false); }}>
                    Sign In
                  </a>
                </span>
              ) : (
                <span>
                  Need an account?{' '}
                  <a href="#register" onClick={(e) => { e.preventDefault(); setIsRegister(true); }}>
                    Register Profile
                  </a>
                </span>
              )}
            </div>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <button className="btn btn-sm" onClick={onBackToLanding}>
            ← Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};
