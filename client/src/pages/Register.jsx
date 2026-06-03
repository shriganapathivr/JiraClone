import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';

export default function Register() {
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created — welcome to ZiraClone!');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h2 className="font-display text-2xl font-bold">Create your account</h2>
      <p className="mt-1 text-sm text-muted">
        Already have one?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input required value={form.name} onChange={update('name')} className="input pl-9" placeholder="Ada Lovelace" />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input type="email" required value={form.email} onChange={update('email')} className="input pl-9" placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input type="password" required minLength={6} value={form.password} onChange={update('password')} className="input pl-9" placeholder="At least 6 characters" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={16} /> : <>Create account <ArrowRight size={16} /></>}
        </button>
      </form>
    </AuthShell>
  );
}
