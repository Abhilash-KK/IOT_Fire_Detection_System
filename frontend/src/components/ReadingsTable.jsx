import React from 'react';
import { History, Filter, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Cpu, Tag, Search } from 'lucide-react';

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
    <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Table Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
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
              <option value="">All Readings</option>
              <option value="true">Flame Detected Only</option>
              <option value="false">Safe (No Flame) Only</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

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
              className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg pl-7 pr-3 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none w-38 shadow-2xs font-mono"
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

          {(filterFlame !== '' || filterDevice !== '' || startDate || endDate) && (
            <button
              onClick={() => {
                setFilterFlame('');
                setFilterDevice('');
                setStartDate('');
                setEndDate('');
                onPageChange(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg"
            >
              Clear
            </button>
          )}
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

      {/* Pagination Footer Matching Screenshot */}
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
    </div>
  );
}
