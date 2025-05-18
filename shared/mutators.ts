// src/mutators.ts
import type { Transaction, CustomMutatorDefs } from '@rocicorp/zero';
import { nanoid } from 'nanoid';
import type { Schema, Todo, Project, Area } from './schema'; // Assuming these types are exported from schema.ts

// This would be your actual authentication data type if you implement auth
// For now, we can just use a placeholder or not pass it if mutators don't need user area yet.
type AuthData = { userID: string } | undefined; // Example: Could be an object with userID or undefined if anonymous


export function createMutators(auth: AuthData) { // auth can be used for permission checks
  return {
    // --- Todo Mutators ---
    todo: {
      /**
       * Adds a new todo.
       * Can optionally create project/area if names are provided and they don't exist.
       */
      // TODO: projectId,areaId should be the primaryKey.unique
      add: async (
        tx: Transaction<Schema>,
        args: {
          rawText: string;
          description: string;
          completed?: boolean;
          projectName?: string | null; // Pass name to create/find project
          areaName?: string | null; // Pass name to create/find area
          priority?: Todo['priority'];
          dueDate?: number | null;
          metadata?: Todo['metadata'];
        }
      ) => {
        if (!args.description.trim()) {
          throw new Error("Todo description cannot be empty.");
        }

        const now = Date.now();

        // const finalProjectId = await getOrCreateLookupId(tx, 'project', args.projectName, args.projectId);
        // const finalAreaId = await getOrCreateLookupId(tx, 'area', args.areaName, args.areaId);

        const newTodo: Todo = {
          id: nanoid(),
          rawText: args.rawText.trim(),
          description: args.description.trim(),
          completed: args.completed ?? false,
          createdAt: now,
          priority: args.priority === undefined ? null : args.priority, // Handle undefined vs null for enum
          projectName: args.projectName === undefined ? null : args.projectName,
          areaName: args.areaName === undefined ? null : args.areaName,
          completionDate: args.completed ? now : null, // Set completionDate if completed on add
          dueDate: args.dueDate === undefined ? null : args.dueDate,
          metadata: args.metadata === undefined ? null : args.metadata,
        };
        await tx.mutate.todo.insert(newTodo);
        console.log(`Mutator (location: ${tx.location}, user: ${auth?.userID}): Added todo: ${newTodo.id}`);
        // return newTodo.id; // Optionally return the new ID
      },

      /**
       * Updates an existing todo. Only provided fields are updated.
       */
      update: async (
        tx: Transaction<Schema>,
        args: {
          id: string;
          rawText?: string;
          description?: string;
          completed?: boolean;
          priority?: Todo['priority'] | 'REMOVE_PRIORITY'; // Special value to remove priority
          projectName?: string | null;
          areaName?: string | null;
          completionDate?: number | null | 'REMOVE_COMPLETION_DATE';
          dueDate?: number | null | 'REMOVE_DUE_DATE';
          metadata?: Todo['metadata'] | 'REMOVE_METADATA';
        }
      ) => {
        const existingTodo = await tx.query.todo.where('id', args.id).one();
        if (!existingTodo) {
          throw new Error(`Todo with id ${args.id} not found.`);
        }

        // Basic permission check example (server-side)
        // if (tx.location === 'server' && existingTodo.userId !== auth?.userID) { // Assuming todo has userId
        //   throw new Error("Permission denied to update this todo.");
        // }

        const updates: Partial<Todo> = {};

        // if (args.rawText !== undefined) updates.rawText = args.rawText.trim();
        if (args.rawText !== undefined) {
          await tx.mutate.todo.update({ id: args.id, rawText: args.rawText.trim() });
        }
        if (args.description !== undefined) {
          if (!args.description.trim()) throw new Error("Todo description cannot be empty if provided.");
          await tx.mutate.todo.update({ id: args.id, description: args.description.trim() });
        }

        if (args.completed !== undefined) {
          await tx.mutate.todo.update({ id: args.id, completed: args.completed });
          // If marking as complete, set completionDate. If un-marking, clear it (unless explicitly set).
          if (args.completed && args.completionDate === undefined) {
            await tx.mutate.todo.update({ id: args.id, completionDate: Date.now() });
          } else if (!args.completed && args.completionDate === undefined && args.completionDate !== 'REMOVE_COMPLETION_DATE') {
            await tx.mutate.todo.update({ id: args.id, completionDate: null });
          }
        }

        if (args.completionDate !== undefined) {
          await tx.mutate.todo.update({ id: args.id, completionDate: args.completionDate === 'REMOVE_COMPLETION_DATE' ? null : args.completionDate });
        }
        if (args.priority !== undefined) {
          await tx.mutate.todo.update({ id: args.id, priority: args.priority === 'REMOVE_PRIORITY' ? null : args.priority });
        }
        if (args.dueDate !== undefined) {
          await tx.mutate.todo.update({ id: args.id, dueDate: args.dueDate === 'REMOVE_DUE_DATE' ? null : args.dueDate });
        }
        if (args.metadata !== undefined) {
          await tx.mutate.todo.update({ id: args.id, metadata: args.metadata === 'REMOVE_METADATA' ? null : args.metadata });
        }


        if (args.projectName !== undefined) {
          await tx.mutate.todo.update({ id: args.id, projectName: args.projectName === 'REMOVE_PROJECT' ? null : args.projectName });
        }
        if (args.areaName !== undefined) {
          await tx.mutate.todo.update({ id: args.id, areaName: args.areaName === 'REMOVE_AREA' ? null : args.areaName });
        }

        if (Object.keys(updates).length > 0) {
          await tx.mutate.todo.update({ id: args.id, ...updates });
        }
        // console.log(`Mutator (location: ${tx.location}, user: ${auth?.userID}): Updated todo: ${args.id}`);
      },

      toggleCompleted: async (tx: Transaction<Schema>, { id }: { id: string }) => {
        const todo = await tx.query.todo.where('id', id).one();
        if (!todo) throw new Error(`Todo with id ${id} not found.`);

        const newCompletedStatus = !todo.completed;
        await tx.mutate.todo.update({
          id,
          completed: newCompletedStatus,
          completionDate: newCompletedStatus ? Date.now() : null,
        });
      },

      delete: async (tx: Transaction<Schema>, { id }: { id: string }) => {
        const existingTodo = await tx.query.todo.where('id', id).one();
        if (!existingTodo) {
          // Optional: throw error or just do nothing if already deleted
          console.warn(`Attempted to delete non-existent todo: ${id}`);
          return;
        }
        // Basic permission check example (server-side)
        // if (tx.location === 'server' && existingTodo.userId !== auth?.userID) {
        //   throw new Error("Permission denied to delete this todo.");
        // }
        await tx.mutate.todo.delete({ id });
        // console.log(`Mutator (location: ${tx.location}, user: ${auth?.userID}): Deleted todo: ${id}`);
      },
    },

    // --- Project Mutators ---
    project: {
      add: async (tx: Transaction<Schema>, { name }: { name: string }) => {
        if (!name.trim()) throw new Error("Project name cannot be empty.");
        const existing = await tx.query.project.where('name', name.trim()).one();
        if (existing) throw new Error(`Project "${name}" already exists.`);

        const newProject: Project = { name: name.trim() };
        await tx.mutate.project.insert(newProject);
        // return newProject.id;
      },
      update: async (tx: Transaction<Schema>, { name }: { id: string; name: string }) => {
        if (!name.trim()) throw new Error("Project name cannot be empty.");
        const project = await tx.query.project.where('name', name).one();
        if (!project) throw new Error(`Project with name ${name} not found.`);

        // Check if new name conflicts with another existing project
        if (name.trim().toLowerCase() !== project.name.toLowerCase()) {
          const existingWithName = await tx.query.project.where('name', name.trim()).one();
          if (existingWithName && existingWithName.name !== name) {
            throw new Error(`Another project with name "${name}" already exists.`);
          }
        }
        await tx.mutate.project.update({ name: name.trim() });
      },
      delete: async (tx: Transaction<Schema>, { name }: { name: string }) => {
        // Note: SQL schema has ON DELETE SET NULL for todos.projectId
        // So deleting a project will set projectId to NULL in associated todos.
        // You might want to add logic here if you need to, for example, prevent deletion
        // if there are todos associated, or reassign them.
        const project = await tx.query.project.where('name', name).one();
        if (!project) {
          console.warn(`Attempted to delete non-existent project: ${name}`);
          return;
        }
        await tx.mutate.project.delete({ name });
      },
    },

    // --- area Mutators ---
    area: {
      add: async (tx: Transaction<Schema>, { name }: { name: string }) => {
        if (!name.trim()) throw new Error("area name cannot be empty.");
        const existing = await tx.query.area.where('name', name.trim()).one();
        if (existing) throw new Error(`Area "${name}" already exists.`);

        const newArea: Area = { name: name.trim() };
        await tx.mutate.area.insert(newArea);
        // return newarea.id;
      },
      update: async (tx: Transaction<Schema>, { name }: { id: string; name: string }) => {
        if (!name.trim()) throw new Error("Area name cannot be empty.");
        const area = await tx.query.area.where('name', name).one();
        if (!area) throw new Error(`Area with id ${name} not found.`);

        if (name.trim().toLowerCase() !== area.name.toLowerCase()) {
          const existingWithName = await tx.query.area.where('name', name.trim()).one();
          if (existingWithName && existingWithName.name !== name) {
            throw new Error(`Another area with name "${name}" already exists.`);
          }
        }
        await tx.mutate.area.update({ name: name.trim() });
      },
      delete: async (tx: Transaction<Schema>, { name }: { name: string }) => {
        // Similar to projects, SQL schema has ON DELETE SET NULL for todos.areaId
        const area = await tx.query.area.where('name', name).one();
        if (!area) {
          console.warn(`Attempted to delete non-existent area: ${name}`);
          return;
        }
        await tx.mutate.area.delete({ name });
      },
    },

  } as const satisfies CustomMutatorDefs<Schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
