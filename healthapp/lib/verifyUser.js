import jwt from 'jsonwebtoken';
import User from '@/models/user';
import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';

export async function verifyUser(request) {
    try {
        await dbConnect();

        // Get token from cookie
        const tokenCookie = request.cookies.get('token');
        
        if (!tokenCookie || !tokenCookie.value) {
            return {
                userId: null,
                errorResponse: NextResponse.json({
                    success: false,
                    message: 'Access denied. No token provided in cookies.'
                }, { status: 401 })
            };
        }

        const token = tokenCookie.value;

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if user still exists
            const user = await User.findById(decoded.userId).select('+isEmailVerified');

            if (!user) {
                const response = NextResponse.json({
                    success: false,
                    message: 'User not found.'
                }, { status: 404 });
                
                response.cookies.delete('token');
                return { userId: null, errorResponse: response };
            }

            // Check if user is verified
            if (!user.isEmailVerified) {
                const response = NextResponse.json({
                    success: false,
                    message: 'Please re-register your email first. The verification is incomplete.'
                }, { status: 401 });

                response.cookies.delete('token');
                return { userId: null, errorResponse: response };
            }

            // Return user ID to request object
            return { userId: decoded.userId, errorResponse: null };

        } catch (error) {
            let message = 'Invalid token.';
            if (error.name === 'TokenExpiredError') {
                message = 'Token has expired. Please login again.';
            }

            const response = NextResponse.json({
                success: false,
                message: message
            }, { status: 401 });

            response.cookies.delete('token');
            return { userId: null, errorResponse: response };
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        return {
            userId: null,
            errorResponse: NextResponse.json({
                success: false,
                message: 'Internal server error'
            }, { status: 500 })
        };
    }
}