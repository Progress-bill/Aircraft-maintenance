import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import AircraftCard from './components/AircraftCard';
import AircraftDetailModal from './components/AircraftDetailModal';
import NewAircraftModal from './components/NewAircraftModal';
import UserManagement from './components/UserManagement';
import MaintenanceLogsView from './components/MaintenanceLogsView';
import {
  Plane, Search, Filter, Plus, Wrench, Shield, CheckCircle,
  AlertTriangle, Clock, Activity, BarChart3, AlertOctagon
} from 'lucide-react';

export default function App() {
  const { user, token, loading, isAdmin, isStaff } = useAuth();
  const [currentTab, setCurrentTab] = useState('fleet'); // 'fleet', 'logs', 'users'

  const [aircraftList, setAircraftList] = useState([]);
  const [stats, setStats] = useState(null);
  const [fleetLoading, setFleetLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedAircraftId, setSelectedAircraftId] = useState(null);
  const [isAddAircraftOpen, setIsAddAircraftOpen] = useState(false);

  const fetchFleet = async () => {
    if (!token) return;
    try {
      setFleetLoading(true);
      const [acRes, statsRes] = await Promise.all([
        fetch('/api/aircraft', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const acData = await acRes.json();
      const statsData = await statsRes.json();

      setAircraftList(acData.aircraft || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch fleet:', err);
    } finally {
      setFleetLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFleet();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-aero-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Initializing Nero Aero Terminal...</span>
        </div>
      </div>
    );
  }

  // Not authenticated -> show front login page
  if (!user) {
    return <Login />;
  }

  // Filtered aircraft cards
  const filteredAircraft = aircraftList.filter(ac => {
    const matchesFilter = statusFilter === 'all' || ac.status === statusFilter;
    const matchesSearch =
      ac.tail_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ac.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ac.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ac.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ac.serial_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-navy-950 bg-aviation-grid text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAddAircraft={() => setIsAddAircraftOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {currentTab === 'fleet' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Top Fleet Header & Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Fleet Airworthiness & Maintenance Hub
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-aero-500/20 text-aero-400 text-xs font-bold border border-aero-500/30">
                    Live Status
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Click on any aircraft widget card below to access maintenance logs, component overhauls, and airworthiness releases.
                </p>
              </div>

              {isStaff && (
                <button
                  onClick={() => setIsAddAircraftOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-aero-600 to-cyan-600 hover:from-aero-500 hover:to-cyan-500 text-white shadow-lg shadow-aero-600/25 transition-all cursor-pointer self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Aircraft to Fleet</span>
                </button>
              )}
            </div>

            {/* KPI Overview Tiles */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Total Fleet</span>
                    <Plane className="w-3.5 h-3.5 text-aero-400 -rotate-45" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white mt-1">
                    {stats.totalAircraft}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Active airframes</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Readiness</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                    {stats.fleetReadinessPercent}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Mission capable</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Operational</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white mt-1">
                    {stats.operationalAircraft}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Cleared for flight</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>In Maintenance</span>
                    <Wrench className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-purple-400 mt-1">
                    {stats.inMaintenance}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">In hangar bays</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Check Due / AOG</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                    {stats.inspectionDue + stats.grounded}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Require action</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Total Flight Hrs</span>
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white mt-1">
                    {Number(stats.totalHours).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Fleet log cumulative</div>
                </div>
              </div>
            )}

            {/* Filter and Search Toolbar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All Aircraft', count: aircraftList.length },
                  { id: 'operational', label: 'Operational', count: aircraftList.filter(a => a.status === 'operational').length },
                  { id: 'maintenance', label: 'In Maintenance', count: aircraftList.filter(a => a.status === 'maintenance').length },
                  { id: 'inspection_due', label: 'Inspection Due', count: aircraftList.filter(a => a.status === 'inspection_due').length },
                  { id: 'grounded', label: 'Grounded / AOG', count: aircraftList.filter(a => a.status === 'grounded').length }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setStatusFilter(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === item.id
                        ? 'bg-aero-600 text-white shadow-md shadow-aero-600/30'
                        : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tail #, model, MSN, hangar..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-aero-500 font-mono"
                />
              </div>
            </div>

            {/* Aircraft Cards Grid (The requested clickable widgets) */}
            {fleetLoading ? (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-aero-500 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-xs">Querying aircraft database records...</span>
              </div>
            ) : filteredAircraft.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-8">
                <Plane className="w-12 h-12 mx-auto text-slate-600 mb-3 -rotate-45" />
                <h3 className="font-bold text-white text-base">No aircraft found</h3>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your status filter or search parameters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAircraft.map(aircraft => (
                  <AircraftCard
                    key={aircraft.id}
                    aircraft={aircraft}
                    onClick={(ac) => setSelectedAircraftId(ac.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Maintenance Logs Tab */}
        {currentTab === 'logs' && (
          <MaintenanceLogsView
            onSelectAircraft={(id) => setSelectedAircraftId(id)}
          />
        )}

        {/* User Management Tab (Admin Only) */}
        {currentTab === 'users' && isAdmin && (
          <UserManagement />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-aero-400 -rotate-45" />
            <span className="font-bold text-slate-300">Nero Aero Systems</span>
            <span>• Aircraft Maintenance Record Keeping & Airworthiness Database</span>
          </div>
          <div className="font-mono text-[11px]">
            SQLite Persistent Database • Role-Based Access Control • Continuous Airworthiness
          </div>
        </div>
      </footer>

      {/* Selected Aircraft Detail Modal */}
      {selectedAircraftId && (
        <AircraftDetailModal
          aircraftId={selectedAircraftId}
          onClose={() => setSelectedAircraftId(null)}
          onRefreshFleet={fetchFleet}
        />
      )}

      {/* Register Aircraft Modal */}
      {isAddAircraftOpen && (
        <NewAircraftModal
          onClose={() => setIsAddAircraftOpen(false)}
          onSuccess={() => {
            setIsAddAircraftOpen(false);
            fetchFleet();
          }}
        />
      )}
    </div>
  );
}
