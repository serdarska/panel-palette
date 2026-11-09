// Laminate decors have no product code yet — their `code` is only the URL key
export const hasCode = item => !item.urlKeyOnly
// the product code to show; `shownCode` is set when two decors share a code
// (e.g. one board in two finishes) and `code` has to stay unique as the URL key
export const codeOf = item => item.shownCode ?? item.code
