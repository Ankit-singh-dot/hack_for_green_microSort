'use client';
import { useEffect, useState } from 'react';
import { Truck, Shield, Fuel, Activity, Plus, X } from 'lucide-react';

interface Vehicle {
    id: string;
    name: string;
    type: string;
    licensePlate: string;
    fuelType: string;
    bs6Compliant: boolean;
    status: string;
    co2Total: number;
    _count?: { alerts: number };
    readings?: Array<{ co2: number }>;
}

export default function FleetPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'truck', licensePlate: '', fuelType: 'diesel', bs6Compliant: true });

    useEffect(() => {
        fetch('/api/vehicles')
            .then(r => r.json())
            .then(setVehicles)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleAdd = async () => {
        try {
            const res = await fetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const newVehicle = await res.json();
            setVehicles(prev => [...prev, newVehicle]);
            setShowAdd(false);
            setForm({ name: '', type: 'truck', licensePlate: '', fuelType: 'diesel', bs6Compliant: true });
        } catch (error) {
            console.error('Failed to add vehicle:', error);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span className="loading-text">Loading fleet data...</span>
            </div>
        );
    }

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Fleet Management</h2>
                    <p>Monitor and manage your vehicle fleet</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                    <Plus size={16} /> Add Vehicle
                </button>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card fade-in">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon cyan"><Truck size={18} /></div>
                        <span className="kpi-card-label">Total Vehicles</span>
                    </div>
                    <div className="kpi-card-value">{vehicles.length}</div>
                </div>
                <div className="kpi-card fade-in fade-in-delay-1">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon green"><Activity size={18} /></div>
                        <span className="kpi-card-label">Active</span>
                    </div>
                    <div className="kpi-card-value">{vehicles.filter(v => v.status === 'active').length}</div>
                </div>
                <div className="kpi-card fade-in fade-in-delay-2">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon yellow"><Shield size={18} /></div>
                        <span className="kpi-card-label">BS-VI Compliant</span>
                    </div>
                    <div className="kpi-card-value">{vehicles.filter(v => v.bs6Compliant).length}/{vehicles.length}</div>
                </div>
                <div className="kpi-card fade-in fade-in-delay-3">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon green"><Fuel size={18} /></div>
                        <span className="kpi-card-label">Electric/CNG</span>
                    </div>
                    <div className="kpi-card-value">{vehicles.filter(v => v.fuelType === 'electric' || v.fuelType === 'cng').length}</div>
                </div>
            </div>

            <div className="glass-card fade-in">
                <h3>Fleet Vehicles</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>License Plate</th>
                            <th>Type</th>
                            <th>Fuel</th>
                            <th>BS-VI</th>
                            <th>Status</th>
                            <th>Latest CO₂</th>
                            <th>Alerts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(v => {
                            const latestCo2 = v.readings?.[0]?.co2;
                            return (
                                <tr key={v.id}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v.name}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{v.licensePlate}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{v.type}</td>
                                    <td>
                                        <span className="badge badge-cyan">{v.fuelType}</span>
                                    </td>
                                    <td>
                                        {v.bs6Compliant
                                            ? <span className="badge badge-green">Compliant</span>
                                            : <span className="badge badge-red">Non-compliant</span>
                                        }
                                    </td>
                                    <td>
                                        <span className={`badge ${v.status === 'active' ? 'badge-green' : v.status === 'idle' ? 'badge-yellow' : 'badge-red'}`}>
                                            {v.status}
                                        </span>
                                    </td>
                                    <td>{latestCo2 ? `${latestCo2.toFixed(1)} g/km` : '—'}</td>
                                    <td>
                                        {v._count?.alerts > 0 && (
                                            <span className="badge badge-red">{v._count.alerts}</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add Vehicle Modal */}
            {showAdd && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.4)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                }}>
                    <div className="glass-card" style={{ width: 440, maxHeight: '80vh', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ margin: 0 }}>Add New Vehicle</h3>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}><X size={14} /></button>
                        </div>
                        <div className="form-group">
                            <label>Vehicle Name</label>
                            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. GreenHaul Lambda" />
                        </div>
                        <div className="form-group">
                            <label>License Plate</label>
                            <input className="form-input" value={form.licensePlate} onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value }))} placeholder="e.g. DL-XX-XXXX" />
                        </div>
                        <div className="form-group">
                            <label>Vehicle Type</label>
                            <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                <option value="truck">Truck</option>
                                <option value="van">Van</option>
                                <option value="tanker">Tanker</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fuel Type</label>
                            <select className="form-select" value={form.fuelType} onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}>
                                <option value="diesel">Diesel</option>
                                <option value="cng">CNG</option>
                                <option value="electric">Electric</option>
                                <option value="petrol">Petrol</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" checked={form.bs6Compliant} onChange={e => setForm(f => ({ ...f, bs6Compliant: e.target.checked }))} />
                                BS-VI Compliant
                            </label>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAdd} disabled={!form.name || !form.licensePlate}>
                            Add Vehicle
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
