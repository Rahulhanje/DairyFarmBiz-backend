import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dairyfarm';

async function fixMilkRateIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collection = db.collection('milkrates');

    // Get existing indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, index.key);
    });

    // Drop the old incorrect index
    try {
      console.log('\nDropping old index: animalType_1_effectiveFrom_1...');
      await collection.dropIndex('animalType_1_effectiveFrom_1');
      console.log('✓ Old index dropped successfully');
    } catch (error: any) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('⚠ Index not found (might already be dropped)');
      } else {
        throw error;
      }
    }

    // The new index will be created automatically when the application starts
    console.log('\n✓ Index fix completed!');
    console.log('The new index with userId will be created automatically on next server start.');

    // Show final indexes
    console.log('\nRemaining indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, index.key);
    });

  } catch (error) {
    console.error('Error fixing index:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  }
}

fixMilkRateIndex();
