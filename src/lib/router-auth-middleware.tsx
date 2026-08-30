/**
 * TanStack Router Auth Middleware & Route Guards
 * Unified entry point for protecting routes and preventing role mismatches.
 */
export {
  AuthRouteMiddleware,
  useAuthRouteGuard,
  withAuthMiddleware,
  createRouterAuthGuard,
  type AuthMiddlewareOptions,
  type AuthGuardResult,
  type AuthRouteMiddlewareProps,
} from "@/middlewares/auth-middleware";

export { RoleGuard } from "@/components/RoleGuard";
export { requireAuthAndRole } from "@/lib/route-guards";
