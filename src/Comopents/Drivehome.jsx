
import React, { useState, useRef } from "react";
import { MdOutlineFileUpload, MdFolder, MdInsertDriveFile, MdDelete, MdEdit, MdShare, MdDownload } from "react-icons/md";
import { FaPlus } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { MdDriveFileMoveRtl, MdViewList, MdViewModule } from "react-icons/md";
import { AiOutlineGoogle } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import FilePreview from "./FilePreview";
import FileUploadPopup from "./FileUploadPopup";
import GoogleDrive from "./GoogleDrive";
import { FaFilePdf, FaFileWord, FaFileExcel, FaFileAudio, FaFileVideo, FaFileAlt, FaFileCode } from "react-icons/fa";
import axios from "axios";

const Drivehome = () => {
  const [files, setFiles] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showFolderPopup, setShowFolderPopup] = useState(false);
  const [showRenamePopup, setShowRenamePopup] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [renameItem, setRenameItem] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [googledrive, setgoogledrive] = useState(false);
  const [importlink, setimportlink] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const fileTypeIcons = {
    pdf: <FaFilePdf className="text-red-500" size={40} />,
    docx: <FaFileWord className="text-blue-500" size={40} />,
    xlsx: <FaFileExcel className="text-green-500" size={40} />,
    mp3: <FaFileAudio className="text-purple-500" size={40} />,
    mp4: <FaFileVideo className="text-orange-500" size={40} />,
    txt: <FaFileAlt className="text-gray-500" size={40} />,
    json: <FaFileCode className="text-yellow-500" size={40} />,
    default: <MdInsertDriveFile className="text-blue-400" size={40} />,
  };

  const convertToPdf = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:5001/convert", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.pdfUrl; // बैकएंड से प्राप्त URL
    } catch (error) {
      console.error(`Conversion error for ${file.name}: ${error.message}`);
      return null;
    }
  };







  const handleFileUpload = async (event) => {
    const rawFiles = Array.from(event.target.files).filter((file) => file.name);
    if (rawFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    setIsUploading(true);
    setUploadingFileName(rawFiles[0].name || "files");

    const processedFiles = [];

    for (const file of rawFiles) {
      let pdfUrl = null;
      const ext = file.name.split(".").pop().toLowerCase();
      const isThumbable = ["pdf", "docx", "doc", "pptx", "xlsx"].includes(ext);

      if (isThumbable) {
        console.log(`Generating PDF for ${file.name}...`);
        pdfUrl = await convertToPdf(file);
        if (!pdfUrl) {
          console.warn(`No PDF URL generated for ${file.name}`);
        }
      }

      processedFiles.push({
        name: file.name,
        webkitRelativePath: file.webkitRelativePath || "",
        lastModified: file.lastModified,
        createdAt: new Date().toISOString(),
        fileObj: file,
        pdfUrl: pdfUrl,
        type: "file",
      });
    }

    console.log("Processed files:", processedFiles);
    processFiles(processedFiles, () => {
      setShowUploadPopup(false);
      setIsUploading(false);
    });
  };




  const processFiles = (uploadedFiles, callback) => {
    if (uploadedFiles.length === 0) {
      console.warn("No valid files to process");
      setIsUploading(false);
      return;
    }

    console.log("Processing files:", uploadedFiles);
    const newFiles = [];
    const folderPaths = new Set();

    uploadedFiles.forEach((file) => {
      const relativePath = file.webkitRelativePath || file.name;
      if (!relativePath) {
        console.warn("Skipping file with undefined relativePath:", file);
        return;
      }
      const isFolder = relativePath.includes("/");
      let path, parent, name;

      if (isFolder) {
        const pathSegments = relativePath.split("/");
        const folderName = pathSegments[0];
        const folderPath = currentFolder ? `${currentFolder}/${folderName}` : folderName;

        if (!folderPaths.has(folderPath)) {
          newFiles.push({
            name: folderName,
            type: "folder",
            path: folderPath,
            lastModified: new Date().toLocaleString(),
            createdAt: file.createdAt,
            parent: currentFolder || null,
            fileObj: null,
          });
          folderPaths.add(folderPath);
        }

        for (let i = 1; i < pathSegments.length - 1; i++) {
          const subFolderPath = currentFolder
            ? `${currentFolder}/${pathSegments.slice(0, i + 1).join("/")}`
            : pathSegments.slice(0, i + 1).join("/");
          if (!folderPaths.has(subFolderPath)) {
            newFiles.push({
              name: pathSegments[i],
              type: "folder",
              path: subFolderPath,
              lastModified: new Date().toLocaleString(),
              createdAt: file.createdAt,
              parent: currentFolder
                ? `${currentFolder}/${pathSegments.slice(0, i).join("/")}`
                : pathSegments.slice(0, i).join("/") || null,
              fileObj: null,
            });
            folderPaths.add(subFolderPath);
          }
        }

        path = currentFolder ? `${currentFolder}/${relativePath}` : relativePath;
        parent = currentFolder
          ? `${currentFolder}/${pathSegments.slice(0, -1).join("/")}`
          : pathSegments.slice(0, -1).join("/");
        name = pathSegments[pathSegments.length - 1];

        newFiles.push({
          name: name,
          type: "file",
          path: path,
          lastModified: new Date(file.lastModified || Date.now()).toLocaleString(),
          createdAt: file.createdAt,
          parent: parent,
          fileObj: file.fileObj,
          pdfUrl: file.pdfUrl,
        });
      } else {
        name = file.name;
        path = currentFolder ? `${currentFolder}/${file.name}` : file.name;
        parent = currentFolder || null;

        newFiles.push({
          name: name,
          type: "file",
          path: path,
          lastModified: new Date(file.lastModified || Date.now()).toLocaleString(),
          createdAt: file.createdAt || new Date().toISOString(),
          parent: parent,
          fileObj: file.fileObj,
          pdfUrl: file.pdfUrl,
        });
      }
    });

    console.log("New files to add:", newFiles);

    setTimeout(() => {
      setFiles((prevFiles) => {
        const existingPaths = new Set(prevFiles.map((f) => f.path));
        const filteredNewFiles = newFiles.filter((f) => !existingPaths.has(f.path));
        const updatedFiles = [...prevFiles, ...filteredNewFiles];
        console.log("Updated files state:", updatedFiles);
        return updatedFiles;
      });
      setIsUploading(false);
      if (callback) callback();
    }, 2000);
  };



  const handleFolderUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files)
      .filter((file) => file.name)
      .map((file) => ({
        name: file.name,
        webkitRelativePath: file.webkitRelativePath || "",
        lastModified: file.lastModified,
        createdAt: new Date().toISOString(),
        fileObj: file,
      }));
    console.log("Folder upload triggered:", uploadedFiles);
    if (uploadedFiles.length > 0) {
      setIsUploading(true);
      setUploadingFileName(uploadedFiles[0].webkitRelativePath.split("/")[0] || "folder");
      processFiles(uploadedFiles);
    } else {
      console.warn("No valid files selected for folder upload");
      setIsUploading(false);
    }
    setShowUploadPopup(false);
  };

  const supportedDomains = [
    "drive.google.com",
    "dropbox.com",
    "dl.dropboxusercontent.com",
    "raw.githubusercontent.com",
    "firebaseapp.com",
    "firebasestorage.googleapis.com",
    "cloudinary.com",
    "amazonaws.com",
    "digitaloceanspaces.com",
    "cdn.",
  ];

  const isSupportedLink = (url) => {
    return supportedDomains.some((domain) => url.includes(domain)) || /\.(pdf|xlsx|csv|docx|png|jpg|jpeg|mp4|mp3|txt|json)$/.test(url);
  };

  const normalizeUrl = (url) => {
    let cleanedUrl = url.trim();
    if (cleanedUrl.includes("dropbox.com")) {
      cleanedUrl = cleanedUrl
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace("?dl=0", "")
        .replace("?dl=1", "");
    }
    if (cleanedUrl.includes("drive.google.com")) {
      const fileIdMatch = cleanedUrl.match(/[-\w]{25,}/);
      if (fileIdMatch) {
        cleanedUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[0]}`;
      }
    }
    return cleanedUrl;
  };

  const handleImportFromLink = async () => {
    if (!importUrl.trim()) {
      setImportError("Please enter a valid file URL.");
      return;
    }

    const cleanedUrl = normalizeUrl(importUrl);

    if (!isSupportedLink(cleanedUrl)) {
      setImportError("❌ Sorry, this platform is not supported for file import.");
      return;
    }

    setIsUploading(true);
    setUploadingFileName("Importing file...");
    setImportError("");

    try {
      const proxyUrl = `http://localhost:5000/proxy-file?url=${encodeURIComponent(cleanedUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch file. Status: ${response.status}`);
      }

      const blob = await response.blob();

      let fileName = "imported_file";
      const contentDisposition = response.headers.get("content-disposition");
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, "");
        }
      } else {
        try {
          const urlParts = new URL(cleanedUrl).pathname.split("/");
          fileName = urlParts.pop() || fileName;
        } catch {}
      }

      const file = new File([blob], fileName, {
        type: blob.type || "application/octet-stream",
        lastModified: Date.now(),
      });

      const importedFile = {
        name: fileName,
        fileObj: file,
        webkitRelativePath: "",
        lastModified: Date.now(),
        createdAt: new Date().toISOString(),
      };

      let pdfUrl = null;
      const ext = fileName.split(".").pop().toLowerCase();
      if (["pdf", "docx", "doc", "pptx", "xlsx"].includes(ext)) {
        pdfUrl = await convertToPdf(file);
      }

      processFiles([{ ...importedFile, pdfUrl }], () => {
        setImportUrl("");
        setimportlink(false);
        setIsUploading(false);
      });
    } catch (error) {
      console.error("❌ Import error:", error.message);
      setImportError("Failed to import file. Make sure the link is valid and publicly accessible.");
      setIsUploading(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const items = event.dataTransfer.items;
    const files = [];

    const processEntry = (entry, path = "") => {
      if (entry.isFile) {
        entry.file((file) => {
          files.push({
            name: file.name,
            webkitRelativePath: path ? `${path}/${file.name}` : file.name,
            lastModified: file.lastModified,
            createdAt: new Date().toISOString(),
            fileObj: file,
          });
        });
      } else if (entry.isDirectory) {
        const dirPath = path ? `${path}/${entry.name}` : entry.name;
        files.push({
          name: entry.name,
          webkitRelativePath: `${dirPath}/`,
          lastModified: Date.now(),
          createdAt: new Date().toISOString(),
          fileObj: null,
        });
        const dirReader = entry.createReader();
        dirReader.readEntries((entries) => {
          entries.forEach((subEntry) => processEntry(subEntry, dirPath));
        });
      }
    };

    for (let item of items) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        processEntry(entry);
      }
    }

    const waitForFiles = () => {
      if (files.length > 0 || items.length === 0) {
        console.log("Dropped files:", files);
        if (files.length > 0) {
          setIsUploading(true);
          setUploadingFileName(files[0].webkitRelativePath.split("/")[0] || files[0].name || "item");
          processFiles(files);
        } else {
          setIsUploading(false);
        }
      } else {
        setTimeout(waitForFiles, 100);
      }
    };
    waitForFiles();
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const path = currentFolder ? `${currentFolder}/${newFolderName}` : newFolderName;
      setFiles((prevFiles) => [
        ...prevFiles,
        {
          name: newFolderName,
          type: "folder",
          path: path,
          lastModified: new Date().toLocaleString(),
          createdAt: new Date().toISOString(),
          parent: currentFolder || null,
          fileObj: null,
        },
      ]);
      console.log("Created folder:", { name: newFolderName, path });
      setNewFolderName("");
      setShowFolderPopup(false);
    }
  };

  const handleDelete = (path) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.path !== path && !file.path.startsWith(`${path}/`)));
    console.log("Deleted item with path:", path);
  };

  const handleRename = (item) => {
    setRenameItem(item);
    setRenameValue(item.name);
    setShowRenamePopup(true);
  };

  const confirmRename = () => {
    if (renameValue.trim() && renameItem) {
      setFiles((prevFiles) => {
        const updatedFiles = prevFiles.map((file) => {
          if (file.path === renameItem.path) {
            const newPath = file.path.replace(file.name, renameValue);
            return { ...file, name: renameValue, path: newPath };
          }
          if (file.path.startsWith(`${renameItem.path}/`)) {
            const newPath = file.path.replace(renameItem.path, renameItem.path.replace(renameItem.name, renameValue));
            return {
              ...file,
              path: newPath,
              parent: file.parent
                ? file.parent.replace(renameItem.path, renameItem.path.replace(renameItem.name, renameValue))
                : file.parent,
            };
          }
          return file;
        });
        console.log("Renamed item:", renameItem, "to", renameValue);
        return updatedFiles;
      });
      setShowRenamePopup(false);
      setRenameItem(null);
      setRenameValue("");
    }
  };

  const handleShare = (item) => {
    setShareItem(item);
    setShowSharePopup(true);
  };

  const handleCopyLink = () => {
    if (shareItem) {
      const shareLink = `https://quickdrive.com/share/${encodeURIComponent(shareItem.path)}`;
      navigator.clipboard.writeText(shareLink).then(() => {
        alert("Link copied to clipboard!");
      });
    }
  };

  const handleDownload = async (item) => {
    if (item.type === "file" && item.fileObj) {
      saveAs(item.fileObj, item.name);
      console.log("Downloaded file:", item.name);
    } else if (item.type === "folder") {
      const zip = new JSZip();
      const folder = zip.folder(item.name);
      const folderFiles = files.filter((f) => f.path.startsWith(`${item.path}/`) && f.type === "file" && f.fileObj);

      for (const file of folderFiles) {
        const relativePath = file.path.replace(`${item.path}/`, "");
        folder.file(relativePath, file.fileObj);
      }

      try {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${item.name}.zip`);
        console.log("Downloaded folder as zip:", item.name);
      } catch (error) {
        console.error("Error generating zip:", error);
        alert("Failed to download folder.");
      }
    }
  };

  const handlePreview = (item) => {
    if (item.type === "file") {
      setPreviewItem(item);
      setShowPreviewPopup(true);
      console.log("Previewing file:", item.name);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  const triggerFolderUpload = () => {
    folderInputRef.current.click();
  };

  const openFolder = (folderPath) => {
    setCurrentFolder(folderPath);
    setFilter("all");
    console.log("Opened folder:", folderPath);
  };

  const goBack = () => {
    if (currentFolder) {
      const parentPath = currentFolder.split("/").slice(0, -1).join("/");
      setCurrentFolder(parentPath || null);
      setFilter("all");
      console.log("Navigated to parent:", parentPath || "root");
    }
  };

  const goToRoot = () => {
    setCurrentFolder(null);
    setFilter("all");
    console.log("Navigated to root");
  };

  const filteredItems = files
    .filter((file) => (file.parent === currentFolder || (!currentFolder && !file.parent)))
    .filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((file) => {
      if (filter === "recent") {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(file.createdAt) >= oneDayAgo;
      }
      return true;
    })
    .sort((a, b) => {
      if (filter === "recent") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return a.name.localeCompare(b.name);
    });

  console.log("Filtered items to display:", filteredItems);

//   const getThumbnail = (item) => {
//     if (item.type === "folder") {
//       return <MdFolder className="text-yellow-400" size={40} />;
//     }

//     if (item.pdfUrl) {
//       console.log(`Attempting to load thumbnail for ${item.name} from ${item.pdfUrl}`);
//       return (
//         <img
//           src={item.pdfUrl}
//           alt={item.name}
//           className="w-full h-full object-cover rounded-lg"
//           onError={(e) => {
//             console.error(
//               `Failed to load thumbnail for ${item.name}: ${item.pdfUrl}`,
//               e.nativeEvent
//             );
//             e.target.replaceWith(
//               fileTypeIcons[item.name.split(".").pop().toLowerCase()] || fileTypeIcons.default
//             );
//           }}
//           onLoad={() => console.log(`Successfully loaded thumbnail for ${item.name}`)}
//         />
//       );
//     }

//     if (item.fileObj) {
//       const ext = item.name.split(".").pop().toLowerCase();
//       if (["jpg", "jpeg", "png"].includes(ext)) {
//         return (
//           <img
//             src={URL.createObjectURL(item.fileObj)}
//             alt={item.name}
//             className="w-full h-full object-cover rounded-lg"
//             onError={(e) => {
//               console.warn(`Failed to load image for ${item.name}`);
//               e.target.replaceWith(fileTypeIcons[ext] || fileTypeIcons.default);
//             }}
//           />
//         );
//       }
//       return fileTypeIcons[ext] || fileTypeIcons.default;
//     }

//     return fileTypeIcons.default;
//   };



const getThumbnail = (item) => {
    if (item.type === "folder") {
      return <MdFolder className="text-yellow-400" size={40} />;
    }

    if (item.thumbnailUrl) { // thumbnailUrl का उपयोग
      console.log(`Attempting to load thumbnail for ${item.name} from ${item.thumbnailUrl}`);
      return (
        <img
          src={item.thumbnailUrl}
          alt={item.name}
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            console.error(`Failed to load thumbnail for ${item.name}: ${item.thumbnailUrl}`, e.nativeEvent);
            e.target.replaceWith(
              fileTypeIcons[item.name.split(".").pop().toLowerCase()] || fileTypeIcons.default
            );
          }}
          onLoad={() => console.log(`Successfully loaded thumbnail for ${item.name}`)}
        />
      );
    }

    if (item.fileObj) {
      const ext = item.name.split(".").pop().toLowerCase();
      if (["jpg", "jpeg", "png"].includes(ext)) {
        return (
          <img
            src={URL.createObjectURL(item.fileObj)}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              console.warn(`Failed to load image for ${item.name}`);
              e.target.replaceWith(fileTypeIcons[ext] || fileTypeIcons.default);
            }}
          />
        );
      }
      return fileTypeIcons[ext] || fileTypeIcons.default;
    }

    return fileTypeIcons.default;
  };


  const popupVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <FileUploadPopup
        isUploading={isUploading}
        fileName={uploadingFileName}
        onUploadComplete={() => setIsUploading(false)}
      />

      <motion.div
        className="flex flex-wrap items-center justify-between gap-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center">
          <MdDriveFileMoveRtl size={32} className="text-orange-500" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">QuickDrive</h1>
        </div>
        <div className="relative w-full sm:w-auto sm:flex-1 max-w-[500px]">
          <input
            placeholder="Search files..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-200 outline-orange-500 w-full h-12 rounded-lg pl-10 pr-5 text-gray-700 focus:ring-2 focus:ring-orange-500 bg-white shadow-sm"
          />
          <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <div className="relative">
            <motion.button
              onClick={() => setShowUploadPopup(!showUploadPopup)}
              className="bg-orange-500 text-white font-semibold p-2 sm:p-3 rounded-lg flex items-center justify-center hover:bg-orange-600 transition w-full sm:w-auto text-sm sm:text-base"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <MdOutlineFileUpload size={18} className="mr-1 sm:mr-2" />
              Upload
            </motion.button>
            <AnimatePresence>
              {showUploadPopup && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                  variants={popupVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.button
                    onClick={triggerFileUpload}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                    variants={buttonVariants}
                    whileHover="hover"
                  >
                    Upload File
                  </motion.button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                  <motion.button
                    onClick={triggerFolderUpload}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                    variants={buttonVariants}
                    whileHover="hover"
                  >
                    Upload Folder
                  </motion.button>
                  <input
                    type="file"
                    ref={folderInputRef}
                    onChange={handleFolderUpload}
                    multiple
                    webkitdirectory=""
                    className="hidden"
                  />
                  <motion.button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                    variants={buttonVariants}
                    whileHover="hover"
                    onClick={() => setgoogledrive(true)}
                  >
                    <AiOutlineGoogle className="inline mr-1" />
                    Import from Google Drive
                  </motion.button>
                  <motion.button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                    variants={buttonVariants}
                    whileHover="hover"
                    onClick={() => setimportlink(true)}
                  >
                    Import from Link
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            onClick={() => setShowFolderPopup(true)}
            className="bg-orange-500 text-white font-semibold p-2 sm:p-3 rounded-lg flex items-center justify-center hover:bg-orange-600 transition w-full sm:w-auto text-sm sm:text-base"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FaPlus size={16} className="mr-1 sm:mr-2" />
            Create Folder
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showFolderPopup && (
          <motion.div
            className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md"
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New Folder</h2>
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="border border-gray-200 outline-orange-500 w-full h-12 rounded-lg px-4 mb-4 text-gray-700 focus:ring-2 focus:ring-orange-500 bg-white"
              />
              <div className="flex gap-4 justify-end">
                <motion.button
                  onClick={handleCreateFolder}
                  className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Create
                </motion.button>
                <motion.button
                  onClick={() => setShowFolderPopup(false)}
                  className="bg-gray-200 text-gray-800 p-2 rounded-lg hover:bg-gray-300 transition"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRenamePopup && (
          <motion.div
            className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md"
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Rename {renameItem?.type === "folder" ? "Folder" : "File"}
              </h2>
              <input
                type="text"
                placeholder="New name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="border border-gray-200 outline-orange-500 w-full h-12 rounded-lg px-4 mb-4 text-gray-700 focus:ring-2 focus:ring-orange-500 bg-white"
              />
              <div className="flex gap-4 justify-end">
                <motion.button
                  onClick={confirmRename}
                  className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Rename
                </motion.button>
                <motion.button
                  onClick={() => setShowRenamePopup(false)}
                  className="bg-gray-200 text-gray-800 p-2 rounded-lg hover:bg-gray-300 transition"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importlink && (
          <motion.div
            className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md"
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Import from Link</h2>
              <input
                type="text"
                placeholder="Enter file URL (e.g., Dropbox, Google Drive)"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="border border-gray-200 outline-orange-500 w-full h-12 rounded-lg px-4 mb-4 text-gray-700 focus:ring-2 focus:ring-orange-500 bg-white"
              />
              {importError && <p className="text-red-500 text-sm mb-4">{importError}</p>}
              <div className="flex gap-4 justify-end">
                <motion.button
                  onClick={handleImportFromLink}
                  className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Import
                </motion.button>
                <motion.button
                  onClick={() => {
                    setimportlink(false);
                    setImportUrl("");
                    setImportError("");
                  }}
                  className="bg-gray-200 text-gray-800 p-2 rounded-lg hover:bg-gray-300 transition"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSharePopup && (
          <motion.div
            className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md"
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Share {shareItem?.type === "folder" ? "Folder" : "File"}
              </h2>
              <input
                type="text"
                value={`https://quickdrive.com/share/${encodeURIComponent(shareItem?.path || "")}`}
                readOnly
                className="border border-gray-200 w-full h-12 rounded-lg px-4 mb-4 text-gray-700 bg-gray-50"
              />
              <div className="flex gap-4 justify-end">
                <motion.button
                  onClick={handleCopyLink}
                  className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Copy Link
                </motion.button>
                <motion.button
                  onClick={() => setShowSharePopup(false)}
                  className="bg-gray-200 text-gray-800 p-2 rounded-lg hover:bg-gray-300 transition"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreviewPopup && previewItem && (
          <FilePreview file={previewItem} onClose={() => setShowPreviewPopup(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {googledrive && <GoogleDrive setgoogledrive={setgoogledrive} />}
      </AnimatePresence>

      <AnimatePresence>
        {filteredItems.length === 0 && files.length === 0 && (
          <motion.div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center mx-2 md:mx-10 mb-6 transition-all ${
              dragOver ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white"
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-lg font-semibold text-gray-800">Drag and drop files or folders here</p>
            <p className="text-gray-500 mb-4">or click to upload files</p>
            <motion.button
              onClick={triggerFileUpload}
              className="bg-orange-500 text-white p-3 rounded-lg hover:bg-orange-600 transition"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Select Files
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-2 md:mx-10">
        <motion.div
          className="flex items-center mb-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h2
            className="text-xl font-semibold text-gray-800 hover:text-orange-600 cursor-pointer"
            onClick={goToRoot}
          >
            All Files
          </h2>
          {currentFolder && (
            <motion.button
              onClick={goBack}
              className="px-4 py-2 text-orange-500 font-semibold hover:text-orange-600 transition"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Back to {currentFolder.split("/").slice(-2, -1)[0] || "Home"}
            </motion.button>
          )}
          <div className="flex gap-2">
            <motion.button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 font-semibold rounded-lg ${
                filter === "all" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-800"
              } hover:bg-orange-600 hover:text-white transition`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              All
            </motion.button>
            <motion.button
              onClick={() => setFilter("recent")}
              className={`px-4 py-2 font-semibold rounded-lg ${
                filter === "recent" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-800"
              } hover:bg-orange-600 hover:text-white transition`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Recent
            </motion.button>
          </div>
          <div className="flex gap-2 ml-auto">
            <motion.button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${
                viewMode === "list" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-800"
              } hover:bg-orange-600 hover:text-white transition`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <MdViewList size={24} />
            </motion.button>
            <motion.button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-800"
              } hover:bg-orange-600 hover:text-white transition`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <MdViewModule size={24} />
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="mb-8"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {filteredItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No files or folders found.</p>
          ) : viewMode === "list" ? (
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-left text-sm font-medium text-gray-600 w-3/5">Name</th>
                    <th className="p-4 text-right text-sm font-medium text-gray-600 w-2/5">Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <motion.tr
                      key={item.path}
                      className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer group relative"
                      onClick={() => (item.type === "folder" ? openFolder(item.path) : handlePreview(item))}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="p-4 flex items-center">
                        {item.type === "folder" ? (
                          <MdFolder className="mr-3 text-yellow-400" size={24} />
                        ) : (
                          <MdInsertDriveFile className="mr-3 text-blue-400" size={24} />
                        )}
                        <span className="text-sm text-gray-800 truncate">{item.name}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 text-right">{item.lastModified}</td>
                      <td className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center gap-4">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(item);
                            }}
                            className="text-blue-500 hover:text-blue-700 transition"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <MdShare size={18} />
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRename(item);
                            }}
                            className="text-gray-500 hover:text-gray-700 transition"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <MdEdit size={18} />
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.path);
                            }}
                            className="text-red-500 hover:text-red-700 transition"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <MdDelete size={18} />
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item);
                            }}
                            className="text-green-500 hover:text-green-700 transition ml-6"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <MdDownload size={18} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  className="bg-white rounded-lg shadow-sm p-4 cursor-pointer group relative hover:shadow-md transition"
                  onClick={() => (item.type === "folder" ? openFolder(item.path) : handlePreview(item))}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="w-full h-24 mb-2 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                    {getThumbnail(item)}
                  </div>
                  <p className="text-sm text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.lastModified}</p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(item);
                      }}
                      className="text-blue-500 hover:text-blue-700 transition"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <MdShare size={16} />
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(item);
                      }}
                      className="text-gray-500 hover:text-gray-700 transition"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <MdEdit size={16} />
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.path);
                      }}
                      className="text-red-500 hover:text-red-700 transition"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <MdDelete size={16} />
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      className="text-green-500 hover:text-green-700 transition"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <MdDownload size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Drivehome;

















