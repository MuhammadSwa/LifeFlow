import { startTunnel } from "untun";

const tunnel = await startTunnel({ port: 4848, acceptCloudflareNotice: true });
const url = await tunnel.getURL()
console.log(url)

const myConfigurations = {
  ZERO_UPSTREAM_DB: "postgresql://user:password@127.0.0.1/postgres",
  ZERO_REPLICA_FILE: "/tmp/sync-replica_lifeFlow.db",

  ZERO_AUTH_SECRET: "a-very-secure-secret-for-dev",

  ZERO_PUSH_URL: "http://localhost:3001/api/push",

  VITE_PUBLIC_ZERO_SERVER: url,
  VITE_PUBLIC_USER_ID: "test-user-01",

};

// Export the configurations if you need to use them elsewhere in your JS code directly
// module.exports = myConfigurations;

// --- Script to generate .env file ---
import fs from 'fs'
import path from 'path'
import { kill } from "process";

// Path to your .env file
const envFilePath = path.resolve('.env');

// Convert the configuration object to .env format
let envFileContent = '';
for (const key in myConfigurations) {
  if (Object.hasOwnProperty.call(myConfigurations, key)) {
    envFileContent += `${key}=${myConfigurations[key]}\n`;
  }
}

// Write the content to the .env file
try {
  fs.writeFileSync(envFilePath, envFileContent);
  console.log('.env file generated successfully!');
} catch (err) {
  console.error('Error writing .env file:', err);
}
