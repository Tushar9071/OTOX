import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requirePermission } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

let ticketCounter = 0;

async function generateTicketNumber(): Promise<string> {
  const count = await prisma.supportTicket.count();
  return `TKT-${String(count + 1).padStart(5, "0")}`;
}

export const adminSupportRoutes = new Elysia({ prefix: "/support" })
  .get("/tickets", async ({ admin, query }) => {
    requirePermission("manage_tickets")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = query.status as string | undefined;
    const priority = query.priority as string | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          raisedBy: { select: { name: true, phone: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      success: true,
      data: tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  })

  .get("/tickets/:id", async ({ admin, params }) => {
    requirePermission("manage_tickets")(admin);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        raisedBy: { select: { name: true, phone: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) return { success: false, error: "Ticket not found" };
    return { success: true, data: ticket };
  })

  .post(
    "/tickets/:id/messages",
    async ({ admin, params, body }) => {
      requirePermission("manage_tickets")(admin);

      const message = await prisma.ticketMessage.create({
        data: {
          ticketId: params.id,
          senderId: admin.id,
          senderType: "ADMIN",
          message: body.message,
        },
      });

      await prisma.supportTicket.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      });

      return { success: true, data: message };
    },
    { body: t.Object({ message: t.String({ minLength: 1 }) }) }
  )

  .patch(
    "/tickets/:id/assign",
    async ({ admin, params, body }) => {
      requirePermission("manage_tickets")(admin);

      const ticket = await prisma.supportTicket.update({
        where: { id: params.id },
        data: { assignedToId: body.adminId },
      });

      return { success: true, data: ticket };
    },
    { body: t.Object({ adminId: t.String() }) }
  )

  .patch(
    "/tickets/:id/status",
    async ({ admin, params, body }) => {
      requirePermission("manage_tickets")(admin);

      const ticket = await prisma.supportTicket.update({
        where: { id: params.id },
        data: { status: body.status as any },
      });

      return { success: true, data: ticket };
    },
    { body: t.Object({ status: t.String() }) }
  )

  .patch(
    "/tickets/:id/priority",
    async ({ admin, params, body }) => {
      requirePermission("manage_tickets")(admin);

      const ticket = await prisma.supportTicket.update({
        where: { id: params.id },
        data: { priority: body.priority as any },
      });

      return { success: true, data: ticket };
    },
    { body: t.Object({ priority: t.String() }) }
  );
