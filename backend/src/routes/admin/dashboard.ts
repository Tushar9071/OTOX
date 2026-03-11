import { Elysia } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requirePermission } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

export const adminDashboardRoutes = new Elysia({ prefix: "/dashboard" })
  .get("/stats", async ({ admin }) => {
    requirePermission("view_dashboard")(admin);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers, totalDrivers, ridesToday, revenueResult,
      activeRides, driversOnline, pendingApprovals, openTickets,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "DRIVER" } }),
      prisma.ride.count({ where: { requestedAt: { gte: today } } }),
      prisma.payment.aggregate({ where: { createdAt: { gte: today }, status: "PAID" }, _sum: { amount: true } }),
      prisma.ride.count({ where: { status: { in: ["REQUESTED", "ACCEPTED", "DRIVER_ARRIVED", "TRIP_STARTED"] } } }),
      prisma.driverProfile.count({ where: { status: "ONLINE" } }),
      prisma.driverProfile.count({ where: { isApproved: false, isDocumentVerified: false } }),
      prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        totalDrivers,
        ridesToday,
        revenueToday: revenueResult._sum.amount || 0,
        activeRides,
        driversOnline,
        pendingApprovals,
        openTickets,
      },
    };
  })

  .get("/analytics", async ({ admin, query }) => {
    requirePermission("view_dashboard")(admin);

    const range = query.range || "30d";
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rides = await prisma.ride.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, finalFare: true, status: true },
    });

    // Group by date
    const dailyData: Record<string, { rides: number; revenue: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyData[key] = { rides: 0, revenue: 0 };
    }

    for (const ride of rides) {
      const key = ride.createdAt.toISOString().split("T")[0];
      if (dailyData[key]) {
        dailyData[key].rides++;
        if (ride.finalFare) dailyData[key].revenue += ride.finalFare;
      }
    }

    const chartData = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: chartData };
  })

  .get("/live", async ({ admin }) => {
    requirePermission("view_dashboard")(admin);

    const [activeRides, onlineDrivers] = await Promise.all([
      prisma.ride.findMany({
        where: { status: { in: ["REQUESTED", "ACCEPTED", "DRIVER_ARRIVED", "TRIP_STARTED"] } },
        include: {
          customer: { select: { name: true, phone: true } },
          driver: {
            include: {
              user: { select: { name: true, phone: true } },
              vehicle: true,
            },
          },
        },
      }),
      prisma.driverProfile.findMany({
        where: { status: { in: ["ONLINE", "BUSY"] } },
        include: { user: { select: { name: true } }, vehicle: true },
      }),
    ]);

    return {
      success: true,
      data: {
        activeRides,
        onlineDrivers: onlineDrivers.map((d) => ({
          id: d.id,
          name: d.user.name,
          status: d.status,
          latitude: d.currentLatitude,
          longitude: d.currentLongitude,
          vehicleNo: d.vehicle?.registrationNo,
        })),
      },
    };
  });
