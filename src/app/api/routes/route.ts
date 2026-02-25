import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const routes = await prisma.route.findMany({
            include: { vehicle: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        return NextResponse.json(routes);
    } catch (error) {
        console.error('Error fetching routes:', error);
        return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
    }
}
