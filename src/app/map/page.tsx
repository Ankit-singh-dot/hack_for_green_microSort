'use client';
import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';

// Dynamically import map to avoid SSR issues
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

interface Vehicle {
    id: string;
    name: string;
    type: string;
    licensePlate: string;
    fuelType: string;
    bs6Compliant: boolean;
    currentLat: number;
    currentLng: number;
    status: string;
    readings: Array<{ co2: number; pm25: number; speed: number }>;
}

interface EmissionZone {
    id: string;
    name: string;
    type: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
}

export default function MapPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [zones, setZones] = useState<EmissionZone[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [vRes, zRes] = await Promise.all([
                fetch('/api/vehicles'),
                fetch('/api/zones'),
            ]);
            const [vData, zData] = await Promise.all([vRes.json(), zRes.json()]);
            setVehicles(vData);
            setZones(zData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span className="loading-text">Loading map data...</span>
            </div>
        );
    }

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Live Fleet Map</h2>
                    <p>Real-time vehicle tracking with emission zone overlays</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={fetchData}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            <div className="map-container">
                <MapView vehicles={vehicles} zones={zones} />
            </div>
        </>
    );
}
