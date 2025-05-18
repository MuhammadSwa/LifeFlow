
import { CustomMutatorDefs } from "@rocicorp/zero";
// import { AuthData } from "./auth";
import { schema, Todo, TodoUpdate } from "./schema";

export function createMutators() {
  return {
    todo: {
      async create(tx, todo: Todo) {
        await tx.mutate.todo.insert(todo);
      },
      async delete(tx, id: string) {
        // mustBeLoggedIn(authData);
        await tx.mutate.todo.delete({ id });
      },
      async update(tx, todo: TodoUpdate) {
        // const auth = mustBeLoggedIn(authData);
        const prev = await tx.query.todo.where("id", todo.id).one();
        if (!prev) {
          return;
        }
        // if (prev.senderID !== auth.sub) {
        //   throw new Error("Must be sender of todo to edit");
        // }
        await tx.mutate.todo.update(todo);
      },
    },
  } as const satisfies CustomMutatorDefs<typeof schema>;
}

// function mustBeLoggedIn(authData: AuthData | undefined): AuthData {
//   if (authData === undefined) {
//     throw new Error("Must be logged in");
//   }
//   return authData;
// }

export type Mutators = ReturnType<typeof createMutators>;
