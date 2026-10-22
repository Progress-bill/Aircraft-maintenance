import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Plane, Plus, Shield, MapPin, AlertCircle } from 'lucide-react';

export default function NewAircraftModal({ onClose, onSuccess }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    tail_number: '',
    model: '',
    manufacturer: '',
    serial_number: '',
    year: new Date().getFullYear(),
    total_hours: 0,
    total_cycles: 0,
    status: 'operational',
    location: 'Hangar Alpha - Bay 1',
    assigned_engineer: user?.name || '',
    next_inspection_type: 'A-Check (500hr)',
    next_inspection_date: '',
    next_inspection_hours: 500,
    image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/aircraft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add aircraft to database');

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-aero-600/20 text-aero-400 border border-aero-500/30">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Register Aircraft into Fleet</h3>
              <p className="text-xs text-slate-400">Initialize airframe records and subsystem health tracking.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tail Registration Number *</label>
              <input
                type="text"
                required
                value={form.tail_number}
                onChange={(e) => setForm({ ...form, tail_number: e.target.value.toUpperCase() })}
                placeholder="e.g. NR-701A"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Aircraft Model *</label>
              <input
                type="text"
                required
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. Boeing 737-800"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Manufacturer *</label>
              <input
                type="text"
                required
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                placeholder="e.g. The Boeing Company"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Manufacturer Serial No (MSN)</label>
              <input
                type="text"
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                placeholder="e.g. MSN-38290"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Year Built</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 2024 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Initial Airframe Hours</label>
              <input
                type="number"
                step="0.1"
                value={form.total_hours}
                onChange={(e) => setForm({ ...form, total_hours: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Initial Flight Cycles</label>
              <input
                type="number"
                value={form.total_cycles}
                onChange={(e) => setForm({ ...form, total_cycles: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Fleet Operational Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="operational">Operational / Flight Ready</option>
                <option value="maintenance">In Maintenance</option>
                <option value="inspection_due">Inspection Due</option>
                <option value="grounded">AOG / Grounded</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Hangar / Gate Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Hangar Alpha - Bay 3"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Assigned Lead Technician</label>
              <input
                type="text"
                value={form.assigned_engineer}
                onChange={(e) => setForm({ ...form, assigned_engineer: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Next Inspection Type</label>
              <input
                type="text"
                value={form.next_inspection_type}
                onChange={(e) => setForm({ ...form, next_inspection_type: e.target.value })}
                placeholder="A-Check (500hr)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-aero-600 hover:bg-aero-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-aero-600/30"
            >
              {loading ? (
                <span>Registering Aircraft...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Register into Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
