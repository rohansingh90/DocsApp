

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdShare, MdDownload, MdFullscreen, MdClose } from "react-icons/md";

const FilePreview = ({ file, onClose }) => {
  const [previewContent, setPreviewContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const previewContainerRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleCopyLink = () => {
    const shareLink = `https://quickdrive.com/share/${encodeURIComponent(file.path || file.name)}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      alert("Link copied to clipboard!");
      setShowSharePopup(false);
    });
  };

  const handleDownload = () => {
    if (file?.fileObj) {
      const url = URL.createObjectURL(file.fileObj);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } else if (file.pdfUrl) {
      window.open(file.pdfUrl, "_blank");
    } else {
      console.error("No file object or PDF URL available for download");
      setError("Unable to download file.");
    }
  };

  const toggleMaximized = () => {
    setIsMaximized(!isMaximized);
  };

  useEffect(() => {
    let isMounted = true;

    if (!file || !file.fileObj || file.type !== "file") {
      if (isMounted) {
        setPreviewContent(
          <p className="text-gray-500 dark:text-gray-400 text-center">Invalid file or folder.</p>
        );
        setIsLoading(false);
      }
      return;
    }

    const fileExtension = file.name.split(".").pop().toLowerCase();
    const fileSize = file.fileObj.size;

    const reader = new FileReader();

    reader.onerror = () => {
      if (isMounted) {
        console.error("FileReader error:", reader.error);
        setError("Failed to read file.");
        setIsLoading(false);
      }
    };

    const loadPreview = async () => {
      if (file.pdfUrl) {
        try {
          const response = await fetch(file.pdfUrl, { mode: "cors" });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setPreviewContent(
              <embed
                src={objectUrl}
                type="application/pdf"
                title={file.name}
                className="w-full h-full border-none"
                onError={(e) => {
                  console.error(`Embed error for ${file.name}:`, e);
                  setError("PDF preview not available.");
                }}
              />
            );
          }
        } catch (err) {
          console.error(`Preview fetch error for ${file.name}:`, err.message);
          if (isMounted) {
            setError("PDF preview not available. Click to open in new tab.");
            setPreviewContent(
              <a
                href={file.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline block text-center mt-4"
              >
                Open in new tab
              </a>
            );
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        const imageTypes = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
        if (imageTypes.includes(fileExtension)) {
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
              if (isMounted) {
                const containerWidth = isMaximized ? window.innerWidth : window.innerWidth * 0.85;
                const containerHeight = isMaximized
                  ? window.innerHeight - 72
                  : window.innerHeight * 0.9 - 72;

                setPreviewContent(
                  <div className="w-full h-full overflow-auto flex items-center justify-center">
                    <img
                      src={e.target.result}
                      alt={file.name}
                      className="block object-contain"
                      style={{
                        maxWidth: `${containerWidth}px`,
                        maxHeight: `${containerHeight}px`,
                      }}
                    />
                  </div>
                );
                setIsLoading(false);
              }
            };
            img.onerror = () => {
              if (isMounted) {
                setError("Failed to load image.");
                setIsLoading(false);
              }
            };
          };
          reader.readAsDataURL(file.fileObj);
          return;
        }

        const videoTypes = ["mp4", "webm", "ogg", "mov", "avi", "mkv"];
        if (videoTypes.includes(fileExtension)) {
          reader.onload = (e) => {
            if (isMounted) {
              setPreviewContent(
                <video controls src={e.target.result} className="w-full h-full object-cover">
                  Your browser does not support video playback.
                </video>
              );
              setIsLoading(false);
            }
          };
          reader.readAsDataURL(file.fileObj);
          return;
        }

        const audioTypes = ["mp3", "wav", "ogg", "m4a", "aac"];
        if (audioTypes.includes(fileExtension)) {
          reader.onload = (e) => {
            if (isMounted) {
              setPreviewContent(
                <audio controls src={e.target.result} className="w-full">
                  Your browser does not support audio playback.
                </audio>
              );
              setIsLoading(false);
            }
          };
          reader.readAsDataURL(file.fileObj);
          return;
        }

        const textTypes = ["txt", "md", "json", "js", "py", "html", "css", "xml", "csv", "yaml", "yml", "log"];
        if (textTypes.includes(fileExtension)) {
          reader.onload = (e) => {
            if (isMounted) {
              setPreviewContent(
                <pre className="text-sm text-gray-800 dark:text-gray-200 p-6 bg-white dark:bg-gray-800 overflow-auto h-full">
                  {e.target.result}
                </pre>
              );
              setIsLoading(false);
            }
          };
          reader.readAsText(file.fileObj);
          return;
        }

        if (isMounted) {
          setPreviewContent(
            <div className="text-center p-8 bg-white dark:bg-gray-800 shadow-sm">
              <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-3">
                Preview not available for .{fileExtension} files
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>File:</strong> {file.name}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Size:</strong> {formatFileSize(fileSize)}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Type:</strong> {fileExtension.toUpperCase()}
              </p>
              <motion.button
                onClick={handleDownload}
                className="bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Download to View
              </motion.button>
            </div>
          );
          setIsLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isMounted = false;
      reader.abort();
    };
  }, [file, isMaximized]);

  return (
    <motion.div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        ref={previewContainerRef}
        className="bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden rounded-xl"
        initial={{ width: "85vw", height: "90vh", scale: 0.9, opacity: 0 }}
        animate={{
          width: isMaximized ? "100vw" : "85vw",
          height: isMaximized ? "100vh" : "90vh",
          scale: 1,
          opacity: 1,
          x: isMaximized ? 0 : undefined,
          y: isMaximized ? 0 : undefined,
        }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ maxWidth: isMaximized ? "100%" : "95vw", maxHeight: isMaximized ? "100%" : "95vh" }}
      >
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate">
              {file.name}
            </h2>
            {file?.fileObj && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(file.fileObj.size)} • {file.name.split(".").pop().toUpperCase()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowSharePopup(!showSharePopup)}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Share"
            >
              <MdShare size={18} />
            </motion.button>
            <AnimatePresence>
              {showSharePopup && (
                <motion.div
                  className="absolute top-14 right-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 w-96 z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`https://quickdrive.com/share/${encodeURIComponent(file.path || file.name)}`}
                      readOnly
                      className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm p-2.5 rounded-lg outline-none border border-gray-200 dark:border-gray-600"
                    />
                    <motion.button
                      onClick={handleCopyLink}
                      className="bg-orange-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Copy
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              onClick={handleDownload}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Download"
            >
              <MdDownload size={18} />
            </motion.button>
            <motion.button
              onClick={toggleMaximized}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              <MdFullscreen size={18} />
            </motion.button>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Close"
            >
              <MdClose size={18} />
            </motion.button>
          </div>
        </div>
        <div
          className="flex-1 p-0 overflow-hidden bg-gray-900 dark:bg-gray-900"
          style={{
            height: isMaximized ? "calc(100vh - 72px)" : "calc(90vh - 72px)",
          }}
        >
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-20">Loading preview...</p>
          ) : error ? (
            <div className="text-center mt-20">
              <p className="text-red-500 dark:text-red-400">{error}</p>
              {file.pdfUrl && (
                <a
                  href={file.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline block mt-2"
                >
                  Open in new tab
                </a>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">{previewContent}</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FilePreview;