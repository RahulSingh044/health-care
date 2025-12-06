import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Profile from '@/models/profile';
import { verifyUser } from '@/lib/verifyUser';

export async function POST(req) {
    await dbConnect();

    const { userId, errorResponse } = await verifyUser(req);
    if (errorResponse) {
        return errorResponse;
    }

    try {
        const body = await req.json();
        const { allergy } = body;
        
        const profile = await Profile.findOne({ userId });
        if (!profile) {
            return NextResponse.json({
                success: false,
                message: 'Profile not found'
            }, { status: 404 });
        }

        profile.allergies.push(allergy);
        const updatedProfile = await profile.save();

        return NextResponse.json({
            success: true,
            message: 'Allergy added successfully',
            data: updatedProfile
        }, { status: 200 });

    } catch (error) {
        console.error('Error adding allergy:', error);
        return NextResponse.json({
            success: false,
            message: 'Error adding allergy',
            error: error.message
        }, { status: 500 });
    }
}