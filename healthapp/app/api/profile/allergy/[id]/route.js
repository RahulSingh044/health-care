import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Profile from '@/models/profile';
import { verifyUser } from '@/lib/verifyUser';

export async function DELETE(req, { params }) {
    await dbConnect();

    const { userId, errorResponse } = await verifyUser(req);
    if (errorResponse) {
        return errorResponse;
    }

    try {
        const resolvedParams = await params;
        const allergyId = resolvedParams.id;
        const profile = await Profile.findOne({ userId });

        if (!profile) {
            return NextResponse.json({
                success: false,
                message: 'Profile not found'
            }, { status: 404 });
        }

        const index = profile.allergies.findIndex(allergy => allergy && allergy._id.toString() === allergyId);
        
        if (index === -1) {
            return NextResponse.json({
                success: false,
                message: 'Allergy not found'
            }, { status: 404 });
        }

        profile.allergies.splice(index, 1);
        await profile.save();

        return NextResponse.json({
            success: true,
            message: 'Allergy deleted successfully',
            data: profile
        }, { status: 200 });

    } catch (error) {
        console.error('Error deleting allergy:', error);
        return NextResponse.json({
            success: false,
            message: 'Error deleting allergy',
            error: error.message
        }, { status: 500 });
    }
}