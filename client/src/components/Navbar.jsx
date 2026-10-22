import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plane, Users, LogOut, ShieldCheck, Clock, FileSpreadsheet, PlusCircle, LayoutDashboard } from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, onOpenAddAircraft, onOpenAddUser }) {
  const { user, logout, isAdmin } = useAuth();
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'engineer':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'inspector':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-aero-600 to-cyan-500 flex items-center justify-center shadow-md shadow-aero-600/30">
            <Plane className="w-5 h-5 text-white -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">NERO AERO</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-aero-500/20 text-aero-400 border border-aero-500/30">MRO</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">AIRCRAFT MAINTENANCE & AIRWORTHINESS SYSTEM</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentTab('fleet')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'fleet'
                ? 'bg-aero-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Aircraft Fleet</span>
          </button>

          <button
            onClick={() => setCurrentTab('logs')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'logs'
                ? 'bg-aero-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Maintenance Records</span>
          </button>

          {/* User Management tab strictly for admin */}
          {isAdmin && (
            <button
              onClick={() => setCurrentTab('users')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'users'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-transparent hover:border-amber-500/30'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Control (Admin)</span>
            </button>
          )}
        </nav>

        {/* Right side: UTC Time, User profile pill & Logout */}
        <div className="flex items-center gap-3">
          {/* Zulu/UTC Time */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-aero-400" />
            <span>{utcTime}</span>
          </div>

          {/* User badge */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white leading-tight">{user?.name}</div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${getRoleBadge(user?.role)}`}>
                  {user?.role}
                </span>
                {user?.license_number && (
                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                    {user.license_number}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out of Maintenance Terminal"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
