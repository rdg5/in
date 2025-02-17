// pages/api/list.js

import { db } from "../../lib/db.js";

export default function handler(req, res) {
  if (req.method === "GET") {
    const query = `SELECT filename, s3url, date FROM images ORDER BY id DESC`;
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("DB select error:", err);
        return res.status(500).json({ error: "Failed to fetch images" });
      }
      // Return the rows as "images"
      return res.status(200).json({ images: rows });
    });
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
