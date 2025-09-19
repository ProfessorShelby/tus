import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../db/schema';

async function setupLocalDatabase() {
  console.log('Setting up local SQLite database...');
  
  // Create database connection
  const sqlite = new Database('./local.db');
  const db = drizzle(sqlite, { schema });
  
  try {
    // Run migrations
    console.log('Running migrations...');
    migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully!');
    
    // Close connection
    sqlite.close();
    console.log('Local database setup completed!');
  } catch (error) {
    console.error('Setup failed:', error);
    sqlite.close();
    process.exit(1);
  }
}

setupLocalDatabase();
