'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Map,
    Route,
    Truck,
    Bell,
    BarChart3,
    Shield,
    Leaf
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/map', label: 'Live Map', icon: Map },
    { href: '/routes', label: 'Route Optimizer', icon: Route },
    { href: '/fleet', label: 'Fleet', icon: Truck },
    { href: '/alerts', label: 'Alerts', icon: Bell },
    { href: '/analytics', label: 'Carbon Analytics', icon: BarChart3 },
    { href: '/compliance', label: 'Compliance', icon: Shield },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon">
                    <Leaf size={18} color="#111" />
                </div>
                <div>
                    <h1>CarbonSense AI</h1>
                    <p>Carbon-Adaptive Logistics</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-title">Navigation</div>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={isActive ? 'active' : ''}
                        >
                            <Icon className="sidebar-nav-icon" size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-status">
                    <div className="sidebar-status-dot" />
                    <span>System Online</span>
                </div>
            </div>
        </aside>
    );
}
