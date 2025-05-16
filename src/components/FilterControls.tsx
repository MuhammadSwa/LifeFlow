// src/components/FilterControls.tsx
import { Component, For } from 'solid-js';
import {
  setActiveFilter,
  availableProjects,
  availableContexts,
  store, // To access current activeFilter for styling
} from '../stores/todoStore';
import { FilterType, FilterOption } from '../types';

const FilterControls: Component = () => {
  const baseFilters: FilterOption[] = [
    { type: FilterType.PRIORITY, label: 'By Priority (Default)' },
    { type: FilterType.ALL, label: 'All Tasks' },
    { type: FilterType.ACTIVE, label: 'Active Tasks' },
    { type: FilterType.COMPLETED, label: 'Completed Tasks' },
  ];

  const handleBaseFilterChange = (filter: FilterOption) => {
    setActiveFilter(filter);
  };

  const handleProjectFilterChange = (e: Event) => {
    const project = (e.currentTarget as HTMLSelectElement).value;
    if (project) {
      setActiveFilter({ type: FilterType.PROJECT, label: `Project: ${project}`, value: project });
    } else {
      setActiveFilter(baseFilters[0]); // Revert to default if "All Projects" selected
    }
  };

  const handleContextFilterChange = (e: Event) => {
    const context = (e.currentTarget as HTMLSelectElement).value;
    if (context) {
      setActiveFilter({ type: FilterType.CONTEXT, label: `Context: ${context}`, value: context });
    } else {
      setActiveFilter(baseFilters[0]); // Revert to default
    }
  };

  const isActive = (filter: FilterOption) => {
    return store.activeFilter.type === filter.type && store.activeFilter.value === filter.value;
  }

  return (
    <div class="mb-4 p-3 bg-gray-50 rounded-md shadow max-w-lg w-full">
      <div class="flex flex-wrap gap-2 items-center">
        <span class="font-semibold mr-2">Filters:</span>
        <For each={baseFilters}>
          {(filter) => (
            <button
              class={`px-3 py-1 text-sm rounded-md border
                                ${isActive(filter)
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-white hover:bg-gray-100 border-gray-300'}`}
              onClick={() => handleBaseFilterChange(filter)}
            >
              {filter.label}
            </button>
          )}
        </For>
      </div>

      <div class="mt-3 flex flex-wrap gap-4 items-center">
        <div>
          <label for="project-filter" class="text-sm font-medium mr-2">Project:</label>
          <select
            id="project-filter"
            class="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            onChange={handleProjectFilterChange}
            value={store.activeFilter.type === FilterType.PROJECT ? store.selectedProject : ''}
          >
            <option value="">All Projects</option>
            <For each={availableProjects()}>
              {(project) => <option value={project}>{project}</option>}
            </For>
          </select>
        </div>

        <div>
          <label for="context-filter" class="text-sm font-medium mr-2">Context:</label>
          <select
            id="context-filter"
            class="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            onChange={handleContextFilterChange}
            value={store.activeFilter.type === FilterType.CONTEXT ? store.selectedContext : ''}
          >
            <option value="">All Contexts</option>
            <For each={availableContexts()}>
              {(context) => <option value={context}>{context}</option>}
            </For>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
