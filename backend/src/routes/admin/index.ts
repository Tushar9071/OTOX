import { Elysia } from "elysia";
import { adminAuthMiddleware } from "../../middleware/adminAuth";
import { adminDashboardRoutes } from "./dashboard";
import { adminUsersRoutes } from "./users";
import { adminDriversRoutes } from "./drivers";
import { adminRidesRoutes } from "./rides";
import { adminPaymentsRoutes } from "./payments";
import { adminSupportRoutes } from "./support";
import { adminErrorsRoutes } from "./errors";
import { adminPromotionsRoutes } from "./promotions";
import { adminSettingsRoutes } from "./settings";
import { adminRolesRoutes } from "./roles";
import { adminAuthRoutes } from "./auth";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(adminAuthRoutes) // Auth routes don't need admin middleware
  .use(adminAuthMiddleware)
  .use(adminDashboardRoutes)
  .use(adminUsersRoutes)
  .use(adminDriversRoutes)
  .use(adminRidesRoutes)
  .use(adminPaymentsRoutes)
  .use(adminSupportRoutes)
  .use(adminErrorsRoutes)
  .use(adminPromotionsRoutes)
  .use(adminSettingsRoutes)
  .use(adminRolesRoutes);
