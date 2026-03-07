import type { LanguageCode } from './languages'
import { PRODUCT_GENERATED } from './productGenerated'

export function getProductCopy(lang: LanguageCode) {
  return PRODUCT_GENERATED[lang] ?? PRODUCT_GENERATED.en ?? {}
}
