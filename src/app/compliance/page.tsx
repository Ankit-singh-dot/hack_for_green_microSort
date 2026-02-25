'use client';
import { useEffect, useState } from 'react';
import { Shield, Check, AlertTriangle, XCircle } from 'lucide-react';

interface ComplianceItem {
    vehicleId: string;
    vehicleName: string;
    licensePlate: string;
    fuelType: string;
    bs6Compliant: boolean;
    status: 'compliant' | 'warning' | 'violation';
    issues: string[];
    activeAlerts: number;
}

interface ComplianceSummary {
    total: number;
    compliant: number;
    warning: number;
    violation: number;
}

export default function CompliancePage() {
    const [compliance, setCompliance] = useState<ComplianceItem[]>([]);
    const [summary, setSummary] = useState<ComplianceSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/compliance')
            .then(r => r.json())
            .then(d => {
                setCompliance(d.compliance);
                setSummary(d.summary);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span className="loading-text">Loading compliance data...</span>
            </div>
        );
    }

    const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string; bgColor: string }> = {
        compliant: { icon: <Check size={18} />, color: 'var(--green-primary)', label: 'Compliant', bgColor: 'var(--green-glow)' },
        warning: { icon: <AlertTriangle size={18} />, color: 'var(--yellow-primary)', label: 'Warning', bgColor: 'var(--yellow-glow)' },
        violation: { icon: <XCircle size={18} />, color: 'var(--red-primary)', label: 'Violation', bgColor: 'var(--red-glow)' },
    };

    return (
        <>
            <div className="page-header">
                <h2>Compliance Dashboard</h2>
                <p>BS-VI emission norms and regulatory compliance monitoring</p>
            </div>

            {/* Summary */}
            {summary && (
                <div className="kpi-grid">
                    <div className="kpi-card fade-in">
                        <div className="kpi-card-header">
                            <div className="kpi-card-icon cyan"><Shield size={20} /></div>
                            <span className="kpi-card-label">Total Vehicles</span>
                        </div>
                        <div className="kpi-card-value" style={{ color: 'var(--cyan-primary)' }}>{summary.total}</div>
                    </div>
                    <div className="kpi-card fade-in fade-in-delay-1">
                        <div className="kpi-card-header">
                            <div className="kpi-card-icon green"><Check size={20} /></div>
                            <span className="kpi-card-label">Compliant</span>
                        </div>
                        <div className="kpi-card-value" style={{ color: 'var(--green-primary)' }}>{summary.compliant}</div>
                        <div className="kpi-card-sub">{Math.round((summary.compliant / summary.total) * 100)}% of fleet</div>
                    </div>
                    <div className="kpi-card fade-in fade-in-delay-2">
                        <div className="kpi-card-header">
                            <div className="kpi-card-icon yellow"><AlertTriangle size={20} /></div>
                            <span className="kpi-card-label">Warnings</span>
                        </div>
                        <div className="kpi-card-value" style={{ color: 'var(--yellow-primary)' }}>{summary.warning}</div>
                    </div>
                    <div className="kpi-card fade-in fade-in-delay-3">
                        <div className="kpi-card-header">
                            <div className="kpi-card-icon red"><XCircle size={20} /></div>
                            <span className="kpi-card-label">Violations</span>
                        </div>
                        <div className="kpi-card-value" style={{ color: 'var(--red-primary)' }}>{summary.violation}</div>
                    </div>
                </div>
            )}

            {/* Compliance Score Bar */}
            {summary && (
                <div className="glass-card fade-in" style={{ marginBottom: 28 }}>
                    <h3>Fleet Compliance Overview</h3>
                    <div style={{
                        height: 24, borderRadius: 12, overflow: 'hidden', display: 'flex',
                        background: 'rgba(255,255,255,0.05)', marginTop: 16, marginBottom: 12,
                    }}>
                        <div style={{
                            width: `${(summary.compliant / summary.total) * 100}%`,
                            background: 'linear-gradient(90deg, #00ff87, #00cc6a)',
                            transition: 'width 0.5s',
                        }} />
                        <div style={{
                            width: `${(summary.warning / summary.total) * 100}%`,
                            background: 'linear-gradient(90deg, #ffd43b, #ffa94d)',
                            transition: 'width 0.5s',
                        }} />
                        <div style={{
                            width: `${(summary.violation / summary.total) * 100}%`,
                            background: 'linear-gradient(90deg, #ff4757, #ff6b6b)',
                            transition: 'width 0.5s',
                        }} />
                    </div>
                    <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
                        <span style={{ color: 'var(--green-primary)' }}>
                            ● Compliant: {Math.round((summary.compliant / summary.total) * 100)}%
                        </span>
                        <span style={{ color: 'var(--yellow-primary)' }}>
                            ● Warning: {Math.round((summary.warning / summary.total) * 100)}%
                        </span>
                        <span style={{ color: 'var(--red-primary)' }}>
                            ● Violation: {Math.round((summary.violation / summary.total) * 100)}%
                        </span>
                    </div>
                </div>
            )}

            {/* Vehicle compliance cards */}
            <div className="glass-card fade-in fade-in-delay-1">
                <h3>Vehicle Compliance Status</h3>
                {compliance.map(item => {
                    const config = statusConfig[item.status];
                    return (
                        <div key={item.vehicleId} className="compliance-card">
                            <div className={`compliance-dot ${item.status}`} />
                            <div className="compliance-info">
                                <h4>{item.vehicleName}</h4>
                                <p>
                                    {item.licensePlate} • {item.fuelType.toUpperCase()} •
                                    BS-VI: {item.bs6Compliant ? 'Yes' : 'No'}
                                </p>
                                {item.issues.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        {item.issues.map((issue, i) => (
                                            <div key={i} style={{
                                                fontSize: 12,
                                                color: 'var(--text-secondary)',
                                                padding: '4px 0',
                                                borderBottom: i < item.issues.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                            }}>
                                                {issue}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                <span
                                    className="badge"
                                    style={{
                                        background: config.bgColor,
                                        color: config.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    {config.icon} {config.label}
                                </span>
                                {item.activeAlerts > 0 && (
                                    <span className="badge badge-red" style={{ fontSize: 10 }}>
                                        {item.activeAlerts} alert{item.activeAlerts > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
