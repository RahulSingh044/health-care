import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MedicalRecord from '@/models/medicalRecord';
import { verifyUser } from '@/lib/verifyUser';

export async function GET(req) {
    await dbConnect();

    const { userId, errorResponse } = await verifyUser(req);
    if (errorResponse) {
        return errorResponse;
    }

    try {
        const records = await MedicalRecord.find({ userId: userId })
        .select("recordType date title description fileUrl fileName fileType fileSize createdAt _id")
        .sort({ date: -1 }); 

        return NextResponse.json({
            success: true,
            data: records,
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching records:", error);
        return NextResponse.json({
            success: false,
            message: "Error fetching records",
            error: error.message,
        }, { status: 500 });
    }
}