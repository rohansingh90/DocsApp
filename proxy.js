// const express = require("express");
// const cors = require("cors");
// const fetch = require("node-fetch");
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = 5000;

app.use(cors());

app.get("/proxy-file", async (req, res) => {
  const fileUrl = req.query.url;

  if (!fileUrl) {
    return res.status(400).send("Missing file URL");
  }

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return res.status(400).send("Failed to fetch file");
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Proxy fetch error:", error.message);
    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
});
