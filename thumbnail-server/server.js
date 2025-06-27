
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");

const app = express();
const port = 5001;

const LIBREOFFICE_PATH = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
const BASE_DIR = "D:\\Knowledge project\\docsystem\\thumbnail-server";
const UPLOADS_DIR = path.join(BASE_DIR, "Uploads");
const CONVERTED_DIR = path.join(BASE_DIR, "converted");

app.use(cors());

app.use("/converted", express.static(CONVERTED_DIR, {
  setHeaders: (res, path) => {
    if (path.endsWith(".pdf")) {
      res.setHeader("Content-Type", "application/pdf");
    }
  }
}));

const ensureDirectories = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(CONVERTED_DIR, { recursive: true });
    console.log(`✅ Directories ensured: ${UPLOADS_DIR}, ${CONVERTED_DIR}`);
  } catch (error) {
    console.error(`❌ Failed to create directories: ${error.message}`);
  }
};
ensureDirectories();

const upload = multer({ dest: UPLOADS_DIR });

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    console.log(`Executing command: ${command}`);
    exec(command, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ Command error: ${stderr || err.message}`);
        return reject(new Error(stderr || err.message));
      }
      console.log(`✅ Command output: ${stdout}`);
      resolve(stdout);
    });
  });
};

app.post("/convert", upload.single("file"), async (req, res) => {
  let baseName, ext, renamedPath;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const tempPath = req.file.path;
    ext = path.extname(req.file.originalname).toLowerCase();
    baseName = path.basename(req.file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "_");
    renamedPath = path.join(UPLOADS_DIR, `${baseName}${ext}`);
    const outputPdf = path.join(CONVERTED_DIR, `${baseName}.pdf`);

    await fs.rename(tempPath, renamedPath);
    console.log(`📄 Processing file: ${renamedPath}`);

    await fs.access(renamedPath).catch(() => {
      throw new Error(`Input file not found: ${renamedPath}`);
    });

    const command = `"${LIBREOFFICE_PATH}" --headless --convert-to pdf "${path.resolve(renamedPath)}" --outdir "${path.resolve(CONVERTED_DIR)}"`;
    const output = await runCommand(command);
    console.log(`✅ Conversion completed with output: ${output}`);

    const stats = await fs.stat(outputPdf);
    if (stats.size === 0) {
      throw new Error(`PDF conversion failed: Output file is empty at ${outputPdf}`);
    }
    await fs.access(outputPdf).catch(() => {
      throw new Error(`PDF conversion failed: Output file not found at ${outputPdf}`);
    });

    const pdfUrl = `http://localhost:${port}/converted/${baseName}.pdf`;
    console.log(`✅ Generated PDF URL: ${pdfUrl}, File size: ${stats.size} bytes`);
    res.json({ pdfUrl });
  } catch (err) {
    console.error(`❌ Conversion failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: "Conversion failed", details: err.message });
  } finally {
    const cleanupPath = renamedPath || path.join(UPLOADS_DIR, req.file ? `${baseName}${ext}` : "");
    if (cleanupPath && await fs.access(cleanupPath).then(() => true).catch(() => false)) {
      await fs.unlink(cleanupPath).catch((err) => {
        console.error(`❌ Failed to delete uploaded file: ${err.message}`);
      });
    }
  }
});

app.listen(port, () => {
  console.log(`🚀 PDF converter running at http://localhost:${port}`);
});








