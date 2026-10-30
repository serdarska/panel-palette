// 6250 → "6.250 ден." (Macedonian thousands separator, independent of the browser locale)
// Laminate decors have no product code yet — their `code` is only the URL key
export const hasCode = item => !item.urlKeyOnly

export const formatPrice = n => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ден.`
