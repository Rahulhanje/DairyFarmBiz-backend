import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dairyfarm';

async function cleanupIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collection = db.collection('milkrates');

    // Drop the duplicate old index that got recreated
    try {
      console.log('Dropping duplicate index: animalType_1_effectiveFrom_1...');
      await collection.dropIndex('animalType_1_effectiveFrom_1');
      console.log('✓ Duplicate index dropped\n');
    } catch (error: any) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('Index not found\n');
      } else {
        throw error;
      }
    }

    // Show final clean indexes
    console.log('Final MilkRate indexes:');
    console.log('======================\n');
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`${index.unique ? '🔒' : '  '} ${index.name}`);
      console.log(`   ${JSON.stringify(index.key)}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

cleanupIndexes();
