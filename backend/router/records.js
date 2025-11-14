const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const MedicalRecord = require("../models/medicalRecord");
const verifyUser = require("../middleware/verifyUser");
const PrescribedRecord = require("../models/prescribedRecord");

// Create storage directory if it doesn't exist
const storageDir = path.join(__dirname, "../storage");
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storageDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + path.basename(file.originalname);
    cb(null, uniqueSuffix);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    req.fileValidationError =
      "Invalid file type. Only PDF, JPG, PNG, and DOC files are allowed.";
    cb(null, false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload medical record
router.post(
  "/medical-record/upload",
  verifyUser,
  upload.single("file"),
  async (req, res) => {
    try {
      const { recordType, date, title, description } = req.body;

      // Check for file validation error
      if (req.fileValidationError) {
        return res.status(400).json({
          success: false,
          message: req.fileValidationError,
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Create new medical record
      const medicalRecord = new MedicalRecord({
        userId: req.userId,
        recordType: recordType || null,
        date: date || null,
        title: title || null,
        description: description || null,
        fileUrl: file ? file.filename : null,
        fileName: file ? file.originalname : null,
        fileType: file ? path.extname(file.originalname).substring(1) : null,
        fileSize: file ? file.size : null,
      });

      await medicalRecord.save();

      res.status(201).json({
        success: true,
        message: "Medical record uploaded successfully",
      });
    } catch (error) {
      // Delete uploaded file if record creation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Error uploading medical record:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading medical record",
        error: error.message,
      });
    }
  }
);

// Delete medical record
router.delete("/medical-record/:id", verifyUser, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id);

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    if (medicalRecord.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this record",
      });
    }

    await MedicalRecord.findByIdAndDelete(req.params.id);

    const filePath = path.join(storageDir, medicalRecord.fileUrl);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({
      success: true,
      message: "Medical record deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting medical record",
      error: error.message,
    });
  }
});

// Get all records for a user
router.get("/medical-record/all", verifyUser, async (req, res) => {
  try {
    // Return explicit whitelist of fields including file metadata so frontend can preview/download
    const records = await MedicalRecord.find({ userId: req.userId })
      .select(
        "recordType date title description fileUrl fileName fileType fileSize createdAt _id"
      )
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching records",
      error: error.message,
    });
  }
});

