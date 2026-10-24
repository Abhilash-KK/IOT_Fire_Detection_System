let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Handle cases where Render provides just the service name (e.g. "iot-fire-detection-backend")
if (rawUrl) {
  rawUrl = rawUrl.trim();
  rawUrl = rawUrl.replace(/\/+$/, '');

  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    if (!rawUrl.includes('.')) {
      rawUrl = `https://${rawUrl}.onrender.com`;
    } else {
      rawUrl = `https://${rawUrl}`;
    }
  }
}

const API_BASE_URL = rawUrl;

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
  endDate = '',
  includeSimulated = true
} = {}) {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('page_size', pageSize);
  if (deviceId) params.append('device_id', deviceId);
  if (flameDetected !== '') params.append('flame_detected', flameDetected);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  params.append('include_simulated', includeSimulated);

  const res = await fetch(`${API_BASE_URL}/api/readings?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch readings: ${res.statusText}`);
  return res.json();
}

export async function fetchDevices() {
  const res = await fetch(`${API_BASE_URL}/api/devices`);
  if (!res.ok) throw new Error(`Failed to fetch devices: ${res.statusText}`);
  return res.json();
}

export async function purgeReadings({ apiKey, simulatedOnly = true, deleteAll = false, deviceId = '' }) {
  const params = new URLSearchParams();
  params.append('simulated_only', simulatedOnly);
  params.append('delete_all', deleteAll);
  if (deviceId) params.append('device_id', deviceId);

  const res = await fetch(`${API_BASE_URL}/api/readings?${params.toString()}`, {
    method: 'DELETE',
    headers: {
      'X-API-Key': apiKey
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Delete failed: ${res.statusText}`);
  }
  return res.json();
}
