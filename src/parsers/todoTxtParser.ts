// src/parsers/todoTxtParser.ts
import type { Todo as Todo } from '../types'; // Or '../todoTxtTypes'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PRIORITY_REGEX = /^\(([A-Z])\)$/;

export function parseTodoTxtLine(line: string): Todo {
  let remainingLine = line.trim();
  const originalLine = line; // Keep original for rawText

  let completed = false;
  let completionDate: string | undefined = undefined;
  let priority: string | undefined = undefined;
  let creationDate: string | undefined = undefined;
  const projects: string[] = [];
  const contexts: string[] = [];
  const metadata: Record<string, string> = {};

  // Rule 1 (Completed Tasks): Check for 'x '
  if (remainingLine.startsWith('x ')) {
    completed = true;
    remainingLine = remainingLine.substring(2).trimStart(); // Remove 'x '

    // Rule 2 (Completed Tasks): Completion Date
    const firstWord = remainingLine.split(' ')[0];
    if (DATE_REGEX.test(firstWord)) {
      completionDate = firstWord;
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
      priority = priorityMatch[1]; // The character inside ( )
      remainingLine = remainingLine.substring(firstWord.length).trimStart();
    }
  }

  // Rule 2 (Incomplete Tasks): Creation Date
  // (Can appear after priority or first if no priority)
  // And for completed tasks, it appears after completionDate
  const firstWordAfterPriorityOrCompletion = remainingLine.split(' ')[0];
  if (DATE_REGEX.test(firstWordAfterPriorityOrCompletion)) {
    creationDate = firstWordAfterPriorityOrCompletion;
    remainingLine = remainingLine.substring(firstWordAfterPriorityOrCompletion.length).trimStart();
  }

  // Rule 3: Contexts, Projects, and Metadata
  // These can appear anywhere in the remaining description.
  // We'll split the remaining line and iterate through words.
  const descriptionParts: string[] = [];
  const words = remainingLine.split(/\s+/); // Split by one or more spaces

  for (const word of words) {
    if (word.startsWith('@') && word.length > 1) {
      contexts.push(word.substring(1));
    } else if (word.startsWith('+') && word.length > 1) {
      projects.push(word.substring(1));
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
    id: new Date().getTime(), // Use provided ID or generate one
    rawText: originalLine,
    completed,
    completionDate,
    priority,
    creationDate,
    description,
    projects,
    contexts,
    metadata,
  };
}

// Optional: A function to parse a whole todo.txt file content
export function parseTodoTxtFileContent(fileContent: string): Todo[] {
  return fileContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0) // Ignore empty lines
    .map((line, index) => parseTodoTxtLine(line)); // Use line number as ID
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

  if (item.creationDate) {
    line += `${item.creationDate} `;
  }

  line += item.description;

  if (item.projects.length > 0) {
    line += item.projects.map(p => ` +${p}`).join('');
  }
  if (item.contexts.length > 0) {
    line += item.contexts.map(c => ` @${c}`).join('');
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
