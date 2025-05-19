/* @refresh reload */
import './index.css';
import { render } from 'solid-js/web';

import App from './App';
import { schema, type Schema } from '../shared/schema';
import { createMutators, type Mutators } from '../shared/mutators';
import { createZero } from '@rocicorp/zero/solid';
import { ZeroProvider } from './ZeroContext';


const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

// const z = createZero({
//   userID: "anon",
//   server: 'http://localhost:4848',
//   schema,
//   kvStore: "idb",
// });

const serverURL = import.meta.env.VITE_PUBLIC_ZERO_SERVER || 'http://localhost:4848';
const userID = import.meta.env.VITE_PUBLIC_USER_ID || 'anonymous_client_user'; // Or from actual auth
//
export const z = createZero<Schema, Mutators>({
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
//
// // For debugging and inspection.
// (window as any)._zero = z;


// render(() => <App />, root!);
render(
  () => (
    <ZeroProvider> {/* Wrap your App component */}
      <App />
    </ZeroProvider>
  ),
  root!
);
