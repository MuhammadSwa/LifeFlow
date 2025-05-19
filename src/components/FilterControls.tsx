// src/components/FilterControls.tsx
import { Component, For, createMemo } from 'solid-js';
import {
  setActiveFilter,
  store,
} from '../stores/todoStore';
import { FilterType, FilterOption } from '../types';
import { useZero } from '../ZeroContext';
import { createQuery } from '@rocicorp/zero/solid';

const FilterControls: Component = () => {
  const z = useZero();
  const [availableProjects] = createQuery(() => z.query.project.orderBy('name', 'asc'));
  const [availableAreas] = createQuery(() => z.query.area.orderBy('name', 'asc'));

  const filters = createMemo(() => [
    { type: FilterType.PRIORITY, label: 'Priority' },
    { type: FilterType.ALL, label: 'All' },
    { type: FilterType.ACTIVE, label: 'Active' },
    { type: FilterType.COMPLETED, label: 'Completed' },
  ]);

  const applyFilter = (filter: FilterOption) => {
    setActiveFilter(filter);
  };

  const isActive = (type: FilterType) => {
    return store.activeFilter.type === type;
  };

  const currentValue = (type: FilterType) => {
    return store.activeFilter.type === type ? store.activeFilter.value : '';
  };

  return (
    <div class="mb-4 bg-white rounded-lg shadow p-3 max-w-lg w-full">
      <div class="flex items-center gap-2 flex-wrap mb-3">
        <For each={filters()}>
          {(filter) => (
            <button
              class={`px-3 py-1.5 text-sm rounded-full transition-colors ${isActive(filter.type)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              onClick={() => applyFilter(filter)}
            >
              {filter.label}
            </button>
          )}
        </For>
      </div>

      <div class="flex flex-wrap gap-3">
        <div class="relative">
          <select
            class="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => {
              const value = e.currentTarget.value;
              if (value) {
                applyFilter({
                  type: FilterType.PROJECT,
                  label: `Project: ${value}`,
                  value
                });
              }
            }}
            value={currentValue(FilterType.PROJECT)}
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
            class="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => {
              const value = e.currentTarget.value;
              if (value) {
                applyFilter({
                  type: FilterType.AREA,
                  label: `Area: ${value}`,
                  value
                });
              }
            }}
            value={currentValue(FilterType.AREA)}
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

        {store.activeFilter.type !== FilterType.PRIORITY && (
          <button
            class="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 flex items-center"
            onClick={() => applyFilter({ type: FilterType.PRIORITY, label: 'Priority' })}
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterControls;
