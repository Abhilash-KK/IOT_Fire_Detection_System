import React from 'react';
import { Database, Flame, CheckCircle, Radio, Clock, ShieldAlert } from 'lucide-react';

export default function MetricsCards({ stats }) {
  const totalReadings = stats?.total_readings ?? 0;
  const flameEvents = stats?.flame_events ?? 0;
  const normalEvents = stats?.normal_events ?? 0;
  const activeOnline = stats?.active_devices_online ?? 0;
  const totalDevices = stats?.total_devices ?? 0;
  const flameEvents24h = stats?.flame_events24h ?? 0;

  const cards = [
    {
      title: 'Total Telemetry Packets',
      value: totalReadings.toLocaleString(),
      subtext: 'Ingested into PostgreSQL',
      icon: Database,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      title: 'Flame Events Triggered',
      value: flameEvents.toLocaleString(),
      subtext: flameEvents > 0 ? `${flameEvents24h} in past 24 hours` : 'Zero alarms recorded',
      icon: Flame,
      iconColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      highlight: flameEvents > 0
    },
    {
      title: 'Normal (Safe) Packets',
      value: normalEvents.toLocaleString(),
      subtext: 'Active-LOW HIGH logic verified',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Online ESP32 Nodes',
      value: `${activeOnline} / ${totalDevices}`,
      subtext: activeOnline > 0 ? 'Heartbeat active (< 30s)' : 'All devices offline',
      icon: Radio,
      iconColor: activeOnline > 0 ? 'text-emerald-400' : 'text-amber-400',
      bgColor: activeOnline > 0 ? 'bg-emerald-500/10' : 'bg-amber-500/10',
      borderColor: activeOnline > 0 ? 'border-emerald-500/20' : 'border-amber-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`rounded-xl bg-slate-900/90 border ${card.borderColor} p-5 shadow-sm relative overflow-hidden transition hover:border-slate-700`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.iconColor}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {card.value}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
