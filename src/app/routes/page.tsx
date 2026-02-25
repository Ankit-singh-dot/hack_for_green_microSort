'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { INDIAN_CITIES } from '@/lib/constants';
import { Search, Leaf, Clock, Fuel, Wind, AlertTriangle } from 'lucide-react';

const RouteMapView = dynamic(() => import('@/components/RouteMapView'), { ssr: false });

interface RouteOption {
    id: string;
    name: string;
    origin: { name: string; lat: number; lng: number };
    destination: { name: string; lat: number; lng: number };
    distance: number;
    duration: number;
    fuelType: string;
    carbonScore: number;
    co2Kg: number;
    fuelUsed: number;
    pm25: number;
    nox: number;
    waypoints: Array<{ lat: number; lng: number }>;
    recommended: boolean;
    savings: number;
}

const cityNames = Object.keys(INDIAN_CITIES);

export default function RoutesPage() {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [fuelType, setFuelType] = useState('diesel');
    const [routes, setRoutes] = useState<RouteOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<number>(0);

    const handleOptimize = async () => {
        if (!origin || !destination) return;
        setLoading(true);
        try {
            const res = await fetch('/api/routes/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ origin, destination, fuelType }),
            });
            const data = await res.json();
            setRoutes(data);
            setSelectedRoute(0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h2>Route Optimizer</h2>
                <p>Find the lowest-carbon route between Indian cities</p>
            </div>

            <div className="glass-card" style={{ marginBottom: 28 }}>
                <div className="route-form">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Origin City</label>
                        <select className="form-select" value={origin} onChange={e => setOrigin(e.target.value)}>
                            <option value="">Select origin...</option>
                            {cityNames.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Destination City</label>
                        <select className="form-select" value={destination} onChange={e => setDestination(e.target.value)}>
                            <option value="">Select destination...</option>
                            {cityNames.filter(c => c !== origin).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Fuel Type</label>
                        <select className="form-select" value={fuelType} onChange={e => setFuelType(e.target.value)}>
                            <option value="diesel">Diesel</option>
                            <option value="cng">CNG</option>
                            <option value="electric">Electric</option>
                            <option value="petrol">Petrol</option>
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleOptimize}
                        disabled={!origin || !destination || loading}
                        style={{ height: 46 }}
                    >
                        {loading ? <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Search size={16} /> Optimize</>}
                    </button>
                </div>
            </div>

            {routes.length > 0 && (
                <>
                    <div className="route-results">
                        {routes.map((route, index) => (
                            <div
                                key={route.id}
                                className={`route-card ${route.recommended ? 'recommended' : ''} ${selectedRoute === index ? '' : ''}`}
                                onClick={() => setSelectedRoute(index)}
                                style={{
                                    cursor: 'pointer',
                                    borderColor: selectedRoute === index ? 'var(--cyan-primary)' : undefined,
                                }}
                            >
                                <div className="route-card-body">
                                    <h4>{route.name}</h4>
                                    <div className="route-card-stats">
                                        <div className="route-card-stat">
                                            <div className="value" style={{ color: route.carbonScore < 40 ? 'var(--green-primary)' : route.carbonScore < 70 ? 'var(--yellow-primary)' : 'var(--red-primary)' }}>
                                                {route.co2Kg}
                                            </div>
                                            <div className="label">CO₂ (kg)</div>
                                        </div>
                                        <div className="route-card-stat">
                                            <div className="value" style={{ color: 'var(--cyan-primary)' }}>
                                                {route.distance}
                                            </div>
                                            <div className="label">Distance (km)</div>
                                        </div>
                                        <div className="route-card-stat">
                                            <div className="value" style={{ color: 'var(--text-primary)' }}>
                                                {Math.round(route.duration / 60)}h {route.duration % 60}m
                                            </div>
                                            <div className="label">Duration</div>
                                        </div>
                                        <div className="route-card-stat">
                                            <div className="value" style={{ color: 'var(--yellow-primary)' }}>
                                                {route.fuelUsed}
                                            </div>
                                            <div className="label">Fuel (L)</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <span className={`badge ${route.carbonScore < 40 ? 'badge-green' : route.carbonScore < 70 ? 'badge-yellow' : 'badge-red'}`}>
                                            <Leaf size={11} /> Score: {route.carbonScore}
                                        </span>
                                        <span className="badge badge-cyan">
                                            <Wind size={11} /> PM2.5: {route.pm25.toFixed(3)}
                                        </span>
                                        {route.savings > 0 && (
                                            <span className="badge badge-red">
                                                <AlertTriangle size={11} /> +{route.savings} kg CO₂
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="glass-card">
                        <h3>Route Visualization</h3>
                        <div style={{ height: 400, borderRadius: 12, overflow: 'hidden', marginTop: 12 }}>
                            <RouteMapView routes={routes} selectedIndex={selectedRoute} />
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
