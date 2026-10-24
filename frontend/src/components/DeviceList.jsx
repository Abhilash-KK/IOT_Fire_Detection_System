import React from 'react';
import { Cpu, Wifi, WifiOff, MapPin, Clock } from 'lucide-react';

export default function DeviceList({ devices = [], offlineThreshold = 30 }) {
  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleTimeString();
  };

  const activeCount = devices.filter((d) => d.is_online).length;

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">
              Registered ESP32 Nodes
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Threshold: {offlineThreshold}s timeout
          </span>
        </div>

        {devices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 rounded-lg">
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
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/90 text-xs space-y-2 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-1 rounded ${
                          isOnline
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {device.device_id}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                          isOnline
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-200/80 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                      {flameActive && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                          FLAME DETECTED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-[11px] text-slate-500 font-mono">
                    <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                    <span>{device.location || 'Main Lab / Station 1'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-200/70 pt-2">
                    <div className="text-slate-500">
                      <span>Last Seen: </span>
                      <strong className="text-slate-800">{formatTime(device.last_seen_at)}</strong>{' '}
                      <span className="text-slate-400">({device.seconds_since_last_seen}s ago)</span>
                    </div>

                    {latest && (
                      <div className="text-right">
                        <span className="text-slate-500">Latest Pin: </span>
                        <span className={latest.flame_detected ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                          GPIO27 = {latest.sensor_value} ({latest.flame_detected ? 'LOW: Flame' : 'HIGH: Safe'})
                        </span>
                        {latest.rssi && (
                          <span className="ml-2 text-sky-600">
                            RSSI: {latest.rssi} dBm
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs font-mono border-t border-slate-100 pt-3 mt-3">
        <span className="text-slate-500">Active Nodes: {activeCount}</span>
        <span className="text-emerald-600 font-semibold">Auto-recon heartbeat ON</span>
      </div>
    </div>
  );
}
