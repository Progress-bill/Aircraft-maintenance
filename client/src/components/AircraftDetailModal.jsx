import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X, Plane, Wrench, Shield, CheckCircle, AlertTriangle, Clock,
  Calendar, MapPin, User, FileText, Plus, Activity, Sliders,
  Printer, CheckCircle2, ChevronRight, AlertCircle, Edit3, Trash2
} from 'lucide-react';
import NewRecordModal from './NewRecordModal';

export default function AircraftDetailModal({ aircraftId, onClose, onRefreshFleet }) {
  const { token, user, isAdmin, isStaff } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records'); // 'records', 'subsystems', 'specs'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [specForm, setSpecForm] = useState({});
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Subsystem edit state
  const [editingSubsystem, setEditingSubsystem] = useState(null);
  const [subsystemForm, setSubsystemForm] = useState({ health_percent: 100, hours_since_overhaul: 0, status: 'good', notes: '' });

  const fetchAircraftDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/aircraft/${aircraftId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch aircraft details');
      setData(result);
      setSpecForm(result.aircraft);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aircraftId) {
      fetchAircraftDetails();
    }
  }, [aircraftId]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`/api/aircraft/${aircraftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update status');

      setData(prev => ({ ...prev, aircraft: result.aircraft }));
      setFeedback({ type: 'success', message: `Aircraft status updated to ${newStatus.toUpperCase()}` });
      onRefreshFleet();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleUpdateSpecs = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/aircraft/${aircraftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(specForm)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update specifications');

      setData(prev => ({ ...prev, aircraft: result.aircraft }));
      setIsEditingSpecs(false);
      setFeedback({ type: 'success', message: 'Aircraft airworthiness specifications updated.' });
      onRefreshFleet();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleUpdateSubsystem = async (e) => {
    e.preventDefault();
    if (!editingSubsystem) return;

    try {
      const res = await fetch(`/api/subsystems/${editingSubsystem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(subsystemForm)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update subsystem');

      setEditingSubsystem(null);
      setFeedback({ type: 'success', message: 'Subsystem component parameters recorded.' });
      fetchAircraftDetails();
      onRefreshFleet();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSignoffRecord = async (recordId) => {
    try {
      const res = await fetch(`/api/records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'completed',
          signoff_by: user.name,
          signoff_date: new Date().toISOString().split('T')[0]
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to signoff record');

      setFeedback({ type: 'success', message: 'Work order signed off and certified for release.' });
      fetchAircraftDetails();
      onRefreshFleet();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteAircraft = async () => {
    if (!isAdmin) return;
    if (!window.confirm(`Permanently decommission ${data?.aircraft?.tail_number} and delete all maintenance logs? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/aircraft/${aircraftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete aircraft');

      onRefreshFleet();
      onClose();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex items-center gap-3 text-slate-300">
          <div className="w-6 h-6 border-2 border-aero-500 border-t-transparent rounded-full animate-spin" />
          <span>Opening Aircraft Airworthiness Dossier...</span>
        </div>
      </div>
    );
  }

  if (!data?.aircraft) {
    return null;
  }

  const { aircraft, subsystems, records } = data;

  const filteredRecords = records.filter(r => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'scheduled') return r.type === 'scheduled';
    if (categoryFilter === 'unscheduled') return r.type === 'unscheduled' || r.type === 'defect_squawk';
    if (categoryFilter === 'avionics') return r.type === 'avionics';
    if (categoryFilter === 'engine') return r.type === 'engine_service' || r.category?.toLowerCase().includes('engine');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aero-600/20 border border-aero-500/30 flex items-center justify-center text-aero-400">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-mono text-white">{aircraft.tail_number}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  {aircraft.serial_number}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">• {aircraft.model}</span>
              </div>
              <p className="text-xs text-slate-400">
                {aircraft.manufacturer} (Year {aircraft.year}) • Base: {aircraft.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Status Dropdown */}
            {isStaff && (
              <select
                value={aircraft.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer uppercase ${
                  aircraft.status === 'operational'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : aircraft.status === 'maintenance'
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                    : aircraft.status === 'inspection_due'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                }`}
              >
                <option value="operational" className="bg-slate-900 text-emerald-400">Operational</option>
                <option value="maintenance" className="bg-slate-900 text-purple-400">In Maintenance</option>
                <option value="inspection_due" className="bg-slate-900 text-amber-400">Inspection Due</option>
                <option value="grounded" className="bg-slate-900 text-rose-400">Grounded (AOG)</option>
              </select>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback.message && (
          <div className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium ${
            feedback.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border-b border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-b border-rose-500/30'
          }`}>
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback({ type: '', message: '' })} className="hover:underline">Dismiss</button>
          </div>
        )}

        {/* Quick KPI stats strip */}
        <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Total Airframe Hours</div>
            <div className="font-bold text-white font-mono text-sm mt-0.5">
              {Number(aircraft.total_hours).toLocaleString()} <span className="text-[11px] font-normal text-slate-400">hrs</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Total Flight Cycles</div>
            <div className="font-bold text-white font-mono text-sm mt-0.5">
              {Number(aircraft.total_cycles).toLocaleString()} <span className="text-[11px] font-normal text-slate-400">landings</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Next Inspection Due</div>
            <div className="font-semibold text-aero-300 text-xs mt-0.5 truncate">
              {aircraft.next_inspection_type || 'Standard Check'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {aircraft.next_inspection_date || 'Date TBD'} ({aircraft.next_inspection_hours ? `${aircraft.next_inspection_hours} hrs` : 'N/A'})
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Assigned Lead Tech</div>
            <div className="font-semibold text-slate-200 text-xs mt-0.5 flex items-center gap-1">
              <User className="w-3 h-3 text-aero-400" />
              <span>{aircraft.assigned_engineer || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('records')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'records'
                  ? 'border-aero-500 text-aero-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Maintenance Records & Work Orders ({records.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('subsystems')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'subsystems'
                  ? 'border-aero-500 text-aero-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Subsystems & Component Health ({subsystems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'specs'
                  ? 'border-aero-500 text-aero-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Airframe Specifications</span>
            </button>
          </div>

          {activeTab === 'records' && isStaff && (
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-aero-600 hover:bg-aero-500 text-white transition-all shadow-md shadow-aero-600/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Maintenance Record</span>
            </button>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/40">
          {/* TAB 1: MAINTENANCE RECORDS */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2">
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[11px] font-mono text-slate-400 px-2">Filter:</span>
                  {['all', 'scheduled', 'unscheduled', 'avionics', 'engine'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-aero-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-aero-400" />
                  <span>Print Airworthiness Log</span>
                </button>
              </div>

              {/* Records List */}
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl p-8 text-slate-500">
                  <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-400">No maintenance records matching filter.</p>
                  <p className="text-xs text-slate-500 mt-1">Click "Log Maintenance Record" above to record maintenance work performed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecords.map(record => (
                    <div
                      key={record.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 transition-all hover:border-slate-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-aero-400 bg-aero-500/10 px-2 py-0.5 rounded border border-aero-500/20">
                              {record.work_order_number}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {record.category}
                            </span>
                            <span className="text-xs text-slate-400">
                              Logged at {record.hours_at_service} airframe hrs
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1.5">{record.title}</h4>
                        </div>

                        {/* Status / Signoff badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            record.status === 'completed'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : record.status === 'in_progress'
                              ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                              : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          }`}>
                            {record.status}
                          </span>

                          {record.status !== 'completed' && isStaff && (
                            <button
                              onClick={() => handleSignoffRecord(record.id)}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sign Off</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Discrepancy Findings & Action */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 mb-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Inspection Findings / Discrepancy:</span>
                          <p className="text-slate-300 mt-1 leading-relaxed">{record.findings}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Corrective Action Taken:</span>
                          <p className="text-slate-300 mt-1 leading-relaxed">{record.corrective_action}</p>
                        </div>
                      </div>

                      {/* Parts replaced & personnel */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
                        <div>
                          <span className="text-slate-500">Parts/Material: </span>
                          <span className="text-slate-300">{record.parts_replaced || 'None'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>
                            Tech: <strong className="text-slate-200">{record.technician_name}</strong> ({record.technician_license || 'N/A'})
                          </span>
                          {record.signoff_by && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Released by: {record.signoff_by} ({record.signoff_date})</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUBSYSTEMS & COMPONENT HEALTH */}
          {activeTab === 'subsystems' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Major Aircraft Subsystems & Time-Between-Overhaul (TBO)</h3>
                  <p className="text-xs text-slate-400">Continuous health monitoring of engines, avionics, gear, and hydraulics.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subsystems.map(sys => {
                  const percentUsed = Math.min(100, Math.round((sys.hours_since_overhaul / sys.tbo_hours) * 100));
                  return (
                    <div
                      key={sys.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-white">{sys.system_name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Inspected: {sys.last_inspected_date || 'Standard interval'}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          sys.status === 'good'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : sys.status === 'monitor'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        }`}>
                          {sys.status}
                        </span>
                      </div>

                      {/* Health Meter */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Component Health Index</span>
                          <span className="font-mono font-bold text-white">{sys.health_percent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sys.health_percent >= 90 ? 'bg-emerald-500' :
                              sys.health_percent >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${sys.health_percent}%` }}
                          />
                        </div>
                      </div>

                      {/* TBO Hours Meter */}
                      <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs font-mono mb-2">
                        <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                          <span>Hours Since Overhaul:</span>
                          <span className="text-white font-bold">{sys.hours_since_overhaul} / {sys.tbo_hours} hrs</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-aero-500"
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                          <span>TBO Progress: {percentUsed}%</span>
                          <span>{sys.tbo_hours - sys.hours_since_overhaul} hrs remaining</span>
                        </div>
                      </div>

                      {sys.notes && (
                        <p className="text-xs text-slate-400 italic mb-3">"{sys.notes}"</p>
                      )}

                      {isStaff && (
                        <button
                          onClick={() => {
                            setEditingSubsystem(sys);
                            setSubsystemForm({
                              health_percent: sys.health_percent,
                              hours_since_overhaul: sys.hours_since_overhaul,
                              status: sys.status,
                              notes: sys.notes || ''
                            });
                          }}
                          className="w-full py-1.5 rounded-lg border border-slate-700 hover:border-aero-500/50 hover:bg-slate-800 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
                        >
                          Calibrate / Update Subsystem
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Subsystem edit modal */}
              {editingSubsystem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl">
                    <h4 className="font-bold text-white text-sm mb-3">Calibrate {editingSubsystem.system_name}</h4>
                    <form onSubmit={handleUpdateSubsystem} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Health Percentage (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={subsystemForm.health_percent}
                          onChange={(e) => setSubsystemForm({ ...subsystemForm, health_percent: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Hours Since Overhaul</label>
                        <input
                          type="number"
                          step="0.1"
                          value={subsystemForm.hours_since_overhaul}
                          onChange={(e) => setSubsystemForm({ ...subsystemForm, hours_since_overhaul: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Status Level</label>
                        <select
                          value={subsystemForm.status}
                          onChange={(e) => setSubsystemForm({ ...subsystemForm, status: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                        >
                          <option value="good">Good / Nominal</option>
                          <option value="monitor">Monitor Closely</option>
                          <option value="service_due">Service Due</option>
                          <option value="critical">Critical Discrepancy</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Inspection Observations / Notes</label>
                        <input
                          type="text"
                          value={subsystemForm.notes}
                          onChange={(e) => setSubsystemForm({ ...subsystemForm, notes: e.target.value })}
                          placeholder="e.g. Boroscope inspection clear"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingSubsystem(null)}
                          className="w-1/2 py-2 rounded-lg border border-slate-700 text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="w-1/2 py-2 rounded-lg bg-aero-600 text-white font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SPECIFICATIONS */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Airframe Technical Record & Fleet Positioning</h3>
                  <p className="text-xs text-slate-400">Official registration, hangar location, and airworthiness tracking metrics.</p>
                </div>
                {isStaff && !isEditingSpecs && (
                  <button
                    onClick={() => setIsEditingSpecs(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-aero-400" />
                    <span>Edit Specifications</span>
                  </button>
                )}
              </div>

              {!isEditingSpecs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-mono font-bold text-slate-400 uppercase text-[11px] border-b border-slate-800 pb-2">
                      Identification & Airworthiness
                    </h4>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Tail Registration:</span>
                      <span className="font-mono font-bold text-white">{aircraft.tail_number}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Aircraft Model:</span>
                      <span className="text-white font-semibold">{aircraft.model}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Manufacturer:</span>
                      <span className="text-white">{aircraft.manufacturer}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Manufacturer Serial No (MSN):</span>
                      <span className="font-mono text-white">{aircraft.serial_number}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Year of Manufacture:</span>
                      <span className="font-mono text-white">{aircraft.year}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-mono font-bold text-slate-400 uppercase text-[11px] border-b border-slate-800 pb-2">
                      Operations & Maintenance Schedule
                    </h4>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Station / Hangar:</span>
                      <span className="text-white font-semibold">{aircraft.location}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Assigned Engineer:</span>
                      <span className="text-white">{aircraft.assigned_engineer}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Next Scheduled Inspection:</span>
                      <span className="text-aero-300 font-semibold">{aircraft.next_inspection_type}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Target Inspection Date:</span>
                      <span className="font-mono text-white">{aircraft.next_inspection_date || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Inspection Target Hours:</span>
                      <span className="font-mono text-white">{aircraft.next_inspection_hours ? `${aircraft.next_inspection_hours} hrs` : 'N/A'}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="md:col-span-2 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="text-slate-500 text-xs">
                        Decommissioning this aircraft will permanently purge all maintenance records.
                      </div>
                      <button
                        onClick={handleDeleteAircraft}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Decommission Aircraft</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleUpdateSpecs} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Tail Registration</label>
                      <input
                        type="text"
                        value={specForm.tail_number || ''}
                        onChange={(e) => setSpecForm({ ...specForm, tail_number: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Aircraft Model</label>
                      <input
                        type="text"
                        value={specForm.model || ''}
                        onChange={(e) => setSpecForm({ ...specForm, model: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Manufacturer</label>
                      <input
                        type="text"
                        value={specForm.manufacturer || ''}
                        onChange={(e) => setSpecForm({ ...specForm, manufacturer: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Serial Number (MSN)</label>
                      <input
                        type="text"
                        value={specForm.serial_number || ''}
                        onChange={(e) => setSpecForm({ ...specForm, serial_number: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Total Airframe Flight Hours</label>
                      <input
                        type="number"
                        step="0.1"
                        value={specForm.total_hours || 0}
                        onChange={(e) => setSpecForm({ ...specForm, total_hours: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Total Flight Cycles (Landings)</label>
                      <input
                        type="number"
                        value={specForm.total_cycles || 0}
                        onChange={(e) => setSpecForm({ ...specForm, total_cycles: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Hangar / Station Location</label>
                      <input
                        type="text"
                        value={specForm.location || ''}
                        onChange={(e) => setSpecForm({ ...specForm, location: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Assigned Lead Engineer</label>
                      <input
                        type="text"
                        value={specForm.assigned_engineer || ''}
                        onChange={(e) => setSpecForm({ ...specForm, assigned_engineer: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Next Inspection Type</label>
                      <input
                        type="text"
                        value={specForm.next_inspection_type || ''}
                        onChange={(e) => setSpecForm({ ...specForm, next_inspection_type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Next Inspection Date</label>
                      <input
                        type="date"
                        value={specForm.next_inspection_date || ''}
                        onChange={(e) => setSpecForm({ ...specForm, next_inspection_date: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingSpecs(false)}
                      className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-aero-600 hover:bg-aero-500 text-white font-semibold"
                    >
                      Save Specifications
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Maintenance Record Modal */}
      {isLogModalOpen && (
        <NewRecordModal
          aircraft={aircraft}
          onClose={() => setIsLogModalOpen(false)}
          onSuccess={() => {
            setIsLogModalOpen(false);
            setFeedback({ type: 'success', message: 'New maintenance entry officially logged to aircraft history.' });
            fetchAircraftDetails();
            onRefreshFleet();
          }}
        />
      )}
    </div>
  );
}
