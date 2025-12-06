import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/checkUser';

export async function POST(req) {
    const userId = await getAuthenticatedUser(req);

    if (!userId) {
        return NextResponse.json({
            success: false,
            message: 'No user logged in.'
        }, { status: 404 });
    }

    const response = NextResponse.json({
        success: true,
        message: 'Logout successful'
    }, { status: 200 });

    const isProd = process.env.NODE_ENV === 'production';
    
    response.cookies.set('token', '', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
        maxAge: 0
    });

    return response;
}