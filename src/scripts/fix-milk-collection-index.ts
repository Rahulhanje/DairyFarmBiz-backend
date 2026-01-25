import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dairyfarm';

async function fixMilkCollectionIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collection = db.collection('milkcollections');

    // Get existing indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, index.key);
    });

    // Drop the old incorrect indexes
    const indexesToDrop = [
      'date_1_session_1_animalType_1',
      'date_-1',
      'animalType_1_date_-1'
    ];

    for (const indexName of indexesToDrop) {
      try {
        console.log(`\nDropping old index: ${indexName}...`);
        await collection.dropIndex(indexName);
        console.log(`✓ Index ${indexName} dropped successfully`);
      } catch (error: any) {
        if (error.code === 27 || error.codeName === 'IndexNotFound') {
          console.log(`⚠ Index ${indexName} not found (might already be dropped)`);
        } else {
          console.error(`Error dropping ${indexName}:`, error.message);
        }
      }
    }

    // The new indexes will be created automatically when the application starts
    console.log('\n✓ Index fix completed!');
    console.log('The new indexes with userId will be created automatically on next server start.');

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

fixMilkCollectionIndex();
