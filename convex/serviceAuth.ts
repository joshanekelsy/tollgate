import { ConvexError, v } from "convex/values";

const MINIMUM_SERVICE_TOKEN_LENGTH = 32;

export const serviceAuthArgs = {
  serviceToken: v.string(),
};

function constantTimeEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export function requireServiceToken(args: { serviceToken: string }) {
  const expected = process.env.CONVEX_SERVICE_TOKEN;
  if (
    !expected
    || expected.length < MINIMUM_SERVICE_TOKEN_LENGTH
    || !constantTimeEqual(args.serviceToken, expected)
  ) {
    throw new ConvexError("Service authorization failed");
  }
}
