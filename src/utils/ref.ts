export function generateRef(email: string, timestamp: number): string {
  const hash = Math.abs(
    email.split('').reduce((acc, char) => acc + char.charCodeAt(0), timestamp)
  );
  const code = (hash % 10000).toString().padStart(4, '0');
  return code === '0000' ? '0001' : code;
}
