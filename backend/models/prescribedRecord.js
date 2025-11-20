const mongoose = require("mongoose");

const prescribedRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      // Allowed file types as per the form
      enum: ["pdf", "jpg", "jpeg", "png", "doc", "docx"],
    },
    fileSize: {
      type: Number, // in bytes
      required: true,
      max: 10 * 1024 * 1024, // 10MB max as specified in the form
    },
    uploadedBy: {
      type: String,
      enum: ["Patient", "Doctor"],
      default: "Patient",
    },
  },
  { timestamps: true }
);

const PrescribedRecord = mongoose.model(
  "PrescribedRecord",
  prescribedRecordSchema
);

module.exports = PrescribedRecord;
