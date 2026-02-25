import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Total CO2 emissions
        const readings = await prisma.carbonReading.findMany({
            orderBy: { createdAt: 'desc' },
            take: 240, // Last ~10 readings per vehicle
        });

        const vehicles = await prisma.vehicle.findMany();
        const routes = await prisma.route.findMany({
            where: { status: 'completed' },
        });

        // Emissions by vehicle
        const emissionsByVehicle = vehicles.map(v => {
            const vehicleReadings = readings.filter(r => r.vehicleId === v.id);
            const avgCo2 = vehicleReadings.length > 0
                ? vehicleReadings.reduce((sum, r) => sum + r.co2, 0) / vehicleReadings.length
                : 0;
            return {
                name: v.name,
                licensePlate: v.licensePlate,
                fuelType: v.fuelType,
                avgCo2: Math.round(avgCo2 * 10) / 10,
                totalReadings: vehicleReadings.length,
            };
        });

        // Hourly emissions trend (last 24h)
        const hourlyTrend = [];
        const now = Date.now();
        for (let i = 23; i >= 0; i--) {
            const hourStart = now - (i + 1) * 3600000;
            const hourEnd = now - i * 3600000;
            const hourReadings = readings.filter(r =>
                r.createdAt.getTime() >= hourStart && r.createdAt.getTime() < hourEnd
            );
            const avgCo2 = hourReadings.length > 0
                ? hourReadings.reduce((sum, r) => sum + r.co2, 0) / hourReadings.length
                : 0;
            const hour = new Date(hourEnd).getHours();
            hourlyTrend.push({
                hour: `${hour}:00`,
                co2: Math.round(avgCo2 * 10) / 10,
                pm25: hourReadings.length > 0
                    ? Math.round(hourReadings.reduce((sum, r) => sum + r.pm25, 0) / hourReadings.length * 10) / 10
                    : 0,
            });
        }

        // Fuel type breakdown
        const fuelBreakdown = [
            { name: 'Diesel', count: vehicles.filter(v => v.fuelType === 'diesel').length, color: '#ff6b6b' },
            { name: 'CNG', count: vehicles.filter(v => v.fuelType === 'cng').length, color: '#51cf66' },
            { name: 'Electric', count: vehicles.filter(v => v.fuelType === 'electric').length, color: '#339af0' },
        ];

        // Total stats
        const totalCo2 = routes.reduce((sum, r) => sum + r.carbonScore, 0);
        const totalDistance = routes.reduce((sum, r) => sum + r.distance, 0);
        const totalFuel = routes.reduce((sum, r) => sum + r.fuelUsed, 0);

        return NextResponse.json({
            totalCo2: Math.round(totalCo2 * 10) / 10,
            totalDistance: Math.round(totalDistance),
            totalFuel: Math.round(totalFuel * 10) / 10,
            routesCompleted: routes.length,
            emissionsByVehicle,
            hourlyTrend,
            fuelBreakdown,
        });
    } catch (error) {
        console.error('Error fetching carbon data:', error);
        return NextResponse.json({ error: 'Failed to fetch carbon data' }, { status: 500 });
    }
}
