import { PowerSyncDatabase, SQLWatchOptions } from "@powersync/web";
import { createEffect, createSignal, on, onCleanup } from "solid-js";

interface QueryResult<T> {
  data: T[] | undefined;
  loading: boolean;
  error: Error | null;
}

export function createQuery<T = any>(
  PWSync: PowerSyncDatabase,
  sql: (() => string) | string,
  params?: (() => any[]) | any[],
  options?: SQLWatchOptions
): QueryResult<T> {
  const [data, setData] = createSignal<T[] | undefined>(undefined);
  const [loading, setLoading] = createSignal<boolean>(true);
  const [error, setError] = createSignal<Error | null>(null);

  createEffect(
    on(
      // Re-run effect if SQL or params signals change
      () => [
        typeof sql === "function" ? sql() : sql,
        typeof params === "function" ? params() : params,
      ],
      async ([currentSql, currentParams]) => {
        if (!PWSync) {
          setError(new Error("PowerSync instance isn't available"));
          setLoading(false);
          return;
        }

        if (!currentSql) {
          setData(undefined);
          setLoading(false);
          setError(null);
          return;
        }

        setLoading(true);
        setError(null);
        
        // Create a controller for this effect execution
        const controller = new AbortController();
        
        // Merge user options with our signal
        const mergedOptions = {
          ...(options || {}),
          signal: controller.signal,
        };
        
        try {
          // Initial fetch
          const initialResult = await PWSync.getAll<T>(currentSql, currentParams);
          setData(initialResult);
          setLoading(false);

          // Set up watch for changes
          const watchIterator = PWSync.watch<T>(currentSql, currentParams, mergedOptions);
          
          // Process watch updates
          (async () => {
            try {
              for await (const update of watchIterator) {
                if (controller.signal.aborted) break;
                setData(update);
              }
            } catch (e: any) {
              if (e.name !== "AbortError" && !controller.signal.aborted) {
                console.error("Error in PowerSync watch loop:", e);
                setError(e);
              }
            }
          })();
        } catch (e: any) {
          console.error("Error in createQuery initial fetch:", e);
          setError(e);
          setLoading(false);
        }

        // Clean up when the effect re-runs or component unmounts
        onCleanup(() => {
          controller.abort();
        });
      },
      { defer: true } // defer ensures PWSync is likely initialized
    )
  );

  return {
    get data() { return data() },
    get loading() { return loading() },
    get error() { return error() }
  };
}