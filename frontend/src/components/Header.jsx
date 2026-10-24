import React from 'react';
import { Flame, RefreshCw, Radio, Server, AlertCircle } from 'lucide-react';

export default function Header({
  isLivePolling,
  setIsLivePolling,
  onRefresh,
  lastUpdated,
  apiConnected,
  isRefreshing
}) {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-4 sm:px-6 py-3.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Title & Branding */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                IoT Fire Detection System
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono">
                ESP32 DEVKIT V1
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              MCA IoT Capstone Dashboard • Active-LOW IR Optical Flame Telemetry
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Backend Connection Indicator */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              apiConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                apiConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span>API: {apiConnected ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Polling Switch */}
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              isLivePolling
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title="Toggle automatic periodic telemetry polling"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLivePolling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>Live Polling: {isLivePolling ? 'ON (3s)' : 'PAUSED'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shadow-2xs disabled:opacity-50"
            title="Fetch latest data immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          {/* Last sync time */}
          {lastUpdated && (
            <span className="text-xs text-slate-500 font-mono hidden xl:inline-block">
              Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
