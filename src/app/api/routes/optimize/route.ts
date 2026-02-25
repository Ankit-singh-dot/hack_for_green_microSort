import { NextResponse } from 'next/server';
import { calculateCarbonFootprint, getTrafficFactor } from '@/lib/carbon-engine';
import { INDIAN_CITIES } from '@/lib/constants';

interface RouteOption {
    name: string;
    distance: number;
    duration: number;
    factor: number;
}

export async function POST(request: Request) {
    try {
        const { origin, destination, fuelType = 'diesel' } = await request.json();

        if (!origin || !destination) {
            return NextResponse.json({ error: 'Origin and destination required' }, { status: 400 });
        }

        const originCity = INDIAN_CITIES[origin];
        const destCity = INDIAN_CITIES[destination];

        if (!originCity || !destCity) {
            return NextResponse.json({ error: 'Invalid city names' }, { status: 400 });
        }

        // Calculate straight-line distance (Haversine)
        const R = 6371;
        const dLat = (destCity.lat - originCity.lat) * Math.PI / 180;
        const dLng = (destCity.lng - originCity.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(originCity.lat * Math.PI / 180) * Math.cos(destCity.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const straightLine = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // Generate 3 route options with different characteristics
        const routeOptions: RouteOption[] = [
            { name: 'Eco-Highway Route (Lowest Carbon)', distance: straightLine * 1.3, duration: straightLine * 1.3 * 1.2, factor: 0.85 },
            { name: 'Balanced Route (Optimized)', distance: straightLine * 1.2, duration: straightLine * 1.2 * 1.0, factor: 1.0 },
            { name: 'Express Route (Fastest)', distance: straightLine * 1.15, duration: straightLine * 1.15 * 0.8, factor: 1.3 },
        ];

        const trafficFactor = getTrafficFactor();

        const results = routeOptions.map((opt, index) => {
            const carbon = calculateCarbonFootprint(
                opt.distance,
                fuelType,
                undefined,
                trafficFactor * opt.factor
            );

            // Generate intermediate waypoints for map display
            const steps = 8;
            const waypoints = [];
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                // Add some curve to make routes visually distinct
                const offset = (index - 1) * 0.5;
                const midLat = originCity.lat + (destCity.lat - originCity.lat) * t + offset * Math.sin(t * Math.PI) * (Math.random() * 0.5 + 0.5);
                const midLng = originCity.lng + (destCity.lng - originCity.lng) * t + offset * Math.sin(t * Math.PI) * 0.3;
                waypoints.push({ lat: midLat, lng: midLng });
            }

            return {
                id: `route-${index + 1}`,
                name: opt.name,
                origin: { name: origin, ...originCity },
                destination: { name: destination, ...destCity },
                distance: Math.round(opt.distance),
                duration: Math.round(opt.duration),
                fuelType,
                carbonScore: carbon.carbonScore,
                co2Kg: carbon.co2Kg,
                fuelUsed: carbon.fuelUsed,
                pm25: carbon.pm25,
                nox: carbon.nox,
                waypoints,
                recommended: index === 0,
                savings: index === 0 ? 0 : Math.round((carbon.co2Kg - calculateCarbonFootprint(opt.distance, fuelType, undefined, trafficFactor * 0.85).co2Kg) * 100) / 100,
            };
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error optimizing route:', error);
        return NextResponse.json({ error: 'Failed to optimize route' }, { status: 500 });
    }
}
