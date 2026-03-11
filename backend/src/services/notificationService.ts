import { logger } from "../middleware/logger";

export const notificationService = {
  async sendPush(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
    try {
      const env = (await import("../config/env")).default;
      if (!env.FIREBASE_PROJECT_ID) {
        logger.debug({ title, body }, "FCM not configured, skipping push");
        return;
      }

      const { getFirebaseMessaging } = await import("../config/firebase");
      const messaging = getFirebaseMessaging();

      await messaging.send({
        token: fcmToken,
        notification: { title, body },
        data: data || {},
        android: {
          priority: "high",
          notification: { sound: "default", channelId: "ride_requests" },
        },
        apns: {
          payload: { aps: { sound: "default", badge: 1 } },
        },
      });

      logger.info({ title }, "Push notification sent");
    } catch (error) {
      logger.error({ error, fcmToken }, "Failed to send push notification");
    }
  },

  async sendToUser(userId: string, type: string, title: string, body: string, data?: object) {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      await prisma.notification.create({
        data: {
          userId,
          type: type as any,
          title,
          body,
          data: data as any,
        },
      });
    } catch (error) {
      logger.error({ error, userId }, "Failed to create notification record");
    }
  },
};
