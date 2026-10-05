export function formatValue(value: string) {
  const parsedValue = Number(value)
  return Math.round(parsedValue)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
