import { readFileSync, writeFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));

const [pdfPath, imgPath, pageNoArg] = process.argv.slice(2);

if (!pdfPath || !imgPath) {
  console.error("Usage: node pdftoimage.js <pdf_path> <img_path> [page_no=1]");
  process.exit(1);
}

const pageNo = parseInt(pageNoArg, 10) || 1;
const pdfBase64 = readFileSync(resolve(pdfPath)).toString("base64");

// Read local pdfjs-dist source files
const pdfjsDir = join(__dirname, "node_modules/pdfjs-dist/build");
const pdfjsMainSrc = readFileSync(join(pdfjsDir, "pdf.mjs"), "utf8");
const pdfjsWorkerSrc = readFileSync(join(pdfjsDir, "pdf.worker.mjs"), "utf8");

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.goto("about:blank");
await page.setContent('<style>body{margin:0}</style><canvas id="c"></canvas>');

// Load pdf.js entirely in-browser via blob URLs (no network needed)
await page.evaluate(async (mainSrc, workerSrc) => {
  const workerBlob = new Blob([workerSrc], { type: "application/javascript" });
  window.__workerUrl = URL.createObjectURL(workerBlob);

  const mainBlob = new Blob([mainSrc], { type: "application/javascript" });
  const mainUrl = URL.createObjectURL(mainBlob);
  const pdfjsLib = await import(mainUrl);

  pdfjsLib.GlobalWorkerOptions.workerSrc = window.__workerUrl;
  window.__pdfjsLib = pdfjsLib;
}, pdfjsMainSrc, pdfjsWorkerSrc);

// Render the requested page
const result = await page.evaluate(async (base64, pageNum) => {
  const pdfjsLib = window.__pdfjsLib;
  const data = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  if (pageNum < 1 || pageNum > doc.numPages) {
    return { error: true, numPages: doc.numPages };
  }

  const p = await doc.getPage(pageNum);
  const viewport = p.getViewport({ scale: 2.0 });
  const canvas = document.getElementById("c");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await p.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return { error: false, dataUrl: canvas.toDataURL("image/png") };
}, pdfBase64, pageNo);

if (result.error) {
  await browser.close();
  console.error(`Page ${pageNo} out of range. Document has ${result.numPages} page(s).`);
  process.exit(2);
}

const base64Png = result.dataUrl.replace(/^data:image\/png;base64,/, "");
writeFileSync(resolve(imgPath), Buffer.from(base64Png, "base64"));

await browser.close();
console.log(`Page ${pageNo} saved to ${imgPath}`);
