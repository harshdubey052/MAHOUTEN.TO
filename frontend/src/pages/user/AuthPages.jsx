import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      {/* Subtle atmospheric gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-deep/30 rounded-full blur-[120px] opacity-40" />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

function AuthInput({ label, type = 'text', value, onChange, placeholder, required, minLength, showToggle }) {
  const [show, setShow] = useState(false);
  const inputType = showToggle ? (show ? 'text' : 'password') : type;
  return (
    <div>
      <label className="block text-meta font-medium text-text-secondary mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          className="w-full bg-surface-1 border border-border text-text-primary placeholder:text-text-disabled rounded-btn px-4 py-3 text-body focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
        />
        {showToggle && (
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/profiles');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <Link to="/" className="inline-block font-display text-[28px] font-bold text-text-primary mb-4">
            mahouten<span className="text-brand">.to</span>
          </Link>
          <h1 className="text-h3 font-semibold text-text-primary">Welcome back</h1>
          <p className="text-meta text-text-muted mt-1">Sign in to continue watching</p>
        </div>

        <div className="bg-surface-1 border border-border-subtle rounded-card-lg p-8">
          {error && (
            <div className="bg-red-500/8 border border-red-500/15 text-red-400 text-meta px-4 py-3 rounded-card mb-6">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            <AuthInput label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" required showToggle />
            <button type="submit" disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-btn transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-meta text-text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand hover:text-brand-hover font-medium transition-colors">Sign up free</Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(username, email, password);
      navigate('/profiles');
    } catch (err) {
      const d = err.response?.data;
      setError(d?.error || Object.values(d || {}).flat().join('. ') || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <Link to="/" className="inline-block font-display text-[28px] font-bold text-text-primary mb-4">
            mahouten<span className="text-brand">.to</span>
          </Link>
          <h1 className="text-h3 font-semibold text-text-primary">Create your account</h1>
          <p className="text-meta text-text-muted mt-1">Start watching in seconds</p>
        </div>

        <div className="bg-surface-1 border border-border-subtle rounded-card-lg p-8">
          {error && (
            <div className="bg-red-500/8 border border-red-500/15 text-red-400 text-meta px-4 py-3 rounded-card mb-6">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="otaku_legend" required />
            <AuthInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            <AuthInput label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} showToggle />
            <button type="submit" disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-btn transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-meta text-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand hover:text-brand-hover font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
