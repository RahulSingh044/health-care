import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PrescribedRecord from '@/models/prescribedRecord';
import { verifyUser } from '@/lib/verifyUser';

export async function GET(req) {
    await dbConnect();

    const { userId, errorResponse } = await verifyUser(req);
    if (errorResponse) {
        return errorResponse;
    }

    try {
        const records = await PrescribedRecord.find({ userId: userId })
            .select("fileUrl fileName fileType fileSize createdAt _id uploadedBy")
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: records,
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Error fetching prescription records",
            error: error.message,
        }, { status: 500 });
    }
}