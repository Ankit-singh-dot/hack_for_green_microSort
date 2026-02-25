'use client';
import { useEffect, useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingDown, Leaf, Fuel, Wind } from 'lucide-react';

interface CarbonData {
    totalCo2: number;
    totalDistance: number;
    totalFuel: number;
    routesCompleted: number;
    emissionsByVehicle: Array<{
        name: string;
        licensePlate: string;
        fuelType: string;
        avgCo2: number;
        totalReadings: number;
    }>;
    hourlyTrend: Array<{ hour: string; co2: number; pm25: number }>;
    fuelBreakdown: Array<{ name: string; count: number; color: string }>;
}

interface AQICity {
    city: string;
    aqi: number;
    pm25: number;
    pm10: number;
    temp: number;
    status: string;
}

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

export default function AnalyticsPage() {
    const [data, setData] = useState<CarbonData | null>(null);
    const [aqiData, setAqiData] = useState<AQICity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/carbon').then(r => r.json()),
            fetch('/api/weather').then(r => r.json()).catch(() => []),
        ]).then(([carbonData, weatherData]) => {
            setData(carbonData);
            setAqiData(Array.isArray(weatherData) ? weatherData : []);
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span className="loading-text">Loading carbon analytics...</span>
            </div>
        );
    }

    if (!data) {
        return <div className="loading-container"><span className="loading-text">Failed to load analytics</span></div>;
    }

    return (
        <>
            <div className="page-header">
                <h2>Carbon Analytics</h2>
                <p>Deep dive into fleet carbon emissions and environmental impact</p>
            </div>

            {/* Summary KPIs */}
            <div className="kpi-grid">
                <div className="kpi-card fade-in">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon green"><Leaf size={20} /></div>
                        <span className="kpi-card-label">Total CO₂ Emitted</span>
                    </div>
                    <div className="kpi-card-value" style={{ color: 'var(--green-primary)' }}>
                        {data.totalCo2}
                        <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>kg</span>
                    </div>
                </div>
                <div className="kpi-card fade-in fade-in-delay-1">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon cyan"><TrendingDown size={20} /></div>
                        <span className="kpi-card-label">Distance Covered</span>
                    </div>
                    <div className="kpi-card-value" style={{ color: 'var(--cyan-primary)' }}>
                        {data.totalDistance.toLocaleString()}
                        <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>km</span>
                    </div>
                </div>
                <div className="kpi-card fade-in fade-in-delay-2">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon yellow"><Fuel size={20} /></div>
                        <span className="kpi-card-label">Fuel Consumed</span>
                    </div>
                    <div className="kpi-card-value" style={{ color: 'var(--yellow-primary)' }}>
                        {data.totalFuel}
                        <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>L</span>
                    </div>
                </div>
                <div className="kpi-card fade-in fade-in-delay-3">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon green"><Wind size={20} /></div>
                        <span className="kpi-card-label">Routes Completed</span>
                    </div>
                    <div className="kpi-card-value" style={{ color: 'var(--green-primary)' }}>
                        {data.routesCompleted}
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="charts-grid">
                <div className="glass-card fade-in">
                    <h3>Hourly Emissions Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data.hourlyTrend}>
                            <defs>
                                <linearGradient id="co2Grad2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00ff87" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="pm25Grad2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area type="monotone" dataKey="co2" name="CO₂ (g/km)" stroke="#00ff87" fill="url(#co2Grad2)" strokeWidth={2} />
                            <Area type="monotone" dataKey="pm25" name="PM2.5 (µg/m³)" stroke="#00d4ff" fill="url(#pm25Grad2)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card fade-in fade-in-delay-1">
                    <h3>Fleet Fuel Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={data.fuelBreakdown}
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={4}
                                dataKey="count"
                                label={({ name, value }) => `${name}: ${value}`}
                            >
                                {data.fuelBreakdown.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 - Emissions by Vehicle */}
            <div className="glass-card fade-in fade-in-delay-2">
                <h3>Average CO₂ Emissions by Vehicle</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.emissionsByVehicle} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avgCo2" name="Avg CO₂ (g/km)" radius={[0, 6, 6, 0]}>
                            {data.emissionsByVehicle.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={
                                        entry.avgCo2 === 0 ? '#00ff87' :
                                            entry.avgCo2 < 130 ? '#00d4ff' :
                                                entry.avgCo2 < 180 ? '#ffd43b' : '#ff4757'
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Live AQI City Comparison from WAQI */}
            {aqiData.length > 0 && (
                <div className="glass-card fade-in fade-in-delay-3" style={{ marginTop: 28 }}>
                    <h3>Live City AQI Comparison</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Real-time data from WAQI API</p>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={aqiData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="aqi" name="AQI" radius={[6, 6, 0, 0]}>
                                {aqiData.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={
                                            entry.aqi <= 50 ? '#00ff87' :
                                                entry.aqi <= 100 ? '#ffd43b' :
                                                    entry.aqi <= 150 ? '#ff9f43' :
                                                        entry.aqi <= 200 ? '#ff4757' : '#8b5cf6'
                                        }
                                    />
                                ))}
                            </Bar>
                            <Bar dataKey="pm25" name="PM2.5" fill="#00d4ff" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </>
    );
}
