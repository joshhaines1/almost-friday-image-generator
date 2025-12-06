import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import overlayImage from "./assets/almost_friday.png";
import "./fonts.css";  

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [overlay, setOverlay] = useState(null);
  const [imageSettings, setImageSettings] = useState({});
  const [padding] = useState(80);
  const MAX_IMAGES = 10;

  useEffect(() => {
    const loadOverlay = async () => {
      const response = await fetch(overlayImage);
      const blob = await response.blob();
      setOverlay(blob);
    };
    loadOverlay();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    addImages(files);
  };

  const addImages = (files) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const availableSlots = MAX_IMAGES - uploadedFiles.length;
    const filesToAdd = imageFiles.slice(0, availableSlots);

    const newFiles = [...uploadedFiles, ...filesToAdd];
    setUploadedFiles(newFiles);

    // Initialize settings for new images
    const newSettings = { ...imageSettings };
    filesToAdd.forEach((file, index) => {
      const fileIndex = uploadedFiles.length + index;
      newSettings[fileIndex] = { position: "bottom", padding: 80 };
    });
    setImageSettings(newSettings);
  };

  const removeImage = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);

    const newSettings = { ...imageSettings };
    delete newSettings[index];
    setImageSettings(newSettings);
  };

  const updateImagePosition = (index, position) => {
    setImageSettings((prev) => ({
      ...prev,
      [index]: { ...prev[index], position },
    }));
  };

  const updateImagePadding = (index, padding) => {
    setImageSettings((prev) => ({
      ...prev,
      [index]: { ...prev[index], padding },
    }));
  };

  const reprocessImage = (index) => {
    setImageSettings((prev) => ({
      ...prev,
      [index]: { 
        ...prev[index], 
        processCount: (prev[index]?.processCount || 0) + 1 
      },
    }));
  };

  const reprocessAllImages = () => {
    console.log("Reprocessing all images");
    setImageSettings((prev) => {
      const newSettings = { ...prev };
      uploadedFiles.forEach((_, index) => {
        newSettings[index] = {
          ...newSettings[index],
          processCount: (newSettings[index]?.processCount || 0) + 1
        };
      });
      return newSettings;
    });
  };

  const generatePreview = async (file, position) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const targetHeight = 1350;
        const targetWidth = 1080;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        let sx, sy, sw, sh;

        if (imgRatio > targetRatio) {
          sh = img.height;
          sw = sh * targetRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = sw / targetRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

        if (overlay) {
          const overlayImg = new Image();
          overlayImg.onload = () => {
            const scale = (targetWidth * 1.05) / overlayImg.width;
            const ow = overlayImg.width * scale;
            const oh = overlayImg.height * scale;

            const x = (targetWidth - ow) / 2;
            const y =
              position.pos === "top"
                ? position.padding
                : targetHeight - oh - position.padding;

            ctx.drawImage(overlayImg, x, y, ow, oh);
            resolve(canvas.toDataURL());
          };
          overlayImg.src = URL.createObjectURL(overlay);
        } else {
          resolve(canvas.toDataURL());
        }
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const PreviewImage = ({ file, index }) => {
    const [preview, setPreview] = useState(null);
    const [debounceTimer, setDebounceTimer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const position = imageSettings[index]?.position || "bottom";
    const imagePadding = imageSettings[index]?.padding || 80;
    const processCount = imageSettings[index]?.processCount || 0;

    useEffect(() => {
      console.log(`Generating preview for image ${index}`);
      // Trigger on processCount change (Process button clicked)
      setIsLoading(true);
      generatePreview(file, { pos: position, padding: imagePadding }).then((result) => {
        setPreview(result);
        setIsLoading(false);
      });
    }, [processCount]);

    useEffect(() => {
      // Debounced update for padding changes only
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        setIsLoading(true);
        generatePreview(file, { pos: position, padding: imagePadding }).then((result) => {
          setPreview(result);
          setIsLoading(false);
        });
      }, 2000);

      setDebounceTimer(timer);

      return () => clearTimeout(timer);
    }, [imagePadding]);

    return isLoading && !preview ? (
      <div style={{ height: "200px", marginBottom: "1rem", backgroundColor: "#f0f0f0", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>
    ) : preview ? (
      <img
        src={preview}
        alt="preview"
        style={{
          maxWidth: "100%",
          maxHeight: "200px",
          marginBottom: "1rem",
          borderRadius: "4px",
        }}
      />
    ) : (
      <div style={{ height: "200px", marginBottom: "1rem", backgroundColor: "#f0f0f0", borderRadius: "4px" }}></div>
    );
  };

  const processImage = (file, position, imagePadding) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const targetHeight = 1350;
        const targetWidth = 1080;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        let sx, sy, sw, sh;

        if (imgRatio > targetRatio) {
          sh = img.height;
          sw = sh * targetRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = sw / targetRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

        if (overlay) {
          const overlayImg = new Image();
          overlayImg.onload = () => {
            const scale = (targetWidth * 1.05) / overlayImg.width;
            const ow = overlayImg.width * scale;
            const oh = overlayImg.height * scale;

            const x = (targetWidth - ow) / 2;
            const y =
              position === "top"
                ? imagePadding
                : targetHeight - oh - imagePadding;

            ctx.drawImage(overlayImg, x, y, ow, oh);
            canvas.toBlob((blob) => resolve(blob));
          };
          overlayImg.src = URL.createObjectURL(overlay);
        } else {
          canvas.toBlob((blob) => resolve(blob));
        }
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDownload = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one image");
      return;
    }
    // Bundle processed images into a ZIP
    const zip = new JSZip();

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const position = imageSettings[i]?.position || "bottom";
      const imagePadding = imageSettings[i]?.padding || 80;
      const blob = await processImage(file, position, imagePadding);
      zip.file(file.name, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "almost_friday_images.zip");
  };

  return (
    <div style={{ padding: "0rem", fontFamily: "Lobster", maxWidth: "1000px", margin: "0 auto", backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", fontFamily: "Lobster", fontSize: "3rem" }}>Almost Friday Image Generator</h1>

      <p style={{ textAlign: "center" }}><b>Upload Images (Max {MAX_IMAGES}):</b></p>
      <div
        style={{
          border: "2px dashed #ccc",
          borderRadius: "8px",
          padding: "2rem",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: "#f9f9f9",
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: "none" }}
          id="fileInput"
          disabled={uploadedFiles.length >= MAX_IMAGES}
        />
        <label htmlFor="fileInput" style={{ cursor: "pointer" }}>
          Drag and drop images here or click to select ({uploadedFiles.length}/{MAX_IMAGES})
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ textAlign: "center" }}>Selected Images</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                  {index + 1}. {file.name}
                </p>
                <PreviewImage file={file} index={index} />
                <div style={{ marginBottom: "1rem" }}>
                  <button
                    onClick={() => updateImagePosition(index, "top")}
                    style={{
                      marginRight: "0.5rem",
                      padding: "0.5rem 1rem",
                      backgroundColor:
                        imageSettings[index]?.position === "top"
                          ? "#006643"
                          : "#ccc",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Top
                  </button>
                  <button
                    onClick={() => updateImagePosition(index, "bottom")}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor:
                        imageSettings[index]?.position === "bottom"
                          ? "#006643"
                          : "#ccc",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Bottom
                  </button>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    Padding (px):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={imageSettings[index]?.padding || 80}
                    onChange={(e) => updateImagePadding(index, Number(e.target.value) || 0)}
                    style={{
                      width: "30%",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      fontSize: "1rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <button
                  onClick={() => removeImage(index)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#006643",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: "2rem", marginBottom: "2rem", textAlign: "center" }}>
          <button
            onClick={reprocessAllImages}
            style={{
              padding: "1rem 2rem",
              marginRight: "1rem",
              backgroundColor: "#FF9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            Process All Images
          </button>
          <button
            onClick={handleDownload}
            style={{
              padding: "1rem 2rem",
              backgroundColor: "#006643",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            Download All Images
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
