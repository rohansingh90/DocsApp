/* eslint-disable no-undef */
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const functions = require("firebase-functions");
const app = express();
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
exports.proxyfile = functions.https.onRequest(app);
