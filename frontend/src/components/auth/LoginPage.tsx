import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Icons } from '../common/Icons';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile, token?: string) => void;
  onBackToLanding: () => void;
  users: UserProfile[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToLanding, users }) => {
  const [email, setEmail] = useState('maya.patel@canteen.edu');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Developer' | 'Reviewer' | 'Viewer'>('Developer');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Demo Persona Quick Selection (1-Click)
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
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Module ownership assignments for personas
  const getPersonaModule = (role: string, name: string) => {
    if (name.includes('Maya')) return 'backend/authService.ts';
    if (name.includes('Carlos')) return 'frontend/login.tsx';
    if (role === 'Admin') return 'Global Ownership Bypass';
    if (role === 'Reviewer') return 'Requirements & Verification';
    return 'Read-Only Observer';
  };

  return (
    <div className="login-split-page">
      {/* LEFT PANE: Research Branding & 1-Click Demo Personas */}
      <div className="login-split-showcase">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Icons.Zap size={26} color="var(--accent-blue)" />
            <span style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px' }}>CodeSync</span>
            <span className="brand-tag">Research Edition</span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1.3, marginBottom: '12px' }}>
            Enter the Collaborative Software Engineering Platform
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6, maxWidth: '520px' }}>
            CodeSync enforces role-based governance and module ownership boundaries while providing
            real-time OT synchronization, TypeScript AST dependency intelligence, and ML change risk prediction.
          </p>

          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚡ 1-Click Demonstration Personas
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Select to enter instantly</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Each persona features distinct file ownership and governance boundaries in the Smart Canteen project:
            </p>

            <div className="persona-grid-v2">
              {users.map((persona) => {
                const assignedModule = getPersonaModule(persona.role, persona.full_name);
                return (
                  <div
                    key={persona.id}
                    className="persona-card-v2"
                    onClick={() => handleSelectPersona(persona)}
                    title={`Click to enter as ${persona.full_name}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={persona.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${persona.id}`}
                        alt={persona.full_name}
                        style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#070a13', border: '1px solid var(--border-color)' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {persona.full_name}
                        </div>
                        <span className={`role-badge role-${persona.role}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                          {persona.role}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '4px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Module: </span>
                      <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontSize: '10px' }}>{assignedModule}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn-sm" onClick={onBackToLanding} style={{ gap: '6px' }}>
            <span>← Back to Landing Page</span>
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>B.Tech CSE Capstone 2026–27</span>
        </div>
      </div>

      {/* RIGHT PANE: Production Credentials Authentication */}
      <div className="login-split-form-col">
        <div className="login-box-v2">
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              {isRegister ? 'Register Project Account' : 'Production Authentication'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isRegister
                ? 'Create a validated developer profile with assigned role capabilities.'
                : 'Authenticate via JSON Web Token (JWT) session to access controlled workspaces.'}
            </p>
          </div>

          {error && (
            <div className="login-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Icons.TriangleAlert size={14} color="var(--color-high)" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCredentialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <>
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maya Patel"
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
                    <option value="Admin">Admin / Project Owner (Full Control)</option>
                    <option value="Developer">Developer (Module-Scoped Writes)</option>
                    <option value="Reviewer">Reviewer (Audit & Verification Sign-Off)</option>
                    <option value="Viewer">Viewer (Read-Only Observer)</option>
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
              <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Default demo accounts password: <code style={{ color: 'var(--accent-blue)' }}>password123</code>
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Verifying Credentials...' : isRegister ? 'Create Profile & Enter' : 'Sign In with JWT'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px' }}>
              {isRegister ? (
                <span>
                  Already registered?{' '}
                  <a href="#login" onClick={(e) => { e.preventDefault(); setIsRegister(false); }} style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
                    Sign In
                  </a>
                </span>
              ) : (
                <span>
                  Need an account?{' '}
                  <a href="#register" onClick={(e) => { e.preventDefault(); setIsRegister(true); }} style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
                    Register Profile
                  </a>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
