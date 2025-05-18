import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { PushProcessor, ZQLDatabase, PostgresJSConnection } from '@rocicorp/zero/pg';
import postgres from 'postgres';

// These would typically come from shared files or be generated
// For simplicity, re-importing or re-defining lightly here.
// Ideally, share schema.ts and mutators.ts (e.g., via a shared workspace package or symlinks)
// For this example, ensure paths are correct or simplify if running in same project.
// This example assumes you might run this server from the root of 'my-zero-todo'
// Adjust paths if 'push-server' is truly standalone.
import { schema } from '../src/schema.ts'; // Adjust path as needed
import { createMutators } from '../src/mutators.ts'; // Adjust path as needed

const app = new Hono();

const dbConnectionString = process.env.ZERO_UPSTREAM_DB || "postgresql://user:password@localhost:5432/zerotodo";
const pg = postgres(dbConnectionString);

const zeroDB = new ZQLDatabase(
  new PostgresJSConnection(pg),
  schema
);

const processor = new PushProcessor(zeroDB);

app.post('/api/push', async (c) => {
  console.log('Push server received request:', c.req.url);
  console.log('Request method:', c.req.method);
  // console.log('Query Params:', c.req.query()); // For debugging queryParams from client
  // For auth, you'd extract JWT, decode it, and pass to createMutators
  const userID = c.req.query('userID') || 'server-user'; // Example: get userID from query param
  // In a real app, this would come from a decoded JWT

  // const decodedJWT = await verifyAndDecodeToken(c.req.header('Authorization')); // Your auth logic
  // const authDataForMutators = decodedJWT.sub; // Or whatever your AuthData structure is
  // const authDataForMutators = c.req.query('userID') || 'server_user_placeholder'; // Placeholder for now

  const mutators = createMutators(); // Pass decoded auth info

  try {
    // Hono's c.req.raw is a Request object.
    // PushProcessor.process expects the raw Request object or specific body types.
    const pushResponse = await processor.process(
      mutators,
      c.req.raw, // Pass the raw Request object
    );
    return c.json(pushResponse);
  } catch (error) {
    console.error('Error processing push request:', error);
    return c.json({ error: 'Failed to process push request', details: error.message }, 500);
  }
});

const port = parseInt(process.env.PORT) || 3001;
console.log(`Push server listening on port ${port}`);
serve({
  fetch: app.fetch,
  port,
});
