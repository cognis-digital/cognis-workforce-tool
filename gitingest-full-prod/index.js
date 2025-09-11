#!/usr/bin/env node
const { execSync, spawn } = require("child_process");
console.log("🚀 Bootstrapping Gitingest-Full...");

execSync("npm run bootstrap:qdrant", { stdio: "inherit" });
execSync("npm install", { stdio: "inherit" });
execSync("npm run build", { stdio: "inherit" });

spawn("node", ["dist/server.js"], { stdio: "inherit" });
