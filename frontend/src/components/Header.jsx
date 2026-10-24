import React from 'react';
import { Flame, RefreshCw, Radio, Server, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Header({
  isLivePolling,
  setIsLivePolling,
  onRefresh,
  lastUpdated,
  apiConnected,
  isRefreshing
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Title & Branding */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 shadow-inner">
            <Flame className="w-7 h-7 animate-pulse text-rose-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                IoT Fire Detection System
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                ESP32 DevKit V1
              </span>
            </div>
            <p className="text-xs text-slate-400">
              MCA IoT Capstone Dashboard • Active-LOW IR Optical Flame Telemetry
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Backend Connection Indicator */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              apiConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {apiConnected ? (
              <Server className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>API: {apiConnected ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Polling Switch */}
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isLivePolling
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700/50'
            }`}
            title="Toggle automatic periodic telemetry polling"
          >
            <Radio className={`w-3.5 h-3.5 ${isLivePolling ? 'animate-pulse text-blue-400' : 'text-slate-500'}`} />
            <span>Live Polling: {isLivePolling ? 'ON (3s)' : 'PAUSED'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Fetch latest data immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          {/* Last sync time */}
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 hidden xl:inline-block">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
