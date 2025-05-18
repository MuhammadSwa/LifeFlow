// src/schema.ts
import { table, string, boolean, number, createSchema, definePermissions, ANYONE_CAN_DO_ANYTHING, json, enumeration, relationships, } from '@rocicorp/zero';
import { type Row } from '@rocicorp/zero'



// Define the 'todos' table schema for Zero
const Todo = table('todo') // Matches your SQL table name
  .columns({
    id: string(),
    rawText: string().from('raw_text'),
    description: string(),
    completed: boolean(),

    projectName: string().optional().from('project_name'),
    areaName: string().optional().from('area_name'),


    completionDate: number().optional().from('completion_date'),
    priority: enumeration<'A' | 'B' | 'C' | 'D'>().optional(),

    createdAt: number().from('created_at'), // Corresponds to BIGINT in SQL, storing timestamp
    dueDate: number().optional().from('due_date'),

    // If you know the structure of metadata, you can type it:
    // metadata: json<Record<string, string>>().optional(),
    metadata: json<Record<string, string | number | boolean | null>>().optional(), // More flexible metadata
  })
  .primaryKey('id');


const project = table('project')
  .columns({
    name: string(),
  })
  .primaryKey('name');

const area = table('area')
  .columns({
    name: string(),
  })
  .primaryKey('name');

// --- Relationship Definitions ---

const todoRelationships = relationships(Todo, ({ one }) => ({
  project: one({
    destSchema: project,
    sourceField: ['projectName'], // Foreign key in 'todos' table
    destField: ['name'],          // Primary key in 'projects' table
  }),
  area: one({
    destSchema: area,
    sourceField: ['areaName'], // Foreign key in 'todos' table
    destField: ['name'],          // Primary key in 'areas' table
  }),
}));




export const schema = createSchema({
  tables: [Todo, project, area],
  relationships: [todoRelationships],
});

export type Schema = typeof schema;

export type Todo = Row<typeof schema.tables.todo>;
export type Project = Row<typeof schema.tables.project>;
export type Area = Row<typeof schema.tables.area>;

// If you want to include related data directly in your Todo type after a query
export type TodoWithRelations = Todo & {
  project?: Project | null; // project will be ProjectRow or null if projectId is null or no match
  area?: Area | null; // area will be Area or null if areaId is null or no match
};

export const permissions = definePermissions<unknown, Schema>(schema, () => ({
  todo: ANYONE_CAN_DO_ANYTHING,
  project: ANYONE_CAN_DO_ANYTHING,
  area: ANYONE_CAN_DO_ANYTHING,
}));

// export interface Todo {
//   id: string; // uuid
//   rawText: string;     // The original line from the todo.txt file
//   description: string;    // The main text of the todo, after parsing out metadata
//   createdAt: number;
//   completed: boolean;
//
// projectName?: string | null; // Pass name to create/find project
// areaName?: string | null; // Pass name to create/find area
//
//   completionDate?: number; // YYYY-MM-DD
//
//   priority?: string;// A-D (just the letter, not "(A)")
//   dueDate?: number;
//
//
//   metadata: Record<string, string>; // For key:value pairs like due:2024-01-01
// }
//
// export interface Project {
//   id: string;
//   name: string;
// }
//
// export interface  {
//   id: string;
//   name: string;
// }
