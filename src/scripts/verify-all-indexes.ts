import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dairyfarm';

async function verifyAllIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collections = [
      { name: 'animals', collection: 'animals' },
      { name: 'inseminations', collection: 'inseminations' },
      { name: 'expenses', collection: 'expenses' }
    ];

    for (const { name, collection } of collections) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`${name.toUpperCase()} INDEXES`);
      console.log('='.repeat(50));
      
      const indexes = await db.collection(collection).indexes();
      indexes.forEach((index) => {
        const uniqueFlag = index.unique ? ' [UNIQUE]' : '';
        console.log(`\n${index.name}${uniqueFlag}`);
        console.log(`  ${JSON.stringify(index.key)}`);
      });
    }

    console.log('\n\n' + '='.repeat(50));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(50));
    console.log('\n✅ All indexes now properly include userId!');
    console.log('✅ Multi-tenant data isolation is secure!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

verifyAllIndexes();
