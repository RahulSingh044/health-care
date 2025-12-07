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
        const conditionId = resolvedParams.id;
        
        const profile = await Profile.findOne({ userId });

        if (!profile) {
            return NextResponse.json({
                success: false,
                message: 'Profile not found'
            }, { status: 404 });
        }

        const index = profile.chronicConditions.findIndex(condition => condition && condition._id.toString() === conditionId);
        if (index === -1) {
            return NextResponse.json({
                success: false,
                message: 'Chronic condition not found'
            }, { status: 404 });
        }

        profile.chronicConditions.splice(index, 1);
        
        profile.chronicConditions = profile.chronicConditions.filter(c => c !== null);

        await profile.save();

        return NextResponse.json({
            success: true,
            message: 'Chronic condition deleted successfully',
            data: profile
        }, { status: 200 });

    } catch (error) {
        console.error('Error deleting chronic condition:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal server error',
            error: error.message
        }, { status: 500 });
    }
}