import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Dashboard KPIs
        const [vehicles, activeAlerts, routes, readings] = await Promise.all([
            prisma.vehicle.findMany({
                include: {
                    readings: { orderBy: { createdAt: 'desc' }, take: 1 },
                    _count: { select: { alerts: { where: { resolved: false } } } },
                },
            }),
            prisma.alert.count({ where: { resolved: false } }),
            prisma.route.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
            prisma.carbonReading.findMany({
                orderBy: { createdAt: 'desc' },
                take: 240,
            }),
        ]);

        const totalVehicles = vehicles.length;
        const activeVehicles = vehicles.filter(v => v.status === 'active').length;
        const bs6Compliant = vehicles.filter(v => v.bs6Compliant).length;
        const complianceScore = Math.round((bs6Compliant / totalVehicles) * 100);

        // Total CO2 from readings
        const totalCo2 = readings.reduce((sum, r) => sum + r.co2, 0);
        const avgCo2PerKm = readings.length > 0 ? totalCo2 / readings.length : 0;

        // Emissions trend (last 12 hours)
        const now = Date.now();
        const hourlyEmissions = [];
        for (let i = 11; i >= 0; i--) {
            const hourStart = now - (i + 1) * 3600000;
            const hourEnd = now - i * 3600000;
            const hourReadings = readings.filter(r =>
                r.createdAt.getTime() >= hourStart && r.createdAt.getTime() < hourEnd
            );
            const avgCo2 = hourReadings.length > 0
                ? hourReadings.reduce((s, r) => s + r.co2, 0) / hourReadings.length
                : 0;
            const hour = new Date(hourEnd).getHours();
            hourlyEmissions.push({
                time: `${hour.toString().padStart(2, '0')}:00`,
                co2: Math.round(avgCo2 * 10) / 10,
                pm25: hourReadings.length > 0
                    ? Math.round(hourReadings.reduce((s, r) => s + r.pm25, 0) / hourReadings.length * 10) / 10
                    : 0,
            });
        }

        // Fleet status breakdown
        const fleetStatus = [
            { name: 'Active', value: vehicles.filter(v => v.status === 'active').length, color: '#00ff87' },
            { name: 'Idle', value: vehicles.filter(v => v.status === 'idle').length, color: '#ffd43b' },
            { name: 'Maintenance', value: vehicles.filter(v => v.status === 'maintenance').length, color: '#ff6b6b' },
        ];

        // Recent alerts
        const recentAlerts = await prisma.alert.findMany({
            include: { vehicle: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
            where: { resolved: false },
        });

        return NextResponse.json({
            kpis: {
                totalCo2: Math.round(totalCo2 * 10) / 10,
                avgCo2PerKm: Math.round(avgCo2PerKm * 10) / 10,
                activeVehicles,
                totalVehicles,
                activeAlerts,
                complianceScore,
                routesOptimized: routes.length,
                carbonSaved: Math.round(totalCo2 * 0.15 * 10) / 10, // ~15% savings from optimization
            },
            hourlyEmissions,
            fleetStatus,
            recentAlerts,
            recentRoutes: routes.slice(0, 5),
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
