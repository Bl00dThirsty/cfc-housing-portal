/** Build template-preview context exclusively from values entered by an operator. */
export function emailPreviewValues(
  variableNames: readonly string[],
  enteredValues: Readonly<Record<string, string>>,
): Record<string, string> {
  return Object.fromEntries(
    variableNames.map((name) => [name, enteredValues[name] ?? ""]),
  );
}
