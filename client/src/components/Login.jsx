import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plane, Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, UserCheck, KeyRound } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setEmail('admin@nero.aero');
    setPassword('Admin@123');
    setError('');
  };

  const fillEngineer = () => {
    setEmail('prudence@nero.aero');
    setPassword('Tech@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-navy-950 bg-aviation-grid flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-aero-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 relative backdrop-blur-xl z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-aero-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-aero-600/25 mb-4 border border-aero-400/30">
            <Plane className="w-8 h-8 text-white -rotate-45" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-wider text-white">NERO AERO</span>
            <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-aero-500/20 text-aero-400 rounded border border-aero-500/30">MRO</span>
          </div>
          <p className="text-sm text-slate-400 mt-1 font-mono">Aircraft Maintenance & Airworthiness Records</p>
        </div>

        {/* Security / Admin clearance notice */}
        <div className="mb-6 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3">
          <Shield className="w-5 h-5 text-aero-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">Restricted Airworthiness System:</span> Only authorized accounts are permitted. The Administrator manages personnel access and grants maintenance permissions.
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Aviation Email / ID
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nero.aero"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-aero-500 focus:ring-1 focus:ring-aero-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Security Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-400 hover:text-aero-400 transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-aero-500 focus:ring-1 focus:ring-aero-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-aero-600 to-cyan-600 hover:from-aero-500 hover:to-cyan-500 text-white shadow-lg shadow-aero-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Access Maintenance Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credential Pills */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-xs text-slate-400 font-medium mb-2.5 text-center flex items-center justify-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-aero-400" />
            Quick Demo Credentials:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillAdmin}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-aero-500/50 text-left transition-all text-xs group cursor-pointer"
            >
              <div className="font-semibold text-white flex items-center gap-1 group-hover:text-aero-400">
                <Shield className="w-3 h-3 text-amber-400" /> Admin
              </div>
              <div className="text-[10px] text-slate-400 truncate">admin@nero.aero</div>
            </button>
            <button
              type="button"
              onClick={fillEngineer}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-aero-500/50 text-left transition-all text-xs group cursor-pointer"
            >
              <div className="font-semibold text-white flex items-center gap-1 group-hover:text-aero-400">
                <UserCheck className="w-3 h-3 text-emerald-400" /> Engineer
              </div>
              <div className="text-[10px] text-slate-400 truncate">prudence@nero.aero</div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-500 flex items-center gap-2">
        <span>ICAO / FAA Part 145 Certified Record-Keeping</span>
        <span>•</span>
        <span>Database Connected</span>
      </div>
    </div>
  );
}
