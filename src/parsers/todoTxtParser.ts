// src/parsers/todoTxtParser.ts

// TODO: make due date seperate from completion date?
import { nanoid } from "nanoid";
import { Todo } from "../../shared/schema";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PRIORITY_REGEX = /^\(([A-Z])\)$/;

export function parseTodoTxtLine(line: string): Todo {
  let remainingLine = line.trim();
  const originalLine = line; // Keep original for rawText

  let completed = false;
  let completionDate: number | null = null;
  let priority: 'A' | 'B' | 'C' | 'D' | null = null;
  let createdAt: number = Date.now();
  let projectName: string | null = null;
  let areaName: string | null = null;
  const metadata: Record<string, string> = {};

  // Rule 1 (Completed Tasks): Check for 'x '
  if (remainingLine.startsWith('x ')) {
    completed = true;
    remainingLine = remainingLine.substring(2).trimStart(); // Remove 'x '

    // Rule 2 (Completed Tasks): Completion Date
    const firstWord = remainingLine.split(' ')[0];
    if (DATE_REGEX.test(firstWord)) {
      // convert datestring to timestamp for postgres
      const date = new Date(firstWord);
      completionDate = date.getTime();
      remainingLine = remainingLine.substring(firstWord.length).trimStart();
    } else {
      // As per spec, completion date is required if 'x' is present.
      // However, some tools might be lenient. For strict parsing, you could throw an error.
      // For now, we'll assume it might be missing if not a valid date.
      // Or, if a tool *always* adds it, this branch might not be strictly necessary.
    }
  }

  // Rule 1 (Incomplete Tasks): Priority
  // Must be checked *after* completion, as 'x' takes precedence.
  if (!completed) {
    const firstWord = remainingLine.split(' ')[0];
    const priorityMatch = firstWord.match(PRIORITY_REGEX);
    if (priorityMatch) {
      if (priorityMatch[1] === 'A' || priorityMatch[1] === 'B' || priorityMatch[1] === 'C' || priorityMatch[1] === 'D') {
        priority = priorityMatch[1]
      } else {
        priority = null;
      }
      remainingLine = remainingLine.substring(firstWord.length).trimStart();
    }
  }

  // Rule 2 (Incomplete Tasks): Creation Date
  // (Can appear after priority or first if no priority)
  // And for completed tasks, it appears after completionDate
  const firstWordAfterPriorityOrCompletion = remainingLine.split(' ')[0];
  if (DATE_REGEX.test(firstWordAfterPriorityOrCompletion)) {
    const date = new Date(firstWordAfterPriorityOrCompletion);
    createdAt = date.getTime();
    remainingLine = remainingLine.substring(firstWordAfterPriorityOrCompletion.length).trimStart();
  }

  // Rule 3: Contexts, Projects, and Metadata
  // These can appear anywhere in the remaining description.
  // We'll split the remaining line and iterate through words.
  const descriptionParts: string[] = [];
  const words = remainingLine.split(/\s+/); // Split by one or more spaces

  for (const word of words) {
    if (word.startsWith('@') && word.length > 1) {
      areaName = word.substring(1);
    } else if (word.startsWith('+') && word.length > 1) {
      projectName = word.substring(1);
    } else if (word.includes(':') && !word.startsWith(':') && !word.endsWith(':')) {
      const [key, ...valParts] = word.split(':');
      const value = valParts.join(':'); // Re-join if value had colons
      if (key && value) { // Ensure both key and value are non-empty
        metadata[key] = value;
      } else {
        descriptionParts.push(word); // Not a valid key:value, treat as description
      }
    } else {
      descriptionParts.push(word);
    }
  }

  const description = descriptionParts.join(' ').trim();

  return {
    id: nanoid(), // Use provided ID or generate one
    rawText: originalLine,
    description,
    completed,
    completionDate,
    priority: priority,
    createdAt,
    projectName,
    areaName,
    metadata,
    // TODO: implement it right
    dueDate: metadata.dueDate ? Number(metadata.dueDate) : null
  };
}

// Optional: A function to parse a whole todo.txt file content
export function parseTodoTxtFileContent(fileContent: string): Todo[] {
  return fileContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0) // Ignore empty lines
    .map((line) => parseTodoTxtLine(line));
}

