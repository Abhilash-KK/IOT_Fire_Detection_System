import React from 'react';
import { Database, Flame, CheckCircle2, Wifi } from 'lucide-react';

export default function MetricsCards({ stats }) {
  const totalReadings = stats?.total_readings ?? 0;
  const flameEvents = stats?.flame_events ?? 0;
  const normalEvents = stats?.normal_events ?? 0;
  const activeOnline = stats?.active_devices_online ?? 0;
  const totalDevices = stats?.total_devices ?? 0;
  const flameEvents24h = stats?.flame_events24h ?? 0;

  const cards = [
    {
      title: 'TOTAL TELEMETRY PACKETS',
      value: totalReadings.toLocaleString(),
      valueColor: 'text-slate-900',
      subtext: 'Ingested into PostgreSQL',
      subtextColor: 'text-slate-500',
      icon: Database,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'FLAME EVENTS TRIGGERED',
      value: flameEvents.toLocaleString(),
      valueColor: flameEvents > 0 ? 'text-rose-600' : 'text-slate-900',
      subtext: flameEvents > 0 ? `${flameEvents24h} in past 24 hours` : 'Zero alarms recorded',
      subtextColor: 'text-slate-500',
      icon: Flame,
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200'
    },
    {
      title: 'NORMAL (SAFE) PACKETS',
      value: normalEvents.toLocaleString(),
      valueColor: 'text-emerald-600',
      subtext: 'Active-LOW HIGH logic verified',
      subtextColor: 'text-slate-500',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'ONLINE ESP32 NODES',
      value: (
        <span>
          {activeOnline}{' '}
          <span className="text-xl font-normal text-slate-400">/ {totalDevices}</span>
        </span>
      ),
      valueColor: 'text-slate-900',
      subtext: activeOnline > 0 ? 'Heartbeat active (< 30s)' : 'All devices offline',
      subtextColor: activeOnline > 0 ? 'text-emerald-600' : 'text-rose-600 font-medium',
      icon: Wifi,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="rounded-xl bg-white border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase font-mono">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgColor} ${card.iconColor} border ${card.borderColor}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline">
              <span className={`text-3xl font-extrabold tracking-tight ${card.valueColor}`}>
                {card.value}
              </span>
            </div>
            <p className={`mt-1 text-xs font-mono ${card.subtextColor}`}>
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
