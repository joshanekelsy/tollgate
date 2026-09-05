/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as applications from "../applications.js";
import type * as billing from "../billing.js";
import type * as billingRuns from "../billingRuns.js";
import type * as calls from "../calls.js";
import type * as customers from "../customers.js";
import type * as health from "../health.js";
import type * as projects from "../projects.js";
import type * as rateCards from "../rateCards.js";
import type * as serviceAuth from "../serviceAuth.js";
import type * as stripe from "../stripe.js";
import type * as taskPolicies from "../taskPolicies.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  applications: typeof applications;
  billing: typeof billing;
  billingRuns: typeof billingRuns;
  calls: typeof calls;
  customers: typeof customers;
  health: typeof health;
  projects: typeof projects;
  rateCards: typeof rateCards;
  serviceAuth: typeof serviceAuth;
  stripe: typeof stripe;
  taskPolicies: typeof taskPolicies;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
