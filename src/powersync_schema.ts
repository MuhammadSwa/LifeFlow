import { column, Schema, Table } from '@powersync/web';
// OR: import { column, Schema, Table } from '@powersync/react-native';

export const TODOS_TABLE = 'todos';

const todos = new Table(
  {
    // id column (text) is automatically included
    raw_text: column.text,
    completed: column.integer,
    completion_date: column.text,
    priority: column.text,
    creation_date: column.text,
    description: column.text,
    projects: column.text,
    contexts: column.text,
    metadata: column.text,
    created_at: column.text,
    updated_at: column.text,
    user_id: column.text
  },
  { indexes: {} }
);

export const AppSchema = new Schema({
  todos
});


export type Database = (typeof AppSchema)['types'];
export type TodoRecord = Database['todos'];
