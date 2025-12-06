import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Profile from '@/models/profile';
import { verifyUser } from '@/lib/verifyUser';

export async function GET(req) {
    await dbConnect();

    const { userId, errorResponse } = await verifyUser(req);
    
    if (errorResponse) {
        return errorResponse;
    }

    try {
        const profile = await Profile.findOne({ userId });

        return NextResponse.json({
            success: true,
            data: profile
        }, { status: 200 });

    } catch (err) {
        return NextResponse.json({
            success: false,
            message: err.message
        }, { status: 500 });
    }
}

export async function PATCH(req) {
    await dbConnect();

    const { userId, errorResponse } = await verifyUser(req);
    if (errorResponse) {
        return errorResponse;
    }

    try {
        const body = await req.json();
        const { personalInfo, insuranceInfo, emergencyContact, allergies, chronicConditions } = body;

        // Check if profile already exists for the user
        let profile = await Profile.findOne({ userId });

        if (profile) {
            // Update existing profile
            profile.personalInfo = { ...personalInfo, email: profile.personalInfo.email };
            profile.insuranceInfo = insuranceInfo;
            profile.emergencyContact = emergencyContact; 
            profile.allergies = allergies;
            profile.chronicConditions = chronicConditions;

            const updatedProfile = await profile.save();
            return NextResponse.json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedProfile
            }, { status: 200 });
        }

        // Create new profile
        const newProfile = new Profile({
            userId,
            personalInfo,
            insuranceInfo,
            emergencyContact,
            allergies,
            chronicConditions
        });

        const savedProfile = await newProfile.save();
        return NextResponse.json({
            success: true,
            message: 'Profile created successfully',
            data: savedProfile
        }, { status: 201 });

    } catch (error) {
        console.error('Error saving profile:', error);
        return NextResponse.json({
            success: false,
            message: 'Error saving profile',
            error: error.message
        }, { status: 500 });
    }
}