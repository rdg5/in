import { useState, useEffect } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [images, setImages] = useState([]);

  // On page load, fetch existing images from /api/list
  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const res = await fetch("/api/list");
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setMessage("Please select a file first");
      return;
    }
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }
      const result = await res.json();
      setMessage(`Upload successful! URL: ${result.url}`);

      // Re-fetch from DB so our list is always synced
      await fetchImages();
    } catch (err) {
      console.error("Error uploading:", err);
      setMessage("Error uploading file");
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  }

  return (
    <div style={{ margin: "40px" }}>
      <h1>Simple Insta-like Upload Demo (SQLite + S3)</h1>

      {/* Upload section */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          accept="image/*,video/*"
        />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {message && <p>{message}</p>}
      </div>

      {/* Gallery display */}
      <h2>Gallery</h2>
      <div style={gridContainer}>
        {images.map((img, idx) => (
          <div key={idx} style={imageCard}>
            {isVideo(img.s3url) ? (
              <video controls style={mediaStyle} src={img.s3url} />
            ) : (
              <img src={img.s3url} alt={img.filename} style={mediaStyle} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Basic inline styles for the gallery grid
const gridContainer = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "10px",
};

const imageCard = {
  border: "1px solid #ddd",
  borderRadius: "4px",
  overflow: "hidden",
};

const mediaStyle = {
  width: "100%",
  height: "auto",
  objectFit: "cover",
  display: "block",
};

function isVideo(url) {
  // E.g. check extension or MIME, naive approach:
  return url.toLowerCase().endsWith(".mp4");
}
