'use client';
import { useEffect, useState } from 'react';
import { Bell, Check, AlertTriangle, MapPin, Cloud, Shield, Clock, Filter } from 'lucide-react';

interface Alert {
    id: string;
    vehicleId: string;
    type: string;
    severity: string;
    message: string;
    resolved: boolean;
    createdAt: string;
    vehicle: { name: string; licensePlate: string };
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    zone_violation: { icon: <MapPin size={16} />, label: 'Zone Violation', color: 'var(--red-primary)' },
    emission_spike: { icon: <AlertTriangle size={16} />, label: 'Emission Spike', color: 'var(--yellow-primary)' },
    weather_alert: { icon: <Cloud size={16} />, label: 'Weather Alert', color: 'var(--cyan-primary)' },
    compliance: { icon: <Shield size={16} />, label: 'Compliance', color: 'var(--purple-primary)' },
};

const severityColors: Record<string, string> = {
    critical: 'var(--red-glow)',
    high: 'var(--yellow-glow)',
    medium: 'var(--cyan-glow)',
    low: 'rgba(0, 255, 135, 0.1)',
};

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetch('/api/alerts')
            .then(r => r.json())
            .then(setAlerts)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleResolve = async (id: string) => {
        try {
            await fetch('/api/alerts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = filter === 'all'
        ? alerts
        : filter === 'active'
            ? alerts.filter(a => !a.resolved)
            : alerts.filter(a => a.type === filter);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span className="loading-text">Loading alerts...</span>
            </div>
        );
    }

    const activeCount = alerts.filter(a => !a.resolved).length;
    const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;

    return (
        <>
            <div className="page-header">
                <h2>Alerts & Notifications</h2>
                <p>Real-time environmental and compliance alerts</p>
            </div>

            {/* Summary cards */}
            <div className="kpi-grid">
                <div className="kpi-card fade-in">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon red"><Bell size={20} /></div>
                        <span className="kpi-card-label">Active Alerts</span>
                    </div>
                    <div className="kpi-card-value" style={{ color: 'var(--red-primary)' }}>{activeCount}</div>
                </div>
                <div className="kpi-card fade-in fade-in-delay-1">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon red"><AlertTriangle size={20} /></div>
                        <span className="kpi-card-label">Critical</span>
                    </div>
                    <div className="kpi-card-value" style={{ color: 'var(--red-primary)' }}>{criticalCount}</div>
                </div>
                <div className="kpi-card fade-in fade-in-delay-2">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon green"><Check size={20} /></div>
                        <span className="kpi-card-label">Resolved</span>
                    </div>
                    <div className="kpi-card-value" style={{ color: 'var(--green-primary)' }}>
                        {alerts.filter(a => a.resolved).length}
                    </div>
                </div>
                <div className="kpi-card fade-in fade-in-delay-3">
                    <div className="kpi-card-header">
                        <div className="kpi-card-icon cyan"><Filter size={20} /></div>
                        <span className="kpi-card-label">Total</span>
                    </div>
                    <div className="kpi-card-value" style={{ color: 'var(--cyan-primary)' }}>{alerts.length}</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {['all', 'active', 'zone_violation', 'emission_spike', 'weather_alert', 'compliance'].map(f => (
                    <button
                        key={f}
                        className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'All' : f === 'active' ? 'Active Only' :
                            typeConfig[f]?.label || f}
                    </button>
                ))}
            </div>

            {/* Alert list */}
            <div className="glass-card">
                {filtered.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
                        No alerts matching the current filter
                    </p>
                ) : (
                    filtered.map(alert => {
                        const config = typeConfig[alert.type] || typeConfig.compliance;
                        return (
                            <div
                                key={alert.id}
                                className="alert-item"
                                style={{
                                    opacity: alert.resolved ? 0.5 : 1,
                                    borderLeftWidth: 3,
                                    borderLeftStyle: 'solid',
                                    borderLeftColor: alert.resolved ? 'transparent' :
                                        alert.severity === 'critical' ? 'var(--red-primary)' :
                                            alert.severity === 'high' ? 'var(--yellow-primary)' :
                                                'var(--cyan-primary)',
                                }}
                            >
                                <div
                                    className="alert-item-icon"
                                    style={{ background: severityColors[alert.severity] || severityColors.medium, color: config.color }}
                                >
                                    {config.icon}
                                </div>
                                <div className="alert-item-content">
                                    <h4>
                                        {config.label}
                                        <span style={{ marginLeft: 8 }} className={`badge ${alert.severity === 'critical' ? 'badge-red' :
                                            alert.severity === 'high' ? 'badge-yellow' :
                                                alert.severity === 'medium' ? 'badge-cyan' : 'badge-green'
                                            }`}>
                                            {alert.severity}
                                        </span>
                                        {alert.resolved && <span className="badge badge-green" style={{ marginLeft: 6 }}>✓ Resolved</span>}
                                    </h4>
                                    <p>{alert.message}</p>
                                    <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                                        {alert.vehicle.name} ({alert.vehicle.licensePlate})
                                    </p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                    <span className="alert-item-time">
                                        <Clock size={11} /> {new Date(alert.createdAt).toLocaleString()}
                                    </span>
                                    {!alert.resolved && (
                                        <button className="btn btn-sm btn-primary" onClick={() => handleResolve(alert.id)}>
                                            <Check size={12} /> Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
}
