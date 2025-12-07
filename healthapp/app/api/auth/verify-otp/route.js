import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import OTP from '@/models/otp';

export async function POST(req) {
    await dbConnect();

    try {
        const body = await req.json();
        const { email, otp } = body;

        // Verify OTP
        const validity = await OTP.verifyOTP(email, otp);
        if (!validity.success) {
            return NextResponse.json(validity, { status: 400 });
        }

        // Update user verification status
        const user = await User.findOneAndUpdate(
            { email },
            { isEmailVerified: true },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isEmailVerified: user.isEmailVerified
            }
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Email verification failed',
            error: error.message
        }, { status: 500 });
    }
}