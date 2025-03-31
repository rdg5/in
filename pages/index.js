import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [images, setImages] = useState([]);
  const [cameraStream, setCameraStream] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Kamera bekapcsolása
  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
    } catch (err) {
      console.error("Kamera hiba:", err);
    }
  }

  // Ha van stream, ráirányítjuk a <video> elemre
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Kép kinyerése canvasen keresztül
  function capturePhoto() {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) return;

    const ctx = canvasEl.getContext("2d");
    // A canvas mérete legyen akkora, mint a videó
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    
    // Rajzoljuk a videót a canvasre, majd generálunk belőle DataURL-t
    ctx.drawImage(videoEl, 0, 0);
    const dataUrl = canvasEl.toDataURL("image/png");
    setPreviewImg(dataUrl);
  }

  // (Nem kötelező) Kamera leállítása
  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }

  // A kinyert kép feltöltése (példa):
  async function uploadCapturedImage() {
    if (!previewImg) return;

    // Alakítsuk át a base64 DataURL-t bináris Blob-bá
    const blob = await (await fetch(previewImg)).blob();

    const formData = new FormData();
    formData.append("file", blob, "capture.png");

    // Feltöltjük az /api/upload endpointodra (ugyanúgy, mint más fájlokat)
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      alert("Kép sikeresen feltöltve!");
    } catch (err) {
      console.error("Hiba a feltöltésnél:", err);
    }
  }

  // Fetch existing images on page load
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
    <div className="container">

      {/* Upload Section */}
      <div className="upload-container">
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          accept="image/*,video/*"
        />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {message && <p className="upload-message">{message}</p>}
      </div>

      {/* Gallery Section */}
      <h2>Gallery</h2>
      <div className="gallery-container">
  {images.map((img, idx) => (
    <div key={idx} className={`image-card image-${idx}`}>
      {isVideo(img.s3url) ? (
        <video
          controls
          className="media-item"
          src={img.s3url}
        />
      ) : (
        <img
          src={img.s3url}
          alt={img.filename}
          className="media-item"
        />
      )}
    </div>
  ))}
</div>
<h2>Kamera használata</h2>
      <button onClick={openCamera}>Kamera bekapcsolása</button>
      <button onClick={stopCamera}>Kamera leállítása</button>

      {/* A video elem, amiben látjuk az élőképet */}
      <video
        ref={videoRef}
        autoPlay
        style={{ width: "300px", background: "#000" }}
      />
      
      {/* Rejtett canvas, amin át kinyerjük a képet */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <button onClick={capturePhoto}>Fénykép készítése</button>

      {/* Ha van preview-kép, megjelenítjük */}
      {previewImg && (
        <div>
          <h3>Elkészült kép:</h3>
          <img src={previewImg} alt="Captured" style={{ maxWidth: "300px" }} />
          <div>
            <button onClick={uploadCapturedImage}>Kép feltöltése</button>
          </div>
        </div>
      )}
    </div>
)}

function isVideo(url) {
  return url.toLowerCase().endsWith(".mp4");
}