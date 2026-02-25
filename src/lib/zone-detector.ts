// Green zone / emission zone violation detection using Haversine distance

interface Zone {
    id: string;
    name: string;
    type: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    restrictions: string;
    active: boolean;
}

export interface ViolationResult {
    isViolating: boolean;
    zone: Zone | null;
    distance: number;
    message: string;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

export function checkZoneViolation(
    lat: number,
    lng: number,
    zones: Zone[]
): ViolationResult {
    for (const zone of zones) {
        if (!zone.active) continue;

        const distance = haversineDistance(lat, lng, zone.centerLat, zone.centerLng);

        if (distance <= zone.radiusKm) {
            const zoneTypeLabels: Record<string, string> = {
                green: '🌿 Green Zone',
                restricted: '🚫 Restricted Zone',
                industrial: '🏭 Industrial Zone',
            };

            return {
                isViolating: zone.type === 'green' || zone.type === 'restricted',
                zone,
                distance: Math.round(distance * 100) / 100,
                message: `Vehicle is inside ${zoneTypeLabels[zone.type] || zone.type}: ${zone.name} (${Math.round(distance * 100) / 100} km from center)`,
            };
        }
    }

    return {
        isViolating: false,
        zone: null,
        distance: -1,
        message: 'Vehicle is not in any restricted zone',
    };
}

export function checkRouteZoneConflicts(
    waypoints: Array<{ lat: number; lng: number }>,
    zones: Zone[]
): ViolationResult[] {
    const violations: ViolationResult[] = [];
    const checked = new Set<string>();

    for (const point of waypoints) {
        const result = checkZoneViolation(point.lat, point.lng, zones);
        if (result.isViolating && result.zone && !checked.has(result.zone.id)) {
            violations.push(result);
            checked.add(result.zone.id);
        }
    }

    return violations;
}
