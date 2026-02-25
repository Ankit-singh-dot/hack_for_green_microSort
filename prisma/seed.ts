import prisma from '@/lib/prisma';
import { SEED_VEHICLES, EMISSION_ZONES } from '@/lib/constants';

async function seed() {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await prisma.carbonReading.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.route.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.emissionZone.deleteMany();
    await prisma.weatherCache.deleteMany();

    // Seed vehicles
    for (const v of SEED_VEHICLES) {
        await prisma.vehicle.create({ data: v });
    }
    console.log(`✅ Seeded ${SEED_VEHICLES.length} vehicles`);

    // Seed emission zones
    for (const z of EMISSION_ZONES) {
        await prisma.emissionZone.create({ data: z });
    }
    console.log(`✅ Seeded ${EMISSION_ZONES.length} emission zones`);

    // Seed carbon readings (last 24 hours)
    const vehicles = await prisma.vehicle.findMany();
    const now = Date.now();
    for (const vehicle of vehicles) {
        for (let i = 0; i < 24; i++) {
            const baseC02 = vehicle.fuelType === 'electric' ? 0 : vehicle.fuelType === 'cng' ? 120 : 180;
            await prisma.carbonReading.create({
                data: {
                    vehicleId: vehicle.id,
                    co2: baseC02 + Math.random() * 60 - 30,
                    pm25: Math.random() * 50,
                    nox: Math.random() * 0.1,
                    speed: 20 + Math.random() * 60,
                    createdAt: new Date(now - i * 3600000),
                },
            });
        }
    }
    console.log('✅ Seeded carbon readings');

    // Seed alerts
    const alertTypes = [
        { type: 'zone_violation', severity: 'high', message: 'Vehicle entered Delhi Green Belt zone without authorization' },
        { type: 'emission_spike', severity: 'critical', message: 'CO2 emissions exceeded 250 g/km threshold' },
        { type: 'weather_alert', severity: 'medium', message: 'Heavy rain advisory - route carbon impact increased by 20%' },
        { type: 'compliance', severity: 'high', message: 'Vehicle not BS-VI compliant - operating in restricted zone' },
        { type: 'emission_spike', severity: 'medium', message: 'PM2.5 emissions above normal range during idle' },
        { type: 'zone_violation', severity: 'critical', message: 'Heavy vehicle detected in Mumbai Coastal Regulation Zone' },
        { type: 'weather_alert', severity: 'low', message: 'High temperature advisory - fuel consumption may increase' },
        { type: 'compliance', severity: 'critical', message: 'Non BS-VI vehicle attempting to enter green zone' },
    ];

    for (let i = 0; i < alertTypes.length; i++) {
        const vehicle = vehicles[i % vehicles.length];
        await prisma.alert.create({
            data: {
                vehicleId: vehicle.id,
                ...alertTypes[i],
                resolved: i > 4,
                createdAt: new Date(now - Math.random() * 86400000),
            },
        });
    }
    console.log('✅ Seeded alerts');

    // Seed some routes
    const routes = [
        { originName: 'Delhi', originLat: 28.6139, originLng: 77.209, destName: 'Jaipur', destLat: 26.9124, destLng: 75.7873, distance: 281, duration: 300, carbonScore: 42.5, fuelUsed: 33.7, status: 'completed' },
        { originName: 'Mumbai', originLat: 19.076, originLng: 72.8777, destName: 'Pune', destLat: 18.5204, destLng: 73.8567, distance: 149, duration: 180, carbonScore: 22.1, fuelUsed: 17.9, status: 'completed' },
        { originName: 'Bangalore', originLat: 12.9716, originLng: 77.5946, destName: 'Chennai', destLat: 13.0827, destLng: 80.2707, distance: 346, duration: 360, carbonScore: 0, fuelUsed: 0, status: 'active' },
        { originName: 'Kolkata', originLat: 22.5726, originLng: 88.3639, destName: 'Lucknow', destLat: 26.8467, destLng: 80.9462, distance: 985, duration: 900, carbonScore: 78.3, fuelUsed: 118.2, status: 'completed' },
        { originName: 'Hyderabad', originLat: 17.385, originLng: 78.4867, destName: 'Nagpur', destLat: 21.1458, destLng: 79.0882, distance: 504, duration: 540, carbonScore: 55.2, fuelUsed: 60.5, status: 'planned' },
    ];

    for (let i = 0; i < routes.length; i++) {
        await prisma.route.create({
            data: {
                vehicleId: vehicles[i].id,
                ...routes[i],
            },
        });
    }
    console.log('✅ Seeded routes');

    // Seed weather cache
    const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'];
    for (const city of cities) {
        await prisma.weatherCache.create({
            data: {
                city,
                temp: 25 + Math.random() * 15,
                humidity: 40 + Math.random() * 40,
                windSpeed: 5 + Math.random() * 20,
                aqi: Math.floor(50 + Math.random() * 200),
                condition: ['Clear', 'Cloudy', 'Haze', 'Rain', 'Mist'][Math.floor(Math.random() * 5)],
            },
        });
    }
    console.log('✅ Seeded weather cache');

    console.log('🎉 Seeding complete!');
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
