import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { Activity } from 'lucide-react';

export default function TelemetryChart({ readings = [] }) {
  // Format the last 20 readings chronologically (oldest to newest)
  const chartData = [...readings]
    .slice(0, 30)
    .reverse()
    .map((r) => {
      const timeStr = r.received_at
        ? new Date(r.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '';
      return {
        time: timeStr,
        flameValue: r.flame_detected ? 1 : 0,
        sensorDigital: r.sensor_value, // 0 = Flame, 1 = Safe
        rssi: r.rssi ?? -70,
        statusLabel: r.flame_detected ? 'FLAME DETECTED' : 'SAFE',
        deviceId: r.device_id
      };
    });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
            Timestamp: {data.time}
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Status:</span>
            <span
              className={`font-bold ${
                data.flameValue === 1 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {data.statusLabel}
            </span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Digital Pin Value:</span>
            <span className="font-mono text-slate-200">{data.sensorDigital}</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Wi-Fi RSSI:</span>
            <span className="font-mono text-cyan-400">{data.rssi} dBm</span>
          </p>
          <p className="flex items-center justify-between gap-4 text-[10px] text-slate-400">
            <span>Device:</span>
            <span>{data.deviceId}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Real-Time Flame & Sensor Waveform
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Showing last {chartData.length} telemetry samples
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
          <p>No telemetry recorded yet to plot waveform</p>
          <span className="text-xs text-slate-600 mt-1">
            Data will appear here as soon as the ESP32 posts readings
          </span>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="flameGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="safeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis
                domain={[0, 1.2]}
                ticks={[0, 1]}
                tickFormatter={(val) => (val === 1 ? 'FLAME' : 'SAFE')}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(val) => (
                  <span className="text-xs text-slate-300">
                    {val === 'flameValue' ? 'Flame Alert (1 = Detected)' : 'Sensor Pin (0 = LOW Flame)'}
                  </span>
                )}
              />
              <Area
                type="stepAfter"
                dataKey="flameValue"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#flameGradient)"
                name="flameValue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
