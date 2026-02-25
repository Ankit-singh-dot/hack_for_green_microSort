// Carbon footprint calculation engine
// BS-VI emission factors (g CO2/km) by fuel type
const EMISSION_FACTORS: Record<string, number> = {
    diesel: 2.68,    // kg CO2 per liter
    cng: 2.75,       // kg CO2 per kg
    electric: 0.0,   // zero direct emissions
    petrol: 2.31,    // kg CO2 per liter
};

// Fuel consumption rates (liters/km or kg/km for CNG)
const FUEL_CONSUMPTION: Record<string, number> = {
    diesel: 0.12,    // 12L/100km for trucks
    cng: 0.15,       // kg/km
    electric: 0.0,
    petrol: 0.10,
};

// PM2.5 emission factors (g/km)
const PM25_FACTORS: Record<string, number> = {
    diesel: 0.045,
    cng: 0.002,
    electric: 0.0,
    petrol: 0.005,
};

// NOx emission factors (g/km) - BS-VI compliant
const NOX_FACTORS: Record<string, number> = {
    diesel: 0.08,
    cng: 0.02,
    electric: 0.0,
    petrol: 0.06,
};

export interface CarbonResult {
    co2Kg: number;
    fuelUsed: number;
    pm25: number;
    nox: number;
    carbonScore: number; // 0-100, lower is better
}

export interface WeatherFactor {
    temp: number;
    humidity: number;
    windSpeed: number;
    aqi: number;
}

export function calculateCarbonFootprint(
    distanceKm: number,
    fuelType: string,
    weather?: WeatherFactor,
    trafficFactor: number = 1.0
): CarbonResult {
    const fuel = fuelType.toLowerCase();
    const baseFuelConsumption = FUEL_CONSUMPTION[fuel] || FUEL_CONSUMPTION.diesel;
    const emissionFactor = EMISSION_FACTORS[fuel] || EMISSION_FACTORS.diesel;

    // Weather multiplier: extreme heat/cold increases fuel consumption
    let weatherMultiplier = 1.0;
    if (weather) {
        if (weather.temp > 40 || weather.temp < 5) weatherMultiplier += 0.15;
        if (weather.humidity > 80) weatherMultiplier += 0.05;
        if (weather.windSpeed > 30) weatherMultiplier += 0.1;
        // Bad AQI means heavier traffic/idling
        if (weather.aqi > 200) weatherMultiplier += 0.2;
        else if (weather.aqi > 150) weatherMultiplier += 0.1;
    }

    const adjustedConsumption = baseFuelConsumption * trafficFactor * weatherMultiplier;
    const fuelUsed = adjustedConsumption * distanceKm;
    const co2Kg = fuelUsed * emissionFactor;
    const pm25 = (PM25_FACTORS[fuel] || 0) * distanceKm * trafficFactor;
    const nox = (NOX_FACTORS[fuel] || 0) * distanceKm * trafficFactor;

    // Carbon score: normalized 0-100 (0 = zero emissions, 100 = worst)
    const maxCo2PerKm = 0.5; // 500g/km threshold
    const co2PerKm = co2Kg / Math.max(distanceKm, 1);
    const carbonScore = Math.min(100, Math.round((co2PerKm / maxCo2PerKm) * 100));

    return { co2Kg: Math.round(co2Kg * 100) / 100, fuelUsed: Math.round(fuelUsed * 100) / 100, pm25: Math.round(pm25 * 1000) / 1000, nox: Math.round(nox * 1000) / 1000, carbonScore };
}

export function getTrafficFactor(hour?: number): number {
    const h = hour ?? new Date().getHours();
    // Rush hours: 8-10 AM and 5-8 PM
    if ((h >= 8 && h <= 10) || (h >= 17 && h <= 20)) return 1.4;
    // Moderate traffic
    if ((h >= 11 && h <= 16)) return 1.1;
    // Night - low traffic
    return 0.8;
}

export function rankRoutesByCarbon(
    routes: Array<{ distance: number; duration: number; waypoints: string }>,
    fuelType: string,
    weather?: WeatherFactor
): Array<{ distance: number; duration: number; waypoints: string; carbon: CarbonResult; rank: number }> {
    const trafficFactor = getTrafficFactor();

    const scored = routes.map(route => ({
        ...route,
        carbon: calculateCarbonFootprint(route.distance, fuelType, weather, trafficFactor),
        rank: 0,
    }));

    scored.sort((a, b) => a.carbon.carbonScore - b.carbon.carbonScore);
    scored.forEach((r, i) => { r.rank = i + 1; });

    return scored;
}
