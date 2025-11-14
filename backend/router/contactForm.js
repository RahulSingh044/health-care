const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../middleware/nodemailer"); // adjust path

router.post("/send", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await sendContactEmail(name, email, subject, message);

    if (!result.success) {
      return res.status(500).json({
        error: "Failed to send email: " + result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error: " + error.message,
    });
  }
});

module.exports = router;
