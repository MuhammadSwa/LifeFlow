// push-server/server.ts
import 'dotenv/config'; // Loads .env from CWD (push-server/) by default
// If your .env is in the project root, and you run from project root:
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // Loads .env from project root

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { PushProcessor, ZQLDatabase, PostgresJSConnection, type TransactionProviderInput } from '@rocicorp/zero/pg';
import postgres from 'postgres';

// Adjust path if schema.ts/mutators.ts are in a different location relative to project root
// This assumes you run the dev script for push-server from the *project root*
// and your tsconfig in push-server allows resolving these.
// For simplicity, ensure your tsconfig in `push-server` can "see" these files
// or consider a monorepo setup for easier sharing.
// A common way if `push-server` is a sibling to `src` and you run from root:
import { schema, type Schema } from '../shared/schema.ts'; // Note the .js extension for ESM
import { createMutators, type Mutators } from '../shared/mutators.ts'; // Note the .js extension

const app = new Hono();

const dbConnectionString = process.env.ZERO_UPSTREAM_DB;
if (!dbConnectionString) {
  console.error("FATAL: ZERO_UPSTREAM_DB environment variable is not set.");
  process.exit(1);
}
const pg = postgres(dbConnectionString);

const zeroDB = new ZQLDatabase(
  new PostgresJSConnection(pg),
  schema as Schema // Cast if schema type isn't perfectly inferred
);

const processor = new PushProcessor(zeroDB);

app.post('/api/push', async (c) => {
  console.log('Push server (TS) received request:', c.req.url);
  const rawUserID = c.req.query('userID'); // Get from query param sent by Zero client's push.queryParams

  // Example AuthData structure; adapt as needed for your actual auth
  const authForMutators: { userID: string } | undefined = rawUserID ? { userID: rawUserID } : undefined;

  // console.log('Query Params from zero-cache:', c.req.query());
  // console.log('AuthData for mutators:', authForMutators);

  try {
    const mutators = createMutators(authForMutators);
    const pushResponse = await processor.process(
      mutators,
      c.req.raw, // Pass the raw Hono Request object
    );
    return c.json(pushResponse);
  } catch (error: any) {
    console.error('Error processing push request in Hono server:', error);
    return c.json({ error: 'Failed to process push request', details: error.message }, 500);
  }
});

const port = parseInt(process.env.PORT || '3001', 10);
console.log(`TypeScript Push server listening on 0.0.0.0:${port}`);
serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});
