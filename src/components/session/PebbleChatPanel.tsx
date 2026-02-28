import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { askPebble } from '../../utils/pebbleLLM'
import { Check, Globe, SendHorizontal, Settings2 } from 'lucide-react'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  usedRunOutput?: boolean
}

type PebbleChatPanelProps = {
  unitTitle: string
  unitConcept: string
  codeText: string
  runStatus: string
  runMessage: string
  failingSummary: string
  initialSummary: string
  onSummaryChange: (summary: string) => void
  className?: string
}

const CHAT_LANGUAGE_KEY = 'pebble.chatLanguage.v1'

type ChatLanguage = 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'ur' | 'gu' | 'kn' | 'ml' | 'or' | 'pa' | 'as'

type ChatLanguageOption = {
  code: ChatLanguage
  nativeLabel: string
  englishLabel: string
}

const CHAT_LANGUAGE_OPTIONS: ChatLanguageOption[] = [
  { code: 'en', nativeLabel: 'English', englishLabel: 'English' },
  { code: 'hi', nativeLabel: 'हिन्दी', englishLabel: 'Hindi' },
  { code: 'bn', nativeLabel: 'বাংলা', englishLabel: 'Bengali' },
  { code: 'te', nativeLabel: 'తెలుగు', englishLabel: 'Telugu' },
  { code: 'mr', nativeLabel: 'मराठी', englishLabel: 'Marathi' },
  { code: 'ta', nativeLabel: 'தமிழ்', englishLabel: 'Tamil' },
  { code: 'ur', nativeLabel: 'اُردُو', englishLabel: 'Urdu' },
  { code: 'gu', nativeLabel: 'ગુજરાતી', englishLabel: 'Gujarati' },
  { code: 'kn', nativeLabel: 'ಕನ್ನಡ', englishLabel: 'Kannada' },
  { code: 'ml', nativeLabel: 'മലയാളം', englishLabel: 'Malayalam' },
  { code: 'or', nativeLabel: 'ଓଡ଼ିଆ', englishLabel: 'Odia' },
  { code: 'pa', nativeLabel: 'ਪੰਜਾਬੀ', englishLabel: 'Punjabi' },
  { code: 'as', nativeLabel: 'অসমীয়া', englishLabel: 'Assamese' },
]

const LEGACY_LANGUAGE_MAP: Record<string, ChatLanguage> = {
  English: 'en',
  Hindi: 'hi',
  Bengali: 'bn',
  Telugu: 'te',
  Marathi: 'mr',
  Tamil: 'ta',
  Urdu: 'ur',
  Gujarati: 'gu',
  Kannada: 'kn',
  Malayalam: 'ml',
  Odia: 'or',
  Punjabi: 'pa',
  Assamese: 'as',
}

type ChatI18nEntry = {
  starterMessage: string
  helperUnlock: string
  helperGrounded: string
  inputPlaceholder: string
  thinking: string
  typing: string
  chips: {
    hint: string
    explain: string
    nextStep: string
  }
}

