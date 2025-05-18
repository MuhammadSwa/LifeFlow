/* @refresh reload */
import './index.css';
import { render } from 'solid-js/web';

import App from './App';
import { createZero } from '@rocicorp/zero/solid';
import { schema } from './schema';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

const z = createZero({
  userID: "anon",
  server: 'http://localhost:4848',
  schema,
  kvStore: "idb",
});

// For debugging and inspection.
(window as any)._zero = z;


render(() => <App z={z} />, root!);
