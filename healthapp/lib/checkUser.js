import jwt from 'jsonwebtoken';
import User from '@/models/user';
import dbConnect from '@/lib/dbConnect';

export async function getAuthenticatedUser(request) {
    await dbConnect();

    // Get token from cookie 
    const tokenCookie = request.cookies.get('token');
    const token = tokenCookie?.value;

    if (!token) {
        return null;
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const user = await User.findById(decoded.userId).select('+isEmailVerified');

        if (!user || !user.isEmailVerified) {
            return null;
        }

        // Return user ID to request object
        return decoded.userId;

    } catch (err) {
        return null;
    }
}