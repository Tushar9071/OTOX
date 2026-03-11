import { Elysia } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { driverProfileRoutes } from "./profile";
import { driverRideRoutes } from "./rides";
import { driverLocationRoutes } from "./location";
import { driverEarningsRoutes } from "./earnings";

export const driverRoutes = new Elysia({ prefix: "/driver" })
  .use(authMiddleware)
  .use(driverProfileRoutes)
  .use(driverRideRoutes)
  .use(driverLocationRoutes)
  .use(driverEarningsRoutes);
