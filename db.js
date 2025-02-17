import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// __filename, __dirname equivalents for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "images.db");

// Initialize SQLite
const sqlite = sqlite3.verbose();
export const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err);
  } else {
    console.log("Connected to SQLite database at", dbPath);
    // Create table if not exists
    db.run(
      `
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        s3url TEXT,
        date TEXT
      )
    `,
      (err2) => {
        if (err2) {
          console.error("Failed to create images table:", err2);
        } else {
          console.log("Table 'images' is ready (or already exists).");
        }
      },
    );
  }
});
