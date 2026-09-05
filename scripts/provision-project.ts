import { api } from "../convex/_generated/api";
import { accessCodeLookup, generateAccessCode, hashAccessCode } from "../src/lib/access-code";
import { createConvexServiceClient } from "../src/lib/convex-service";
import { generateWriteKey, hashWriteKey, writeKeyPrefix } from "../src/lib/write-key";

const projectId = process.argv[2]?.trim();
const name = process.argv[3]?.trim();
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const appUrl = process.env.TOLLGATE_APP_URL ?? "http://localhost:3000";

if (!projectId || !/^[a-z0-9-]{3,40}$/.test(projectId) || !name) {
  throw new Error('Usage: npm run provision -- <lowercase-project-id> "Project name"');
}
if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL is required");

async function main() {
  const accessCode = generateAccessCode();
  const testWriteKey = generateWriteKey("test");
  const liveWriteKey = generateWriteKey("live");
  const dashboardCodeHash = await hashAccessCode(accessCode);
  const convex = createConvexServiceClient(convexUrl);
  if (!convex) throw new Error("CONVEX_SERVICE_TOKEN is required");
  await convex.mutation(api.projects.create, {
    projectId: projectId as string,
    name: name as string,
    dashboardCodeHash,
    dashboardCodeLookup: accessCodeLookup(accessCode),
    createdAt: Date.now(),
    meterKeys: [
      { environment: "test", keyHash: hashWriteKey(testWriteKey), keyPrefix: writeKeyPrefix(testWriteKey) },
      { environment: "live", keyHash: hashWriteKey(liveWriteKey), keyPrefix: writeKeyPrefix(liveWriteKey) },
    ],
  });
  console.log(`Base URL: ${appUrl}/p/${projectId}/v1`);
  console.log(`Dashboard: ${appUrl}/p/${projectId}/dashboard`);
  console.log(`Dashboard code (shown once): ${accessCode}`);
  console.log(`Test write key (shown once): ${testWriteKey}`);
  console.log(`Live write key (shown once): ${liveWriteKey}`);
}

void main();
