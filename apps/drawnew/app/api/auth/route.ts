import { NextResponse } from 'next/server';
import { HTTP_BACKEND } from '@/config';


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, ...data } = body;

        if (!type || (type !== 'signin' && type !== 'signup')) {
            return NextResponse.json(
                { message: 'Invalid request type' },
                { status: 400 }
            );
        }

        const endpoint = type === 'signin' ? '/signin' : '/signup';
        const response = await fetch(`${HTTP_BACKEND}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: responseData.message || `${type} failed` },
                { status: response.status }
            );
        }

        return NextResponse.json(responseData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
 