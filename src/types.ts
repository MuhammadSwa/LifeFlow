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

