import React from 'react';
import { Cpu, Wifi, WifiOff, MapPin, Clock, CircleDot } from 'lucide-react';

export default function DeviceList({ devices = [], offlineThreshold = 30 }) {
  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleTimeString();
  };

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Registered ESP32 Nodes
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Threshold: {offlineThreshold}s timeout
        </span>
      </div>

      {devices.length === 0 ? (
        <div className="p-6 text-center text-slate-500 text-xs">
          No ESP32 nodes registered yet.
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => {
            const isOnline = device.is_online;
            const latest = device.latest_reading;
            const flameActive = latest?.flame_detected;

            return (
              <div
                key={device.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition gap-3"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-white">
                        {device.device_id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isOnline
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                      {flameActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                          FLAME DETECTED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {device.location || 'Station 1'}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Last Seen: {formatTime(device.last_seen_at)} ({device.seconds_since_last_seen}s ago)
                      </span>
                    </div>
                  </div>
                </div>

                {latest && (
                  <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4 flex sm:flex-col items-center sm:items-end justify-between text-xs">
                    <span className="text-slate-400">Latest Pin State:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      GPIO27 = {latest.sensor_value} ({latest.flame_detected ? 'LOW: Flame' : 'HIGH: Safe'})
                    </span>
                    {latest.rssi && (
                      <span className="text-[11px] text-cyan-400 font-mono">
                        RSSI: {latest.rssi} dBm
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
