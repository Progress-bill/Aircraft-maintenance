import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Search, Filter, CheckCircle2, Clock, Wrench, AlertTriangle, Printer, Plane, CheckCircle } from 'lucide-react';

export default function MaintenanceLogsView({ onSelectAircraft }) {
  const { token, user, isStaff } = useAuth();
  const [logs, setLogs] = useState([]);
  const [aircraftMap, setAircraftMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [acRes] = await Promise.all([
        fetch('/api/aircraft', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const acData = await acRes.json();
      const acList = acData.aircraft || [];

      // Map aircraft id to aircraft object
      const map = {};
      acList.forEach(a => { map[a.id] = a; });
      setAircraftMap(map);

      // Fetch logs for all aircraft
      const recordPromises = acList.map(a =>
        fetch(`/api/aircraft/${a.id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(data => (data.records || []).map(r => ({ ...r, aircraft_tail: a.tail_number, aircraft_model: a.model })))
      );

      const allRecordsArrays = await Promise.all(recordPromises);
      const flatRecords = allRecordsArrays.flat().sort((a, b) => new Date(b.service_date) - new Date(a.service_date));
      setLogs(flatRecords);
    } catch (err) {
      console.error('Failed to load global maintenance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const handleSignoff = async (recordId) => {
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
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      alert('Failed to sign off record: ' + err.message);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.work_order_number?.toLowerCase().includes(search.toLowerCase()) ||
      log.title?.toLowerCase().includes(search.toLowerCase()) ||
      log.aircraft_tail?.toLowerCase().includes(search.toLowerCase()) ||
      log.technician_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.findings?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesType = typeFilter === 'all' || log.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-aero-600/20 text-aero-400 border border-aero-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Master Maintenance Logbook</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Complete airworthiness history, work orders, component replacements, and regulatory sign-offs.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4 text-aero-400" />
          <span>Print Master Airworthiness Register</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by WO#, Tail Registration, Title, Tech..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-aero-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-aero-500"
          >
            <option value="all">All Release Statuses</option>
            <option value="completed">Completed & Released</option>
            <option value="in_progress">In-Progress</option>
            <option value="pending_signoff">Pending Sign-off</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-aero-500"
          >
            <option value="all">All Maintenance Types</option>
            <option value="scheduled">Scheduled Check</option>
            <option value="unscheduled">Unscheduled Repair</option>
            <option value="defect_squawk">Pilot Squawk</option>
            <option value="avionics">Avionics</option>
            <option value="engine_service">Engine Service</option>
            <option value="airframe">Airframe</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Showing {filteredLogs.length} of {logs.length} Maintenance Records</span>
          <span>ICAO Annex 6 / Part 145 Audit Trail</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-aero-500 border-t-transparent rounded-full animate-spin" />
            <span>Compiling fleet maintenance logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No maintenance records found matching current query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-6">Work Order</th>
                  <th className="py-3 px-6">Aircraft</th>
                  <th className="py-3 px-6">Service Date & Hours</th>
                  <th className="py-3 px-6">Maintenance Task / Findings</th>
                  <th className="py-3 px-6">Technician / Sign-off</th>
                  <th className="py-3 px-6">Release Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-aero-400 bg-aero-500/10 px-2 py-0.5 rounded border border-aero-500/20">
                        {log.work_order_number}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 capitalize">{log.category || log.type}</div>
                    </td>

                    <td className="py-4 px-6">
                      <button
                        onClick={() => onSelectAircraft(log.aircraft_id)}
                        className="font-bold text-white font-mono hover:text-aero-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plane className="w-3.5 h-3.5 text-aero-400" />
                        <span>{log.aircraft_tail}</span>
                      </button>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{log.aircraft_model}</div>
                    </td>

                    <td className="py-4 px-6 font-mono">
                      <div className="text-white">{log.service_date}</div>
                      <div className="text-[10px] text-slate-400">{log.hours_at_service} airframe hrs</div>
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-semibold text-white line-clamp-1">{log.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{log.corrective_action}</div>
                      {log.parts_replaced && log.parts_replaced !== 'None' && (
                        <div className="text-[10px] text-aero-300 font-mono mt-0.5 truncate">
                          Parts: {log.parts_replaced}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-200">{log.technician_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.technician_license || 'STAFF'}</div>
                      {log.signoff_by && (
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>Signed: {log.signoff_by}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        log.status === 'completed'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : log.status === 'in_progress'
                          ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {log.status !== 'completed' && isStaff ? (
                        <button
                          onClick={() => handleSignoff(log.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Release</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectAircraft(log.aircraft_id)}
                          className="text-[11px] text-aero-400 hover:underline cursor-pointer"
                        >
                          View Aircraft
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
