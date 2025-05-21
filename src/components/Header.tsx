export const Header = () => {

  return (
    <header class="flex justify-between items-center mb-8">
      <div class="flex items-center">
        <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          TaskFlow</h1>
        <span
          class="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full dark:bg-indigo-900 dark:text-indigo-200">v1.0</span>
      </div>
    </header>
  )
}
