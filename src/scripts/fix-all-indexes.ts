import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dairyfarm';

async function fixAllIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Fix Animal indexes
    console.log('=== FIXING ANIMAL INDEXES ===');
    const animalCollection = db.collection('animals');
    const animalIndexesToDrop = [
      'serialNumber_1_animalType_1',
      'animalType_1',
      'isSold_1',
      'isActive_1'
    ];

    for (const indexName of animalIndexesToDrop) {
      try {
        console.log(`Dropping: ${indexName}...`);
        await animalCollection.dropIndex(indexName);
        console.log(`✓ Dropped ${indexName}`);
      } catch (error: any) {
        if (error.code === 27 || error.codeName === 'IndexNotFound') {
          console.log(`⚠ ${indexName} not found`);
        } else {
          console.error(`Error: ${error.message}`);
        }
      }
    }

    // Fix Insemination indexes
    console.log('\n=== FIXING INSEMINATION INDEXES ===');
    const inseminationCollection = db.collection('inseminations');
    const inseminationIndexesToDrop = [
      'animal_1',
      'inseminationDate_-1',
      'pregnancyCheckDate_1',
      'pregnancyStatus_1',
      'notificationSent_1_pregnancyStatus_1'
    ];

    for (const indexName of inseminationIndexesToDrop) {
      try {
        console.log(`Dropping: ${indexName}...`);
        await inseminationCollection.dropIndex(indexName);
        console.log(`✓ Dropped ${indexName}`);
      } catch (error: any) {
        if (error.code === 27 || error.codeName === 'IndexNotFound') {
          console.log(`⚠ ${indexName} not found`);
        } else {
          console.error(`Error: ${error.message}`);
        }
      }
    }

    // Fix Expense indexes
    console.log('\n=== FIXING EXPENSE INDEXES ===');
    const expenseCollection = db.collection('expenses');
    const expenseIndexesToDrop = [
      'date_-1',
      'category_1',
      'date_-1_category_1'
    ];

    for (const indexName of expenseIndexesToDrop) {
      try {
        console.log(`Dropping: ${indexName}...`);
        await expenseCollection.dropIndex(indexName);
        console.log(`✓ Dropped ${indexName}`);
      } catch (error: any) {
        if (error.code === 27 || error.codeName === 'IndexNotFound') {
          console.log(`⚠ ${indexName} not found`);
        } else {
          console.error(`Error: ${error.message}`);
        }
      }
    }

    console.log('\n✓ All index fixes completed!');
    console.log('New indexes with userId will be created automatically on server start.\n');

    // Show summary
    console.log('=== SUMMARY ===');
    console.log('Animal indexes: Fixed unique index + query indexes');
    console.log('Insemination indexes: Fixed all query indexes');
    console.log('Expense indexes: Fixed all query indexes');

  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  }
}

fixAllIndexes();
