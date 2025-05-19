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

  return (
    <div class="mb-4 bg-white rounded-lg shadow p-3 max-w-lg w-full">
      <div class="flex items-center gap-2 flex-wrap mb-3">
        <For each={filters()}>
          {(filter) => (
            <button
              class={`px-3 py-1.5 text-sm rounded-full transition-colors ${isBaseFilterActive(filter.type)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              onClick={() => applyBaseFilter(filter)}
            >
              {filter.label}
            </button>
          )}
        </For>
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <div class="relative">
          <select
            class={`appearance-none pl-3 pr-8 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${store.selectedProject
              ? 'bg-blue-50 border-blue-200'
              : 'bg-gray-50 border-gray-200'
              }`}
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
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>

        <div class="relative">
          <select
            class={`appearance-none pl-3 pr-8 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${store.selectedArea
              ? 'bg-blue-50 border-blue-200'
              : 'bg-gray-50 border-gray-200'
              }`}
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
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>

        <Show when={hasActiveFilters()}>
          <button
            class="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 flex items-center"
            onClick={resetFilters}
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Reset
          </button>
        </Show>

        <Show when={store.selectedProject && store.selectedArea}>
          <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            Filtering by project and area
          </span>
        </Show>
      </div>
    </div>
  );
};

export default FilterControls;
