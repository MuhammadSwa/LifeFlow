import { PowerSyncDatabase } from "@powersync/web"
import { AppSchema } from "./powersync_schema"

const factory = {
  dbFilename: 'lifeFlow.sqlite'
}

export const PWSync = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: factory.dbFilename
  }
})
