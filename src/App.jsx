import { useState, useCallback, lazy, Suspense } from 'react';
import './styles/auth.css';
import { useAuth } from './context/AuthContext';
import { firebaseErrorMessage } from './utils/firebaseErrors';
import {
  Eye, EyeOff, Mail, Lock, User, Building2,
  Phone, BadgeCheck, ShieldCheck, ArrowRight, Loader2,
  BarChart3, CheckCircle, Users, Trophy, Heart, TrendingUp, Umbrella, Award,
  AlertCircle, Crown, CheckCircle2, PartyPopper, XCircle, KeyRound, Leaf
} from 'lucide-react';

// Lazy-load heavy dashboard pages — only fetched when the user logs in
const HRDashboard       = lazy(() => import('./pages/HRDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));

// ─── Toast Component ────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{t.icon}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Password Strength ──────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strength = getStrength(password);
  if (!password) return null;
  return (
    <div className="password-strength">
      <div className="password-strength-bars">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`strength-bar ${i <= strength ? `active-${strength}` : ''}`} />
        ))}
      </div>
      <span className="password-strength-label">{labels[strength]}</span>
    </div>
  );
}

// ─── Forgot Password Modal ───────────────────────────────────────────────────
function ForgotPasswordModal({ onClose, onSend }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      await onSend(email);
      setSent(true);
    } catch (err) {
      setError(err.code ? firebaseErrorMessage(err.code) : (err.message || 'Something went wrong.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon"><KeyRound size={36} strokeWidth={1.5} /></div>
        <h3 className="modal-title">Reset Password</h3>
        {sent ? (
          <>
            <p className="modal-text success-text">
              <CheckCircle2 size={16} style={{ display:'inline', verticalAlign:'middle', marginRight:6, color:'#16a34a' }} />
              Password reset email sent! Check your inbox.
            </p>
            <button className="modal-btn" onClick={onClose}>Close</button>
          </>
        ) : (
          <form onSubmit={handleSend}>
            <p className="modal-text">Enter your registered email and we'll send a reset link.</p>
            <div className="form-input-wrapper" style={{ marginBottom: 12 }}>
              <span className="form-input-icon"><Mail size={16} /></span>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
              />
            </div>
            {error && <p className="form-error" style={{ marginBottom: 10 }}><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{error}</p>}
            <button type="submit" className="modal-btn" disabled={loading}>
              {loading ? <><span className="btn-spinner" style={{ width: 14, height: 14, marginRight: 8 }} />Sending...</> : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Left Branding Panel ─────────────────────────────────────────────────────
function BrandPanel({ role }) {
  const isHR = role === 'hr';
  const hrFeatures = [
    { icon: <BarChart3 size={17} />, title: 'Workforce Analytics', desc: 'Real-time wellness insights across your team' },
    { icon: <CheckCircle size={17} />, title: 'Leave Management', desc: 'Approve or reject leave requests instantly' },
    { icon: <Users size={17} />, title: 'Employee Directory', desc: 'Manage all employee profiles in one place' },
    { icon: <Trophy size={17} />, title: 'Wellness Reports', desc: 'Track org-wide health trends & scores' },
  ];
  const empFeatures = [
    { icon: <Heart size={17} />, title: 'Daily Wellness Log', desc: 'Track mood, stress, sleep, and steps' },
    { icon: <TrendingUp size={17} />, title: 'My Health Trends', desc: 'Visualize your wellness journey over time' },
    { icon: <Umbrella size={17} />, title: 'Leave Requests', desc: 'Apply for leave and track status' },
    { icon: <Award size={17} />, title: 'Wellness Streaks', desc: 'Earn badges for consistent healthy habits' },
  ];
  const features = isHR ? hrFeatures : empFeatures;

  return (
    <div className="auth-left-panel">
      <div className="auth-brand-section">
        <h2 className={`auth-brand-title ${isHR ? 'text-gradient-hr' : 'text-gradient-emp'}`}>
          {isHR ? 'HR Manager Portal' : 'Employee Wellness'}
        </h2>
        <p className="auth-brand-subtitle">
          {isHR
            ? 'Empower your organization with smart wellness tools. Monitor, manage and improve employee health at scale.'
            : 'Track your daily wellness, log health metrics, and build better habits. Your health journey starts here.'}
        </p>
        <div className="auth-feature-list">
          {features.map((f, i) => (
            <div className="auth-feature-item" key={i}>
              <div className={`auth-feature-icon ${isHR ? 'hr-icon' : 'emp-icon'}`} style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>{f.icon}</div>
              <div className="auth-feature-text">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Login Form ──────────────────────────────────────────────────────────────
function LoginForm({ role, onSubmit, loading, onForgot }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [errors, setErrors]     = useState({});
  const isHR = role === 'hr';

  const validate = () => {
    const e = {};
    if (!email)                          e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email  = 'Enter a valid email';
    if (!password)                       e.password = 'Password is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSubmit({ email, password });
  };

  return (
    <form className={`auth-form ${isHR ? 'hr-mode' : 'emp-mode'}`} onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label className="form-label" htmlFor="login-email">Email Address</label>
        <div className={`form-input-wrapper ${errors.email ? 'error' : ''}`}>
          <span className="form-input-icon"><Mail size={16} /></span>
          <input id="login-email" type="email" className="form-input"
            placeholder={isHR ? 'hr@company.com' : 'employee@company.com'}
            value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        {errors.email && <span className="form-error"><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{errors.email}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="login-password">Password</label>
        <div className={`form-input-wrapper ${errors.password ? 'error' : ''}`}>
          <span className="form-input-icon"><Lock size={16} /></span>
          <input id="login-password" type={showPwd ? 'text' : 'password'}
            className="form-input has-right-icon" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <button type="button" className="form-input-icon-right" onClick={() => setShowPwd(!showPwd)}>
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <span className="form-error"><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{errors.password}</span>}
      </div>

      <div className="auth-forgot">
        <a href="#" onClick={(e) => { e.preventDefault(); onForgot(); }}>Forgot password?</a>
      </div>

      <button type="submit" id="login-submit-btn"
        className={`auth-submit-btn ${isHR ? 'hr-btn' : 'emp-btn'}`} disabled={loading}>
        {loading
          ? <span className="btn-loading"><span className="btn-spinner" />Signing in...</span>
          : <>Sign In as {isHR ? 'HR Manager' : 'Employee'} <ArrowRight size={16} style={{ display:'inline', verticalAlign:'middle', marginLeft:6 }} /></>
        }
      </button>
    </form>
  );
}

// ─── Signup Form ─────────────────────────────────────────────────────────────
function SignupForm({ role, onSubmit, loading }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', department: '',
    employeeId: '', agreeTerms: false,
  });
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors]         = useState({});
  const [modalType, setModalType]   = useState(null); // 'terms' | 'privacy' | null
  const isHR = role === 'hr';
  const up = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim())           e.firstName       = 'Required';
    if (!form.lastName.trim())            e.lastName        = 'Required';
    if (!form.email)                      e.email           = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email     = 'Invalid email';
    if (!form.phone)                      e.phone           = 'Phone required';
    if (!form.password)                   e.password        = 'Required';
    else if (form.password.length < 8)    e.password        = 'Min 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.department)                 e.department      = 'Select a department';
    if (!form.agreeTerms)                 e.agreeTerms      = 'You must agree to terms';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSubmit({ ...form, role });
  };

  const hrDepts   = ['Human Resources', 'Recruitment', 'Training & Development', 'Payroll', 'Administration'];
  const empDepts  = ['Engineering', 'Design', 'Marketing', 'Sales', 'Finance', 'Operations', 'Customer Support', 'Legal'];

  return (
    <form className={`auth-form ${isHR ? 'hr-mode' : 'emp-mode'}`} onSubmit={handleSubmit} noValidate>
      {/* Name */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="su-fn">First Name</label>
          <div className={`form-input-wrapper ${errors.firstName ? 'error' : ''}`}>
            <span className="form-input-icon"><User size={16} /></span>
            <input id="su-fn" type="text" className="form-input" placeholder="John"
              value={form.firstName} onChange={(e) => up('firstName', e.target.value)} />
          </div>
          {errors.firstName && <span className="form-error"><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{errors.firstName}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="su-ln">Last Name</label>
          <div className={`form-input-wrapper ${errors.lastName ? 'error' : ''}`}>
            <span className="form-input-icon"><User size={16} /></span>
            <input id="su-ln" type="text" className="form-input" placeholder="Doe"
              value={form.lastName} onChange={(e) => up('lastName', e.target.value)} />
          </div>
          {errors.lastName && <span className="form-error"><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{errors.lastName}</span>}
        </div>
      </div>

      {/* Email */}
      <div className="form-group">
        <label className="form-label" htmlFor="su-email">Work Email</label>
        <div className={`form-input-wrapper ${errors.email ? 'error' : ''}`}>
          <span className="form-input-icon"><Mail size={16} /></span>
          <input id="su-email" type="email" className="form-input"
            placeholder={isHR ? 'hr@company.com' : 'you@company.com'}
            value={form.email} onChange={(e) => up('email', e.target.value)} autoComplete="email" />
        </div>
        {errors.email && <span className="form-error"><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{errors.email}</span>}
      </div>

      {/* Phone + ID */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="su-phone">Phone</label>
          <div className={`form-input-wrapper ${errors.phone ? 'error' : ''}`}>
            <span className="form-input-icon"><Phone size={16} /></span>
            <input id="su-phone" type="tel" className="form-input" placeholder="+91 98765 43210"
              value={form.phone} onChange={(e) => up('phone', e.target.value)} />
          </div>
          {errors.phone && <span className="form-error"><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{errors.phone}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="su-eid">{isHR ? 'HR ID' : 'Employee ID'}</label>
          <div className={`form-input-wrapper ${errors.employeeId ? 'error' : ''}`}>
            <span className="form-input-icon"><BadgeCheck size={16} /></span>
            <input id="su-eid" type="text" className="form-input"
              placeholder={isHR ? 'HR-001' : 'EMP-001'}
              value={form.employeeId} onChange={(e) => up('employeeId', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Department */}
      <div className="form-group">
        <label className="form-label" htmlFor="su-dept">Department</label>
        <div className={`form-input-wrapper ${errors.department ? 'error' : ''}`}>
          <span className="form-input-icon"><Building2 size={16} /></span>
          <select id="su-dept" className="form-select"
            value={form.department} onChange={(e) => up('department', e.target.value)}>
            <option value="">Select Department</option>
            {(isHR ? hrDepts : empDepts).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {errors.department && <span className="form-error"><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{errors.department}</span>}
      </div>

      {/* Password */}
      <div className="form-group">
        <label className="form-label" htmlFor="su-pwd">Password</label>
        <div className={`form-input-wrapper ${errors.password ? 'error' : ''}`}>
          <span className="form-input-icon"><Lock size={16} /></span>
          <input id="su-pwd" type={showPwd ? 'text' : 'password'}
            className="form-input has-right-icon" placeholder="Min. 8 characters"
            value={form.password} onChange={(e) => up('password', e.target.value)} autoComplete="new-password" />
          <button type="button" className="form-input-icon-right" onClick={() => setShowPwd(!showPwd)}>
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <PasswordStrength password={form.password} />
        {errors.password && <span className="form-error"><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{errors.password}</span>}
      </div>

      {/* Confirm */}
      <div className="form-group">
        <label className="form-label" htmlFor="su-confirm">Confirm Password</label>
        <div className={`form-input-wrapper ${errors.confirmPassword ? 'error' : ''}`}>
          <span className="form-input-icon"><Lock size={16} /></span>
          <input id="su-confirm" type={showConfirm ? 'text' : 'password'}
            className="form-input has-right-icon" placeholder="Repeat password"
            value={form.confirmPassword} onChange={(e) => up('confirmPassword', e.target.value)} autoComplete="new-password" />
          <button type="button" className="form-input-icon-right" onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {form.confirmPassword && form.password === form.confirmPassword && (
          <span className="form-success"><CheckCircle2 size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />Passwords match</span>
        )}
        {errors.confirmPassword && <span className="form-error"><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{errors.confirmPassword}</span>}
      </div>

      {/* Terms */}
      <div className="form-group">
        <div className="form-checkbox-group">
          <input id="su-terms" type="checkbox" className="form-checkbox"
            checked={form.agreeTerms} onChange={(e) => up('agreeTerms', e.target.checked)} />
          <label htmlFor="su-terms" className="form-checkbox-label">
            I agree to the <a href="#" onClick={(e) => { e.preventDefault(); setModalType('terms'); }}>Terms of Service</a> and{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setModalType('privacy'); }}>Privacy Policy</a>
          </label>
        </div>
        {errors.agreeTerms && <span className="form-error"><AlertCircle size={12} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />{errors.agreeTerms}</span>}
      </div>

      <button type="submit" id="signup-submit-btn"
        className={`auth-submit-btn ${isHR ? 'hr-btn' : 'emp-btn'}`} disabled={loading}>
        {loading
          ? <span className="btn-loading"><span className="btn-spinner" />Creating account...</span>
          : <>Create {isHR ? 'HR' : 'Employee'} Account <ArrowRight size={16} style={{ display:'inline', verticalAlign:'middle', marginLeft:6 }} /></>
        }
      </button>

      {modalType && (
        <div className="auth-modal-overlay" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 17, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div className="auth-modal-content animate-in" style={{
            background: 'var(--gray-900)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--gray-50)',
                margin: 0
              }}>
                {modalType === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: 'var(--gray-400)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              padding: '24px',
              overflowY: 'auto',
              fontSize: '0.85rem',
              color: 'var(--gray-300)',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'left'
            }}>
              {modalType === 'terms' ? (
                <>
                  <p>Welcome to <strong>Self Wellness</strong>. By signing up, you agree to comply with and be bound by the following terms of use.</p>
                  <div>
                    <h4 style={{ color: 'var(--gray-100)', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>1. User Eligibility</h4>
                    <p>This software portal is restricted to authorized employees and managers of registering organizations. You must provide a valid work email and credentials during registration.</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--gray-100)', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>2. Self Tracking & Metrics</h4>
                    <p>Self Wellness offers features to log mood, sleep, steps, and focus sessions. These metrics are processed to provide wellness analytics and are not intended to substitute professional medical evaluation or medical advice.</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--gray-100)', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>3. Deep Focus & Productivity</h4>
                    <p>The deep concentration tracker counts tab shifts and screen distractions to help you manage your focus. Your employer’s specific HR policies govern how organization-wide metrics are shared and evaluated.</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--gray-100)', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>4. Termination & Deletion</h4>
                    <p>You can terminate your account at any time via your profile settings. Upon deletion, your user details and personal history logs are purged immediately.</p>
                  </div>
                </>
              ) : (
                <>
                  <p>At <strong>Self Wellness</strong>, we value your privacy. This policy outlines how your information is gathered, managed, and safeguarded.</p>
                  <div>
                    <h4 style={{ color: 'var(--gray-100)', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>1. Data Collection</h4>
                    <p>We collect standard account details (name, email, phone, employee ID, department) and self-reported wellness logs (mood, sleep, steps, stress scores, and focus distraction metrics).</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--gray-100)', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>2. Purpose of Processing</h4>
                    <p>Data is used to provide personal dashboard metrics, calculate aggregate department wellness indexes, and facilitate administrative review of leave requests.</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--gray-100)', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>3. Organizational Transparency</h4>
                    <p>Individual wellness log details and notes are visible in your workspace. Aggregate metrics and focus times are visible to authorized HR managers in your organization.</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--gray-100)', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>4. Data Deletion Rights</h4>
                    <p>You have full autonomy over your data. Deleting your account will immediately remove all user profile information and history entries from our active systems.</p>
                  </div>
                </>
              )}
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(255, 255, 255, 0.01)'
            }}>
              <button
                type="button"
                className={`auth-submit-btn ${isHR ? 'hr-btn' : 'emp-btn'}`}
                onClick={() => setModalType(null)}
                style={{
                  padding: '8px 20px',
                  fontSize: '0.8rem',
                  width: 'auto',
                  marginTop: 0
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

// ─── Auth Page ───────────────────────────────────────────────────────────────
function AuthPage() {
  const { login, signup, resetPassword, authLoading } = useAuth();
  const [role, setRole]         = useState('employee');
  const [mode, setMode]         = useState('login');
  const [loading, setLoading]   = useState(false);
  const [toasts, setToasts]     = useState([]);
  const [showForgot, setShowForgot] = useState(false);
  const isHR = role === 'hr';

  const addToast = useCallback((message, type = 'info', icon = 'ℹ️') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const { profile } = await login(email, password, role);
      addToast(`Welcome back, ${profile.firstName}!`, isHR ? 'info-hr' : 'info-emp', isHR ? <Crown size={15} /> : <Heart size={15} />);
    } catch (err) {
      const msg = err.code
        ? firebaseErrorMessage(err.code)
        : (err.message || 'Something went wrong. Please try again.');
      addToast(msg, 'error', <XCircle size={15} />);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (formData) => {
    setLoading(true);
    try {
      const { profile } = await signup(formData);
      addToast(`Account created! Welcome, ${profile.firstName}!`, 'success', <PartyPopper size={15} />);
    } catch (err) {
      const msg = err.code
        ? firebaseErrorMessage(err.code)
        : (err.message || 'Something went wrong. Please try again.');
      addToast(msg, 'error', <XCircle size={15} />);
    } finally {
      setLoading(false);
    }
  };

  const activeModeBtn = (m) => {
    let cls = 'auth-mode-btn';
    if (mode === m) cls += isHR ? ' active active-hr' : ' active active-emp';
    return cls;
  };

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-logo"><Leaf size={32} strokeWidth={1.5} /></div>
        <Loader2 size={28} className="spin-icon" />
        <p>Loading Self Wellness...</p>
      </div>
    );
  }

  return (
    <>
      <Toast toasts={toasts} />
      {showForgot && (
        <ForgotPasswordModal
          onClose={() => setShowForgot(false)}
          onSend={resetPassword}
        />
      )}

      <div className="auth-page">
        <div className="auth-bg">
          <div className="auth-bg-orb auth-bg-orb-1"
            style={!isHR ? { background: 'radial-gradient(circle, var(--emp-primary), transparent)' } : {}} />
          <div className="auth-bg-orb auth-bg-orb-2"
            style={!isHR ? { background: 'radial-gradient(circle, var(--emp-secondary), transparent)' } : {}} />
          <div className="auth-bg-orb auth-bg-orb-3" />
          <div className="auth-bg-grid" />
        </div>

        <BrandPanel role={role} />
        <div className="auth-panel-divider" />

        <div className="auth-right-panel">
          <div className="auth-form-container">
            {/* Header */}
            <div className="auth-header">
              <h1 className="auth-title">
                {mode === 'login' ? 'Welcome back to Self Wellness' : 'Join Self Wellness'}
              </h1>
              <p className="auth-subtitle">
                {mode === 'login' ? 'Sign in to your workspace' : 'Create your wellness account'}
              </p>
            </div>

            {/* Role Selector */}
            <div className="role-selector">
              <button type="button" id="role-hr-btn"
                className={`role-btn ${role === 'hr' ? 'active-hr' : ''}`}
                onClick={() => setRole('hr')}>
                <span className="role-badge">✓</span>
                <span className="role-btn-label">HR Manager</span>
                <span className="role-btn-desc">Manage & monitor wellness</span>
              </button>
              <button type="button" id="role-employee-btn"
                className={`role-btn ${role === 'employee' ? 'active-emp' : ''}`}
                onClick={() => setRole('employee')}>
                <span className="role-badge">✓</span>
                <span className="role-btn-label">Employee</span>
                <span className="role-btn-desc">Track your daily wellness</span>
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="auth-mode-toggle">
              <button type="button" id="mode-login-btn" className={activeModeBtn('login')} onClick={() => setMode('login')}>
                Sign In
              </button>
              <button type="button" id="mode-signup-btn" className={activeModeBtn('signup')} onClick={() => setMode('signup')}>
                Sign Up
              </button>
            </div>

            {/* Form */}
            {mode === 'login'
              ? <LoginForm role={role} onSubmit={handleLogin} loading={loading} onForgot={() => setShowForgot(true)} />
              : <SignupForm role={role} onSubmit={handleSignup} loading={loading} />
            }

            {/* Footer Link */}
            <p className="auth-footer">
              {mode === 'login' ? (
                <>Don&apos;t have an account?{' '}
                  <a href="#" className={isHR ? 'hr-link' : 'emp-link'}
                    onClick={(e) => { e.preventDefault(); setMode('signup'); }} id="switch-to-signup-link">
                    Sign up here
                  </a></>
              ) : (
                <>Already have an account?{' '}
                  <a href="#" className={isHR ? 'hr-link' : 'emp-link'}
                    onClick={(e) => { e.preventDefault(); setMode('login'); }} id="switch-to-login-link">
                    Sign in here
                  </a></>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Loading Spinner Screen ───────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-logo"><Leaf size={32} strokeWidth={1.5} /></div>
      <div className="auth-loading-spinner" />
      <p>Loading Self Wellness...</p>
    </div>
  );
}

// ─── Main App Router ─────────────────────────────────────────────────────────
export default function App() {
  const { currentUser, userProfile, authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;

  // Not logged in → show auth
  if (!currentUser || !userProfile) return <AuthPage />;

  // Logged in → lazy-load dashboard by role
  return (
    <Suspense fallback={<LoadingScreen />}>
      {userProfile.role === 'hr' ? <HRDashboard /> : <EmployeeDashboard />}
    </Suspense>
  );
}
