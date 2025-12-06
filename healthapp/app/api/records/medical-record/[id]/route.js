import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MedicalRecord from '@/models/medicalRecord';
import { verifyUser } from '@/lib/verifyUser';
import path from 'path';
import fs from 'fs';

export async function DELETE(req, { params }) {
    await dbConnect();
    const { userId, errorResponse } = await verifyUser(req);
    if (errorResponse) {
        return errorResponse;
    }

    try {
        const resolvedParams = await params;
        const recordId = resolvedParams.id;

        const medicalRecord = await MedicalRecord.findById(recordId);

        if (!medicalRecord) {
            return NextResponse.json({
                success: false,
                message: "Medical record not found",
            }, { status: 404 });
        }

        if (medicalRecord.userId.toString() !== userId) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized to delete this record",
            }, { status: 403 });
        }

        if (medicalRecord.fileUrl) {
            const storageDir = path.join(process.cwd(), 'storage');
            const filePath = path.join(storageDir, medicalRecord.fileUrl);

            try {
                if (fs.existsSync(filePath)) { 
                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${filePath}`);
                } else {
                    console.warn(`File not found at path: ${filePath}`);
                }
            } catch (fileErr) {
                console.error("Error deleting physical file:", fileErr);
            }
        }

        await MedicalRecord.findByIdAndDelete(recordId);

        return NextResponse.json({
            success: true,
            message: "Medical record deleted successfully",
        }, { status: 200 });

    } catch (error) {
        console.error("Error deleting medical record:", error);
        return NextResponse.json({
            success: false,
            message: "Error deleting medical record",
            error: error.message,
        }, { status: 500 });
    }
}