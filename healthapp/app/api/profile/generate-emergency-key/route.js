import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import EmergencyAccessKey from '@/models/emergencyAccessKey';
import { verifyUser } from '@/lib/verifyUser';
import crypto from 'crypto';

export async function POST(req) {
    await dbConnect();

    const { userId, errorResponse } = await verifyUser(req);
    if (errorResponse) {
        return errorResponse;
    }

    try {
        // Generate an alphanumeric key with hyphens
        const generateKey = () => {
            const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let key = '';
            for (let i = 0; i < 16; i++) {
                if (i > 0 && i % 4 === 0) key += '-';
                const randomIndex = crypto.randomInt(0, chars.length);
                key += chars[randomIndex];
            }
            return key;
        };
        
        const accessKey = generateKey();
        
        // Check if there's an existing key for this user and remove it
        await EmergencyAccessKey.deleteMany({ userId });
        
         // Create new emergency access key
        const emergencyKey = new EmergencyAccessKey({
            userId,
            accessKey
        });
        
        await emergencyKey.save();
        
        return NextResponse.json({
            success: true,
            message: 'Emergency access key generated successfully',
            data: {
                accessKey,
                expiresIn: '10 minutes'
            }
        }, { status: 201 });
        
    } catch (error) {
        console.error('Error generating emergency access key:', error);
        return NextResponse.json({
            success: false,
            message: 'Error generating emergency access key',
            error: error.message
        }, { status: 500 });
    }
}