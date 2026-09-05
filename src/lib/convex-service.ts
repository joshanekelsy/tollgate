import { ConvexHttpClient } from "convex/browser";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

const MINIMUM_SERVICE_TOKEN_LENGTH = 32;

type ServerArgs<Reference extends FunctionReference<"query" | "mutation">> = Omit<FunctionArgs<Reference>, "serviceToken">;

export function getConvexServiceToken() {
  const token = process.env.CONVEX_SERVICE_TOKEN;
  return token && token.length >= MINIMUM_SERVICE_TOKEN_LENGTH ? token : null;
}

export function withConvexServiceToken<T extends Record<string, unknown>>(args: T, token = getConvexServiceToken()) {
  if (!token || token.length < MINIMUM_SERVICE_TOKEN_LENGTH) {
    throw new Error("Convex service authorization is not configured");
  }
  return { ...args, serviceToken: token };
}

export class ConvexServiceClient {
  private readonly client: ConvexHttpClient;

  constructor(url: string, private readonly serviceToken: string) {
    this.client = new ConvexHttpClient(url);
  }

  query<Query extends FunctionReference<"query">>(reference: Query, args: ServerArgs<Query>) {
    return this.client.query(
      reference,
      withConvexServiceToken(args, this.serviceToken) as FunctionArgs<Query>,
    ) as Promise<Awaited<FunctionReturnType<Query>>>;
  }

  mutation<Mutation extends FunctionReference<"mutation">>(reference: Mutation, args: ServerArgs<Mutation>) {
    return this.client.mutation(
      reference,
      withConvexServiceToken(args, this.serviceToken) as FunctionArgs<Mutation>,
    ) as Promise<Awaited<FunctionReturnType<Mutation>>>;
  }
}

export function createConvexServiceClient(url = process.env.NEXT_PUBLIC_CONVEX_URL) {
  const serviceToken = getConvexServiceToken();
  return url && serviceToken ? new ConvexServiceClient(url, serviceToken) : null;
}
