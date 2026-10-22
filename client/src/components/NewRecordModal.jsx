import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Wrench, Shield, CheckCircle, FileText, Calendar, Clock, AlertTriangle } from 'lucide-react';

export default function NewRecordModal({ aircraft, onClose, onSuccess }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    work_order_number: `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    title: '',
    type: 'scheduled',
    category: 'A-Check',
    service_date: new Date().toISOString().split('T')[0],
    hours_at_service: aircraft.total_hours || 0,
    cycles_at_service: aircraft.total_cycles || 0,
    technician_name: user?.name || '',
    technician_license: user?.license_number || '',
    findings: '',
    corrective_action: '',
    parts_replaced: '',
    status: 'completed',
    next_due_date: '',
    next_due_hours: '',
    notes: '',
    update_aircraft_hours: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/aircraft/${aircraft.id}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log maintenance record');

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-aero-600/20 text-aero-400 border border-aero-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Log Maintenance Record</h3>
              <p className="text-xs text-slate-400">
                Official Airworthiness Logbook Entry for <strong className="font-mono text-white">{aircraft.tail_number}</strong> ({aircraft.model})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Work Order #</label>
              <input
                type="text"
                required
                value={form.work_order_number}
                onChange={(e) => setForm({ ...form, work_order_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Record Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="scheduled">Scheduled Inspection</option>
                <option value="unscheduled">Unscheduled Repair</option>
                <option value="defect_squawk">Pilot Squawk / Defect</option>
                <option value="avionics">Avionics Calibration</option>
                <option value="engine_service">Engine Service / Overhaul</option>
                <option value="airframe">Airframe Structural</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Category / Tag</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. A-Check, Hydraulics"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Record Title / Subject</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Replaced Left Main Gear Brake Assembly and Pressure Tested"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Service Date</label>
              <input
                type="date"
                required
                value={form.service_date}
                onChange={(e) => setForm({ ...form, service_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Airframe Hours at Service</label>
              <input
                type="number"
                step="0.1"
                required
                value={form.hours_at_service}
                onChange={(e) => setForm({ ...form, hours_at_service: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Flight Cycles at Service</label>
              <input
                type="number"
                value={form.cycles_at_service}
                onChange={(e) => setForm({ ...form, cycles_at_service: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Certificated Mechanic / Technician</label>
              <input
                type="text"
                required
                value={form.technician_name}
                onChange={(e) => setForm({ ...form, technician_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">A&P / Part-66 License #</label>
              <input
                type="text"
                value={form.technician_license}
                onChange={(e) => setForm({ ...form, technician_license: e.target.value })}
                placeholder="FAA-A&P-982144"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Inspection Findings / Squawk Report</label>
            <textarea
              required
              rows={2}
              value={form.findings}
              onChange={(e) => setForm({ ...form, findings: e.target.value })}
              placeholder="Describe discrepancies found during inspection or reported by crew..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Corrective Action Taken & Compliance Method</label>
            <textarea
              required
              rows={2}
              value={form.corrective_action}
              onChange={(e) => setForm({ ...form, corrective_action: e.target.value })}
              placeholder="State repairs, tests, and AMM manual references complied with..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Parts & Consumables Replaced (with Part Numbers)</label>
            <input
              type="text"
              value={form.parts_replaced}
              onChange={(e) => setForm({ ...form, parts_replaced: e.target.value })}
              placeholder="e.g. Brake Pack PN: 2-1540-1, O-Ring Seal MS28775-224"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Work Order Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="completed">Completed & Released</option>
                <option value="in_progress">In-Progress</option>
                <option value="pending_signoff">Pending Inspector Sign-off</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Next Inspection Due Date</label>
              <input
                type="date"
                value={form.next_due_date}
                onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Next Due Airframe Hours</label>
              <input
                type="number"
                step="0.1"
                value={form.next_due_hours}
                onChange={(e) => setForm({ ...form, next_due_hours: e.target.value })}
                placeholder="e.g. 5200.0"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-aero-600 hover:bg-aero-500 text-white font-semibold flex items-center gap-2 shadow-md shadow-aero-600/30 cursor-pointer"
            >
              {loading ? (
                <span>Writing to Database...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Officially Log Maintenance Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
