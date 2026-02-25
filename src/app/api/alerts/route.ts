import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const alerts = await prisma.alert.findMany({
            include: { vehicle: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return NextResponse.json(alerts);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id } = await request.json();
        const alert = await prisma.alert.update({
            where: { id },
            data: { resolved: true },
        });
        return NextResponse.json(alert);
    } catch (error) {
        console.error('Error resolving alert:', error);
        return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 });
    }
}
