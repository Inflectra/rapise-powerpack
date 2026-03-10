#!/usr/bin/env node
"use strict";

const { spawnSync, spawn } = require("child_process");
const fs = require("fs");
const os = require("os");

function env(name, fallback) {
  return process.env[name] || fallback || "";
}

function fail(msg) {
  console.log(`::error::${msg}`);
  process.exit(1);
}

function quoteArg(arg) {
  if (arg.includes(" ")) return `"${arg}"`;
  return arg;
}

function npxSync(args) {
  console.log(`Executing: npx ${args.join(" ")}`);
  const result = spawnSync("npx", args.map(quoteArg), {
    stdio: "inherit",
    windowsHide: true,
    shell: true,
  });
  if (result.error) {
    fail(`Failed to spawn npx: ${result.error.message}`);
  }
  if (result.signal) {
    fail(`Process killed by signal: ${result.signal}`);
  }
  if (result.status !== 0) {
    fail(`Non zero exit code returned by RapiseLauncher: ${result.status}`);
  }
}

function npxWithTimeout(args, timeoutMinutes) {
  return new Promise((resolve) => {
    console.log(`Executing (timeout ${timeoutMinutes}m): npx ${args.join(" ")}`);
    const child = spawn("npx", args.map(quoteArg), {
      stdio: "inherit",
      windowsHide: true,
      shell: true,
    });

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const timer = setTimeout(() => {
      console.log(`::warning::RapiseLauncher exceeded timeout of ${timeoutMinutes} minutes. Killing process.`);
      child.kill("SIGTERM");
      // Force kill after 5 seconds if still alive
      setTimeout(() => child.kill("SIGKILL"), 5000);
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      fail(`Failed to spawn npx: ${err.message}`);
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (signal) {
        fail(`RapiseLauncher timed out after ${timeoutMinutes} minutes.`);
      } else if (code !== 0) {
        fail(`Non zero exit code returned by RapiseLauncher: ${code}`);
      } else {
        resolve();
      }
    });
  });
}

// --- Main (async to support timeout) ---
async function main() {
  let spiraUrl = env("INPUT_SPIRA_URL");
  const spiraUsername = env("INPUT_SPIRA_USERNAME");
  const spiraApiKey = env("INPUT_SPIRA_API_KEY");
  let spiraProjectId = env("INPUT_SPIRA_PROJECT_ID");
  let spiraTestSetId = env("INPUT_SPIRA_TEST_SET_ID");
  let spiraAutomationHost = env("INPUT_SPIRA_AUTOMATION_HOST");
  const spiraConfig = env("INPUT_SPIRA_CONFIG");
  const rapiseParams = env("INPUT_RAPISE_PARAMS");
  const timeoutMinutes = parseInt(env("INPUT_TIMEOUT_MINUTES", "0"), 10) || 0;

  // Parse full-form Spira URL: https://server/9/TestSet/925.aspx
  const urlMatch = spiraUrl.match(/^(https?:\/\/.+?)\/(\d+)\/TestSet\/(\d+)\.aspx$/);
  if (urlMatch) {
    spiraUrl = urlMatch[1] + "/";
    if (!spiraProjectId) spiraProjectId = urlMatch[2];
    if (!spiraTestSetId) spiraTestSetId = urlMatch[3];
    console.log(`Parsed from spira_url: server=${spiraUrl}, project=${spiraProjectId}, testset=${spiraTestSetId}`);
  }

  if (!spiraTestSetId) {
    fail("spira_test_set_id required. Provide it explicitly or use the full spira_url form (e.g. https://server/9/TestSet/925.aspx).");
  }

  if (!spiraAutomationHost) {
    spiraAutomationHost = os.hostname();
    console.log(`spira_automation_host not set, using hostname: ${spiraAutomationHost}`);
  }

  console.log(`spiraProjectId: ${spiraProjectId}`);
  console.log(`spiraTestSetId: ${spiraTestSetId}`);

  // --- Configure or validate config ---
  let rlConfigPath;

  if (spiraConfig) {
    rlConfigPath = spiraConfig;
    console.log(`Using existing Spira config: ${rlConfigPath}`);
    if (!fs.existsSync(rlConfigPath)) {
      fail(`Spira config file not found: ${rlConfigPath}`);
    }
  } else {
    if (!spiraUrl || !spiraUsername || !spiraApiKey) {
      fail("Either spira_config or spira_url+spira_username+spira_api_key must be provided.");
    }

    console.log(`spiraUrl: ${spiraUrl}`);
    console.log(`spiraAutomationHost: ${spiraAutomationHost}`);

    rlConfigPath = "RepositoryConnection.xml";
    console.log(`RLConfigPath: ${rlConfigPath}`);

    console.log("Configuring RapiseLauncher...");
    npxSync([
      "rapiselauncher", "-c", rlConfigPath,
      "--set", `SpiraServer=${spiraUrl}`,
      "--set", `SpiraUser=${spiraUsername}`,
      "--set", `SpiraPassword=${spiraApiKey}`,
      "--set", `AutomationHost=${spiraAutomationHost}`,
    ]);
  }

  // --- Ensure Rapise data folder exists on Windows ---
  if (process.platform === "win32") {
    const rapiseDir = "C:\\ProgramData\\Inflectra\\Rapise";
    if (!fs.existsSync(rapiseDir)) {
      console.log(`Creating ${rapiseDir}`);
      fs.mkdirSync(rapiseDir, { recursive: true });
    }
  }

  // --- Set GITROOT ---
  const gitRoot = env("INPUT_GIT_ROOT");
  if (gitRoot) {
    console.log(`Setting GITROOT=${gitRoot}`);
    process.env.GITROOT = gitRoot;
  } else if (process.env.GITHUB_WORKSPACE) {
    console.log(`Setting GITROOT=${process.env.GITHUB_WORKSPACE}`);
    process.env.GITROOT = process.env.GITHUB_WORKSPACE;
  }

  // --- Build run command ---
  const cmdArgs = ["rapiselauncher", "-c", rlConfigPath, "--details"];

  if (spiraProjectId) {
    cmdArgs.push("-p", spiraProjectId);
  }

  cmdArgs.push("-t", spiraTestSetId);

  if (rapiseParams) {
    for (const p of rapiseParams.split("\n")) {
      const trimmed = p.trim();
      if (trimmed) cmdArgs.push("--param", trimmed);
    }
  }

  // --- Execute with or without timeout ---
  if (timeoutMinutes > 0) {
    await npxWithTimeout(cmdArgs, timeoutMinutes);
  } else {
    npxSync(cmdArgs);
  }

  console.log("Execution Successful");
}

main().catch((e) => {
  fail(e.message || String(e));
});
