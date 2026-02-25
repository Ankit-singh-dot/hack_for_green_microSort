'use client';
import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Leaf, Truck, AlertTriangle, Shield, TrendingDown, Zap, MapPin, Clock } from 'lucide-react';

interface AQIData {
  city: string;
  aqi: number;
  pm25: number;
  pm10: number;
  temp: number;
  humidity: number;
  windSpeed: number;
  dominantPollutant: string;
  status: string;
  weatherCondition: string;
  feelsLike: number;
}

interface DashboardData {
  kpis: {
    totalCo2: number;
    avgCo2PerKm: number;
    activeVehicles: number;
    totalVehicles: number;
    activeAlerts: number;
    complianceScore: number;
    routesOptimized: number;
    carbonSaved: number;
  };
  hourlyEmissions: Array<{ time: string; co2: number; pm25: number }>;
  fleetStatus: Array<{ name: string; value: number; color: string }>;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    createdAt: string;
    vehicle: { name: string; licensePlate: string };
  }>;
  recentRoutes: Array<{
    id: string;
    originName: string;
    destName: string;
    distance: number;
    carbonScore: number;
    status: string;
  }>;
}

const FLEET_COLORS = ['#16a34a', '#d97706', '#dc2626'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="item" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#16a34a';
  if (aqi <= 100) return '#d97706';
  if (aqi <= 150) return '#ea580c';
  if (aqi <= 200) return '#dc2626';
  return '#7c3aed';
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [aqiData, setAqiData] = useState<AQIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/weather').then(r => r.json()).catch(() => []),
    ]).then(([dashData, weatherData]) => {
      setData(dashData);
      setAqiData(Array.isArray(weatherData) ? weatherData : []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span className="loading-text">Loading dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return <div className="loading-container"><span className="loading-text">Failed to load dashboard data</span></div>;
  }

  return (
    <>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Real-time carbon monitoring and fleet intelligence</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card fade-in">
          <div className="kpi-card-header">
            <div className="kpi-card-icon green"><Leaf size={18} /></div>
            <span className="kpi-card-label">Total CO₂</span>
          </div>
          <div className="kpi-card-value">
            {data.kpis.totalCo2.toLocaleString()}
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>kg</span>
          </div>
          <div className="kpi-card-sub">
            <TrendingDown size={12} color="#16a34a" /> {data.kpis.carbonSaved} kg saved via optimization
          </div>
        </div>

        <div className="kpi-card fade-in fade-in-delay-1">
          <div className="kpi-card-header">
            <div className="kpi-card-icon cyan"><Truck size={18} /></div>
            <span className="kpi-card-label">Active Fleet</span>
          </div>
          <div className="kpi-card-value">
            {data.kpis.activeVehicles}
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>/ {data.kpis.totalVehicles}</span>
          </div>
          <div className="kpi-card-sub">
            <Zap size={12} /> Avg {data.kpis.avgCo2PerKm} g CO₂/km
          </div>
        </div>

        <div className="kpi-card fade-in fade-in-delay-2">
          <div className="kpi-card-header">
            <div className="kpi-card-icon red"><AlertTriangle size={18} /></div>
            <span className="kpi-card-label">Active Alerts</span>
          </div>
          <div className="kpi-card-value">
            {data.kpis.activeAlerts}
          </div>
          <div className="kpi-card-sub">
            <MapPin size={12} /> {data.kpis.routesOptimized} routes monitored
          </div>
        </div>

        <div className="kpi-card fade-in fade-in-delay-3">
          <div className="kpi-card-header">
            <div className="kpi-card-icon yellow"><Shield size={18} /></div>
            <span className="kpi-card-label">Compliance</span>
          </div>
          <div className="kpi-card-value">
            {data.kpis.complianceScore}%
          </div>
          <div className="kpi-card-sub">BS-VI fleet compliance score</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="glass-card fade-in">
          <h3>Carbon Emissions Trend (24h)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.hourlyEmissions}>
              <defs>
                <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#111" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="co2" name="CO₂ (g/km)" stroke="#111" fill="url(#co2Gradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="pm25" name="PM2.5 (µg/m³)" stroke="#9ca3af" fill="url(#pm25Gradient)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card fade-in fade-in-delay-1">
          <h3>Fleet Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.fleetStatus}
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {data.fleetStatus.map((_, index) => (
                  <Cell key={index} fill={FLEET_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
            {data.fleetStatus.map((s, i) => (
              <div key={i} className="map-legend-item">
                <div className="map-legend-dot" style={{ backgroundColor: FLEET_COLORS[i] }} />
                {s.name}: {s.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="charts-grid-equal">
        <div className="glass-card fade-in fade-in-delay-2">
          <h3>Active Alerts</h3>
          {data.recentAlerts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active alerts</p>
          ) : (
            data.recentAlerts.map(alert => (
              <div key={alert.id} className="alert-item">
                <div
                  className="alert-item-icon"
                  style={{
                    background: alert.severity === 'critical' ? 'var(--status-red-bg)' :
                      alert.severity === 'high' ? 'var(--status-yellow-bg)' : 'var(--status-blue-bg)',
                    color: alert.severity === 'critical' ? 'var(--status-red)' :
                      alert.severity === 'high' ? 'var(--status-yellow)' : 'var(--status-blue)',
                  }}
                >
                  <AlertTriangle size={14} />
                </div>
                <div className="alert-item-content">
                  <h4>{alert.vehicle.name}</h4>
                  <p>{alert.message}</p>
                </div>
                <span className="alert-item-time">
                  <Clock size={11} /> {new Date(alert.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="glass-card fade-in fade-in-delay-3">
          <h3>Recent Routes</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Distance</th>
                <th>CO₂ Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRoutes.map(route => (
                <tr key={route.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {route.originName} → {route.destName}
                  </td>
                  <td>{route.distance} km</td>
                  <td>
                    <span className={`badge ${route.carbonScore < 40 ? 'badge-green' : route.carbonScore < 70 ? 'badge-yellow' : 'badge-red'}`}>
                      {route.carbonScore}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${route.status === 'completed' ? 'badge-green' : route.status === 'active' ? 'badge-cyan' : 'badge-yellow'}`}>
                      {route.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live AQI from WAQI API */}
      {aqiData.length > 0 && (
        <div className="glass-card fade-in fade-in-delay-4" style={{ marginTop: 4 }}>
          <h3>Live Air Quality Index</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, marginTop: -8 }}>Real-time data from WAQI &amp; OpenWeatherMap</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {aqiData.map(city => (
              <div key={city.city} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                padding: 14,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {city.city}
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: getAQIColor(city.aqi),
                  lineHeight: 1,
                }}>
                  {city.aqi}
                </div>
                <div style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: getAQIColor(city.aqi),
                  marginTop: 3,
                }}>
                  {city.status}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  PM2.5: {city.pm25} · {city.temp}°C
                </div>
                {city.weatherCondition && city.weatherCondition !== 'N/A' && (
                  <div style={{ marginTop: 2, fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {city.weatherCondition}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
