import React, { useState } from 'react';
import {
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Tag,
  Search,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';
import { purgeReadings } from '../api';

export default function ReadingsTable({
  readings = [],
  total = 0,
  page = 1,
  pageSize = 15,
  totalPages = 1,
  onPageChange,
  filterFlame,
  setFilterFlame,
  filterDevice,
  setFilterDevice,
  filterSource,
  setFilterSource,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isLoading,
  onDataPurged
}) {
  // Purge Modal State
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeTarget, setPurgeTarget] = useState('simulated'); // 'simulated' | 'all'
  const [adminApiKey, setAdminApiKey] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [purgeError, setPurgeError] = useState(null);
  const [purgeSuccess, setPurgeSuccess] = useState(null);

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleExecutePurge = async (e) => {
    e.preventDefault();
    if (!adminApiKey.trim()) {
      setPurgeError('Please enter your DEVICE_API_KEY to authorize deletion.');
      return;
    }

    setIsPurging(true);
    setPurgeError(null);
    setPurgeSuccess(null);

    try {
      const res = await purgeReadings({
        apiKey: adminApiKey.trim(),
        simulatedOnly: purgeTarget === 'simulated',
        deleteAll: purgeTarget === 'all'
      });
      setPurgeSuccess(res.message || 'Records successfully purged.');
      if (onDataPurged) onDataPurged();
      setTimeout(() => {
        setShowPurgeModal(false);
        setPurgeSuccess(null);
        setAdminApiKey('');
      }, 1500);
    } catch (err) {
      setPurgeError(err.message || 'Failed to purge records. Verify your API key.');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-2xs space-y-4 relative">
      {/* Table Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">
              Historical Sensor Telemetry Log
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {total} total records verified in database
            </span>
          </div>
        </div>

        {/* Filters Matching the Clean White Look */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Flame Status Dropdown */}
          <div className="relative">
            <select
              value={filterFlame}
              onChange={(e) => {
                setFilterFlame(e.target.value);
                onPageChange(1);
              }}
              className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg pl-7 pr-3 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-2xs font-mono"
            >
              <option value="">All Statuses</option>
              <option value="true">Flame Detected</option>
              <option value="false">Safe (No Flame)</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Telemetry Source Dropdown (Instant filter between Physical and Simulated) */}
          <select
            value={filterSource}
            onChange={(e) => {
              setFilterSource(e.target.value);
              onPageChange(1);
            }}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-2xs font-mono font-medium"
          >
            <option value="">All Sources</option>
            <option value="physical">Physical ESP32 Only</option>
            <option value="simulated">Simulated Only</option>
          </select>

          {/* Device ID Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter device ID..."
              value={filterDevice}
              onChange={(e) => {
                setFilterDevice(e.target.value);
                onPageChange(1);
              }}
              className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg pl-7 pr-3 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none w-36 shadow-2xs font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Date range filters */}
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              onPageChange(1);
            }}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-2xs font-mono"
            title="Filter Start Date"
          />
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              onPageChange(1);
            }}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-2xs font-mono"
            title="Filter End Date"
          />

          {/* Clear Filters Button */}
          {(filterFlame !== '' || filterDevice !== '' || filterSource !== '' || startDate || endDate) && (
            <button
              onClick={() => {
                setFilterFlame('');
                setFilterDevice('');
                setFilterSource('');
                setStartDate('');
                setEndDate('');
                onPageChange(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg"
            >
              Clear
            </button>
          )}

          {/* Purge / Delete Button */}
          <button
            onClick={() => setShowPurgeModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition shadow-2xs"
            title="Purge unwanted history logs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Purge Logs</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700 font-mono">
          <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200 text-[11px] tracking-wider font-sans">
            <tr>
              <th scope="col" className="px-4 py-3">Packet ID</th>
              <th scope="col" className="px-4 py-3">Timestamp (Server UTC)</th>
              <th scope="col" className="px-4 py-3">Device ID</th>
              <th scope="col" className="px-4 py-3">Digital Reading</th>
              <th scope="col" className="px-4 py-3">Detection Status</th>
              <th scope="col" className="px-4 py-3">Wi-Fi RSSI</th>
              <th scope="col" className="px-4 py-3">Source Origin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-400 font-sans">
                  <div className="inline-flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                    <span>Loading telemetry records...</span>
                  </div>
                </td>
              </tr>
            ) : readings.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-400 font-sans">
                  No records matching the selected filters.
                </td>
              </tr>
            ) : (
              readings.map((reading) => {
                const isFlame = reading.flame_detected;
                return (
                  <tr
                    key={reading.id}
                    className={`transition-colors ${
                      isFlame
                        ? 'bg-rose-50/70 hover:bg-rose-100/60'
                        : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    <td className={`px-4 py-3 ${isFlame ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      #{reading.id}
                    </td>
                    <td className={`px-4 py-3 font-sans text-xs ${isFlame ? 'text-rose-900 font-semibold' : 'text-slate-600'}`}>
                      {formatDateTime(reading.received_at)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {reading.device_id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                          reading.sensor_value === 0
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        GPIO27 = {reading.sensor_value} ({reading.sensor_value === 0 ? 'LOW' : 'HIGH'})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      {isFlame ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-2xs">
                          <AlertTriangle className="w-3 h-3 text-white" />
                          FLAME DETECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          NO FLAME
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {reading.rssi ? `${reading.rssi} dBm` : '—'}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      {reading.is_simulated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-400" />
                          Simulated Test
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Cpu className="w-3 h-3 text-emerald-600" />
                          Physical ESP32
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-mono text-slate-500">
        <div>
          Showing page <strong className="text-slate-900">{page}</strong> of{' '}
          <strong className="text-slate-900">{totalPages}</strong> ({total} items)
        </div>
        <div className="flex items-center space-x-2 font-sans font-medium">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 disabled:opacity-40 disabled:hover:bg-white transition shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 disabled:opacity-40 disabled:hover:bg-white transition shadow-2xs"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Purge Modal Dialog */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative font-sans space-y-4">
            <button
              onClick={() => setShowPurgeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Purge Telemetry History
                </h3>
                <p className="text-xs text-slate-500">
                  Safely remove unwanted records from the database
                </p>
              </div>
            </div>

            <form onSubmit={handleExecutePurge} className="space-y-4 text-xs">
              {/* Radio options */}
              <div className="space-y-2">
                <label className="flex items-start space-x-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="purgeTarget"
                    value="simulated"
                    checked={purgeTarget === 'simulated'}
                    onChange={(e) => setPurgeTarget(e.target.value)}
                    className="mt-0.5 text-emerald-600"
                  />
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      Delete Simulated Test Logs Only
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                      Removes virtual simulator data and cleans the simulated node, keeping your real physical ESP32 data completely safe.
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-3 rounded-lg border border-rose-200 hover:bg-rose-50/50 cursor-pointer">
                  <input
                    type="radio"
                    name="purgeTarget"
                    value="all"
                    checked={purgeTarget === 'all'}
                    onChange={(e) => setPurgeTarget(e.target.value)}
                    className="mt-0.5 text-rose-600"
                  />
                  <div>
                    <strong className="text-rose-700 block font-semibold">
                      Reset Entire History (All Records)
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                      Completely empties telemetry history to start fresh for a final viva or classroom demonstration.
                    </span>
                  </div>
                </label>
              </div>

              {/* API Key authorization input */}
              <div className="space-y-1">
                <label className="block text-slate-700 font-semibold text-[11px]">
                  Authorize with DEVICE_API_KEY:
                </label>
                <input
                  type="password"
                  value={adminApiKey}
                  onChange={(e) => setAdminApiKey(e.target.value)}
                  placeholder="Paste your Render DEVICE_API_KEY..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {purgeError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{purgeError}</span>
                </div>
              )}

              {purgeSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{purgeSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurgeModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPurging}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition disabled:opacity-50"
                >
                  {isPurging ? 'Deleting...' : 'Confirm Purge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
