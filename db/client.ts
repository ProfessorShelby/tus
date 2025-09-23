import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://tus-tercih-rehberi-tusrobotu.aws-eu-west-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTc0MjQ2MzEsImlkIjoiMjMyZTk5ZTctMTFiMS00NDA3LWFjNGQtN2QzNWY0ODljMjQ5IiwicmlkIjoiN2Q4Y2FjNGQtMDJlNy00NDVhLWI1ZWUtZjg0Y2NiYmU3NTZmIn0.FCytb4i5gNgV9kOP662g1ViYgr9MmNMcc4JCs_5aIT5HqD6erLr5GH1kA2QVr9xoV1BLiKCJLAYCmGXfkmGYDg',
});

export const db = drizzle(client, { schema });
