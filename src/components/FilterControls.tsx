// src/components/FilterControls.tsx
import { Component, For, createMemo, Show } from 'solid-js';
import {
  store,
  setStore,
} from '../stores/todoStore';
import { FilterType, FilterOption } from '../types';
import { useZero } from '../ZeroContext';
import { createQuery } from '@rocicorp/zero/solid';
import { produce } from 'solid-js/store';

const FilterControls: Component = () => {
  const z = useZero();
  const [availableProjects] = createQuery(() => z.query.project.orderBy('name', 'asc'));
  const [availableAreas] = createQuery(() => z.query.area.orderBy('name', 'asc'));

  const filters = createMemo(() => [
    { type: FilterType.ALL, label: 'All' },
    { type: FilterType.ACTIVE, label: 'Active' },
    { type: FilterType.COMPLETED, label: 'Completed' },
  ]);

  // Apply a base filter (all, active, completed)
  const applyBaseFilter = (filter: FilterOption) => {
    setStore(
      produce(s => {
        s.activeFilter = filter;
        // Keep project and area selections when changing base filter
      })
    );
  };

  // Toggle project selection
  const setProjectFilter = (projectName: string | null) => {
    setStore(
      produce(s => {
        s.selectedProject = projectName || undefined;
      })
    );
  };

  // Toggle area selection
  const setAreaFilter = (areaName: string | null) => {
    setStore(
      produce(s => {
        s.selectedArea = areaName || undefined;
      })
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setStore(
      produce(s => {
        s.activeFilter = { type: FilterType.ALL, label: 'All' };
        s.selectedProject = undefined;
        s.selectedArea = undefined;
      })
    );
  };

  const isBaseFilterActive = (type: FilterType) => {
    return store.activeFilter.type === type;
  };

  const hasActiveFilters = () => {
    return store.selectedProject !== undefined ||
      store.selectedArea !== undefined ||
      store.activeFilter.type !== FilterType.ALL;
  };

  const SelectArrow = () =>
  (

    <div
      class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>
  )


  return (
    <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">


      <div class="flex flex-wrap gap-2 mb-4">
        <For each={filters()}>
          {(filter) => (
            <button

              class={`px-6 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:bg-indigo-700 transition-colors focus-visible
                ${isBaseFilterActive(filter.type)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }

            `}
              onClick={() => applyBaseFilter(filter)}
            >
              {filter.label}
            </button>
          )}
        </For>
      </div>

      <div class="flex flex-wrap gap-3">
        <div class="relative flex-grow max-w-xs">
          <select



            class="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white focus-visible"
            onChange={(e) => {
              const value = e.currentTarget.value;
              setProjectFilter(value || null);
            }}
            value={store.selectedProject || ''}
          >
            <option value="">All Projects</option>
            <For each={availableProjects()}>
              {(project) => <option value={project.name}>{project.name}</option>}
            </For>
          </select>
          <SelectArrow />
        </div>

        <div class="relative flex-grow max-w-xs">
          <select
            class="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white focus-visible"
            onChange={(e) => {
              const value = e.currentTarget.value;
              setAreaFilter(value || null);
            }}
            value={store.selectedArea || ''}
          >
            <option value="">All Areas</option>
            <For each={availableAreas()}>
              {(area) => <option value={area.name}>{area.name}</option>}
            </For>
          </select>
          <SelectArrow />
          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>

        <Show when={hasActiveFilters()}>

          <button
            onclick={resetFilters}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-6 h-6 mr-2 hover:text-gray-400"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6"></path>
              <path d="M22 11.5a10 10 0 0 1-20 0"></path>
              <path d="M2 12.5a10 10 0 0 1 20 0"></path>
            </svg>
          </button>
        </Show>

        {/*<button
          class="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus-visible">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z">
            </path>
          </svg>
        </button>

        <button
          class="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus-visible">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m-6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4">
            </path>
          </svg>
        </button>
*/}
      </div>
    </div>
  );
};

export default FilterControls;
