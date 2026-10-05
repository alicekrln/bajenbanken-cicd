import { expect, test } from "vitest";
import { validateAmount } from "../src/validateAmount";

test('Validering av insättningsbelopp', () => {  
  const value = 125
  expect(validateAmount(value)).toBe(true)
})