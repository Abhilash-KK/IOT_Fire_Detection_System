const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE_URL}/api/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`);
  return res.json();
}

export async function fetchLatestReading() {
  const res = await fetch(`${API_BASE_URL}/api/readings/latest`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch latest reading: ${res.statusText}`);
  return res.json();
}

export async function fetchReadings({
  page = 1,
  pageSize = 15,
  deviceId = '',
  flameDetected = '',
  startDate = '',
  endDate = ''
} = {}) {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('page_size', pageSize);
  if (deviceId) params.append('device_id', deviceId);
  if (flameDetected !== '') params.append('flame_detected', flameDetected);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const res = await fetch(`${API_BASE_URL}/api/readings?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch readings: ${res.statusText}`);
  return res.json();
}

export async function fetchDevices() {
  const res = await fetch(`${API_BASE_URL}/api/devices`);
  if (!res.ok) throw new Error(`Failed to fetch devices: ${res.statusText}`);
  return res.json();
}
