// pages/api/upload.js

import { PutObjectCommand } from "@aws-sdk/client-s3";
import formidable from "formidable";
import fs from "fs";
import { s3Client } from "../../lib/s3Client.js";
import { db } from "../../lib/db.js";

// Next.js config: disable built-in bodyParser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable({ multiples: false });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) => {
        if (err) return reject(err);
        resolve({ fields: flds, files: fls });
      });
    });

    let uploadedFile = files.file;
    if (Array.isArray(uploadedFile)) {
      uploadedFile = uploadedFile[0];
    }
    if (!uploadedFile?.filepath) {
      return res
        .status(400)
        .json({ error: "No file uploaded or filepath missing" });
    }

    const fileData = fs.readFileSync(uploadedFile.filepath);
    const fileName = uploadedFile.originalFilename || `upload-${Date.now()}`;
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: fileData,
      ContentType: uploadedFile.mimetype,
    };

    // Upload to S3
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct the S3 URL
    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;

    // Now insert into SQLite
    const now = new Date().toISOString();
    const insertQuery = `INSERT INTO images (filename, s3url, date) VALUES (?, ?, ?)`;
    db.run(insertQuery, [fileName, s3Url, now], function (err) {
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ error: "Failed to store image record" });
      }
      console.log("Inserted row with id =", this.lastID);
      return res.status(200).json({ url: s3Url });
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Failed to upload file" });
  }
}
