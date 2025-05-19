
export function formatDate(date: Date) {

  const year = String(date.getFullYear()).slice(-2); // Get last two digits of the year
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}:${hour}-${minute}`;
}


// format unix time to readable date
export function formatUnixTime(unixTime: number) {
  const date = new Date(unixTime);

  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  return `${day}/${month}`;
}