const CHAT_I18N: Record<ChatLanguage, ChatI18nEntry> = {
  en: {
    starterMessage: 'I can help with hints, debugging, and your next tiny step. Run tests and ask anytime.',
    helperUnlock: 'Run tests to unlock specific guidance.',
    helperGrounded: 'Guidance is grounded in your latest run.',
    inputPlaceholder: 'Ask Pebble...',
    thinking: 'Pebble is thinking...',
    typing: 'typing',
    chips: { hint: 'Hint', explain: 'Explain', nextStep: 'Next step' },
  },
  hi: {
    starterMessage: 'मैं संकेत, डीबगिंग और आपका अगला छोटा कदम बताने में मदद कर सकता हूँ। टेस्ट चलाकर पूछें।',
    helperUnlock: 'विशिष्ट मार्गदर्शन पाने के लिए टेस्ट चलाएँ।',
    helperGrounded: 'मार्गदर्शन आपके नवीनतम रन पर आधारित है।',
    inputPlaceholder: 'Pebble से पूछें...',
    thinking: 'Pebble सोच रहा है...',
    typing: 'टाइप कर रहा है',
    chips: { hint: 'संकेत', explain: 'समझाएँ', nextStep: 'अगला कदम' },
  },
  bn: {
    starterMessage: 'ইঙ্গিত, ডিবাগিং আর পরের ছোট ধাপ নিয়ে আমি সাহায্য করতে পারি। টেস্ট চালিয়ে জিজ্ঞেস করুন।',
    helperUnlock: 'নির্দিষ্ট গাইডেন্স পেতে টেস্ট চালান।',
    helperGrounded: 'গাইডেন্স আপনার সর্বশেষ রান-এর উপর ভিত্তি করে।',
    inputPlaceholder: 'Pebble-কে জিজ্ঞেস করুন...',
    thinking: 'Pebble ভাবছে...',
    typing: 'টাইপ করছে',
    chips: { hint: 'ইঙ্গিত', explain: 'ব্যাখ্যা', nextStep: 'পরের ধাপ' },
  },
  te: {
    starterMessage: 'హింట్లు, డీబగ్గింగ్, ఇంకా మీ తదుపరి చిన్న అడుగులో నేను సహాయం చేస్తాను. టెస్టులు రన్ చేసి అడగండి.',
    helperUnlock: 'స్పష్టమైన మార్గదర్శకానికి టెస్టులు రన్ చేయండి.',
    helperGrounded: 'మార్గదర్శకం మీ తాజా రన్‌పై ఆధారపడి ఉంది.',
    inputPlaceholder: 'Pebble ని అడగండి...',
    thinking: 'Pebble ఆలోచిస్తోంది...',
    typing: 'టైప్ చేస్తోంది',
    chips: { hint: 'హింట్', explain: 'వివరించు', nextStep: 'తదుపరి అడుగు' },
  },
  mr: {
    starterMessage: 'हिंट्स, डिबगिंग आणि तुमची पुढची छोटी पायरी यात मी मदत करू शकतो. टेस्ट चालवा आणि विचारा.',
    helperUnlock: 'नेमके मार्गदर्शन मिळवण्यासाठी टेस्ट चालवा.',
    helperGrounded: 'मार्गदर्शन तुमच्या ताज्या रनवर आधारित आहे.',
    inputPlaceholder: 'Pebble ला विचारा...',
    thinking: 'Pebble विचार करत आहे...',
    typing: 'टाइप करत आहे',
    chips: { hint: 'हिंट', explain: 'समजावून सांगा', nextStep: 'पुढची पायरी' },
  },
  ta: {
    starterMessage: 'குறிப்புகள், பிழைதிருத்தம் மற்றும் அடுத்த சிறிய படி குறித்து நான் உதவ முடியும். டெஸ்ட்களை ஓட்டி கேளுங்கள்.',
    helperUnlock: 'குறிப்பிட்ட வழிகாட்டலை பெற டெஸ்ட்களை ஓட்டுங்கள்.',
    helperGrounded: 'வழிகாட்டல் உங்கள் சமீபத்திய ரன் அடிப்படையில் உள்ளது.',
    inputPlaceholder: 'Pebble-ஐ கேளுங்கள்...',
    thinking: 'Pebble யோசிக்கிறது...',
    typing: 'தட்டச்சு செய்கிறது',
    chips: { hint: 'குறிப்பு', explain: 'விளக்கம்', nextStep: 'அடுத்த படி' },
  },
  ur: {
    starterMessage: 'میں اشاروں، ڈیبگنگ اور آپ کے اگلے چھوٹے قدم میں مدد کر سکتا ہوں۔ ٹیسٹ چلا کر پوچھیں۔',
    helperUnlock: 'مخصوص رہنمائی کے لیے ٹیسٹ چلائیں۔',
    helperGrounded: 'رہنمائی آپ کے تازہ ترین رن پر مبنی ہے۔',
    inputPlaceholder: 'Pebble سے پوچھیں...',
    thinking: 'Pebble سوچ رہا ہے...',
    typing: 'ٹائپ کر رہا ہے',
    chips: { hint: 'اشارہ', explain: 'وضاحت', nextStep: 'اگلا قدم' },
  },
  gu: {
    starterMessage: 'હિંટ્સ, ડિબગિંગ અને તમારું આગળનું નાનું પગલું સમજવામાં હું મદદ કરી શકું છું. ટેસ્ટ ચલાવો અને પૂછો.',
    helperUnlock: 'ખાસ માર્ગદર્શન માટે ટેસ્ટ ચલાવો.',
    helperGrounded: 'માર્ગદર્શન તમારા તાજેતરના રન પર આધારિત છે.',
    inputPlaceholder: 'Pebble ને પૂછો...',
    thinking: 'Pebble વિચારી રહ્યું છે...',
    typing: 'ટાઇપ કરી રહ્યું છે',
    chips: { hint: 'હિંટ', explain: 'સમજાવો', nextStep: 'આગલું પગલું' },
  },
  kn: {
    starterMessage: 'ಹಿಂಟ್ಸ್, ಡಿಬಗ್ಗಿಂಗ್ ಮತ್ತು ನಿಮ್ಮ ಮುಂದಿನ ಚಿಕ್ಕ ಹೆಜ್ಜೆಯಲ್ಲಿ ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಟೆಸ್ಟ್ ರನ್ ಮಾಡಿ ಕೇಳಿ.',
    helperUnlock: 'ನಿಖರ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಟೆಸ್ಟ್ ರನ್ ಮಾಡಿ.',
    helperGrounded: 'ಮಾರ್ಗದರ್ಶನ ನಿಮ್ಮ ಇತ್ತೀಚಿನ ರನ್ ಆಧಾರಿತವಾಗಿದೆ.',
    inputPlaceholder: 'Pebble ಅನ್ನು ಕೇಳಿ...',
    thinking: 'Pebble ಯೋಚಿಸುತ್ತಿದೆ...',
    typing: 'ಟೈಪ್ ಮಾಡುತ್ತಿದೆ',
    chips: { hint: 'ಸೂಚನೆ', explain: 'ವಿವರಿಸಿ', nextStep: 'ಮುಂದಿನ ಹೆಜ್ಜೆ' },
  },
  ml: {
    starterMessage: 'ഹിന്റുകളും ഡിബഗിംഗും അടുത്ത ചെറിയ ഘട്ടവും ഞാൻ സഹായിക്കും. ടെസ്റ്റുകൾ റൺ ചെയ്ത് ചോദിക്കൂ.',
    helperUnlock: 'വിശദമായ മാർഗ്ഗനിർദ്ദേശത്തിന് ടെസ്റ്റുകൾ റൺ ചെയ്യുക.',
    helperGrounded: 'മാർഗ്ഗനിർദ്ദേശം നിങ്ങളുടെ പുതിയ റണ്ണിനെ അടിസ്ഥാനമാക്കിയതാണ്.',
    inputPlaceholder: 'Pebble-നോട് ചോദിക്കൂ...',
    thinking: 'Pebble ആലോചിക്കുന്നു...',
    typing: 'ടൈപ്പ് ചെയ്യുന്നു',
    chips: { hint: 'ഹിന്റ്', explain: 'വിവരിക്കുക', nextStep: 'അടുത്ത ഘട്ടം' },
  },
  or: {
    starterMessage: 'ମୁଁ ଇଙ୍ଗିତ, ଡିବଗିଂ ଏବଂ ପରବର୍ତ୍ତୀ ଛୋଟ ପଦକ୍ଷେପରେ ସହଯୋଗ କରିପାରିବି। ଟେଷ୍ଟ ଚଳାଇ ପଚାରନ୍ତୁ।',
    helperUnlock: 'ନିର୍ଦ୍ଦିଷ୍ଟ ଗାଇଡ୍‌ଆନ୍ସ ପାଇବାକୁ ଟେଷ୍ଟ ଚଳାନ୍ତୁ।',
    helperGrounded: 'ଗାଇଡ୍‌ଆନ୍ସ ଆପଣଙ୍କ ସବୁଠୁ ନୂତନ ରନ୍‌ ଉପରେ ଆଧାରିତ।',
    inputPlaceholder: 'Pebble କୁ ପଚାରନ୍ତୁ...',
    thinking: 'Pebble ଭାବୁଛି...',
    typing: 'ଟାଇପ କରୁଛି',
    chips: { hint: 'ଇଙ୍ଗିତ', explain: 'ବ୍ୟାଖ୍ୟା', nextStep: 'ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପ' },
  },
  pa: {
    starterMessage: 'ਮੈਂ ਹਿੰਟ, ਡੀਬੱਗਿੰਗ ਅਤੇ ਤੁਹਾਡੇ ਅਗਲੇ ਛੋਟੇ ਕਦਮ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਟੈਸਟ ਚਲਾ ਕੇ ਪੁੱਛੋ।',
    helperUnlock: 'ਖਾਸ ਮਦਦ ਲਈ ਟੈਸਟ ਚਲਾਓ।',
    helperGrounded: 'ਮਦਦ ਤੁਹਾਡੇ ਤਾਜ਼ਾ ਰਨ ਤੇ ਆਧਾਰਿਤ ਹੈ।',
    inputPlaceholder: 'Pebble ਨੂੰ ਪੁੱਛੋ...',
    thinking: 'Pebble ਸੋਚ ਰਿਹਾ ਹੈ...',
    typing: 'ਟਾਈਪ ਕਰ ਰਿਹਾ ਹੈ',
    chips: { hint: 'ਹਿੰਟ', explain: 'ਸਮਝਾਓ', nextStep: 'ਅਗਲਾ ਕਦਮ' },
  },
  as: {
    starterMessage: 'ইঙ্গিত, ডিবাগিং আৰু আপোনাৰ পৰৱৰ্তী সৰু পদক্ষেপত মই সহায় কৰিব পাৰোঁ। টেষ্ট চলাওক আৰু সোধক।',
    helperUnlock: 'নির্দিষ্ট সহায় পেতে টেষ্ট চলাওক।',
    helperGrounded: 'সহায় আপোনাৰ শেহতীয়া run ৰ ওপৰত ভিত্তি কৰি দিয়া হৈছে।',
    inputPlaceholder: 'Pebble-ক সোধক...',
    thinking: 'Pebble ভাবি আছে...',
    typing: 'টাইপ কৰি আছে',
    chips: { hint: 'ইঙ্গিত', explain: 'বুজাওক', nextStep: 'পৰৱৰ্তী পদক্ষেপ' },
  },
}

