#!/usr/bin/env node
/**
 * Post-deploy verification for Musaffa Country KB.
 * Exit 0 = all checks passed. Exit 1 = failure.
 *
 * Usage:
 *   node scripts/verify-dev.js
 *   node scripts/verify-dev.js --port 3001
 *   node scripts/verify-dev.js --url / --url /countries/united-arab-emirates
 */

const http = require("http");

const args = process.argv.slice(2);
let port = 3000;
const urls = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--port" && args[i + 1]) {
    port = parseInt(args[++i], 10);
  } else if (args[i] === "--url" && args[i + 1]) {
    urls.push(args[++i]);
  }
}

if (urls.length === 0) {
  urls.push("/", "/countries/united-arab-emirates");
}

const ERROR_MARKERS = [
  "Internal Server Error",
  "Application error",
  "Cannot find module",
  "ENOENT:",
  "500 Internal Server Error",
];

function fetch(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: "localhost", port, path, timeout: 15000 },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode, body });
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

async function main() {
  console.log(`Verifying http://localhost:${port} ...\n`);
  let failed = false;

  for (const path of urls) {
    const label = `GET ${path}`;
    try {
      const { status, body } = await fetch(path);
      const errorInBody = ERROR_MARKERS.some((m) => body.includes(m));

      if (status === 200 && !errorInBody) {
        console.log(`  PASS  ${label}  →  ${status}`);
      } else if (status === 200 && errorInBody) {
        console.log(`  FAIL  ${label}  →  200 but error content in body`);
        failed = true;
      } else {
        console.log(`  FAIL  ${label}  →  ${status}`);
        failed = true;
      }
    } catch (err) {
      console.log(`  FAIL  ${label}  →  ${err.message}`);
      failed = true;
    }
  }

  console.log("");
  if (failed) {
    console.error("Verification FAILED. Fix errors before telling the user you are done.");
    process.exit(1);
  }
  console.log("Verification PASSED. Safe to tell the user the app is ready.");
  process.exit(0);
}

main();
