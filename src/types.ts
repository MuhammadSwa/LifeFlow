
// New Todo type for todo.txt format
export interface Todo {
  id: number; // Can be original line number or a generated ID
  rawText: string;     // The original line from the todo.txt file

  completed: boolean;
  completionDate?: string; // YYYY-MM-DD
  priority?: string;       // A-Z (just the letter, not "(A)")

  creationDate?: string;   // YYYY-MM-DD

  description: string;    // The main text of the todo, after parsing out metadata

  projects: string[];     // e.g., ["GarageSale", "TodoTxt"]
  contexts: string[];     // e.g., ["phone", "email"]
  metadata: Record<string, string>; // For key:value pairs like due:2024-01-01
}

// Type for creating a new Todo, id and timestamps are optional or auto-generated
export type NewTodo = Omit<Todo, 'id' | 'created_at' | 'updated_at'> & { id?: string };
// Type for updating an existing Todo
export type UpdateTodo = Partial<Omit<Todo, 'id' | 'created_at' | 'updated_at'>>;


export enum FilterType {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE', // Not completed
  COMPLETED = 'COMPLETED',
  PRIORITY = 'PRIORITY', // Default sort
  PROJECT = 'PROJECT',
  AREA = 'CONTEXT',
  // You can add more specific ones like TODAY, OVERDUE, etc.
}

export interface FilterOption {
  type: FilterType;
  label: string;
  value?: string; // For PROJECT or CONTEXT specific filtering
}

