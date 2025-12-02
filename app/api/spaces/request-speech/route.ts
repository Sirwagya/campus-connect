import { NextResponse } from 'next/server';

const legacyResponse = NextResponse.json(
    { error: 'This legacy spaces endpoint has been retired.' },
    { status: 410 }
);

export function POST() {
    return legacyResponse;
}
