
// schema.ts
import { createSchema, table, string, definePermissions, ANYONE_CAN_DO_ANYTHING, Row, UpdateValue } from '@rocicorp/zero';

const todo = table('todo')
  .columns({
    id: string(),
    raw_text: string(),
    description: string(),
  })
  .primaryKey('id');


export const schema = createSchema({
  tables: [todo],
});

export type Schema = typeof schema;
export type Todo = Row<typeof schema.tables.todo>;
export type TodoUpdate = UpdateValue<typeof schema.tables.todo>;

export const permissions = definePermissions<unknown, Schema>(schema, () => ({
  todo: ANYONE_CAN_DO_ANYTHING
}))

