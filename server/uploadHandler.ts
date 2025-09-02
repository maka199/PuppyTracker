import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request, Response } from "express";

// Set up multer for file uploads
const upload = multer({
  dest: path.join(__dirname, "../../uploads/"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const uploadHandler = [
  upload.single("file"),
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    // Optionally, rename/move file, validate type, etc.
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ url: fileUrl });
  },
];
