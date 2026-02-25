import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const vehicles = await prisma.vehicle.findMany({
            include: {
                alerts: { where: { resolved: false } },
                readings: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
        });

        const zones = await prisma.emissionZone.findMany({ where: { active: true } });

        const compliance = vehicles.map(v => {
            const issues: string[] = [];
            let status: 'compliant' | 'warning' | 'violation' = 'compliant';

            // BS-VI check
            if (!v.bs6Compliant) {
                issues.push('Vehicle is not BS-VI compliant');
                status = 'violation';
            }

            // Emission readings check
            if (v.readings.length > 0) {
                const latest = v.readings[0];
                if (latest.co2 > 230) {
                    issues.push(`CO2 emissions high: ${latest.co2.toFixed(1)} g/km (limit: 230)`);
                    status = status === 'violation' ? 'violation' : 'warning';
                }
                if (latest.pm25 > 40) {
                    issues.push(`PM2.5 elevated: ${latest.pm25.toFixed(1)} µg/m³`);
                    status = status === 'violation' ? 'violation' : 'warning';
                }
            }

            // Active alerts
            if (v.alerts.length > 0) {
                const criticalAlerts = v.alerts.filter(a => a.severity === 'critical');
                if (criticalAlerts.length > 0) {
                    issues.push(`${criticalAlerts.length} critical alert(s) active`);
                    status = 'violation';
                }
            }

            return {
                vehicleId: v.id,
                vehicleName: v.name,
                licensePlate: v.licensePlate,
                fuelType: v.fuelType,
                bs6Compliant: v.bs6Compliant,
                status,
                issues,
                activeAlerts: v.alerts.length,
            };
        });

        const summary = {
            total: compliance.length,
            compliant: compliance.filter(c => c.status === 'compliant').length,
            warning: compliance.filter(c => c.status === 'warning').length,
            violation: compliance.filter(c => c.status === 'violation').length,
        };

        return NextResponse.json({ compliance, summary, zones });
    } catch (error) {
        console.error('Error fetching compliance:', error);
        return NextResponse.json({ error: 'Failed to fetch compliance' }, { status: 500 });
    }
}
