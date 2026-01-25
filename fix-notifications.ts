import mongoose from 'mongoose';
import { Notification } from './src/modules/notification/notification.model';
import { config } from './src/config';

/**
 * Migration script to update all pending email notifications
 * that don't have a recipientEmail set
 */
async function updatePendingNotifications() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongodbUri);
        console.log('✅ Connected to MongoDB');

        // Find all pending email notifications without recipientEmail
        const notificationsToUpdate = await Notification.find({
            channel: 'email',
            status: 'pending',
            $or: [
                { recipientEmail: { $exists: false } },
                { recipientEmail: null },
                { recipientEmail: '' }
            ]
        });

        console.log(`📋 Found ${notificationsToUpdate.length} notification(s) to update`);

        if (notificationsToUpdate.length === 0) {
            console.log('✅ No notifications need updating');
            process.exit(0);
        }

        // Use the NOTIFICATION_EMAIL from config as fallback
        const recipientEmail = config.notificationEmail || config.smtpUser;

        if (!recipientEmail) {
            console.error('❌ No NOTIFICATION_EMAIL or SMTP_USER configured in environment variables');
            process.exit(1);
        }

        console.log(`📧 Will set recipientEmail to: ${recipientEmail}`);

        // Update all notifications
        const result = await Notification.updateMany(
            {
                channel: 'email',
                status: 'pending',
                $or: [
                    { recipientEmail: { $exists: false } },
                    { recipientEmail: null },
                    { recipientEmail: '' }
                ]
            },
            {
                $set: { recipientEmail }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} notification(s)`);
        console.log('✅ Migration complete!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
updatePendingNotifications();
