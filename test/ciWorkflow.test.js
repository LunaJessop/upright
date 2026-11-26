import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

const source = readFileSync(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8"
);

function childBlock(parentLine) {
  const lines = source.split("\n");
  const start = lines.indexOf(parentLine);
  assert.notEqual(start, -1, `missing ${parentLine}`);
  const indent = parentLine.match(/^ */)[0].length;
  const body = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === "") {
      body.push(line);
      continue;
    }
    if (line.match(/^ */)[0].length <= indent) break;
    body.push(line);
  }
  return body.join("\n");
}

describe("GitHub Actions CI workflow", () => {
  it("runs on pull requests to develop and main, and on pushes to develop", () => {
    const pullRequest = childBlock("  pull_request:");
    const push = childBlock("  push:");
    assert.match(pullRequest, /- develop(?:\n|$)/);
    assert.match(pullRequest, /- main(?:\n|$)/);
    assert.match(push, /- develop(?:\n|$)/);
    assert.doesNotMatch(push, /- main(?:\n|$)/);
  });

  it("installs with npm ci and runs lint, tests, and the production build on the current Node LTS", () => {
    assert.match(source, /node-version:\s*lts\/\*/);
    assert.match(source, /check-latest:\s*true/);
    assert.match(source, /^\s+- name: Install dependencies\n\s+run: npm ci\n/m);
    assert.match(source, /^\s+- name: Lint\n\s+run: npm run lint\n/m);
    assert.match(source, /^\s+- name: Run tests\n\s+run: npm test\n/m);
    assert.match(source, /^\s+- name: Build\n\s+run: npm run build\n/m);
    assert.match(source, /name: lint, test, and build/);
  });

  it("runs npm test on current Node LTS, which dropped the old module-type flag", () => {
    assert.equal(packageJson.type, "module");
    assert.match(packageJson.scripts.test, /^node --import \.\/test\/register-alias\.js /);
    assert.match(packageJson.scripts.test, /test\/ciWorkflow\.test\.js$/);
    assert.doesNotMatch(packageJson.scripts.test, /experimental-default-type/);
  });

  it("does not reference repository secrets and points the public API URL at a dummy host", () => {
    assert.doesNotMatch(source, /secrets\./);
    assert.doesNotMatch(source, /\$\{\{/);
    assert.match(
      source,
      /NEXT_PUBLIC_API_URL:\s*https:\/\/example\.invalid(?:\n|$)/
    );
    assert.doesNotMatch(source, /POSTHOG/i);
    assert.doesNotMatch(source, /neon\.tech/i);
  });
});
