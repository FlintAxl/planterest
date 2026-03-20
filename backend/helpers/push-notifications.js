const { Expo } = require('expo-server-sdk');

const expo = new Expo();

const STATUS_LABELS = {
    '1': 'Delivered',
    '2': 'Shipped',
    '3': 'Pending',
    '4': 'Cancelled',
};

const getStatusLabel = (status) => STATUS_LABELS[String(status)] || 'Updated';

async function sendOrderStatusNotification({ expoPushToken, orderId, status }) {
    if (!expoPushToken) {
        return { sent: false, shouldRemoveToken: false };
    }

    if (!Expo.isExpoPushToken(expoPushToken)) {
        return { sent: false, shouldRemoveToken: true, reason: 'InvalidExpoPushToken' };
    }

    const messages = [
        {
            to: expoPushToken,
            sound: 'default',
            title: 'Order Status Updated',
            body: `Your order is now ${getStatusLabel(status)}.`,
            data: {
                orderId: String(orderId),
                status: String(status),
                screen: 'Order Details',
            },
        },
    ];

    let shouldRemoveToken = false;
    const tickets = [];

    for (const chunk of expo.chunkPushNotifications(messages)) {
        const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...chunkTickets);
    }

    const ticketIds = tickets
        .filter((ticket) => ticket.status === 'ok')
        .map((ticket) => ticket.id)
        .filter(Boolean);

    for (const ticket of tickets) {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
            shouldRemoveToken = true;
        }
    }

    for (const chunk of expo.chunkPushNotificationReceiptIds(ticketIds)) {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

        for (const receiptId of Object.keys(receipts)) {
            const receipt = receipts[receiptId];
            if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
                shouldRemoveToken = true;
            }
        }
    }

    return { sent: true, shouldRemoveToken };
}

module.exports = { sendOrderStatusNotification };
