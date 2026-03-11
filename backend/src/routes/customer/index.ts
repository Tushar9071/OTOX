import { Elysia } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { customerProfileRoutes } from "./profile";
import { customerRideRoutes } from "./rides";
import { customerPaymentRoutes } from "./payments";

export const customerRoutes = new Elysia({ prefix: "/customer" })
  .use(authMiddleware)
  .use(customerProfileRoutes)
  .use(customerRideRoutes)
  .use(customerPaymentRoutes);
