import { spawnSync } from "node:child_process";
import { createServer } from "node:net";

const supabaseVersion = "2.121.0";
const projectDirectory = process.cwd();
const isWindows = process.platform === "win32";

function run(
  command,
  args,
  { env = process.env, captureOutput = false, quietFailure = false } = {},
) {
  const executable = isWindows ? process.env.ComSpec ?? "cmd.exe" : command;
  const commandArgs = isWindows
    ? ["/d", "/s", "/c", [command, ...args].join(" ")]
    : args;
  const result = spawnSync(executable, commandArgs, {
    cwd: projectDirectory,
    env,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    stdio: captureOutput ? "pipe" : "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const errorOutput = result.stderr?.trim();
    if (!quietFailure && errorOutput) process.stderr.write(`${errorOutput}\n`);
    throw new Error(`${command} exited with code ${result.status ?? 1}.`);
  }

  return result.stdout ?? "";
}

function runNodeScript(scriptPath, env) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: projectDirectory,
    env,
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${scriptPath} exited with code ${result.status ?? 1}.`);
  }
}

function runSupabase(args, options) {
  return run(
    "npx",
    ["--yes", `supabase@${supabaseVersion}`, ...args],
    options,
  );
}

function getLocalStatus() {
  try {
    const output = runSupabase(["status", "-o", "json"], {
      captureOutput: true,
      quietFailure: true,
    });
    const jsonStart = output.indexOf("{");
    return jsonStart < 0 ? null : JSON.parse(output.slice(jsonStart));
  } catch {
    return null;
  }
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a local E2E server port."));
        return;
      }

      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

const hadRunningStack = Boolean(getLocalStatus()?.API_URL);
let exitCode = 0;

try {
  runSupabase(["start", "--exclude", "studio,postgres-meta"], {
    captureOutput: true,
  });
  runSupabase(["migration", "up", "--local"], { captureOutput: true });

  const status = getLocalStatus();
  if (!status?.API_URL || !status.PUBLISHABLE_KEY || !status.SERVICE_ROLE_KEY) {
    throw new Error("Supabase local did not return its API and Auth keys.");
  }

  const port = await getAvailablePort();
  const testEnvironment = {
    ...process.env,
    E2E_LOCAL: "1",
    E2E_BASE_URL: `http://localhost:${port}`,
    E2E_SUPABASE_URL: status.API_URL,
    E2E_SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    PORT: String(port),
  };

  runNodeScript("scripts/seed-e2e-users.mjs", testEnvironment);

  run("npm", ["run", "build"], { env: testEnvironment });

  run("npx", ["playwright", "test", ...process.argv.slice(2)], {
    env: testEnvironment,
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  exitCode = 1;
} finally {
  if (!hadRunningStack) {
    try {
      runSupabase(["stop"], { captureOutput: true });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      exitCode = 1;
    }
  }
}

process.exitCode = exitCode;
