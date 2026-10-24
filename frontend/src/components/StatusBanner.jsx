import React from 'react';
import { AlertTriangle, ShieldCheck, WifiOff, Clock, Cpu, Signal, HelpCircle } from 'lucide-react';

export default function StatusBanner({ stats, latestReading, offlineThreshold = 30 }) {
  const currentStatus = stats?.current_system_status || 'NO_DATA';
  const hasReading = Boolean(latestReading);

  // Formatter for timestamp
  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return 'No communications received yet';
    const seconds = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (seconds < 5) return 'Just now (< 5s ago)';
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ${seconds % 60}s ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  // State 1: FLAME DETECTED - Large Red Alert Banner
  if (currentStatus === 'ALERT') {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-2 border-rose-500 p-6 sm:p-8 shadow-2xl shadow-rose-950/60 relative overflow-hidden animate-pulse">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-5">
            <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg ring-4 ring-rose-500/30 flex-shrink-0 animate-bounce">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400 text-rose-200 text-xs font-bold tracking-widest uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span>CRITICAL FIRE WARNING</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                FLAME DETECTED!
              </h2>
              <p className="mt-2 text-sm sm:text-base text-rose-100/90 max-w-2xl">
                The optical IR flame sensor detected infrared radiation from an active flame or heat source.
                ESP32 hardware triggered GPIO26 RED LED (ON) and GPIO25 GREEN LED (OFF).
              </p>
            </div>
          </div>

          {/* Quick telemetry badge */}
          <div className="w-full lg:w-auto bg-black/40 backdrop-blur-sm border border-rose-500/40 rounded-xl p-4 sm:p-5 flex flex-col gap-2.5 text-xs text-rose-100 min-w-[280px]">
            <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
              <span className="text-rose-300 flex items-center gap-1.5 font-medium">
                <Cpu className="w-4 h-4 text-rose-300" /> Device ID:
              </span>
              <span className="font-mono font-bold text-white bg-rose-950 px-2 py-0.5 rounded border border-rose-700">
                {latestReading?.device_id || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
              <span className="text-rose-300 font-medium">Sensor Pin Logic:</span>
              <span className="font-mono font-bold text-rose-200">
                LOW (Value: {latestReading?.sensor_value ?? 0})
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
              <span className="text-rose-300 flex items-center gap-1.5 font-medium">
                <Signal className="w-4 h-4 text-rose-300" /> Wi-Fi RSSI:
              </span>
              <span className="font-mono text-white">
                {latestReading?.rssi ? `${latestReading.rssi} dBm` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-rose-300 flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-rose-300" /> Detected At:
              </span>
              <span className="font-mono text-white text-right">
                {getRelativeTime(latestReading?.received_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: OFFLINE - Explicit Disconnection Warning Panel
  // Per requirement: "Distinguish clearly between a disconnected device and a device reporting no flame. Do not treat missing readings as a safe condition."
  if (currentStatus === 'OFFLINE') {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-amber-950 via-yellow-950 to-amber-950 border-2 border-amber-500 p-6 sm:p-8 shadow-xl shadow-amber-950/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-5">
            <div className="p-4 bg-amber-600 text-white rounded-2xl shadow-lg ring-4 ring-amber-500/30 flex-shrink-0">
              <WifiOff className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-200 text-xs font-bold tracking-widest uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>DEVICE DISCONNECTED • CAUTION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                SENSOR OFFLINE (NO SIGNAL)
              </h2>
              <p className="mt-2 text-sm sm:text-base text-amber-100/90 max-w-2xl">
                No telemetry ping received within the threshold ({offlineThreshold}s). The system cannot verify current fire status.
                <strong className="block text-amber-300 font-semibold mt-1">
                  Missing readings are NOT treated as a safe condition. Check ESP32 power, Wi-Fi connection, or serial monitor.
                </strong>
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto bg-black/40 backdrop-blur-sm border border-amber-500/40 rounded-xl p-4 sm:p-5 flex flex-col gap-2.5 text-xs text-amber-100 min-w-[280px]">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
              <span className="text-amber-300 font-medium">Last Known Device:</span>
              <span className="font-mono text-white">{latestReading?.device_id || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
              <span className="text-amber-300 font-medium">Last Heartbeat:</span>
              <span className="font-mono text-white">{getRelativeTime(latestReading?.received_at)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-amber-300 font-medium">Offline Threshold:</span>
              <span className="font-mono text-amber-300">{offlineThreshold} seconds</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 3: SAFE - Green All Clear Panel
  if (currentStatus === 'SAFE') {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/80 p-6 sm:p-8 shadow-xl shadow-emerald-950/40 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-5">
            <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg ring-4 ring-emerald-500/20 flex-shrink-0">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-bold tracking-widest uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>SYSTEM ARMED • NORMAL OPERATION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                NO FLAME DETECTED
              </h2>
              <p className="mt-2 text-sm sm:text-base text-emerald-100/90 max-w-2xl">
                The optical flame sensor reports normal environment conditions. ESP32 hardware status:
                GPIO25 GREEN LED is ON (Safe), GPIO26 RED LED is OFF. Continuous telemetry monitoring active.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto bg-black/40 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4 sm:p-5 flex flex-col gap-2.5 text-xs text-emerald-100 min-w-[280px]">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-emerald-300 flex items-center gap-1.5 font-medium">
                <Cpu className="w-4 h-4 text-emerald-300" /> Active Device:
              </span>
              <span className="font-mono font-bold text-white bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                {latestReading?.device_id || 'ESP32'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-emerald-300 font-medium">Digital Reading:</span>
              <span className="font-mono font-bold text-emerald-300">
                HIGH (Value: {latestReading?.sensor_value ?? 1})
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-emerald-300 flex items-center gap-1.5 font-medium">
                <Signal className="w-4 h-4 text-emerald-300" /> Wi-Fi RSSI:
              </span>
              <span className="font-mono text-white">
                {latestReading?.rssi ? `${latestReading.rssi} dBm` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-emerald-300 flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-emerald-300" /> Last Reading:
              </span>
              <span className="font-mono text-white text-right">
                {getRelativeTime(latestReading?.received_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 4: NO_DATA - Fresh Installation / Waiting for First Ping
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start space-x-5">
          <div className="p-4 bg-slate-800 text-slate-300 rounded-2xl shadow-inner border border-slate-700">
            <HelpCircle className="w-10 h-10" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold uppercase mb-2">
              <span>AWAITING TELEMETRY</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Awaiting First ESP32 Sensor Reading
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              The database currently contains no sensor readings. Flash the ESP32 with your sketch or
              run the test simulator script to send initial telemetry.
            </p>
          </div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 font-mono">
          python tests/simulate_device.py --trigger-safe
        </div>
      </div>
    </div>
  );
}
