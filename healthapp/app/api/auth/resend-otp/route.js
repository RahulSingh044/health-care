import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import OTP from '@/models/otp';
import { sendOTPEmail } from '@/lib/nodemailer';

export async function POST(req) {
    await dbConnect();

    try {
        const body = await req.json();
        const { email } = body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+isEmailVerified');
        
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Don't send OTP if email is already verified
        if (user.isEmailVerified) {
            return NextResponse.json({
                success: false,
                message: 'Email is already verified'
            }, { status: 400 });
        }

         // Generate and send new OTP
        const otpDoc = await OTP.createOTP(email);
        const emailResult = await sendOTPEmail(email, otpDoc.otp);

        if (!emailResult.success) {
             return NextResponse.json({
                success: false,
                message: 'Failed to send OTP email',
                error: emailResult.error
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully'
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Failed to resend OTP',
            error: error.message
        }, { status: 500 });
    }
}