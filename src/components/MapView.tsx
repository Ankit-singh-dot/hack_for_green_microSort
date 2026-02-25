'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const statusColors: Record<string, string> = {
    active: '#00ff87',
    idle: '#ffd43b',
    maintenance: '#ff4757',
};

const zoneColors: Record<string, string> = {
    green: '#00ff87',
    restricted: '#ff4757',
    industrial: '#ffd43b',
};

function createVehicleIcon(status: string, fuelType: string) {
    const color = statusColors[status] || '#8899b4';
    const label = fuelType === 'electric' ? 'EV' : fuelType === 'cng' ? 'CNG' : 'DSL';
    return L.divIcon({
        className: '',
        html: `<div style="
      background: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      color: #fff;
      letter-spacing: 0.3px;
    ">${label}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
    });
}

function MapFixer() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 100);
    }, [map]);
    return null;
}

export default function MapView({
    vehicles,
    zones,
}: {
    vehicles: Vehicle[];
    zones: EmissionZone[];
}) {
    return (
        <MapContainer
            center={[22.5, 78.5]}
            zoom={5}
            style={{ height: '100%', width: '100%', background: '#0a1128' }}
            zoomControl={true}
        >
            <MapFixer />
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Emission zones */}
            {zones.map((zone) => (
                <Circle
                    key={zone.id}
                    center={[zone.centerLat, zone.centerLng]}
                    radius={zone.radiusKm * 1000}
                    pathOptions={{
                        color: zoneColors[zone.type] || '#8899b4',
                        fillColor: zoneColors[zone.type] || '#8899b4',
                        fillOpacity: 0.15,
                        weight: 2,
                        dashArray: zone.type === 'restricted' ? '8, 4' : undefined,
                    }}
                >
                    <Popup>
                        <div style={{ fontFamily: 'Inter, sans-serif', color: '#333' }}>
                            <strong>{zone.name}</strong>
                            <br />
                            <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600,
                                background: zone.type === 'green' ? '#d4f7dc' : zone.type === 'restricted' ? '#fde4e4' : '#fff3cd',
                                color: zone.type === 'green' ? '#0d7a2e' : zone.type === 'restricted' ? '#c0392b' : '#856404',
                                marginTop: 4,
                            }}>
                                {zone.type.toUpperCase()} ZONE
                            </span>
                            <br />
                            <small>Radius: {zone.radiusKm} km</small>
                        </div>
                    </Popup>
                </Circle>
            ))}

            {/* Vehicles */}
            {vehicles.map((vehicle) => {
                const latestReading = vehicle.readings?.[0];
                return (
                    <Marker
                        key={vehicle.id}
                        position={[vehicle.currentLat, vehicle.currentLng]}
                        icon={createVehicleIcon(vehicle.status, vehicle.fuelType)}
                    >
                        <Popup>
                            <div style={{ fontFamily: 'Inter, sans-serif', color: '#333', minWidth: 180 }}>
                                <strong style={{ fontSize: 14 }}>{vehicle.name}</strong>
                                <br />
                                <span style={{ fontSize: 12, color: '#666' }}>{vehicle.licensePlate}</span>
                                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '8px 0' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
                                    <span>Type:</span><strong>{vehicle.type}</strong>
                                    <span>Fuel:</span><strong>{vehicle.fuelType}</strong>
                                    <span>Status:</span>
                                    <strong style={{ color: statusColors[vehicle.status] }}>{vehicle.status}</strong>
                                    <span>BS-VI:</span>
                                    <strong style={{ color: vehicle.bs6Compliant ? '#16a34a' : '#dc2626' }}>
                                        {vehicle.bs6Compliant ? 'Yes' : 'No'}
                                    </strong>
                                    {latestReading && (
                                        <>
                                            <span>CO₂:</span><strong>{latestReading.co2.toFixed(1)} g/km</strong>
                                            <span>PM2.5:</span><strong>{latestReading.pm25.toFixed(1)} µg/m³</strong>
                                            <span>Speed:</span><strong>{latestReading.speed.toFixed(0)} km/h</strong>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Map legend */}
            <div className="map-legend">
                <h4>Legend</h4>
                <div className="map-legend-item">
                    <div className="map-legend-dot" style={{ backgroundColor: '#00ff87' }} /> Green Zone
                </div>
                <div className="map-legend-item">
                    <div className="map-legend-dot" style={{ backgroundColor: '#ff4757' }} /> Restricted
                </div>
                <div className="map-legend-item">
                    <div className="map-legend-dot" style={{ backgroundColor: '#ffd43b' }} /> Industrial
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />
                <div className="map-legend-item">
                    DSL = Diesel &nbsp; CNG = CNG &nbsp; EV = Electric
                </div>
            </div>
        </MapContainer>
    );
}