// Serve a single medical record file (stream) after verifying ownership
router.get("/medical-record/file/:id", async (req, res) => {
  try {
    const recordId = req.params.id;
    const record = await MedicalRecord.findById(recordId);

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    const filePath = path.join(storageDir, record.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File missing on server" });
    }

    // Determine a content type for common extensions
    const ext = path.extname(record.fileName).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".doc") contentType = "application/msword";
    else if (ext === ".docx")
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    res.setHeader("Content-Type", contentType);

    // For inline preview of images / pdfs use inline disposition, otherwise attachment
    const inline =
      contentType.startsWith("image/") || contentType === "application/pdf";
    const dispositionType = inline ? "inline" : "attachment";
    // Ensure proper filename in Content-Disposition
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename="${encodeURIComponent(record.fileName)}"`
    );

    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => {
      console.error("File stream error:", err);
      res.status(500).end();
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Error serving file:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error serving file",
        error: error.message,
      });
  }
});

// Download all records as zip
router.get("/medical-record/download-all", verifyUser, async (req, res) => {
  try {
    // Get all records for user
    const records = await MedicalRecord.find({ userId: req.userId });

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No records found",
      });
    }

    // Create zip file
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Set the content disposition and type
    res.attachment("medical-records.zip");
    res.setHeader("Content-Type", "application/zip");

    // Pipe archive data to response
    archive.pipe(res);

    // Add each file to the archive
    for (const record of records) {
      const filePath = path.join(storageDir, record.fileUrl);
      if (fs.existsSync(filePath)) {
        // Create folder structure based on record type
        const folderName = record.recordType.replace("_", " ").toUpperCase();
        const datePart = new Date(record.date).toISOString().split("T")[0];
        const ext = path.extname(record.fileName);
        const fileName = `${folderName}/${datePart}-${record.title}${ext}`;
        // const folderName = record.recordType.replace('_', ' ').toUpperCase();
        // const fileName = `${folderName}/${record.date.toISOString().split('T')[0]}-${record.title}${path.extname(record.fileName)}`;

        archive.file(filePath, { name: fileName });
      }
    }

    // Finalize archive
    await archive.finalize();
  } catch (error) {
    console.error("Error downloading records:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading records",
      error: error.message,
    });
  }
});

// --- PRESCRIBED RECORDS: store only prescription image file ---
// Upload a prescription image
router.post(
  "/prescribed-record/upload",
  verifyUser,
  upload.single("file"),
  async (req, res) => {
    try {
      // Check for file validation error
      if (req.fileValidationError) {
        return res.status(400).json({
          success: false,
          message: req.fileValidationError,
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const prescribedRecord = new PrescribedRecord({
        userId: req.userId,
        fileUrl: file.filename,
        fileName: file.originalname,
        fileType: path.extname(file.originalname).substring(1),
        fileSize: file.size,
      });

      await prescribedRecord.save();

      res.status(201).json({
        success: true,
        message: "Prescription uploaded successfully",
        data: prescribedRecord,
      });
    } catch (error) {
      // Delete uploaded file if saving fails
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          /* ignore */
        }
      }

      res.status(500).json({
        success: false,
        message: "Error uploading prescription",
        error: error.message,
      });
    }
  }
);

// Update (replace) a prescription image
// Accepts optional new file (field name 'file'); if provided replaces the stored file.
router.put(
  "/prescribed-record/update/:id",
  verifyUser,
  upload.single("file"),
  async (req, res) => {
    try {
      const record = await PrescribedRecord.findById(req.params.id);
      if (!record) {
        // If a new file was uploaded, remove it because record doesn't exist
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {}
        }
        return res
          .status(404)
          .json({ success: false, message: "Prescription record not found" });
      }

      if (record.userId.toString() !== req.userId) {
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {}
        }
        return res
          .status(403)
          .json({
            success: false,
            message: "Unauthorized to update this record",
          });
      }

      // If a new file uploaded, delete old file and update fields
      if (req.file) {
        const oldFilePath = path.join(storageDir, record.fileUrl);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            /* ignore */
          }
        }

        record.fileUrl = req.file.filename;
        record.fileName = req.file.originalname;
        record.fileType = path.extname(req.file.originalname).substring(1);
        record.fileSize = req.file.size;
      }

      // Save updated record (even if nothing changed to update updatedAt)
      await record.save();

      res.status(200).json({
        success: true,
        message: "Prescription record updated successfully",
        data: record,
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {}
      }

      res.status(500).json({
        success: false,
        message: "Error updating prescription record",
        error: error.message,
      });
    }
  }
);

// Get all prescription images for a user
router.get("/prescribed-record/all", verifyUser, async (req, res) => {
  try {
    const records = await PrescribedRecord.find({ userId: req.userId })
      .select("fileUrl fileName fileType fileSize createdAt _id")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching prescription records",
      error: error.message,
    });
  }
});

// Serve a single prescription image file (stream) after verifying ownership
router.get("/prescribed-record/file/:id", async (req, res) => {
  try {
    const record = await PrescribedRecord.findById(req.params.id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    const filePath = path.join(storageDir, record.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File missing on server" });
    }

    const ext = path.extname(record.fileName).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";

    res.setHeader("Content-Type", contentType);
    const inline =
      contentType.startsWith("image/") || contentType === "application/pdf";
    res.setHeader(
      "Content-Disposition",
      `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(
        record.fileName
      )}"`
    );

    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => {
      console.error("File stream error:", err);
      res.status(500).end();
    });
    stream.pipe(res);
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error serving file",
        error: error.message,
      });
  }
});

// Delete prescription record and its file
router.delete("/prescribed-record/:id", verifyUser, async (req, res) => {
  try {
    const record = await PrescribedRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Prescription record not found",
      });
    }

    if (record.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this record",
      });
    }

    await PrescribedRecord.findByIdAndDelete(req.params.id);

    const filePath = path.join(storageDir, record.fileUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        /* ignore */
      }
    }

    res.status(200).json({
      success: true,
      message: "Prescription record deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting prescription record",
      error: error.message,
    });
  }
});

// Error handler for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size cannot exceed 10MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  next(error);
});

module.exports = router;
