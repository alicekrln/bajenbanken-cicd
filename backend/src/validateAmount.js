export function validateAmount(value) {
  const parsedAmount = Number(value)
  return Number.isFinite(parsedAmount) && parsedAmount > 0
}