const TYPE_MIN = 1
const TYPE_MAX = 3
const TYPE_MS = 26

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function summarizeRecentChat(messages: ChatMessage[]) {
  return messages
    .slice(-4)
    .map((message) => `${message.role === 'user' ? 'U' : 'A'}: ${message.text.replace(/\s+/g, ' ').trim()}`)
    .join(' | ')
    .slice(0, 360)
}

function isChatLanguage(value: string | null): value is ChatLanguage {
  return CHAT_LANGUAGE_OPTIONS.some((language) => language.code === value)
}

function resolveInitialChatLanguage() {
  if (typeof window === 'undefined') {
    return 'en' as ChatLanguage
  }

  const stored = window.localStorage.getItem(CHAT_LANGUAGE_KEY)
  if (isChatLanguage(stored)) {
    return stored
  }
  return LEGACY_LANGUAGE_MAP[stored ?? ''] ?? 'en'
}

function buildPrompt(input: {
  question: string
  unitTitle: string
  unitConcept: string
  runStatus: string
  runMessage: string
  failingSummary: string
  recentSummary: string
  chatLanguage: ChatLanguage
  chatLanguageLabel: string
}) {
  const contextLines = [
    `Unit: ${input.unitTitle}`,
    `Concept: ${input.unitConcept}`,
    `Run status: ${input.runStatus}`,
    input.runMessage ? `Run output summary: ${input.runMessage}` : '',
    input.failingSummary ? `Failing tests: ${input.failingSummary}` : '',
    input.recentSummary ? `Recent chat summary: ${input.recentSummary}` : '',
    `SYSTEM_LANGUAGE: ${input.chatLanguage} (${input.chatLanguageLabel}). Respond in this language unless user asks otherwise.`,
    `Question: ${input.question}`,
  ]

  return contextLines.filter(Boolean).join('\n')
}

