import mongoose from 'mongoose';
import { Notification } from './src/modules/notification/notification.model';
import { config } from './src/config';

/**
 * Check all notifications to see their recipientEmail status
 */
async function checkNotifications() {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('✅ Connected to MongoDB');

        const allNotifications = await Notification.find({
            channel: 'email'
        }).sort({ createdAt: -1 }).limit(10);

        console.log(`\n📋 Last 10 EMAIL notifications:\n`);

        allNotifications.forEach((notif, index) => {
            console.log(`${index + 1}. Status: ${notif.status}`);
            console.log(`   RecipientEmail: ${notif.recipientEmail || '❌ NOT SET'}`);
            console.log(`   Scheduled: ${notif.scheduledDate.toISOString()}`);
            console.log(`   Type: ${notif.type}`);
            console.log(`   Created: ${notif.createdAt}`);
            if (notif.lastError) {
                console.log(`   Error: ${notif.lastError}`);
            }
            console.log('');
        });

        await mongoose.disconnect();
        console.log('✅ Done');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkNotifications();
