import type { LanguageCode } from './languages'
import { PRODUCT_GENERATED } from './productGenerated'

const PRODUCT_COPY_OVERRIDES: Partial<Record<LanguageCode, any>> = {
  hi: {
    help: {
      faq: {
        howToCta: 'उपयोग कैसे करें',
        sessionCta: 'सत्र खोलें',
        bestSignal: 'सर्वश्रेष्ठ डेमो संकेत',
        bestSignalTitle: 'जज सबसे पहले क्या देखें',
        bestSignalItems: [
          'Pebble सबसे अच्छा तब दिखता है जब उपयोगकर्ता रन में फेल हो, कोच खोले, सुझाव लागू करे और दोबारा रन करे।',
          'कम्युनिटी जानबूझकर seeded है, लेकिन यह दिखाती है कि उत्पाद solo AI guidance से collaborative learning तक बढ़ सकता है।',
        ],
        prototypeNote: 'प्रोटोटाइप नोट',
        prototypeNoteTitle: 'आज क्या वास्तविक है',
        prototypeNoteItems: [
          'Problems, Session, Coach, auth flows, placement, notifications, settings और local-first insights वास्तविक इंटरैक्टिव सतहें हैं।',
          'Weekly recap और cloud-backed analytics मौजूद हैं, लेकिन कुछ backend paths environment configuration पर निर्भर हैं।',
          'Community में demo storytelling के लिए seeded content का उपयोग किया गया है।',
        ],
        backToHome: 'होम पर वापस जाएँ',
        backBody: 'पूरी प्रोडक्ट कहानी के लिए About PebbleCode खोलें। निर्देशित walkthrough के लिए How to Use देखें।',
      },
      howTo: {
        note: 'वर्तमान ऐप फ्लो पर आधारित',
        homeCta: 'होम से शुरू करें',
        faqCta: 'FAQ पढ़ें',
        quickTour: 'जज त्वरित टूर',
        quickTourTitle: '3 मिनट से कम में सबसे अच्छा डेमो फ्लो',
        quickTourChip: 'High signal',
        quickMoveLabel: 'त्वरित कदम',
        suggestedRun: 'पहला सुझाया गया रन',
        suggestedRunTitle: 'सबसे साफ़ लाइव डेमो अनुक्रम',
        suggestedRunItems: [
          'Two Sum या किसी ऐसे प्रश्न को खोलें जिसमें fail case स्पष्ट दिखे।',
          'पहले imperfect solution चलाएँ ताकि Pebble Coach के पास ठोस संदर्भ हो।',
          'Hint → Explain → Next step का उपयोग करें, फिर rerun करें।',
          'अंत में Insights या Community दिखाएँ ताकि डेमो breadth के साथ समाप्त हो।',
        ],
        prototypeNotes: 'प्रोटोटाइप नोट्स',
        prototypeNotesTitle: 'क्या interactive है और क्या seeded',
        prototypeNotesItems: [
          'मुख्य practice surfaces interactive और local-first हैं।',
          'कुछ deep cloud-backed paths backend configuration पर निर्भर हैं।',
          'Community activity demo storytelling के लिए seeded है।',
        ],
        backToHome: 'होम पर वापस जाएँ',
        backBody: 'जज-facing narrative के लिए About PebbleCode खोलें। तेज़ प्रश्न-उत्तर संदर्भ के लिए FAQ देखें।',
      },
    },
  },
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function deepMerge(base: any, override: any): any {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override ?? base
  }

  const merged: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    merged[key] = key in merged ? deepMerge(merged[key], value) : value
  }
  return merged
}

export function getProductCopy(lang: LanguageCode) {
  const localized = PRODUCT_GENERATED[lang] ?? PRODUCT_GENERATED.en ?? {}
  const overrides = PRODUCT_COPY_OVERRIDES[lang]
  return overrides ? deepMerge(localized, overrides) : localized
}
