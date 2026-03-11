import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger";

export const swaggerPlugin = new Elysia({ name: "swagger" }).use(
  swagger({
    documentation: {
      info: {
        title: "AutoRiksha API",
        version: "1.0.0",
        description: "Auto Rickshaw ride-booking platform API",
      },
      tags: [
        { name: "Auth", description: "Authentication" },
        { name: "Customer", description: "Customer endpoints" },
        { name: "Driver", description: "Driver endpoints" },
        { name: "Maps", description: "Maps & geocoding" },
        { name: "Admin", description: "Admin panel endpoints" },
      ],
    },
    path: "/swagger",
  })
);
