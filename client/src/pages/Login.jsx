import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('alice@zira.dev');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h2 className="font-display text-2xl font-bold">Sign in</h2>
      <p className="mt-1 text-sm text-muted">
        New here?{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-9"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-9"
              placeholder="••••••••"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={16} /> : <>Sign in <ArrowRight size={16} /></>}
        </button>
      </form>

      <p className="mt-6 rounded-lg bg-accent-soft px-3 py-2.5 text-xs text-accent">
        Demo account is pre-filled — just hit <b>Sign in</b>. (Run <code>npm run seed</code> first.)
      </p>
    </AuthShell>
  );
}
