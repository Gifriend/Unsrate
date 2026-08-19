import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

export default async () => {
  console.log('\nRunning Prisma migrations for test database...');
  try {
    // Ensure the DATABASE_URL from .env.test is used for the migration
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env, // Inherit existing env vars
        DATABASE_URL: process.env.DATABASE_URL, // Explicitly pass the loaded DATABASE_URL
      },
      stdio: 'inherit', // Show migration output in the console
    });
    console.log('Prisma migrations applied successfully.');
  } catch (error) {
    console.error('Failed to apply Prisma migrations:', error);
    process.exit(1); // Exit if migrations fail
  }
};
