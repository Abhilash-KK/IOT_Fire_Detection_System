import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import StatusBanner from './components/StatusBanner';
import MetricsCards from './components/MetricsCards';
import TelemetryChart from './components/TelemetryChart';
import DeviceList from './components/DeviceList';
import ReadingsTable from './components/ReadingsTable';
import {
  fetchHealth,
  fetchStats,
  fetchLatestReading,
  fetchReadings,
  fetchDevices
} from './api';
import { Flame, ShieldAlert, Cpu } from 'lucide-react';

export default function App() {
  // State variables
  const [stats, setStats] = useState(null);
  const [latestReading, setLatestReading] = useState(null);
  const [historicalReadings, setHistoricalReadings] = useState([]);
  const [devices, setDevices] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  // Filters
  const [filterFlame, setFilterFlame] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Status & Polling
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const pollIntervalRef = useRef(null);

  // Core Data Fetcher
  const loadDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      // Parallel fetch for snappy real-time responsiveness
      const [healthData, statsData, latestData, devicesData] = await Promise.all([
        fetchHealth(),
        fetchStats(),
        fetchLatestReading(),
        fetchDevices()
      ]);

      setApiConnected(healthData.status === 'healthy');
      setStats(statsData);
      setLatestReading(latestData);
      setDevices(devicesData);
      setLastUpdated(new Date());
      setErrorMessage(null);
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
      setApiConnected(false);
      setErrorMessage(err.message || 'Failed to connect to backend API');
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  }, []);

  // Table Data Fetcher (depends on pagination and filter states)
  const loadTableData = useCallback(async () => {
    setIsTableLoading(true);
    try {
      const data = await fetchReadings({
        page,
        pageSize,
        deviceId: filterDevice,
        flameDetected: filterFlame,
        startDate,
        endDate
      });
      setHistoricalReadings(data.items || []);
      setTotalRecords(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Error fetching historical table records:', err);
    } finally {
      setIsTableLoading(false);
    }
  }, [page, pageSize, filterDevice, filterFlame, startDate, endDate]);

  // Initial load
  useEffect(() => {
    loadDashboardData(true);
    loadTableData();
  }, [loadDashboardData, loadTableData]);

  // Periodic polling hook (every 3 seconds)
  useEffect(() => {
    if (!isLivePolling) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      loadDashboardData(false);
      loadTableData();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isLivePolling, loadDashboardData, loadTableData]);

  const handleManualRefresh = () => {
    loadDashboardData(true);
    loadTableData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navigation & Status Bar */}
      <Header
        isLivePolling={isLivePolling}
        setIsLivePolling={setIsLivePolling}
        onRefresh={handleManualRefresh}
        lastUpdated={lastUpdated}
        apiConnected={apiConnected}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error notification banner if disconnected */}
        {!apiConnected && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>
                <strong>API Unreachable:</strong> Unable to connect to the backend at{' '}
                <code>{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</code>.
                Make sure the FastAPI server is running.
              </span>
            </div>
            <button
              onClick={handleManualRefresh}
              className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-medium px-3 py-1.5 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Primary Status Banner (Alert / Safe / Offline / No Data) */}
        <StatusBanner
          stats={stats}
          latestReading={latestReading}
          offlineThreshold={stats?.offline_threshold_seconds || 30}
        />

        {/* Metrics Overview Cards */}
        <MetricsCards stats={stats} />

        {/* Grid: Waveform Chart (2 cols) & Registered Nodes (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TelemetryChart readings={historicalReadings} />
          </div>
          <div className="lg:col-span-1">
            <DeviceList
              devices={devices}
              offlineThreshold={stats?.offline_threshold_seconds || 30}
            />
          </div>
        </div>

        {/* Historical Sensor Telemetry Log Table */}
        <ReadingsTable
          readings={historicalReadings}
          total={totalRecords}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          filterFlame={filterFlame}
          setFilterFlame={setFilterFlame}
          filterDevice={filterDevice}
          setFilterDevice={setFilterDevice}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          isLoading={isTableLoading}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            IoT Fire Detection System • MCA Capstone Project • ESP32 DevKit V1 + IR Optical Flame Sensor
          </p>
          <p className="font-mono text-slate-400">
            Backend: FastAPI + PostgreSQL • Frontend: React + Vite + Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
