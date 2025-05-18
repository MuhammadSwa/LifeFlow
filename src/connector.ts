
// supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
// powersyncUrl: import.meta.env.VITE_POWERSYNC_URL,
// supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY

import { AbstractPowerSyncDatabase, PowerSyncBackendConnector, UpdateType } from "@powersync/web";
import { supabase } from "./supabaseClient";

const POWERSYNC_URL = import.meta.env.VITE_POWERSYNC_URL;
if (!POWERSYNC_URL) {
  throw new Error('POWERSYNC_URL is not set. Add it to your .env file');
}

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error fetching Supabase session: ', error)
      return null
    }
    if (!data.session) {
      console.warn("No supabase session found.");
      return null
    }

    // Powersync is configured to accept Supabase JWTs.
    const token = data.session.access_token;
    return {
      endpoint: POWERSYNC_URL,
      token
    }
  }

  async uploadData(db: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await db.getNextCrudTransaction()

    if (!transaction) return

    console.log(`Uploading ${transaction.crud.length} changes`)

    try {
      for (const op of transaction.crud) {
        const table = supabase.from(op.table)
        let res;

        // Adjust opData for SupaBase: Powersync uses 0/1 for booleans
        const opData = { ...op.opData }
        if ('completed' in opData) {
          opData.completed = !!opData.completed //convert 0/1 to true/false
        }

        // Arrays and JSON are already strings, Supabase client handles them
        switch (op.op) {
          case UpdateType.PUT:
            // Assumes op.id is the UUID PK for the todos table
            res = await table.upsert({ ...opData, id: op.id })
            break
          case UpdateType.PATCH:
            res = await table.update(opData).eq('id', op.id)
            break;
          case UpdateType.DELETE:
            res = await table.delete().eq('id', op.id)
            break
        }

        if (res.error) {
          console.error("Supabase upload error: ", res.error)
        }
      }
      await transaction.complete()
    } catch (e) {
      console.error("Error during uploadData: ", e)
      await transaction.complete()
    }
  }
}
