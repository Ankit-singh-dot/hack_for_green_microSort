import { NextResponse } from 'next/server';

const INDIAN_CITIES_WAQI: Record<string, string> = {
    'Delhi': 'delhi',
    'Mumbai': 'mumbai',
    'Bangalore': 'bangalore',
    'Chennai': 'chennai',
    'Kolkata': 'kolkata',
    'Hyderabad': 'hyderabad',
    'Pune': 'pune',
    'Ahmedabad': 'ahmedabad',
    'Jaipur': 'jaipur',
    'Lucknow': 'lucknow',
};

interface WeatherResult {
    city: string;
    aqi: number;
    pm25: number;
    pm10: number;
    temp: number;
    humidity: number;
    windSpeed: number;
    dominantPollutant: string;
    status: string;
    weatherCondition: string;
    feelsLike: number;
}

function getAQIStatus(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');
        const waqiKey = process.env.WAQI_API_KEY;
        const owmKey = process.env.OPENWEATHER_API_KEY;

        if (!waqiKey) {
            return NextResponse.json({ error: 'WAQI API key not configured' }, { status: 500 });
        }

        // If specific city requested
        if (city) {
            const waqiCity = INDIAN_CITIES_WAQI[city] || city.toLowerCase();

            // Fetch both APIs in parallel
            const [waqiRes, owmRes] = await Promise.all([
                fetch(`https://api.waqi.info/feed/${waqiCity}/?token=${waqiKey}`),
                owmKey
                    ? fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${owmKey}&units=metric`)
                    : Promise.resolve(null),
            ]);

            const waqiData = await waqiRes.json();
            const owmData = owmRes ? await owmRes.json() : null;

            if (waqiData.status !== 'ok') {
                return NextResponse.json({ error: 'Failed to fetch AQI data' }, { status: 500 });
            }

            const result: WeatherResult = {
                city,
                aqi: waqiData.data.aqi,
                pm25: waqiData.data.iaqi?.pm25?.v || 0,
                pm10: waqiData.data.iaqi?.pm10?.v || 0,
                temp: owmData?.main?.temp ?? waqiData.data.iaqi?.t?.v ?? 0,
                humidity: owmData?.main?.humidity ?? waqiData.data.iaqi?.h?.v ?? 0,
                windSpeed: owmData?.wind?.speed ?? waqiData.data.iaqi?.w?.v ?? 0,
                dominantPollutant: waqiData.data.dominentpol || 'unknown',
                status: getAQIStatus(waqiData.data.aqi),
                weatherCondition: owmData?.weather?.[0]?.description || 'N/A',
                feelsLike: owmData?.main?.feels_like ?? 0,
            };

            return NextResponse.json(result);
        }

        // Fetch all Indian cities
        const results: WeatherResult[] = [];
        const cities = Object.entries(INDIAN_CITIES_WAQI);

        for (const [name, waqiName] of cities) {
            try {
                // Fetch WAQI + OpenWeatherMap in parallel per city
                const [waqiRes, owmRes] = await Promise.all([
                    fetch(`https://api.waqi.info/feed/${waqiName}/?token=${waqiKey}`),
                    owmKey
                        ? fetch(`https://api.openweathermap.org/data/2.5/weather?q=${name},IN&appid=${owmKey}&units=metric`)
                        : Promise.resolve(null),
                ]);

                const waqiData = await waqiRes.json();
                const owmData = owmRes ? await owmRes.json() : null;

                if (waqiData.status === 'ok') {
                    results.push({
                        city: name,
                        aqi: waqiData.data.aqi,
                        pm25: waqiData.data.iaqi?.pm25?.v || 0,
                        pm10: waqiData.data.iaqi?.pm10?.v || 0,
                        temp: owmData?.main?.temp ?? waqiData.data.iaqi?.t?.v ?? 0,
                        humidity: owmData?.main?.humidity ?? waqiData.data.iaqi?.h?.v ?? 0,
                        windSpeed: owmData?.wind?.speed ?? waqiData.data.iaqi?.w?.v ?? 0,
                        dominantPollutant: waqiData.data.dominentpol || 'unknown',
                        status: getAQIStatus(waqiData.data.aqi),
                        weatherCondition: owmData?.weather?.[0]?.description || 'N/A',
                        feelsLike: owmData?.main?.feels_like ?? 0,
                    });
                }
            } catch {
                continue;
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
    }
}
