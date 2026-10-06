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
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <Icons.Zap size={20} color="var(--accent-blue)" />
          <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>CodeSync</span>
          <span className="brand-tag">Research Edition</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#research">Research</a>
          <a href="#architecture">Architecture</a>
          <button className="btn btn-sm" onClick={onGoToLogin}>Sign In / Personas</button>
          <button className="btn btn-sm btn-primary" onClick={onEnterWorkspace}>Launch IDE</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge">Final-Year B.Tech CSE Research Capstone Project • 2026–27</div>
        <h1 className="hero-title">
          AI-Assisted Real-Time<br />
          <span style={{ color: 'var(--accent-blue)' }}>Collaborative Code Sync</span>
        </h1>
        <p className="hero-subtitle">
          A role-, artifact-, and dependency-aware collaborative software development environment that combines
          controlled module ownership, document-to-code traceability, dependency-aware change analysis,
          ML-based change-impact/risk prediction, and contextual AI assistance within a real-time collaborative IDE.
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
            <span>Demo Personas</span>
          </button>
        </div>

        <div className="hero-metrics-pill">
          <span>✓ Real-Time Operational Transformation (OT)</span>
          <span>•</span>
          <span>✓ TypeScript Compiler AST Analysis</span>
          <span>•</span>
          <span>✓ Supervised Random Forest ML</span>
          <span>•</span>
          <span>✓ 100% False-Positive Alert Reduction</span>
        </div>
      </section>

      {/* 8 Core Features Grid */}
      <section id="features" className="landing-section">
        <div className="section-header">
          <h2>Core Research & Engineering Modules</h2>
          <p>Engineered as a comprehensive software engineering platform, not a generic online editor.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--accent-blue)' }}>
              <Icons.Zap size={28} color="var(--accent-blue)" />
            </div>
            <h3>1. Real-Time Collaborative Coding</h3>
            <p>
              Latency-aware Operational Transformation (OT) engine synchronizing concurrent edits, live collaborator
              cursors, and presence over WebSockets.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--color-med)' }}>
              <Icons.Shield size={28} color="var(--color-med)" />
            </div>
            <h3>2. Role-Based Governance</h3>
            <p>
              Strict server-side authorization separating Admin/Project Owner, Developer, Reviewer, and Viewer roles
              with PostgreSQL RLS policies.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--color-high)' }}>
              <Icons.Lock size={28} color="var(--color-high)" />
            </div>
            <h3>3. Controlled Artifact Ownership</h3>
            <p>
              Explicit module ownership mapping files to developers. Unauthorized edits are intercepted by permission gates
              triggering formal access requests.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#38bdf8' }}>
              <Icons.Network size={28} color="#38bdf8" />
            </div>
            <h3>4. Compiler-Grade Dependency Engine</h3>
            <p>
              Real TypeScript Compiler API AST analysis extracting import/export, function calls, class references,
              and test bindings without guessing.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--color-high)' }}>
              <Icons.Activity size={28} color="var(--color-high)" />
            </div>
            <h3>5. ML Change-Impact Prediction</h3>
            <p>
              Supervised Random Forest classifier scoring candidate artifacts across change and co-change features.
              All probabilities are dynamically computed.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#c084fc' }}>
              <Icons.Sparkles size={28} color="#c084fc" />
            </div>
            <h3>6. Contextual AI Assistant</h3>
            <p>
              Context-builder architecture supplying user role, git diff, AST graph, ML scores, and test traces
              to generate patch suggestions with human-in-the-loop review.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--color-low)' }}>
              <Icons.Flask size={28} color="var(--color-low)" />
            </div>
            <h3>7. Intelligent Relevant Testing</h3>
            <p>
              Selective test execution based on AST graph connections. Captures assertion errors, failure traces, and run times
              to feed the AI context.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#a855f7' }}>
              <Icons.GitBranch size={28} color="#a855f7" />
            </div>
            <h3>8. Git / GitHub Integration</h3>
            <p>
              Durable version control integration associating collaborative sessions, change events, and approved fixes
              with verified Git commits.
            </p>
          </div>
        </div>
      </section>

      {/* Research Foundation Section */}
      <section id="research" className="landing-section alt-bg">
        <div className="section-header">
          <h2>Academic Research Foundation</h2>
          <p>Grounding CodeSync within the collaborative programming literature.</p>
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
              CodeSync does not claim error isolation, basic real-time OT, chat, or standard AI coding assistance as its novelty.
              Those form the established foundation.
            </p>
          </div>

          <div className="research-card highlight">
            <h3>CodeSync's Proposed Contributions</h3>
            <p>The research contribution focuses on making collaboration structured and dependency-aware:</p>
            <ol style={{ margin: '12px 0 0 20px', lineHeight: 1.8 }}>
              <li><strong>Formal Role-Based Governance:</strong> Explicit project-specific permissions.</li>
              <li><strong>Module Ownership:</strong> Explicit responsibility mapping and permission gates.</li>
              <li><strong>Controlled Editing & Access Requests:</strong> Preserving boundaries without halting flow.</li>
              <li><strong>AST Dependency Mapping:</strong> Machine-readable structural graph from source analysis.</li>
              <li><strong>ML Change-Impact Prediction:</strong> Probabilistic risk prioritization over static reachability.</li>
              <li><strong>Document-to-Code Traceability:</strong> Linking requirements, implementation, and tests.</li>
              <li><strong>Contextual AI:</strong> Explaining failures and impacts grounded in project context.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Architecture Flow Section */}
      <section id="architecture-section" className="landing-section">
        <div className="section-header">
          <h2>End-to-End System Pipeline</h2>
          <p>How code edits propagate through real-time sync, AST analysis, ML inference, and AI assistance.</p>
        </div>

        <div className="architecture-flow-diagram">
          <div className="flow-step">
            <div className="step-num">1</div>
            <h4>Collaborative Edit</h4>
            <p>Developer edits code in Monaco Editor; WebSockets broadcast OT operations.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">2</div>
            <h4>Change Detection</h4>
            <p>Fine-grained diff computes added/deleted lines and modified functions.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">3</div>
            <h4>AST Dependency Engine</h4>
            <p>TypeScript Compiler API traverses AST and scopes candidate downstream files.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">4</div>
            <h4>Random Forest ML</h4>
            <p>Model scores candidate files on change features, outputting dynamic risk probabilities.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">5</div>
            <h4>Selective Testing</h4>
            <p>Runs covering test suites; captures assertion failures and stack traces.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">6</div>
            <h4>Contextual AI</h4>
            <p>Analyzes error and generates verified fix diff requiring human approval.</p>
          </div>
        </div>
      </section>

      {/* Target Demonstration Walkthrough */}
      <section className="landing-section alt-bg">
        <div className="section-header">
          <h2>Target End-to-End Demonstration: Smart Canteen Platform</h2>
          <p>Pre-configured full-stack demonstration verifying all 13 system milestones.</p>
        </div>

        <div className="demo-scenario-box">
          <div className="demo-step">
            <strong>Stage 1: Ownership Enforcement</strong>
            <p>Carlos (Dev B) attempts to edit <code>authService.ts</code> owned by Maya (Dev A) → System intercepts with 403 Forbidden & Access Request Modal.</p>
          </div>
          <div className="demo-step">
            <strong>Stage 2: Code Modification</strong>
            <p>Maya Patel (Dev A) modifies <code>authService.ts</code> → Change detection triggers AST re-indexing and candidate discovery.</p>
          </div>
          <div className="demo-step">
            <strong>Stage 3: ML Risk Prediction & Owner Notification</strong>
            <p>Random Forest model predicts HIGH impact on <code>login.tsx</code> (92%) and <code>auth.test.ts</code> (88%) → Targeted alert sent to Carlos Santos.</p>
          </div>
          <div className="demo-step">
            <strong>Stage 4: Automated Testing & Contextual AI</strong>
            <p>Relevant test runner runs <code>auth.test.ts</code> → AssertionError detected → Contextual AI explains root cause and proposes compliant patch diff.</p>
          </div>
          <div className="demo-step">
            <strong>Stage 5: Review & Git Commit</strong>
            <p>Developer applies fix → Tests pass (100%) → Elena Rostova (Reviewer) approves and records Git commit in the Audit Trail.</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="landing-cta-banner">
        <h2>Experience Collaborative Software Engineering</h2>
        <p>Explore the interactive IDE workspace, experiment with personas, and run the Smart Canteen scenario.</p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '14px', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={onEnterWorkspace}>
            Launch Collaborative IDE Workspace
          </button>
          <button className="btn btn-lg" onClick={onGoToLogin}>
            Sign In with Demo Personas
          </button>
        </div>
      </section>

      {/* Academic Footer */}
      <footer className="landing-footer">
        <div>
          <strong>CodeSync</strong> — AI-Assisted Real-Time Collaborative Code Sync
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '4px' }}>
          Department of Computer Science and Engineering • Academic Year 2026–27
        </div>
      </footer>
    </div>
  );
};
