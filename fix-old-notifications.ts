import mongoose from 'mongoose';
import { Notification } from './src/modules/notification/notification.model';
import { config } from './src/config';

async function fixPendingNotifications() {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('✅ Connected to MongoDB');

        const recipientEmail = config.notificationEmail || config.smtpUser;

        if (!recipientEmail) {
            console.error('❌ No email configured');
            process.exit(1);
        }

        // Update all pending/cancelled email notifications without recipientEmail
        const result = await Notification.updateMany(
            {
                channel: 'email',
                status: { $in: ['pending', 'cancelled'] },
                $or: [
                    { recipientEmail: { $exists: false } },
                    { recipientEmail: null },
                    { recipientEmail: '' }
                ]
            },
            {
                $set: {
                    recipientEmail,
                    status: 'pending',  // Reset cancelled ones to pending
                    lastError: null     // Clear error message
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} notification(s) to: ${recipientEmail}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixPendingNotifications();
