import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
console.log('Using connection string starting with:', dbUrl?.slice(0, 30));

const sql = neon(dbUrl);

async function main() {
  try {
    const result = await sql`select id, name, email, "emailVerified", image from "user" where email = ${'embroconnect3@gmail.com'}`;
    console.log('SUCCESS:', result);
  } catch (e) {
    console.error('RAW ERROR:', e);
  }
}

main();
