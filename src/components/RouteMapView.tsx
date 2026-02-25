'use client';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

interface Route {
    id: string;
    name: string;
    origin: { name: string; lat: number; lng: number };
    destination: { name: string; lat: number; lng: number };
    waypoints: Array<{ lat: number; lng: number }>;
    carbonScore: number;
    co2Kg: number;
    recommended: boolean;
}

const routeColors = ['#00ff87', '#ffd43b', '#ff4757'];

function createCityIcon(label: string, color: string) {
    return L.divIcon({
        className: '',
        html: `<div style="
      background: ${color};
      color: #000;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-family: Inter, sans-serif;
    ">${label}</div>`,
        iconAnchor: [40, 12],
    });
}

function FitBounds({ routes, selectedIndex }: { routes: Route[]; selectedIndex: number }) {
    const map = useMap();
    useEffect(() => {
        if (routes.length > 0) {
            const route = routes[selectedIndex];
            const points = route.waypoints.map(w => [w.lat, w.lng] as [number, number]);
            if (points.length > 0) {
                map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
            }
        }
    }, [routes, selectedIndex, map]);
    return null;
}

export default function RouteMapView({
    routes,
    selectedIndex,
}: {
    routes: Route[];
    selectedIndex: number;
}) {
    if (routes.length === 0) return null;

    const selectedRoute = routes[selectedIndex];

    return (
        <MapContainer
            center={[22.5, 78.5]}
            zoom={5}
            style={{ height: '100%', width: '100%', background: '#0a1128' }}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap'
            />
            <FitBounds routes={routes} selectedIndex={selectedIndex} />

            {/* Draw all routes */}
            {routes.map((route, i) => (
                <Polyline
                    key={route.id}
                    positions={route.waypoints.map(w => [w.lat, w.lng] as [number, number])}
                    pathOptions={{
                        color: routeColors[i] || '#8899b4',
                        weight: i === selectedIndex ? 5 : 2,
                        opacity: i === selectedIndex ? 1 : 0.3,
                        dashArray: i === selectedIndex ? undefined : '8, 4',
                    }}
                >
                    <Popup>
                        <div style={{ fontFamily: 'Inter, sans-serif' }}>
                            <strong>{route.name}</strong><br />
                            CO₂: {route.co2Kg} kg | Score: {route.carbonScore}
                        </div>
                    </Popup>
                </Polyline>
            ))}

            {/* Origin & Destination markers */}
            <Marker
                position={[selectedRoute.origin.lat, selectedRoute.origin.lng]}
                icon={createCityIcon(`📍 ${selectedRoute.origin.name}`, '#00ff87')}
            />
            <Marker
                position={[selectedRoute.destination.lat, selectedRoute.destination.lng]}
                icon={createCityIcon(`🏁 ${selectedRoute.destination.name}`, '#ff4757')}
            />
        </MapContainer>
    );
}
