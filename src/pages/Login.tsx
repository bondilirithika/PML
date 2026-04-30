import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Zap, Eye, EyeOff, Shield, Activity, Ticket, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (data: FormData) => {
    setLoggingIn(true);
    try {
      await login(data.username, data.password);
      toast.success(`Welcome back, ${data.username}!`);
      navigate('/', { replace: true });
    } catch {
      toast.error('Invalid username or password');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>

      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
          <div className="absolute bottom-[-60px] right-[-60px] w-[350px] h-[350px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.5)' }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">PML</p>
              <p className="text-indigo-300 text-[11px] font-semibold tracking-wider uppercase">Predictive Maintenance</p>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
            Industrial<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Intelligence
            </span><br />
            Platform
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Real-time asset monitoring, automated anomaly detection, and predictive maintenance for industrial systems.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: Activity, text: 'Real-time vibration & temperature monitoring' },
            { icon: Shield,   text: 'Threshold-based anomaly detection' },
            { icon: Ticket,   text: 'Automated maintenance ticket creation' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Icon className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-slate-300 text-sm font-medium">{text}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <p className="text-slate-600 text-xs">© 2026 PML · All rights reserved</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">

          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-900 text-lg">PML System</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <Lock className="w-3 h-3 text-indigo-500" />
              <span className="text-indigo-600 text-[11px] font-bold uppercase tracking-widest">Secure Access</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1.5">Sign in to your PML account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username"
              placeholder="Enter your username"
              error={errors.username?.message}
              autoComplete="username"
              autoFocus
              {...register('username')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                error={errors.password?.message}
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={loggingIn} className="w-full" size="lg">
                {loggingIn ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Predictive Maintenance Lite · PML System
          </p>
        </div>
      </div>
    </div>
  );
}
