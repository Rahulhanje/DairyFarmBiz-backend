/**
 * Migration Script: Add userId to existing records
 * 
 * IMPORTANT: Run this ONCE after deploying the userId changes
 * 
 * This script will:
 * 1. Assign the first user's ID to all existing records (for single-user systems)
 * 2. OR allow you to manually assign records to specific users
 */

import mongoose from 'mongoose';
import { config } from '../config';
import { User } from '../modules/auth/user.model';
import { Animal } from '../modules/animal/animal.model';
import { Expense } from '../modules/expense/expense.model';
import { MilkCollection } from '../modules/milk-collection/milk-collection.model';
import { Insemination } from '../modules/breeding/insemination.model';
import { MilkRate } from '../modules/milk-rate/milk-rate.model';
import { PregnancyStatusHistory } from '../modules/pregnancy-status/pregnancy-status.model';
import { Notification } from '../modules/notification/notification.model';

async function migrateData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Get the first user (or specify a user ID)
    const firstUser = await User.findOne().sort({ createdAt: 1 });
    
    if (!firstUser) {
      console.error('❌ No users found in database. Please create a user first.');
      process.exit(1);
    }

    const userId = firstUser._id;
    console.log(`\n👤 Using user: ${firstUser.name} (${firstUser.email})`);
    console.log(`🆔 User ID: ${userId}\n`);

    // Confirm before proceeding
    console.log('⚠️  This will assign ALL existing records to this user.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update each collection
    const collections = [
      { name: 'Animals', model: Animal },
      { name: 'Expenses', model: Expense },
      { name: 'Milk Collections', model: MilkCollection },
      { name: 'Inseminations', model: Insemination },
      { name: 'Milk Rates', model: MilkRate },
      { name: 'Pregnancy Status History', model: PregnancyStatusHistory },
      { name: 'Notifications', model: Notification },
    ];

    console.log('🔄 Starting migration...\n');

    for (const { name, model } of collections) {
      try {
        // Count records without userId
        const count = await model.countDocuments({ userId: { $exists: false } });
        
        if (count === 0) {
          console.log(`✅ ${name}: No records to migrate`);
          continue;
        }

        // Update records
        const result = await model.updateMany(
          { userId: { $exists: false } },
          { $set: { userId } }
        );

        console.log(`✅ ${name}: Migrated ${result.modifiedCount} records`);
      } catch (error) {
        console.error(`❌ ${name}: Migration failed -`, error);
      }
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📊 Summary:');
    
    // Print summary
    for (const { name, model } of collections) {
      const total = await model.countDocuments();
      const withUserId = await model.countDocuments({ userId: { $exists: true } });
      console.log(`  ${name}: ${withUserId}/${total} records have userId`);
    }

    console.log('\n✅ All done! You can now restart your application.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrateData();
