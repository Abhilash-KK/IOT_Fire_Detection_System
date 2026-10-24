import React from 'react';
import { History, Filter, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Cpu, Tag } from 'lucide-react';

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
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isLoading
}) {
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

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm space-y-4">
      {/* Table Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Historical Sensor Telemetry Log
          </h3>
          <span className="text-xs text-slate-400">
            ({total} total records)
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Flame Status Filter */}
          <select
            value={filterFlame}
            onChange={(e) => {
              setFilterFlame(e.target.value);
              onPageChange(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Readings</option>
            <option value="true">Flame Detected Only</option>
            <option value="false">Safe (No Flame) Only</option>
          </select>

          {/* Device ID Filter */}
          <input
            type="text"
            placeholder="Filter device ID..."
            value={filterDevice}
            onChange={(e) => {
              setFilterDevice(e.target.value);
              onPageChange(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none w-36"
          />

          {/* Date range filters */}
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              onPageChange(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            title="Filter Start Date"
          />
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              onPageChange(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            title="Filter End Date"
          />

          {(filterFlame !== '' || filterDevice !== '' || startDate || endDate) && (
            <button
              onClick={() => {
                setFilterFlame('');
                setFilterDevice('');
                setStartDate('');
                setEndDate('');
                onPageChange(1);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-medium px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase font-semibold text-slate-400 border-b border-slate-800">
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
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                  <div className="inline-flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    <span>Loading telemetry records...</span>
                  </div>
                </td>
              </tr>
            ) : readings.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                  No records matching the selected filters.
                </td>
              </tr>
            ) : (
              readings.map((reading) => {
                const isFlame = reading.flame_detected;
                return (
                  <tr
                    key={reading.id}
                    className={`transition hover:bg-slate-800/40 ${
                      isFlame ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-400">
                      #{reading.id}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-sans">
                      {formatDateTime(reading.received_at)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {reading.device_id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          reading.sensor_value === 0
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        GPIO27 = {reading.sensor_value} ({reading.sensor_value === 0 ? 'LOW' : 'HIGH'})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      {isFlame ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          FLAME DETECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          NO FLAME
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {reading.rssi ? `${reading.rssi} dBm` : '—'}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      {reading.is_simulated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          <Tag className="w-3 h-3" />
                          Simulated Test
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-950 text-teal-300 border border-teal-800">
                          <Cpu className="w-3 h-3" />
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div>
          Showing page <span className="font-semibold text-white">{page}</span> of{' '}
          <span className="font-semibold text-white">{totalPages}</span> ({total} items)
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
