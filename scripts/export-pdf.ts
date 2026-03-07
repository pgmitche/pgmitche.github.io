#!/usr/bin/env bun
/**
 * Exports the resume to PDF using a headless browser.
 *
 * Usage:
 *   bun run scripts/export-pdf.ts
 *
 * Builds the site, serves it locally, prints to PDF, then exits.
 * Output: <Name>-Resume.pdf in the project root.
 */

import puppeteer from "puppeteer";
import { $ } from "bun";
import { load } from "js-yaml";
import type { ResumeData } from "../src/data/resume.ts";

const resume = load(await Bun.file("resume.yaml").text()) as ResumeData;

const PORT = 4173;
const SERVER_STARTUP_MS = 1500; // time for vite preview to bind before browser connects
const FILENAME = `${resume.name.replace(/\s+/g, "-")}-Resume.pdf`;

// ── 1. Build the site ──────────────────────────────────────────────────────
console.log("Building site...");
await $`bun run build`.quiet();

// ── 2. Start vite preview ──────────────────────────────────────────────────
console.log(`Starting preview server on port ${PORT}...`);
const server = Bun.spawn(
  ["bun", "x", "vite", "preview", "--port", String(PORT), "--strictPort"],
  { stdout: "ignore", stderr: "ignore" },
);

// Give the server a moment to bind
await Bun.sleep(SERVER_STARTUP_MS);

// ── 3. Launch browser and print ────────────────────────────────────────────
console.log("Launching headless browser...");
const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();

  // Match A4 viewport so layout is stable before printing
  await page.setViewport({ width: 794, height: 1123 });
  await page.goto(`http://localhost:${PORT}/#resume`, { waitUntil: "networkidle0" });

  await page.pdf({
    path: FILENAME,
    format: "A4",
    printBackground: true,
    margin: { top: "1.2cm", right: "1.5cm", bottom: "1.2cm", left: "1.5cm" },
  });

  console.log(`✓ PDF saved: ${FILENAME}`);
} finally {
  await browser.close();
  server.kill();
}
