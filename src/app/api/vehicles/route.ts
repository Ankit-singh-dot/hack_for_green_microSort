import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const vehicles = await prisma.vehicle.findMany({
            include: {
                readings: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                _count: {
                    select: { alerts: { where: { resolved: false } } },
                },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const vehicle = await prisma.vehicle.create({ data: body });
        return NextResponse.json(vehicle, { status: 201 });
    } catch (error) {
        console.error('Error creating vehicle:', error);
        return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
    }
}
