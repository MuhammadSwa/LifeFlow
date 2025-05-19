// src/ZeroContext.tsx
import { createContext, useContext, type ParentComponent, onCleanup } from 'solid-js';
import { createZero } from '@rocicorp/zero/solid';
import type { Zero } from '@rocicorp/zero';
import { schema, type Schema } from '../shared/schema'; // Ensure .js extension if needed by your tsconfig/bundler
import { createMutators, type Mutators } from '../shared/mutators'; // Ensure .js extension if needed

// 1. Define the type for your Zero client instance
export type AppZeroClient = Zero<Schema, Mutators>;

// 2. Create the context
// It's good practice to provide a default value, even if it's just undefined initially,
// and handle the undefined case in the custom hook.
// However, for a critical service like this, we'll initialize it in the provider.
// The context itself can be untyped initially or typed with | undefined.
const ZeroRawContext = createContext<AppZeroClient>(); // Or createContext<AppZeroClient | undefined>();

// 3. Create a custom Provider component
export const ZeroProvider: ParentComponent = (props) => {
  console.log("[ZeroProvider] Initializing Zero client 'z' for context...");

  const serverURL = import.meta.env.VITE_PUBLIC_ZERO_SERVER || 'http://localhost:4848';
  const userID = import.meta.env.VITE_PUBLIC_USER_ID || 'anonymous';
  // Define your AuthData based on how createMutators expects it
  const authDataForMutators = { userID }; // Or undefined, or a more complex object

  // Create the Zero client instance
  // This instance is created once when ZeroProvider mounts
  const client = createZero<Schema, Mutators>({
    server: serverURL,
    schema,
    userID: userID, // Later, this should come from auth
    kvStore: 'idb',
    // Auth token if you implement JWT authentication
    // auth: async () => { /* fetch JWT token */ return 'your_jwt_token'; },
    mutators: createMutators(userID), // Pass userID if mutators need it for permissions
    push: {
      queryParams: { // Example if your push server needs extra static info per client
        // clientID: 'some-client-identifier',
      }
    }
  });

  console.log("[ZeroProvider] Zero client 'z' initialized and provided:", !!client);
  (window as any).zContextClient = client; // For debugging in browser console

  // Ensure Zero client is properly closed when the provider is unmounted
  // This is important for cleaning up WebSocket connections, etc.
  onCleanup(() => {
    console.log("[ZeroProvider] Cleaning up Zero client...");
    client.close(); // Zero clients have a close() method
  });

  return (
    <ZeroRawContext.Provider value={client}>
      {props.children}
    </ZeroRawContext.Provider>
  );
};

// 4. Create a custom hook to consume the context
export function useZero(): AppZeroClient {
  const client = useContext(ZeroRawContext);
  if (!client) {
    // This error ensures that useZero is always called within a ZeroProvider tree
    throw new Error("useZero must be used within a ZeroProvider. Make sure your component is a child of <ZeroProvider>.");
  }
  return client;
}
