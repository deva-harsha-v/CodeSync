import React from 'react';
import { Icons } from '../common/Icons';

interface LandingPageProps {
  onEnterWorkspace: () => void;
  onGoToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterWorkspace, onGoToLogin }) => {
  const scrollToArchitecture = () => {
    document.getElementById('architecture-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page-container">
      {/* 1. Global Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <Icons.Zap size={22} color="var(--accent-blue)" />
          <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>CodeSync</span>
          <span className="brand-tag">Research Capstone Edition</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#lifecycle">Lifecycle</a>
          <a href="#architecture-section">Architecture</a>
          <a href="#demo">Smart Canteen</a>
          <a href="#research">Research</a>
          <button className="btn btn-sm" onClick={onGoToLogin} style={{ gap: '6px' }}>
            <Icons.User size={13} color="var(--text-muted)" />
            <span>Sign In / Personas</span>
          </button>
          <button className="btn btn-sm btn-primary" onClick={onEnterWorkspace} style={{ gap: '6px' }}>
            <Icons.Code size={13} color="#fff" />
            <span>Launch Workspace</span>
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge">Final-Year B.Tech CSE Research Capstone Project • 2026–27</div>
        <h1 className="hero-title">
          AI-Assisted Real-Time<br />
          <span style={{ color: 'var(--accent-blue)' }}>Collaborative Code Sync</span>
        </h1>
        <p className="hero-subtitle">
          A role-, artifact-, and dependency-aware collaborative software engineering environment combining
          controlled module ownership, document-to-code traceability, TypeScript AST change analysis,
          Supervised Random Forest risk prediction, and contextual AI assistance.
        </p>

        <div className="hero-cta-group">
          <button className="btn btn-primary btn-lg" onClick={onEnterWorkspace} style={{ gap: '8px' }}>
            <Icons.Code size={18} color="#fff" />
            <span>Launch IDE Workspace</span>
          </button>
          <button className="btn btn-lg" onClick={scrollToArchitecture} style={{ gap: '8px' }}>
            <Icons.Network size={18} color="var(--text-muted)" />
            <span>Explore Architecture</span>
          </button>
          <button className="btn btn-lg" onClick={onGoToLogin} style={{ gap: '8px' }}>
            <Icons.User size={18} color="var(--text-muted)" />
            <span>Demo Personas (1-Click)</span>
          </button>
        </div>

        <div className="hero-metrics-pill">
          <span>✓ Real-Time Operational Transformation (OT)</span>
          <span>•</span>
          <span>✓ TypeScript Compiler AST Engine</span>
          <span>•</span>
          <span>✓ Supervised Random Forest ML</span>
          <span>•</span>
          <span>✓ 100% Noise Reduction vs Broadcast Alerts</span>
        </div>

        {/* Embedded Actual CodeSync 3-Column IDE Preview Mockup */}
        <div className="landing-preview-window">
          <div className="preview-window-titlebar">
            <div className="preview-window-dots">
              <span className="preview-dot red" />
              <span className="preview-dot yellow" />
              <span className="preview-dot green" />
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginLeft: '12px' }}>
              CodeSync IDE — Smart Canteen (Branch: main)
            </span>
          </div>

          <div className="preview-window-layout">
            {/* Left Explorer Column */}
            <div className="preview-left-col">
              <div style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px' }}>
                Files & Governance
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--accent-blue)', fontWeight: 600 }}>
                  <span>backend/authService.ts</span>
                  <span style={{ fontSize: '9px', backgroundColor: 'var(--color-high-bg)', color: 'var(--color-high)', padding: '1px 4px', borderRadius: '3px' }}>● 92%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>backend/userService.ts</span>
                  <span style={{ fontSize: '9px', backgroundColor: 'var(--color-high-bg)', color: 'var(--color-high)', padding: '1px 4px', borderRadius: '3px' }}>● 88%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>frontend/login.tsx</span>
                  <span style={{ fontSize: '9px', color: 'var(--color-med)' }}>🔒 Locked</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>tests/auth.test.ts</span>
                  <span style={{ fontSize: '9px', color: 'var(--color-low)' }}>✓ Pass</span>
                </div>
              </div>
            </div>

            {/* Center Editor Column */}
            <div className="preview-center-col">
              <div style={{ height: '32px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-main)', borderBottom: '2px solid var(--accent-blue)', padding: '6px 0' }}>authService.ts</span>
                <span style={{ color: 'var(--text-muted)' }}>login.tsx</span>
              </div>
              <div style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e2e8f0', lineHeight: 1.6, overflow: 'hidden' }}>
                <span style={{ color: '#818cf8' }}>export async function</span> <span style={{ color: '#38bdf8' }}>authenticateUser</span>(creds: Credentials) {'{'}<br />
                &nbsp;&nbsp;<span style={{ color: '#64748b' }}>// AST Token Issued — Maya Patel (Developer A)</span><br />
                &nbsp;&nbsp;<span style={{ color: '#f43f5e' }}>- const token = issueLegacyToken(creds.id);</span><br />
                &nbsp;&nbsp;<span style={{ color: '#10b981' }}>+ const token = await cryptoIssuance(creds.id, creds.role);</span><br />
                &nbsp;&nbsp;<span style={{ color: '#818cf8' }}>return</span> {'{ success: true, token, role: creds.role };'}<br />
                {'}'}
              </div>
              <div style={{ marginTop: 'auto', height: '65px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)', padding: '8px 12px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-high)', fontWeight: 600 }}>
                  <span>TEST RESULTS: 2 passed · 1 failed</span>
                  <span>Duration: 42ms</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px' }}>
                  ✕ auth.test.ts: AssertionError: Expected AuthResponse.token to match 'cs_jwt_'
                </div>
              </div>
            </div>

            {/* Right Intelligence Column */}
            <div className="preview-right-col">
              <div style={{ fontWeight: 600, color: 'var(--accent-blue)', fontSize: '11px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icons.Zap size={13} color="var(--accent-blue)" />
                <span>Change Impact (ML)</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Model: RandomForest (18 features)
              </div>
              <div style={{ backgroundColor: '#090d16', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-high)', fontSize: '11px' }}>HIGH RISK • 92%</div>
                <div style={{ color: 'var(--text-main)', fontSize: '10px', marginTop: '2px' }}>tests/auth.test.ts</div>
                <div style={{ height: '3px', backgroundColor: '#1e293b', borderRadius: '2px', margin: '6px 0', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', backgroundColor: 'var(--color-high)' }} />
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  ▸ Distance: 1 hop<br />
                  ▸ Co-Change: 84% freq
                </div>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className="btn btn-sm btn-primary" style={{ fontSize: '10px', padding: '3px' }}>
                  ✨ Diagnose with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 6-Stage Lifecycle Pipeline Visualization */}
      <section id="lifecycle" className="landing-section alt-bg">
        <div className="section-header">
          <h2>The 6-Stage Research Lifecycle Pipeline</h2>
          <p>How CodeSync safeguards collaborative development from keystroke to verified Git commit.</p>
        </div>

        <div className="architecture-flow-diagram">
          <div className="flow-step">
            <div className="step-num" style={{ backgroundColor: '#6366f1' }}>1</div>
            <h4>EDIT</h4>
            <p>Collaborative typing in Monaco Editor with live OT synchronization and cursor presence.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num" style={{ backgroundColor: '#38bdf8' }}>2</div>
            <h4>ANALYZE</h4>
            <p>TypeScript Compiler API traverses the AST, extracting call graphs, imports, and test bindings.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num" style={{ backgroundColor: '#f43f5e' }}>3</div>
            <h4>PREDICT</h4>
            <p>Supervised Random Forest scores downstream artifacts dynamically across change and co-change features.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num" style={{ backgroundColor: '#f59e0b' }}>4</div>
            <h4>TEST</h4>
            <p>Selective test runner executes relevant test suites, isolating failures without full-suite lag.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num" style={{ backgroundColor: '#c084fc' }}>5</div>
            <h4>REVIEW</h4>
            <p>Contextual AI copilot synthesizes AST, diff, and test traces to propose safe, human-reviewed patches.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num" style={{ backgroundColor: '#10b981' }}>6</div>
            <h4>COMMIT</h4>
            <p>Author-aware Git commits logged in the tamper-resistant audit trail and synced to GitHub.</p>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section id="features" className="landing-section">
        <div className="section-header">
          <h2>Core Research & Engineering Capabilities</h2>
          <p>Engineered as a comprehensive software engineering platform, not a generic online editor.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--accent-blue)' }}>
              <Icons.Zap size={28} color="var(--accent-blue)" />
            </div>
            <h3>1. Real-Time Operational Transformation</h3>
            <p>
              Latency-aware Operational Transformation (OT) engine resolving concurrent character insertions and
              deletions with live cursor broadcasts over WebSockets.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--color-med)' }}>
              <Icons.Shield size={28} color="var(--color-med)" />
            </div>
            <h3>2. Role-Based Governance</h3>
            <p>
              Strict server-side authorization separating Admin/Project Owner, Developer, Reviewer, and Viewer roles
              with granular PostgreSQL RLS and capability policies.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--color-high)' }}>
              <Icons.Lock size={28} color="var(--color-high)" />
            </div>
            <h3>3. Controlled Artifact Ownership</h3>
            <p>
              Explicit module ownership mapping files to developers. Unauthorized edits are intercepted by permission gates
              triggering formal, auditable access requests.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#38bdf8' }}>
              <Icons.Network size={28} color="#38bdf8" />
            </div>
            <h3>4. Compiler-Grade Dependency Engine</h3>
            <p>
              Real TypeScript Compiler API AST analysis extracting import/export statements, function calls, class references,
              and test bindings without regex heuristics.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--color-high)' }}>
              <Icons.Activity size={28} color="var(--color-high)" />
            </div>
            <h3>5. Dynamic ML Change-Impact Prediction</h3>
            <p>
              Supervised Random Forest classifier scoring candidate artifacts across change and co-change features.
              All probabilities are dynamically computed (0–100%).
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#c084fc' }}>
              <Icons.Sparkles size={28} color="#c084fc" />
            </div>
            <h3>6. Contextual AI Engineering Copilot</h3>
            <p>
              Context-builder supplying user role, git diff, AST graph, ML scores, and test traces
              to generate verified patch suggestions with human-in-the-loop review.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--color-low)' }}>
              <Icons.Flask size={28} color="var(--color-low)" />
            </div>
            <h3>7. Intelligent Relevant Testing</h3>
            <p>
              Selective test execution based on AST dependency closures. Captures assertion errors, failure traces, and execution timings
              to feed the AI diagnosis.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#a855f7' }}>
              <Icons.GitBranch size={28} color="#a855f7" />
            </div>
            <h3>8. Git & GitHub Integration</h3>
            <p>
              Durable version control integration associating collaborative sessions, change events, and approved fixes
              with verified Git commits and remote push sync.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Target Demonstration Walkthrough: Smart Canteen */}
      <section id="demo" className="landing-section alt-bg">
        <div className="section-header">
          <h2>Target Demonstration: Smart Canteen Platform</h2>
          <p>Pre-configured full-stack scenario verifying all 13 research and system milestones.</p>
        </div>

        <div className="demo-scenario-box">
          <div className="demo-step">
            <strong>Stage 1: Ownership Enforcement Gate</strong>
            <p>Carlos (Dev B) attempts to edit <code>backend/authService.ts</code> owned by Maya (Dev A) → System intercepts with 403 Forbidden & Access Request Modal.</p>
          </div>
          <div className="demo-step">
            <strong>Stage 2: Code Modification & AST Re-Indexing</strong>
            <p>Maya Patel (Dev A) modifies <code>authService.ts</code> → Change detection triggers AST re-indexing and downstream candidate discovery.</p>
          </div>
          <div className="demo-step">
            <strong>Stage 3: ML Risk Prediction & Targeted Alerts</strong>
            <p>Random Forest model predicts HIGH impact on <code>login.tsx</code> (92%) and <code>auth.test.ts</code> (88%) → Targeted alert sent to Carlos Santos.</p>
          </div>
          <div className="demo-step">
            <strong>Stage 4: Automated Testing & Contextual AI Diagnosis</strong>
            <p>Relevant test runner runs <code>auth.test.ts</code> → AssertionError detected → Contextual AI copilot explains root cause and proposes compliant patch diff.</p>
          </div>
          <div className="demo-step">
            <strong>Stage 5: Review, Post-Apply Test Verification & Git Commit</strong>
            <p>Developer applies fix → Tests re-run and pass (100%) → Elena Rostova (Reviewer) verifies specification and records Git commit in the Audit Trail.</p>
          </div>
        </div>
      </section>

      {/* 6. Academic Research Foundation */}
      <section id="research" className="landing-section">
        <div className="section-header">
          <h2>Academic Research Foundation & Prior Literature</h2>
          <p>Grounding CodeSync within the collaborative programming and software engineering literature.</p>
        </div>

        <div className="research-container">
          <div className="research-card">
            <h3>Base Papers & Prior Systems</h3>
            <p>
              CodeSync builds upon foundational research in web-based collaborative IDEs, notably:
            </p>
            <ul style={{ margin: '12px 0 16px 20px', lineHeight: 1.8 }}>
              <li>
                <strong>Collabode (ACM UIST 2011)</strong> by Max Goldman, Greg Little, and Robert C. Miller — established
                concurrent editing, compilation-error isolation, and error-mediated integration.
              </li>
              <li>
                <strong>CodePilot (ACM CHI 2017)</strong> by Jeremy Warner and Philip J. Guo — established real-time
                shared editor scaffolding and novice pair programming workflows.
              </li>
            </ul>
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              CodeSync does not claim basic real-time OT or generic coding assistance as its novelty. Those form the established foundation.
            </p>
          </div>

          <div className="research-card highlight">
            <h3>CodeSync's Research Contributions</h3>
            <p>Our contribution focuses on making collaboration structured, governance-aware, and dependency-guided:</p>
            <ol style={{ margin: '12px 0 0 20px', lineHeight: 1.8 }}>
              <li><strong>Formal Role-Based Governance:</strong> Explicit project-specific permissions.</li>
              <li><strong>Controlled Module Ownership:</strong> Responsibility mapping with access request workflows.</li>
              <li><strong>AST Dependency Mapping:</strong> Machine-readable structural graph from TypeScript Compiler API.</li>
              <li><strong>ML Change-Impact Prediction:</strong> Probabilistic risk prioritization over static reachability.</li>
              <li><strong>Document-to-Code Traceability:</strong> Linking requirements, implementation, and tests.</li>
              <li><strong>Contextual AI:</strong> Diagnosing failures grounded in live project context with patch verification.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA Banner */}
      <section className="landing-cta-banner">
        <h2>Experience Collaborative Software Engineering</h2>
        <p>Explore the continuous product journey from Project Overview to the 3-column Collaborative IDE.</p>
        <div style={{ marginTop: '22px', display: 'flex', gap: '14px', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={onEnterWorkspace} style={{ gap: '8px' }}>
            <Icons.Code size={18} color="#fff" />
            <span>Launch Collaborative IDE Workspace</span>
          </button>
          <button className="btn btn-lg" onClick={onGoToLogin} style={{ gap: '8px' }}>
            <Icons.User size={18} color="var(--text-muted)" />
            <span>Sign In with Demo Personas</span>
          </button>
        </div>
      </section>

      {/* 8. Professional Footer */}
      <footer className="landing-footer">
        <div>
          <strong>CodeSync</strong> — AI-Assisted Real-Time Collaborative Code Sync
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '4px' }}>
          Department of Computer Science and Engineering • Final-Year B.Tech Research Capstone • Academic Year 2026–27
        </div>
      </footer>
    </div>
  );
};
