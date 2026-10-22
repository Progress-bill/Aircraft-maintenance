import React from 'react';
import { Plane, Clock, Wrench, AlertTriangle, CheckCircle, Activity, MapPin, ChevronRight, FileText, User } from 'lucide-react';

export default function AircraftCard({ aircraft, onClick, onLogRecord }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'operational':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          label: 'OPERATIONAL / FLIGHT READY',
          icon: CheckCircle
        };
      case 'maintenance':
        return {
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
          dot: 'bg-purple-400',
          label: 'IN MAINTENANCE',
          icon: Wrench
        };
      case 'inspection_due':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          label: 'INSPECTION DUE',
          icon: AlertTriangle
        };
      case 'grounded':
        return {
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
          label: 'AOG / GROUNDED',
          icon: AlertTriangle
        };
      default:
        return {
          bg: 'bg-slate-500/15 border-slate-500/30 text-slate-400',
          dot: 'bg-slate-400',
          label: status.toUpperCase(),
          icon: Activity
        };
    }
  };

  const statusConfig = getStatusBadge(aircraft.status);
  const StatusIcon = statusConfig.icon;

  // Remaining hours calculation
  const remainingHours = aircraft.next_inspection_hours
    ? Math.max(0, Math.round((aircraft.next_inspection_hours - aircraft.total_hours) * 10) / 10)
    : null;

  const healthScore = Math.round(aircraft.avg_health_score || 95);

  return (
    <div
      onClick={() => onClick(aircraft)}
      className="group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-aero-500/60 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-aero-600/10 cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5 ${
        aircraft.status === 'operational' ? 'bg-emerald-500' :
        aircraft.status === 'maintenance' ? 'bg-purple-500' :
        aircraft.status === 'inspection_due' ? 'bg-amber-500' : 'bg-rose-500'
      }`} />

      {/* Header section */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black font-mono tracking-tight text-white group-hover:text-aero-400 transition-colors">
                {aircraft.tail_number}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                {aircraft.year}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-0.5 line-clamp-1">
              {aircraft.model}
            </h3>
            <p className="text-xs text-slate-400">
              {aircraft.manufacturer} • <span className="font-mono text-slate-400">{aircraft.serial_number}</span>
            </p>
          </div>

          {/* Status Badge */}
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shrink-0 ${statusConfig.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`} />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Aircraft Image preview / banner */}
        <div className="relative h-32 w-full rounded-xl overflow-hidden mb-4 border border-slate-800/80 group-hover:border-slate-700/80 transition-all bg-slate-950">
          <img
            src={aircraft.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'}
            alt={aircraft.model}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

          {/* Location pill */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/60 text-slate-300">
            <MapPin className="w-3 h-3 text-aero-400" />
            <span className="truncate max-w-[140px]">{aircraft.location}</span>
          </div>

          {/* Health score badge */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/60 font-mono">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-300">Health:</span>
            <span className={`font-bold ${healthScore >= 90 ? 'text-emerald-400' : healthScore >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
              {healthScore}%
            </span>
          </div>
        </div>

        {/* Primary Flight Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-aero-400" /> Total Hours
            </div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {Number(aircraft.total_hours).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-400">hrs</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" /> Total Landings
            </div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {Number(aircraft.total_cycles).toLocaleString()} <span className="text-xs font-normal text-slate-400">cyc</span>
            </div>
          </div>
        </div>

        {/* Next Inspection Card */}
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">Next Inspection:</span>
            <span className="font-semibold text-aero-300 truncate max-w-[160px]">
              {aircraft.next_inspection_type || 'Standard Check'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span>Due Date: {aircraft.next_inspection_date || 'TBD'}</span>
            {remainingHours !== null && (
              <span className={`font-semibold ${remainingHours < 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {remainingHours} hrs left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-white font-mono">{aircraft.total_records_count || 0}</strong> logs
          </span>
          {aircraft.active_work_orders_count > 0 && (
            <span className="flex items-center gap-1 text-purple-400 font-medium">
              <Wrench className="w-3.5 h-3.5" />
              <span>{aircraft.active_work_orders_count} open WO</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-aero-400 font-medium group-hover:translate-x-0.5 transition-transform">
          <span>Inspect Records</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
