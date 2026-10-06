import { Config } from "@remotion/cli/config";
import { existsSync, readdirSync } from "fs";
import { join } from "path";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);

// Some sandboxed/cloud sessions route all HTTPS (including what the headless
// browser fetches, e.g. Google Fonts) through a local MITM proxy whose CA isn't
// in Chromium's trust store. Harmless elsewhere since it only affects fetches
// Chromium itself makes while rendering, not the rendered video's correctness.
Config.setChromiumIgnoreCertificateErrors(true);

// Some sandboxed/cloud sessions block the remotion.media download host entirely
// but ship a Playwright Chromium already. Reuse its headless-shell build instead
// of letting Remotion try to download its own; no-op when it isn't present.
const pwBrowsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
if (pwBrowsersPath && existsSync(pwBrowsersPath)) {
  const headlessShellDir = readdirSync(pwBrowsersPath).find((d) =>
    d.startsWith("chromium_headless_shell-")
  );
  if (headlessShellDir) {
    const binPath = join(pwBrowsersPath, headlessShellDir, "chrome-linux", "headless_shell");
    if (existsSync(binPath)) {
      Config.setBrowserExecutable(binPath);
    }
  }
}
