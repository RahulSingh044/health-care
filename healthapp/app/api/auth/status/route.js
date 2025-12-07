import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import { getAuthenticatedUser } from '@/lib/checkUser';

export async function GET(req) {
    await dbConnect();

    const userId = await getAuthenticatedUser(req);

    if (!userId) {
        return NextResponse.json({
            success: false,
            message: 'No user logged in.'
        }, { status: 404 });
    }

    try {
        const user = await User.findById(userId).select('-_id -__v');

        if (!user) {
             return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'User logged in',
            user: user
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Failed to check user status',
            error: error.message
        }, { status: 500 });
    }
}