import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Activity } from 'lucide-react';

export default function TelemetryChart({ readings = [] }) {
  // Format the last 15-20 readings chronologically
  const chartData = [...readings]
    .slice(0, 20)
    .reverse()
    .map((r) => {
      const timeStr = r.received_at
        ? new Date(r.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '';
      return {
        time: timeStr,
        flameValue: r.flame_detected ? 1 : 0,
        sensorDigital: r.sensor_value,
        rssi: r.rssi ?? -65,
        statusLabel: r.flame_detected ? 'FLAME DETECTED' : 'SAFE',
        deviceId: r.device_id
      };
    });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md text-xs space-y-1 font-mono">
          <p className="font-semibold text-slate-900 border-b border-slate-100 pb-1 font-sans">
            Timestamp: {data.time}
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Detection Status:</span>
            <span
              className={`font-bold ${
                data.flameValue === 1 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {data.statusLabel}
            </span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Digital Pin:</span>
            <span className="text-slate-900 font-bold">GPIO27 = {data.sensorDigital}</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Wi-Fi RSSI:</span>
            <span className="text-slate-700">{data.rssi} dBm</span>
          </p>
          <p className="flex items-center justify-between gap-4 text-[11px] text-slate-400">
            <span>Device:</span>
            <span>{data.deviceId}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 tracking-wide">
            Real-Time Flame & Sensor Waveform
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-500 font-mono">
            Showing last {chartData.length} telemetry samples
          </span>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Flame Alert (1 = Detected)</span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 rounded-lg">
          <p>No telemetry recorded yet to plot waveform</p>
          <span className="text-[11px] text-slate-400 mt-1">
            Data will appear here as soon as the ESP32 posts readings
          </span>
        </div>
      ) : (
        <div className="h-64 w-full relative">
          {/* Overlay state labels matching the screenshot */}
          <div className="absolute top-4 left-2 z-10">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
              FLAME (HIGH)
            </span>
          </div>
          <div className="absolute top-4 right-1/4 z-10 hidden sm:block">
            <span className="text-[11px] font-mono text-slate-400">
              Digital Logic = 0 (Active-LOW Inverted)
            </span>
          </div>
          <div className="absolute bottom-8 left-2 z-10">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              SAFE (NORMAL)
            </span>
          </div>
          <div className="absolute bottom-8 right-2 z-10 hidden sm:block">
            <span className="text-[11px] font-mono text-slate-400">
              IR Sensor Idle
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="lightFlameGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
              />
              <YAxis
                domain={[0, 1.2]}
                ticks={[0, 1]}
                tickFormatter={(val) => (val === 1 ? '1' : '0')}
                stroke="#94a3b8"
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="stepAfter"
                dataKey="flameValue"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#lightFlameGradient)"
                dot={{ r: 3, fill: '#ef4444', strokeWidth: 1, stroke: '#fff' }}
                activeDot={{ r: 5, fill: '#ef4444' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
