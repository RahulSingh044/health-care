"use client";
import axios from "axios";

export async function verifyFromExternalAPI(url) {
  try {
    const response = await axios.get(url, {
      withCredentials: true, // ✅ Send cookies with cross-origin requests
      headers: {
        "Content-Type": "application/json",
        // Add other headers if needed, e.g.:
        // Authorization: Bearer ${token},
      },
    });

    const data = response.data;

    // Assume API returns { success: true } or { valid: false }
    return data.success || data.valid || false;
  } catch (error) {
    console.error("API check failed:", error.response?.status || error.message);
    return false;
  }
}
