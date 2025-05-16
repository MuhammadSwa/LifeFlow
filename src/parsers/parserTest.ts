import { parseTodoTxtLine, parseTodoTxtFileContent, formatTodoTxtItem } from './todoTxtParser';
import type { Todo } from '../types';

// Example: Parsing a single line
const line1 = "(A) 2023-10-26 Call Mom @phone +Family due:2023-10-27";
const parsedItem1: Todo = parseTodoTxtLine(line1);
console.log("Parsed Item 1:", parsedItem1);
// Output:
// {
//   id: ..., // Timestamp or provided ID
//   rawText: "(A) 2023-10-26 Call Mom @phone +Family due:2023-10-27",
//   completed: false,
//   priority: "A",
//   creationDate: "2023-10-26",
//   description: "Call Mom",
//   projects: ["Family"],
//   contexts: ["phone"],
//   metadata: { due: "2023-10-27" }
// }
console.log("Formatted Item 1:", formatTodoTxtItem(parsedItem1));
// Output: (A) 2023-10-26 Call Mom +Family @phone due:2023-10-27 (order might vary for last 3)


const line2 = "x 2023-10-25 2023-10-24 Review PR +Work @computer";
const parsedItem2: Todo = parseTodoTxtLine(line2);
console.log("Parsed Item 2:", parsedItem2);
// Output:
// {
//   id: ...,
//   rawText: "x 2023-10-25 2023-10-24 Review PR +Work @computer",
//   completed: true,
//   completionDate: "2023-10-25",
//   creationDate: "2023-10-24",
//   description: "Review PR",
//   projects: ["Work"],
//   contexts: ["computer"],
//   metadata: {}
// }
console.log("Formatted Item 2:", formatTodoTxtItem(parsedItem2));
// Output: x 2023-10-25 2023-10-24 Review PR +Work @computer


const line3 = "Simple task @home";
const parsedItem3: Todo = parseTodoTxtLine(line3);
console.log("Parsed Item 3:", parsedItem3);
// Output:
// {
//   id: ...,
//   rawText: "Simple task @home",
//   completed: false,
//   description: "Simple task",
//   projects: [],
//   contexts: ["home"],
//   metadata: {}
// }
console.log("Formatted Item 3:", formatTodoTxtItem(parsedItem3));
// Output: Simple task @home


// Example: Parsing file content
const fileContent = `
(A) Thank Mom for the meatballs @phone
(B) Schedule Goodwill pickup +GarageSale @phone
Post signs around the neighborhood +GarageSale
@GroceryStore pies
x 2021-03-03 2021-03-02 Call Mom
`;
const allTodos: Todo[] = parseTodoTxtFileContent(fileContent);
console.log("All Todos from file:", allTodos);
