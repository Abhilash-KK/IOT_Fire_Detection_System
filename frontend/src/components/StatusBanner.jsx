import React from 'react';
import { AlertTriangle, ShieldCheck, WifiOff, Clock, Cpu, Signal, HelpCircle } from 'lucide-react';

export default function StatusBanner({ stats, latestReading, offlineThreshold = 30 }) {
  const currentStatus = stats?.current_system_status || 'NO_DATA';

  const getRelativeTime = (isoString) => {
    if (!isoString) return 'No communications received yet';
    const seconds = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (seconds < 5) return 'Just now (< 5s ago)';
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ${seconds % 60}s ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  // State 1: FLAME DETECTED - Crisp Red Alert Banner
  if (currentStatus === 'ALERT') {
    return (
      <div className="rounded-2xl bg-rose-50/70 border-2 border-rose-400 p-6 sm:p-7 shadow-sm transition-all duration-300">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-rose-600 text-white rounded-xl shadow-md flex-shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold tracking-widest uppercase mb-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>CRITICAL FIRE WARNING</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                FLAME DETECTED!
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-700 max-w-2xl leading-relaxed">
                The optical IR flame sensor detected infrared radiation from an active flame or heat source.
                ESP32 hardware triggered GPIO26 RED LED (ON) and GPIO25 GREEN LED (OFF).
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto bg-white border border-rose-200 rounded-xl p-4 flex flex-col gap-2 text-xs font-mono text-slate-700 min-w-[280px] shadow-2xs">
            <div className="flex items-center justify-between border-b border-rose-100 pb-1.5">
              <span className="text-slate-500 font-sans">Last Known Device:</span>
              <span className="font-bold text-slate-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {latestReading?.device_id || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-rose-100 pb-1.5">
              <span className="text-slate-500 font-sans">Sensor Pin Logic:</span>
              <span className="font-bold text-rose-600">
                GPIO27 = {latestReading?.sensor_value ?? 0} (LOW: Flame)
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-rose-100 pb-1.5">
              <span className="text-slate-500 font-sans">Wi-Fi RSSI:</span>
              <span className="text-slate-900">
                {latestReading?.rssi ? `${latestReading.rssi} dBm` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-slate-500 font-sans">Last Heartbeat:</span>
              <span className="text-rose-600 font-bold">
                {getRelativeTime(latestReading?.received_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: OFFLINE - Amber Disconnection Panel (Matching User's Screenshot Exactly)
  if (currentStatus === 'OFFLINE') {
    return (
      <div className="rounded-2xl bg-amber-50/40 border border-amber-300 p-6 sm:p-7 shadow-2xs transition-all duration-300">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-amber-500 text-white rounded-xl shadow-xs flex-shrink-0">
              <WifiOff className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-[11px] font-bold tracking-widest uppercase mb-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>DEVICE DISCONNECTED • CAUTION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                SENSOR OFFLINE (NO SIGNAL)
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                No telemetry ping received within the threshold ({offlineThreshold}s). The system cannot verify current fire status.
                <span className="block mt-1 text-slate-700">
                  <strong className="text-rose-600 font-semibold">Missing readings are NOT treated as a safe condition.</strong> Check ESP32 power, Wi-Fi connection, or serial monitor.
                </span>
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto bg-white border border-amber-200/80 rounded-xl p-4 flex flex-col gap-2 text-xs font-mono text-slate-700 min-w-[300px] shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-sans">Last Known Device:</span>
              <span className="font-bold text-slate-900">
                {latestReading?.device_id || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-sans">Last Heartbeat:</span>
              <span className="font-bold text-rose-600">
                {getRelativeTime(latestReading?.received_at)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-slate-500 font-sans">Offline Threshold:</span>
              <span className="font-bold text-slate-900">{offlineThreshold} seconds</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 3: SAFE - Emerald All Clear Panel
  if (currentStatus === 'SAFE') {
    return (
      <div className="rounded-2xl bg-emerald-50/50 border border-emerald-300 p-6 sm:p-7 shadow-2xs transition-all duration-300">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-emerald-600 text-white rounded-xl shadow-xs flex-shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-[11px] font-bold tracking-widest uppercase mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>SYSTEM ARMED • NORMAL OPERATION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                NO FLAME DETECTED
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                The optical flame sensor reports normal environment conditions. ESP32 hardware status:
                GPIO25 GREEN LED is ON (Safe), GPIO26 RED LED is OFF. Continuous telemetry monitoring active.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto bg-white border border-emerald-200/80 rounded-xl p-4 flex flex-col gap-2 text-xs font-mono text-slate-700 min-w-[300px] shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-sans">Active Device:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {latestReading?.device_id || 'ESP32'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-sans">Digital Reading:</span>
              <span className="font-bold text-emerald-600">
                GPIO27 = {latestReading?.sensor_value ?? 1} (HIGH: Safe)
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-sans">Wi-Fi RSSI:</span>
              <span className="text-slate-900">
                {latestReading?.rssi ? `${latestReading.rssi} dBm` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-slate-500 font-sans">Last Reading:</span>
              <span className="font-bold text-emerald-700">
                {getRelativeTime(latestReading?.received_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 4: NO_DATA - Initial Awaiting State
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="p-3.5 bg-slate-100 text-slate-500 rounded-xl shadow-inner border border-slate-200">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold uppercase mb-1.5">
              <span>AWAITING TELEMETRY</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Awaiting First ESP32 Sensor Reading
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              The database currently contains no sensor readings. Flash the ESP32 with your sketch or
              run the test simulator script to send initial telemetry.
            </p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 font-mono">
          python tests/simulate_device.py --trigger-safe
        </div>
      </div>
    </div>
  );
}