// --- Helper to format a TodoTxtItem back to a todo.txt line ---
export function formatTodoTxtItem(item: Todo): string {
  let line = '';

  if (item.completed) {
    line += 'x ';
    if (item.completionDate) {
      line += `${item.completionDate} `;
    }
  }

  if (!item.completed && item.priority) {
    line += `(${item.priority}) `;
  }

  if (item.createdAt) {
    line += `${item.createdAt} `;
  }

  line += item.description;

  if (item.projectName) {
    line += ` +${item.projectName}`;
  }
  if (item.areaName) {
    line += ` @${item.areaName}`;
  }
  for (const key in item.metadata) {
    line += ` ${key}:${item.metadata[key]}`;
  }

  // Normalize spacing: remove leading/trailing space and ensure single spaces
  return line.trim().replace(/\s+/g, ' ');
}

// Explanation of parseTodoTxtLine:
//
// Initialization: Sets up default values for all parts of the TodoTxtItem.
//
// Completed Task Check (x):
//
// Checks if the line starts with x.
//
// If so, sets completed = true and removes x from remainingLine.
//
// Then, it checks if the next word is a YYYY-MM-DD date for completionDate.
//
// Priority Check ((A)):
//
// Only if not completed.
//
// Checks if the first word matches ([A-Z]).
//
// If so, extracts the priority letter and removes it from remainingLine.
//
// Creation Date Check (YYYY-MM-DD):
//
// Checks if the next word (after potential completion date or priority) is a YYYY-MM-DD date.
//
// If so, sets creationDate and removes it.
//
// Contexts, Projects, Metadata, and Description:
//
// The remainingLine now contains the description mixed with projects, contexts, and metadata.
//
// It splits remainingLine into words.
//
// Iterates through each word:
//
// If it starts with @, it's a context.
//
// If it starts with +, it's a project.
//
// If it contains : (and isn't just : or starting/ending with it), it's treated as key:value metadata.
//
// Otherwise, it's part of the description.
//
// The collected description parts are joined back together.
//
// Return Object: Constructs and returns the TodoTxtItem.
//
// parseTodoTxtFileContent Function:
//
// A utility to take the full content of a todo.txt file (as a string), split it into lines, trim whitespace, filter out empty lines, and parse each line.
//
// It assigns a simple ID like line-1, line-2, etc.
//
// formatTodoTxtItem Function:
//
// This is the reverse of the parser. It takes a TodoTxtItem object and constructs a string formatted according to todo.txt rules.
//
// This is crucial if you want to save changes back to a todo.txt file or display the raw format.
//
// Order matters here: completed status, completion date, priority, creation date, then description, then projects, contexts, metadata.
//
// The final trim().replace(/\s+/g, ' ') helps normalize spacing.


// // --- Mutator Functions ---
// const parseTodoInput = (raw: string): { description: string; projectName?: string; areaName?: string; priority?: Todo['priority']; dueDate?: number } => {
//   let description = raw;
//   let projectName: string | undefined;
//   let areaName: string | undefined;
//   let priority: Todo['priority'] | undefined;
//   let dueDate: number | undefined;
//
//   // Basic parsing, can be made more robust
//   const projectMatch = raw.match(/\+([\w-]+)/);
//   if (projectMatch) {
//     projectName = projectMatch[1];
//     description = description.replace(projectMatch[0], '').trim();
//   }
//   const contextMatch = raw.match(/@([\w-]+)/);
//   if (contextMatch) {
//     areaName = contextMatch[1];
//     description = description.replace(contextMatch[0], '').trim();
//   }
//   const priorityMatch = raw.match(/\(([A-D])\)/i);
//   if (priorityMatch) {
//     priority = priorityMatch[1].toUpperCase() as TodoRow['priority'];
//     description = description.replace(priorityMatch[0], '').trim();
//   }
//   const dueDateMatch = raw.match(/due:(\d{4}-\d{2}-\d{2})/);
//   if (dueDateMatch) {
//     try {
//       dueDate = new Date(dueDateMatch[1]).getTime();
//       description = description.replace(dueDateMatch[0], '').trim();
//     } catch (e) { /* ignore invalid date */ }
//   }
//   return { description: description.trim(), projectName, areaName: areaName, priority, dueDate };
// };
