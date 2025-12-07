import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import { getAuthenticatedUser } from '@/lib/checkUser';

export async function POST(req) {
    await dbConnect();

    // Check if user is already logged in
    const loggedInUserId = await getAuthenticatedUser(req);
    if (loggedInUserId) {
        return NextResponse.json({
            success: false,
            message: 'User already logged in.'
        }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { email, password } = body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password +isEmailVerified');
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return NextResponse.json({
                success: false,
                message: 'Invalid password'
            }, { status: 400 });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
        }, { status: 200 });

        // Set Cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 60 * 60 * 24 // 1 day 
        });

        return response;

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({
            success: false,
            message: 'Login failed',
            error: error.message
        }, { status: 500 });
    }
}