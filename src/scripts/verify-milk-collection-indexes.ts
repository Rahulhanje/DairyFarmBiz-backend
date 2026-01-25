import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dairyfarm';

async function verifyMilkCollectionIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const indexes = await db.collection('milkcollections').indexes();
    
    console.log('Current MilkCollection indexes:');
    console.log('==============================\n');
    
    indexes.forEach((index) => {
      console.log(`Index: ${index.name}`);
      console.log(`Keys: ${JSON.stringify(index.key)}`);
      console.log(`Unique: ${index.unique || false}`);
      console.log('---');
    });

    // Check if the correct index exists
    const correctIndex = indexes.find(idx => 
      idx.name === 'userId_1_date_1_session_1_animalType_1'
    );

    if (correctIndex) {
      console.log('\n✅ SUCCESS! The correct index with userId exists!');
      console.log('Users can now independently add milk collections for the same date and session.');
    } else {
      console.log('\n⚠️  The new index may not be created yet.');
      console.log('Make sure the server has started at least once after the fix.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

verifyMilkCollectionIndexes();