export function PebbleChatPanel({
  unitTitle,
  unitConcept,
  codeText,
  runStatus,
  runMessage,
  failingSummary,
  initialSummary,
  onSummaryChange,
  className,
}: PebbleChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialLanguage = resolveInitialChatLanguage()
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: (CHAT_I18N[initialLanguage] ?? CHAT_I18N.en).starterMessage,
      },
    ]
  })
  const [input, setInput] = useState('')
  const [assistantState, setAssistantState] = useState<'idle' | 'thinking' | 'typing'>('idle')
  const [typedDraft, setTypedDraft] = useState('')
  const [lastAsked, setLastAsked] = useState('')
  const [chatLanguage, setChatLanguage] = useState<ChatLanguage>(resolveInitialChatLanguage)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const typingTimerRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)

  const isGenerating = assistantState === 'thinking' || assistantState === 'typing'
  const recentSummary = useMemo(() => summarizeRecentChat(messages), [messages])
  const hasRunContext = runStatus !== 'idle' && runMessage.trim().length > 0
  const chatCopy = CHAT_I18N[chatLanguage] ?? CHAT_I18N.en
  const selectedLanguageOption = CHAT_LANGUAGE_OPTIONS.find((language) => language.code === chatLanguage) ?? CHAT_LANGUAGE_OPTIONS[0]
  const usingRunOutputLabel = chatLanguage === 'hi' ? 'आपके रन आउटपुट का उपयोग' : 'Using your run output'
  const usingRunOutputTag = chatLanguage === 'hi' ? 'रन आउटपुट' : 'using run output'
  const stopLabel = chatLanguage === 'hi' ? 'रोकें' : 'Stop'
  const retryLabel = chatLanguage === 'hi' ? 'फिर प्रयास करें' : 'Retry'
  const chatLanguageLabel = chatLanguage === 'hi' ? 'चैट भाषा' : 'Chat language'
  const languageHintLabel =
    chatLanguage === 'hi'
      ? 'Pebble आपके चुने हुए भाषा विकल्प में जवाब देगा।'
      : 'Pebble replies in your selected language preference.'

  useEffect(() => {
    onSummaryChange(recentSummary || initialSummary)
  }, [initialSummary, onSummaryChange, recentSummary])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(CHAT_LANGUAGE_KEY, chatLanguage)
  }, [chatLanguage])

  useEffect(() => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === 'welcome'
          ? {
              ...message,
              text: chatCopy.starterMessage,
            }
          : message,
      ),
    )
  }, [chatCopy.starterMessage])

  const clearTyping = useCallback(() => {
    if (typingTimerRef.current !== null) {
      window.clearInterval(typingTimerRef.current)
      typingTimerRef.current = null
    }
  }, [])

  const cancelGeneration = useCallback(() => {
    requestIdRef.current += 1
    abortRef.current?.abort()
    abortRef.current = null
    clearTyping()
    setTypedDraft('')
    setAssistantState('idle')
  }, [clearTyping])

  useEffect(() => {
    return () => {
      cancelGeneration()
    }
  }, [cancelGeneration])

  const pushAssistantWithTypewriter = useCallback(
    (text: string, requestId: number, usedRunOutput: boolean) => {
      clearTyping()
      setAssistantState('typing')
      setTypedDraft('')

      let cursor = 0
      typingTimerRef.current = window.setInterval(() => {
        if (requestIdRef.current !== requestId) {
          clearTyping()
          return
        }

        const chunk = clamp(Math.floor(Math.random() * TYPE_MAX) + 1, TYPE_MIN, TYPE_MAX)
        cursor = Math.min(text.length, cursor + chunk)
        setTypedDraft(text.slice(0, cursor))

        if (cursor >= text.length) {
          clearTyping()
          setAssistantState('idle')
          setTypedDraft('')
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              text,
              usedRunOutput,
            },
          ])
        }
      }, TYPE_MS)
    },
    [clearTyping],
  )

  const submitQuestion = useCallback(
    async (question: string, appendUser = true) => {
      if (!question.trim()) {
        return
      }

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      if (appendUser) {
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, role: 'user', text: question },
        ])
      }

      setLastAsked(question)
      setAssistantState('thinking')
      setTypedDraft('')

      const usesRunOutput = hasRunContext
      const prompt = buildPrompt({
        question,
        unitTitle,
        unitConcept,
        runStatus,
        runMessage,
        failingSummary,
        recentSummary,
        chatLanguage,
        chatLanguageLabel: selectedLanguageOption.nativeLabel,
      })

      try {
        const answer = await askPebble({
          prompt,
          signal: controller.signal,
          context: {
            taskTitle: unitTitle,
            codeText: codeText.length > 4000 ? `${codeText.slice(0, 4000)}\n...[trimmed]` : codeText,
            runStatus,
            runMessage,
            currentErrorKey: null,
            nudgeVisible: false,
            guidedActive: false,
            struggleScore: runStatus === 'error' ? 70 : 35,
            repeatErrorCount: runStatus === 'error' ? 1 : 0,
            errorHistory: failingSummary ? [failingSummary] : [],
          },
        })

        if (requestIdRef.current !== requestId) {
          return
        }

        setAssistantState('idle')
        pushAssistantWithTypewriter(answer, requestId, usesRunOutput)
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
        }
      }
    },
    [
      chatLanguage,
      codeText,
      failingSummary,
      hasRunContext,
      pushAssistantWithTypewriter,
      recentSummary,
      runMessage,
      runStatus,
      selectedLanguageOption.nativeLabel,
      unitConcept,
      unitTitle,
    ],
  )

  const quickActions = [
    {
      label: chatCopy.chips.hint,
      prompt: 'Give me one concise hint. Do not provide the full solution.',
    },
    {
      label: chatCopy.chips.explain,
      prompt: 'Explain what is wrong in my current approach using failing tests.',
    },
    {
      label: chatCopy.chips.nextStep,
      prompt: 'What is the next smallest step I should implement?',
    },
  ]

  const canSend = !isGenerating && input.trim().length > 0

  function sendCurrentInput() {
    const value = input.trim()
    if (!value || isGenerating) {
      return
    }
    setInput('')
    void submitQuestion(value)
  }

  return (
    <CardLayout className={className}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-pebble-border/35 bg-pebble-accent/18 text-sm font-semibold text-pebble-text-primary">
            P
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-pebble-panel ${
                runStatus === 'success'
                  ? 'bg-pebble-success'
                  : runStatus === 'error'
                    ? 'bg-pebble-warning'
                    : 'bg-pebble-text-secondary/65'
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-pebble-text-primary">Pebble</p>
            <p className="text-xs text-pebble-text-secondary">AI mentor in context</p>
          </div>
        </div>

        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pebble-border/30 bg-pebble-overlay/[0.08] text-pebble-text-secondary transition hover:bg-pebble-overlay/[0.16] hover:text-pebble-text-primary"
            title="Chat settings"
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <Badge variant={runStatus === 'success' ? 'success' : runStatus === 'error' ? 'warning' : 'neutral'}>
            {runStatus}
          </Badge>

          {settingsOpen && (
            <div className="absolute right-0 top-10 z-20 w-72 rounded-xl border border-pebble-border/35 bg-pebble-panel/95 p-3 shadow-[0_14px_34px_rgba(2,8,23,0.3)]">
              <p className="text-[11px] uppercase tracking-[0.06em] text-pebble-text-muted">{chatLanguageLabel}</p>
              <div className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">
                {CHAT_LANGUAGE_OPTIONS.map((language) => {
                  const selected = language.code === chatLanguage
                  return (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => setChatLanguage(language.code)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition ${
                        selected
                          ? 'border-pebble-accent/45 bg-pebble-accent/14'
                          : 'border-pebble-border/25 bg-pebble-overlay/[0.05] hover:bg-pebble-overlay/[0.12]'
                      }`}
                    >
                      <span className="inline-flex w-4 justify-center">
                        {selected ? <Check className="h-3.5 w-3.5 text-pebble-accent" aria-hidden="true" /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-pebble-text-primary">{language.nativeLabel}</p>
                        <p className="truncate text-xs text-pebble-text-secondary">{language.englishLabel}</p>
                      </div>
                      <Globe className="h-3.5 w-3.5 text-pebble-text-muted" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-[11px] text-pebble-text-secondary">{languageHintLabel}</p>
            </div>
          )}
        </div>
      </div>

      {hasRunContext && (
        <p className="inline-flex w-fit rounded-full border border-pebble-border/35 bg-pebble-overlay/[0.1] px-2.5 py-0.5 text-[11px] font-medium text-pebble-text-secondary">
          {usingRunOutputLabel}
        </p>
      )}

      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="rounded-full border border-pebble-border/30 bg-pebble-overlay/[0.08] px-3 py-1 text-xs font-medium text-pebble-text-primary transition hover:bg-pebble-overlay/[0.16] disabled:opacity-50"
              onClick={() => void submitQuestion(action.prompt, true)}
              disabled={isGenerating}
            >
              {action.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-pebble-text-secondary">
          {hasRunContext ? chatCopy.helperGrounded : chatCopy.helperUnlock}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl border border-pebble-border/30 bg-pebble-canvas/45 p-3 pr-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[95%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'ml-auto border border-pebble-accent/40 bg-pebble-accent/16 text-pebble-text-primary'
                : 'mr-auto border border-pebble-border/30 bg-pebble-overlay/[0.08] text-pebble-text-primary'
            }`}
          >
            {message.usedRunOutput && (
              <p className="mb-1 inline-flex rounded-full border border-pebble-border/35 px-2 py-0.5 text-[10px] uppercase tracking-[0.04em] text-pebble-text-secondary">
                {usingRunOutputTag}
              </p>
            )}
            <p className="whitespace-pre-wrap">{message.text}</p>
          </div>
        ))}

        {assistantState === 'thinking' && (
          <div className="mr-auto max-w-[95%] rounded-xl border border-pebble-border/30 bg-pebble-overlay/[0.08] px-3 py-2 text-sm text-pebble-text-primary">
            {chatCopy.thinking}
          </div>
        )}

        {assistantState === 'typing' && (
          <div className="mr-auto max-w-[95%] rounded-xl border border-pebble-border/30 bg-pebble-overlay/[0.08] px-3 py-2 text-sm text-pebble-text-primary">
            <p className="mb-1 inline-flex rounded-full border border-pebble-border/35 px-2 py-0.5 text-[10px] uppercase tracking-[0.04em] text-pebble-text-secondary">
              {chatCopy.typing}
            </p>
            <p className="whitespace-pre-wrap">{typedDraft}</p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {(isGenerating || !!lastAsked) && (
          <div className="flex items-center justify-end gap-1.5">
            {isGenerating ? (
              <Button variant="secondary" size="sm" onClick={cancelGeneration}>
                {stopLabel}
              </Button>
            ) : null}
            {!!lastAsked && !isGenerating ? (
              <Button variant="secondary" size="sm" onClick={() => void submitQuestion(lastAsked, false)}>
                {retryLabel}
              </Button>
            ) : null}
          </div>
        )}

        <div className="relative">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendCurrentInput()
              }
            }}
            rows={1}
            placeholder={chatCopy.inputPlaceholder}
            className="min-h-[44px] w-full resize-none rounded-xl border border-pebble-border/35 bg-pebble-overlay/[0.08] px-3 py-2 pr-12 text-sm text-pebble-text-primary outline-none placeholder:text-pebble-text-secondary focus:border-pebble-accent/55"
          />
          <button
            type="button"
            onClick={sendCurrentInput}
            disabled={!canSend}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-pebble-accent/45 bg-pebble-accent/30 text-pebble-text-primary transition hover:bg-pebble-accent/40 disabled:cursor-not-allowed disabled:opacity-45"
            title="Send"
          >
            <SendHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </CardLayout>
  )
}

function CardLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative flex h-full min-h-0 flex-col gap-2 overflow-hidden rounded-2xl border border-pebble-border/30 bg-gradient-to-b from-pebble-overlay/[0.12] to-pebble-overlay/[0.04] p-3 ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
