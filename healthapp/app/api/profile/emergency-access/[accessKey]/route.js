import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import EmergencyAccessKey from '@/models/emergencyAccessKey';
import Profile from '@/models/profile';
import PrescribedRecord from '@/models/prescribedRecord';
import MedicalRecord from '@/models/medicalRecord';

export async function GET(req, { params }) {
    await dbConnect();

    try {
        const resolvedParams = await params;
        const { accessKey } = resolvedParams;

        const keyDoc = await EmergencyAccessKey.findOne({ accessKey });
        
        if (!keyDoc) {
            return NextResponse.json({
                success: false,
                message: 'Invalid or expired access key'
            }, { status: 404 });
        }

        const profile = await Profile.findOne({ userId: keyDoc.userId });
        
        if (!profile) {
            return NextResponse.json({
                 success: false,
                 message: 'Profile not found.'
             }, { status: 404 });
        }

        const medications = await PrescribedRecord.find({ userId: keyDoc.userId }).select('-userId -__v -createdAt -updatedAt');
        const medicalRecords = await MedicalRecord.find({ userId: keyDoc.userId }).select('-userId -__v -createdAt -updatedAt');
        
        // Extract only required emergency information
        const emergencyData = {
            personalInfo: profile.personalInfo,
            allergies: profile.allergies,
            chronicConditions: profile.chronicConditions,
            emergencyContact: profile.insuranceInfo,
            currentMedications: medications,
            medicalRecords: medicalRecords
        };

        return NextResponse.json({
            success: true,
            message: 'Emergency data retrieved successfully',
            data: emergencyData
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Error retrieving data',
            error: error.message
        }, { status: 500 });
    }
}