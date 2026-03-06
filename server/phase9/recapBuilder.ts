/**
 * Phase 9: Weekly Growth Ledger Narrator — premium recap composer.
 *
 * Produces a short, human recap script (roughly 45–90s) with:
 * - personalized metrics
 * - warm emotional tone shifts
 * - optional light humor
 * - practical next step
 * - multilingual output aligned to selected app language
 */

import { normalizeAppLanguageCode, type AppLanguageCode } from '../../shared/recapVoice.ts'

export type RecapSummary = {
  appLanguage?: AppLanguageCode | string
  trackLanguage?: string
  userName?: string | null
  solvesLast7: number
  solvesDelta?: number
  daysActiveLast7: number
  streakDays: number
  streakDelta?: number
  biggestStruggle: string | null
  trendDirection: 'improving' | 'stable' | 'worsening'
  attemptsLast7?: number
  passRateLast7?: number
  passRateDelta?: number
  guidanceReliancePct?: number
  guidanceRelianceDeltaPct?: number
  avgRecoveryTimeSec?: number
  avgRecoveryTimeDeltaSec?: number
  hardestSolvedDifficulty?: 'easy' | 'medium' | 'hard' | null
}

export type RecapTone = 'celebratory' | 'encouraging' | 'reflective' | 'empathetic' | 'determined'

export type RecapNarrative = {
  script: string
  tone: RecapTone
  usedHumor: boolean
}

type SegmentKey =
  | 'openNamed'
  | 'openGeneric'
  | 'headline'
  | 'streakStrong'
  | 'streakGrowing'
  | 'streakReset'
  | 'strength'
  | 'struggle'
  | 'interpretUp'
  | 'interpretStable'
  | 'interpretDown'
  | 'humorLogic'
  | 'humorRuntime'
  | 'humorReliance'
  | 'nextStep'
  | 'close'

type SegmentMap = Record<SegmentKey, string>

const EN_SEGMENTS: SegmentMap = {
  openNamed: 'Hey {name}, here is your Weekly Pebble Recap.',
  openGeneric: 'Here is your Weekly Pebble Recap.',
  headline: 'You solved {solves} problems across {days} active days this week.',
  streakStrong: 'Your streak is at {streak} days — that is not luck, that is rhythm.',
  streakGrowing: 'You are on a {streak}-day streak. Small repeats, real momentum.',
  streakReset: 'Your streak reset recently, but your effort this week still counts and compounds.',
  strength: 'Your strongest signal this week: {strength}.',
  struggle: 'The main friction point was {struggle}, but you kept returning to the work.',
  interpretUp: 'The trend is moving up — cleaner attempts, steadier recovery.',
  interpretStable: 'The trend is steady. Not flashy, but solid and repeatable.',
  interpretDown: 'The week was messier than ideal, but your recovery pattern is still trainable.',
  humorLogic: 'Logic bugs were your weekly villain, but honestly, they were not great at escaping.',
  humorRuntime: 'Runtime errors tried to be dramatic this week. You kept the plot under control.',
  humorReliance: 'Pebble Coach got extra screen time this week — think of it as a tactical mini-bootcamp.',
  nextStep: 'Next week, focus on {nextAction}. Keep it small, daily, and intentional.',
  close: 'That is your recap. Keep showing up — the curve is bending in your favor.',
}

const HINDI_SEGMENTS: SegmentMap = {
  openNamed: '{name}, यह रहा आपका Weekly Pebble Recap।',
  openGeneric: 'यह रहा आपका Weekly Pebble Recap।',
  headline: 'इस हफ्ते आपने {days} active दिनों में {solves} problems solve किए।',
  streakStrong: 'आपका streak {streak} दिनों पर है — यह luck नहीं, rhythm है।',
  streakGrowing: 'आप {streak}-day streak पर हैं। छोटे repeats, बड़ा momentum।',
  streakReset: 'streak हाल में reset हुआ, लेकिन इस हफ्ते की आपकी मेहनत पूरी तरह मायने रखती है।',
  strength: 'इस हफ्ते आपकी strongest signal: {strength}।',
  struggle: 'मुख्य friction point था {struggle}, लेकिन आपने काम पर वापसी नहीं छोड़ी।',
  interpretUp: 'Trend ऊपर जा रहा है — attempts साफ हुए हैं और recovery stable हुई है।',
  interpretStable: 'Trend steady है। flashy नहीं, लेकिन मजबूत और repeatable।',
  interpretDown: 'हफ्ता थोड़ा messy रहा, लेकिन आपकी recovery pattern अभी भी मजबूत बन रही है।',
  humorLogic: 'Logic bugs इस हफ्ते villain बने, पर आप उनके लिए खराब host निकले।',
  humorRuntime: 'Runtime errors ने drama किया, और आपने calmly script बदल दी।',
  humorReliance: 'इस हफ्ते Pebble Coach को extra screen time मिला — smart training समझिए।',
  nextStep: 'अगले हफ्ते {nextAction} पर focus करें। छोटा, रोज़ाना और intentional रखें।',
  close: 'यही था आपका recap। ऐसे ही लौटते रहिए — growth दिख रही है।',
}

const BN_SEGMENTS: SegmentMap = {
  openNamed: '{name}, আপনার Weekly Pebble Recap প্রস্তুত।',
  openGeneric: 'আপনার Weekly Pebble Recap প্রস্তুত।',
  headline: 'এই সপ্তাহে আপনি {days} active দিনে {solves}টি problem solve করেছেন।',
  streakStrong: 'আপনার streak এখন {streak} দিন — এটা কেবল luck না, এটা rhythm।',
  streakGrowing: 'আপনি {streak}-day streak এ আছেন। ছোট repeat, বড় momentum।',
  streakReset: 'streak রিসেট হয়েছে, কিন্তু এই সপ্তাহের effort একদমই নষ্ট হয়নি।',
  strength: 'এই সপ্তাহে আপনার strongest signal: {strength}।',
  struggle: 'সবচেয়ে বেশি friction ছিল {struggle}, তবুও আপনি ফিরে এসেছেন।',
  interpretUp: 'Trend উপরে যাচ্ছে — attempt পরিষ্কার হচ্ছে, recovery দ্রুত হচ্ছে।',
  interpretStable: 'Trend steady। খুব flashy নয়, কিন্তু solid।',
  interpretDown: 'সপ্তাহটা একটু messy ছিল, কিন্তু আপনার recovery pattern এখনও শক্তিশালী হচ্ছে।',
  humorLogic: 'Logic bug অনেকবার এসেছিল, কিন্তু আপনি ওদের জন্য আরামদায়ক host ছিলেন না।',
  humorRuntime: 'Runtime error drama করেছে, আপনি শান্তভাবে scene বদলে দিয়েছেন।',
  humorReliance: 'এই সপ্তাহে Pebble Coach একটু বেশি ব্যস্ত ছিল — একে smart pit-stop ভাবুন।',
  nextStep: 'আগামী সপ্তাহে {nextAction} এ ফোকাস করুন। ছোট, নিয়মিত, intentional।',
  close: 'এটাই আপনার recap। ফিরে আসার অভ্যাসটাই আপনাকে এগিয়ে দিচ্ছে।',
}

const TE_SEGMENTS: SegmentMap = {
  openNamed: '{name}, మీ Weekly Pebble Recap సిద్ధంగా ఉంది.',
  openGeneric: 'మీ Weekly Pebble Recap సిద్ధంగా ఉంది.',
  headline: 'ఈ వారం మీరు {days} active రోజుల్లో {solves} problems solve చేశారు.',
  streakStrong: 'మీ streak {streak} రోజులకి చేరింది — ఇది luck కాదు, rhythm.',
  streakGrowing: 'మీరు {streak}-day streak లో ఉన్నారు. చిన్న repeats, మంచి momentum.',
  streakReset: 'streak reset అయినా, ఈ వారం చేసిన effort చాలా విలువైనది.',
  strength: 'ఈ వారం మీ strongest signal: {strength}.',
  struggle: 'ప్రధాన friction point {struggle}, అయినా మీరు పని దగ్గరికి తిరిగి వచ్చారు.',
  interpretUp: 'Trend పైకి వెళ్తోంది — attempts క్లియర్ గా, recovery బెటర్ గా ఉన్నాయి.',
  interpretStable: 'Trend steady గా ఉంది. flashy కాదు, కానీ solid.',
  interpretDown: 'వారం కొంచెం messy అయినా, మీ recovery pattern ఇంకా build అవుతోంది.',
  humorLogic: 'Logic bugs ఈ వారం villain అయ్యాయి, కానీ మీరు వాటికి easy target కాలేదు.',
  humorRuntime: 'Runtime errors drama చేశాయి, మీరు calm గా direction మార్చారు.',
  humorReliance: 'ఈ వారం Pebble Coach కి extra screen time వచ్చింది — smart training గా తీసుకోండి.',
  nextStep: 'తర్వాతి వారం {nextAction} పై focus చేయండి. చిన్నది, daily, intentional.',
  close: 'ఇదే మీ recap. మీరు తిరిగి వస్తున్న consistency నే మీ superpower.',
}

const MR_SEGMENTS: SegmentMap = {
  openNamed: '{name}, तुमचा Weekly Pebble Recap तयार आहे.',
  openGeneric: 'तुमचा Weekly Pebble Recap तयार आहे.',
  headline: 'या आठवड्यात तुम्ही {days} active दिवसांमध्ये {solves} problems solve केले.',
  streakStrong: 'तुमचा streak {streak} दिवसांवर आहे — हे luck नाही, rhythm आहे.',
  streakGrowing: 'तुम्ही {streak}-day streak वर आहात. छोटे repeats, मोठा momentum.',
  streakReset: 'streak reset झाला तरी या आठवड्यातील effort महत्त्वाचा आहे.',
  strength: 'या आठवड्यातील तुमचा strongest signal: {strength}.',
  struggle: 'मुख्य friction point होता {struggle}, पण तुम्ही पुन्हा कामाकडे आलात.',
  interpretUp: 'Trend वर जातोय — attempts स्वच्छ, recovery जलद.',
  interpretStable: 'Trend steady आहे. flashy नाही, पण solid आहे.',
  interpretDown: 'आठवडा थोडा messy होता, पण recovery pattern मजबूत होत आहे.',
  humorLogic: 'Logic bugs या आठवड्यात villain होते, पण तुम्ही त्यांना जास्त वेळ दिला नाही.',
  humorRuntime: 'Runtime errors ने drama केला, तुम्ही शांतपणे scene बदलला.',
  humorReliance: 'या आठवड्यात Pebble Coach ला extra screen time मिळाला — smart training समजा.',
  nextStep: 'पुढच्या आठवड्यात {nextAction} वर focus करा. छोटे, रोजचे, intentional.',
  close: 'हा तुमचा recap. तुम्ही सातत्याने परत येता आहात — तीच खरी ताकद आहे.',
}

const TA_SEGMENTS: SegmentMap = {
  openNamed: '{name}, உங்கள் Weekly Pebble Recap தயார்.',
  openGeneric: 'உங்கள் Weekly Pebble Recap தயார்.',
  headline: 'இந்த வாரம் நீங்கள் {days} active நாட்களில் {solves} problems solve செய்தீர்கள்.',
  streakStrong: 'உங்கள் streak {streak} நாட்கள் — இது luck இல்லை, rhythm.',
  streakGrowing: 'நீங்கள் {streak}-day streakல் இருக்கிறீர்கள். சிறிய repeats, பெரிய momentum.',
  streakReset: 'streak reset ஆனாலும், இந்த வார effort முழுக்க மதிப்புடையது.',
  strength: 'இந்த வார உங்கள் strongest signal: {strength}.',
  struggle: 'முக்கிய friction point {struggle}, ஆனாலும் நீங்கள் திரும்பி வேலை செய்தீர்கள்.',
  interpretUp: 'Trend மேலே போகிறது — attempts தெளிவாக, recovery வேகமாக இருக்கிறது.',
  interpretStable: 'Trend steady. flashy இல்லை, ஆனால் solid.',
  interpretDown: 'இந்த வாரம் கொஞ்சம் messy, ஆனால் recovery pattern இன்னும் build ஆகிறது.',
  humorLogic: 'Logic bugs இந்த வாரம் villain போல வந்தது, ஆனால் நீங்கள் அவற்றுக்கு easy host இல்லை.',
  humorRuntime: 'Runtime errors drama செய்தது; நீங்கள் calm ஆக scene மாற்றிட்டீர்கள்.',
  humorReliance: 'இந்த வாரம் Pebble Coachக்கு extra screen time கிடைத்தது — இதை smart training என்று நினைக்கலாம்.',
  nextStep: 'அடுத்த வாரம் {nextAction} மீது focus செய்யுங்கள். சிறியது, தினசரி, intentional.',
  close: 'இது உங்கள் recap. நீங்கள் தொடர்ந்து திரும்பி வருவது தான் உங்கள் edge.',
}

const UR_SEGMENTS: SegmentMap = {
  openNamed: '{name}، یہ رہا آپ کا Weekly Pebble Recap۔',
  openGeneric: 'یہ رہا آپ کا Weekly Pebble Recap۔',
  headline: 'اس ہفتے آپ نے {days} active دنوں میں {solves} problems solve کیے۔',
  streakStrong: 'آپ کا streak {streak} دن ہے — یہ luck نہیں، rhythm ہے۔',
  streakGrowing: 'آپ {streak}-day streak پر ہیں۔ چھوٹے repeats، مضبوط momentum۔',
  streakReset: 'streak reset ہوا، مگر اس ہفتے کی محنت پھر بھی قیمتی ہے۔',
  strength: 'اس ہفتے آپ کا strongest signal: {strength}۔',
  struggle: 'اہم friction point تھا {struggle}، لیکن آپ واپس آتے رہے۔',
  interpretUp: 'Trend اوپر جا رہا ہے — attempts صاف اور recovery بہتر ہو رہی ہے۔',
  interpretStable: 'Trend steady ہے۔ flashy نہیں، مگر مضبوط ہے۔',
  interpretDown: 'ہفتہ تھوڑا messy رہا، مگر recovery pattern پھر بھی بہتر ہو رہا ہے۔',
  humorLogic: 'Logic bugs اس ہفتے villain بنے، لیکن آپ ان کے لیے آسان میزبان نہیں تھے۔',
  humorRuntime: 'Runtime errors نے drama کیا، آپ نے سکون سے direction بدل دی۔',
  humorReliance: 'اس ہفتے Pebble Coach کو extra screen time ملا — اسے smart training سمجھیں۔',
  nextStep: 'اگلے ہفتے {nextAction} پر focus کریں۔ چھوٹا، روزانہ، intentional۔',
  close: 'یہ تھا آپ کا recap۔ آپ کا واپس آنا ہی اصل growth signal ہے۔',
}

const GU_SEGMENTS: SegmentMap = {
  openNamed: '{name}, તમારું Weekly Pebble Recap તૈયાર છે.',
  openGeneric: 'તમારું Weekly Pebble Recap તૈયાર છે.',
  headline: 'આ અઠવાડિયે તમે {days} active દિવસોમાં {solves} problems solve કર્યા.',
  streakStrong: 'તમારો streak {streak} દિવસ છે — આ luck નહીં, rhythm છે.',
  streakGrowing: 'તમે {streak}-day streak પર છો. નાના repeats, મજબૂત momentum.',
  streakReset: 'streak reset થયો, છતાં આ અઠવાડિયાનું effort ખૂબ કિંમતી છે.',
  strength: 'આ અઠવાડિયે તમારો strongest signal: {strength}.',
  struggle: 'મુખ્ય friction point હતો {struggle}, છતાં તમે પાછા ફર્યા.',
  interpretUp: 'Trend ઉપર જઈ રહ્યો છે — attempts વધુ clean અને recovery વધુ stable.',
  interpretStable: 'Trend steady છે. flashy નથી, પણ solid છે.',
  interpretDown: 'આ અઠવાડિયું થોડું messy હતું, પણ recovery pattern આગળ વધી રહ્યું છે.',
  humorLogic: 'Logic bugs આ અઠવાડિયે villain બન્યા, પણ તમે ખરાબ host સાબિત થયા.',
  humorRuntime: 'Runtime errors એ drama કર્યું, તમે શાંતિથી scene બદલી દીધો.',
  humorReliance: 'આ અઠવાડિયે Pebble Coach ને extra screen time મળ્યું — smart training સમજો.',
  nextStep: 'આવતા અઠવાડિયે {nextAction} પર focus કરો. નાનું, દૈનિક, intentional.',
  close: 'આ હતો તમારો recap. સતત પાછા આવવું જ તમારી edge છે.',
}

const KN_SEGMENTS: SegmentMap = {
  openNamed: '{name}, ನಿಮ್ಮ Weekly Pebble Recap ಸಿದ್ಧವಾಗಿದೆ.',
  openGeneric: 'ನಿಮ್ಮ Weekly Pebble Recap ಸಿದ್ಧವಾಗಿದೆ.',
  headline: 'ಈ ವಾರ ನೀವು {days} active ದಿನಗಳಲ್ಲಿ {solves} problems solve ಮಾಡಿದ್ದೀರಿ.',
  streakStrong: 'ನಿಮ್ಮ streak {streak} ದಿನ — ಇದು luck ಅಲ್ಲ, rhythm.',
  streakGrowing: 'ನೀವು {streak}-day streak ಮೇಲೆ ಇದ್ದೀರಿ. ಚಿಕ್ಕ repeats, ನಿಜವಾದ momentum.',
  streakReset: 'streak reset ಆದರೂ, ಈ ವಾರದ effort ಬಹಳ ಮುಖ್ಯ.',
  strength: 'ಈ ವಾರ ನಿಮ್ಮ strongest signal: {strength}.',
  struggle: 'ಮುಖ್ಯ friction point {struggle}, ಆದರೆ ನೀವು ಮತ್ತೆ ಕೆಲಸಕ್ಕೆ ಮರಳಿದಿರಿ.',
  interpretUp: 'Trend ಮೇಲಕ್ಕೇ ಹೋಗುತ್ತಿದೆ — attempts ಕ್ಲೀನ್, recovery ಉತ್ತಮ.',
  interpretStable: 'Trend steady ಇದೆ. flashy ಅಲ್ಲ, ಆದರೆ solid.',
  interpretDown: 'ವಾರ ಸ್ವಲ್ಪ messy ಆಗಿತ್ತು, ಆದರೆ recovery pattern ಬಲವಾಗುತ್ತಿದೆ.',
  humorLogic: 'Logic bugs ಈ ವಾರ villain ಆಗಿದ್ದವು, ಆದರೆ ನೀವು ಅವರಿಗೆ easy host ಅಲ್ಲ.',
  humorRuntime: 'Runtime errors drama ಮಾಡಿದವು; ನೀವು calm ಆಗಿ scene ಬದಲಾಯಿಸಿದ್ದೀರಿ.',
  humorReliance: 'ಈ ವಾರ Pebble Coach ಗೆ extra screen time ಸಿಕ್ಕಿತು — ಇದನ್ನು smart training ಎಂದು ನೋಡಿ.',
  nextStep: 'ಮುಂದಿನ ವಾರ {nextAction} ಮೇಲೆ focus ಮಾಡಿ. ಚಿಕ್ಕದು, daily, intentional.',
  close: 'ಇದು ನಿಮ್ಮ recap. ನೀವು ಮರಳಿ ಬರುತ್ತಿರುವ consistency ನಿಮ್ಮ ಬಲ.',
}

const ML_SEGMENTS: SegmentMap = {
  openNamed: '{name}, നിങ്ങളുടെ Weekly Pebble Recap തയ്യാറായി.',
  openGeneric: 'നിങ്ങളുടെ Weekly Pebble Recap തയ്യാറായി.',
  headline: 'ഈ ആഴ്ച നിങ്ങൾ {days} active ദിവസങ്ങളിൽ {solves} problems solve ചെയ്തു.',
  streakStrong: 'നിങ്ങളുടെ streak {streak} ദിവസമാണ് — ഇത് luck അല്ല, rhythm ആണ്.',
  streakGrowing: 'നിങ്ങൾ {streak}-day streak ലാണ്. ചെറിയ repeats, നല്ല momentum.',
  streakReset: 'streak reset ആയെങ്കിലും, ഈ ആഴ്ചയിലെ effort വിലപ്പെട്ടതാണ്.',
  strength: 'ഈ ആഴ്ച നിങ്ങളുടെ strongest signal: {strength}.',
  struggle: 'പ്രധാന friction point {struggle} ആയിരുന്നു, പക്ഷേ നിങ്ങൾ തിരിച്ചു വന്നു.',
  interpretUp: 'Trend മുകളിലേക്ക് പോകുന്നു — attempts cleaner, recovery better.',
  interpretStable: 'Trend steady ആണ്. flashy അല്ല, പക്ഷേ solid ആണ്.',
  interpretDown: 'ഈ ആഴ്ച കുറച്ച് messy ആയിരുന്നു, പക്ഷേ recovery pattern ഇപ്പോഴും വളരുന്നു.',
  humorLogic: 'Logic bugs ഈ ആഴ്ച villain ആയി വന്നു, പക്ഷേ നിങ്ങളൊരു easy host ആയിരുന്നില്ല.',
  humorRuntime: 'Runtime errors drama ഉണ്ടാക്കി; നിങ്ങൾ calm ആയി flow മാറ്റി.',
  humorReliance: 'ഈ ആഴ്ച Pebble Coach ന് extra screen time കിട്ടി — smart training എന്ന് കാണാം.',
  nextStep: 'അടുത്ത ആഴ്ച {nextAction} ന് focus ചെയ്യൂ. ചെറുതായി, ദിവസവും, intentional ആയി.',
  close: 'ഇതാണ് നിങ്ങളുടെ recap. തിരികെ വരാനുള്ള ശീലം തന്നെയാണ് നിങ്ങളുടെ power.',
}

const OR_SEGMENTS: SegmentMap = {
  openNamed: '{name}, ଆପଣଙ୍କ Weekly Pebble Recap ପ୍ରସ୍ତୁତ।',
  openGeneric: 'ଆପଣଙ୍କ Weekly Pebble Recap ପ୍ରସ୍ତୁତ।',
  headline: 'ଏହି ସପ୍ତାହରେ ଆପଣ {days} active ଦିନରେ {solves} problems solve କରିଛନ୍ତି।',
  streakStrong: 'ଆପଣଙ୍କ streak {streak} ଦିନ — ଏହା luck ନୁହେଁ, rhythm।',
  streakGrowing: 'ଆପଣ {streak}-day streak ଉପରେ ଅଛନ୍ତି। ଛୋଟ repeats, ବଡ momentum।',
  streakReset: 'streak reset ହେଲେ ମଧ୍ୟ ଏହି ସପ୍ତାହର effort ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ।',
  strength: 'ଏହି ସପ୍ତାହର ଆପଣଙ୍କ strongest signal: {strength}।',
  struggle: 'ମୁଖ୍ୟ friction point ଥିଲା {struggle}, କିନ୍ତୁ ଆପଣ ପୁଣି ଫେରିଲେ।',
  interpretUp: 'Trend ଉପରକୁ ଯାଉଛି — attempts cleaner, recovery better।',
  interpretStable: 'Trend steady। flashy ନୁହେଁ, କିନ୍ତୁ solid।',
  interpretDown: 'ସପ୍ତାହଟି କିଛି messy ଥିଲା, ତଥାପି recovery pattern ଶକ୍ତିଶାଳୀ ହେଉଛି।',
  humorLogic: 'Logic bugs ଏହି ସପ୍ତାହର villain ଥିଲେ, କିନ୍ତୁ ଆପଣ easy host ନୁହେଁ।',
  humorRuntime: 'Runtime errors drama କଲେ, ଆପଣ ଶାନ୍ତ ଭାବରେ flow ବଦଳେଇଲେ।',
  humorReliance: 'ଏହି ସପ୍ତାହରେ Pebble Coach extra screen time ପାଇଲା — smart training ବୋଲି ଭାବନ୍ତୁ।',
  nextStep: 'ଆସନ୍ତା ସପ୍ତାହରେ {nextAction} ଉପରେ focus କରନ୍ତୁ। ଛୋଟ, ଦୈନିକ, intentional।',
  close: 'ଏହା ଥିଲା ଆପଣଙ୍କ recap। ଫେରିଆସିବା ଅଭ୍ୟାସଟା ହିଁ ଆପଣଙ୍କ edge।',
}

const PA_SEGMENTS: SegmentMap = {
  openNamed: '{name}, ਤੁਹਾਡਾ Weekly Pebble Recap ਤਿਆਰ ਹੈ।',
  openGeneric: 'ਤੁਹਾਡਾ Weekly Pebble Recap ਤਿਆਰ ਹੈ।',
  headline: 'ਇਸ ਹਫ਼ਤੇ ਤੁਸੀਂ {days} active ਦਿਨਾਂ ਵਿੱਚ {solves} problems solve ਕੀਤੇ।',
  streakStrong: 'ਤੁਹਾਡਾ streak {streak} ਦਿਨਾਂ ' + 'ਤੇ ਹੈ — ਇਹ luck ਨਹੀਂ, rhythm ਹੈ।',
  streakGrowing: 'ਤੁਸੀਂ {streak}-day streak ' + 'ਤੇ ਹੋ। ਛੋਟੇ repeats, ਵੱਡਾ momentum।',
  streakReset: 'streak reset ਹੋਇਆ, ਪਰ ਇਸ ਹਫ਼ਤੇ ਦੀ effort ਫਿਰ ਵੀ ਕਾਫੀ ਕੀਮਤੀ ਹੈ।',
  strength: 'ਇਸ ਹਫ਼ਤੇ ਤੁਹਾਡਾ strongest signal: {strength}।',
  struggle: 'ਮੁੱਖ friction point ਸੀ {struggle}, ਪਰ ਤੁਸੀਂ ਵਾਪਸ ਆਉਂਦੇ ਰਹੇ।',
  interpretUp: 'Trend ਉੱਪਰ ਜਾ ਰਿਹਾ ਹੈ — attempts cleaner ਤੇ recovery better।',
  interpretStable: 'Trend steady ਹੈ। flashy ਨਹੀਂ, ਪਰ solid ਹੈ।',
  interpretDown: 'ਹਫ਼ਤਾ ਕੁਝ messy ਸੀ, ਪਰ recovery pattern ਹਾਲੇ ਵੀ ਮਜ਼ਬੂਤ ਹੋ ਰਹੀ ਹੈ।',
  humorLogic: 'Logic bugs ਇਸ ਹਫ਼ਤੇ villain ਸਨ, ਪਰ ਤੁਸੀਂ ਉਨ੍ਹਾਂ ਲਈ easy host ਨਹੀਂ ਸੀ।',
  humorRuntime: 'Runtime errors ਨੇ drama ਕੀਤਾ, ਤੁਸੀਂ calm ਹੋ ਕੇ flow ਬਦਲ ਦਿੱਤਾ।',
  humorReliance: 'ਇਸ ਹਫ਼ਤੇ Pebble Coach ਨੂੰ extra screen time ਮਿਲਿਆ — ਇਸਨੂੰ smart training ਸਮਝੋ।',
  nextStep: 'ਅਗਲੇ ਹਫ਼ਤੇ {nextAction} ' + 'ਤੇ focus ਕਰੋ। ਛੋਟਾ, ਰੋਜ਼ਾਨਾ, intentional।',
  close: 'ਇਹ ਸੀ ਤੁਹਾਡਾ recap। ਵਾਪਸ ਆਉਣ ਦੀ ਆਦਤ ਹੀ ਤੁਹਾਡੀ edge ਹੈ।',
}

const AS_SEGMENTS: SegmentMap = {
  openNamed: '{name}, আপোনাৰ Weekly Pebble Recap সাজু আছে।',
  openGeneric: 'আপোনাৰ Weekly Pebble Recap সাজু আছে।',
  headline: 'এই সপ্তাহত আপুনি {days} active দিনত {solves} problems solve কৰিছে।',
  streakStrong: 'আপোনাৰ streak {streak} দিন — এইটো luck নহয়, rhythm।',
  streakGrowing: 'আপুনি {streak}-day streak ত আছে। সৰু repeats, ডাঙৰ momentum।',
  streakReset: 'streak reset হলেও এই সপ্তাহৰ effort বহুত মূল্যবান।',
  strength: 'এই সপ্তাহত আপোনাৰ strongest signal: {strength}।',
  struggle: 'মুখ্য friction point আছিল {struggle}, তথাপি আপুনি ঘূৰি আহিলে।',
  interpretUp: 'Trend ওপৰলৈ গৈ আছে — attempts cleaner আৰু recovery better।',
  interpretStable: 'Trend steady। flashy নহয়, কিন্তু solid।',
  interpretDown: 'সপ্তাহটো অলপ messy আছিল, কিন্তু recovery pattern এতিয়াও শক্তিশালী হৈ আছে।',
  humorLogic: 'Logic bugs এই সপ্তাহত villain আছিল, কিন্তু আপুনি easy host নাছিল।',
  humorRuntime: 'Runtime errors এ drama কৰিলে, আপুনি শান্তে flow সলনি কৰিলে।',
  humorReliance: 'এই সপ্তাহত Pebble Coach এ extra screen time পালে — smart training বুলি ভাবক।',
  nextStep: 'আগত সপ্তাহত {nextAction} ওপৰত focus কৰক। সৰু, দৈনিক, intentional।',
  close: 'এইটোৱেই আপোনাৰ recap। পুনৰ আহি থকাৰ অভ্যাসেই আপোনাৰ edge।',
}

const SEGMENTS_BY_LANGUAGE: Record<AppLanguageCode, SegmentMap> = {
  en: EN_SEGMENTS,
  hi: HINDI_SEGMENTS,
  bn: BN_SEGMENTS,
  te: TE_SEGMENTS,
  mr: MR_SEGMENTS,
  ta: TA_SEGMENTS,
  ur: UR_SEGMENTS,
  gu: GU_SEGMENTS,
  kn: KN_SEGMENTS,
  ml: ML_SEGMENTS,
  or: OR_SEGMENTS,
  pa: PA_SEGMENTS,
  as: AS_SEGMENTS,
}

const STRENGTH_COPY: Record<AppLanguageCode, Record<'discipline' | 'recovery' | 'difficulty' | 'autonomy', string>> = {
  en: {
    discipline: 'you kept showing up on schedule',
    recovery: 'your recovery speed improved under pressure',
    difficulty: 'you traded volume for tougher wins',
    autonomy: 'you needed less external guidance in key moments',
  },
  hi: {
    discipline: 'आपने consistency के साथ वापस आना जारी रखा',
    recovery: 'pressure में भी आपकी recovery speed बेहतर हुई',
    difficulty: 'कम volume में भी आपने tougher wins लिए',
    autonomy: 'महत्वपूर्ण moments में guidance पर निर्भरता कम हुई',
  },
  bn: {
    discipline: 'আপনি নিয়মিতভাবে ফিরে এসেছেন',
    recovery: 'চাপের মধ্যেও recovery speed উন্নত হয়েছে',
    difficulty: 'কম সংখ্যায়ও আপনি tougher সমস্যা নিয়েছেন',
    autonomy: 'গুরুত্বপূর্ণ সময়ে guidance নির্ভরতা কমেছে',
  },
  te: {
    discipline: 'మీరు consistencyతో తిరిగి వస్తూనే ఉన్నారు',
    recovery: 'pressureలో కూడా recovery speed మెరుగైంది',
    difficulty: 'తక్కువ countలో కూడా tougher wins తీసుకున్నారు',
    autonomy: 'ముఖ్య సమయంలో guidance మీద ఆధారం తగ్గింది',
  },
  mr: {
    discipline: 'तुम्ही सातत्याने परत येत राहिलात',
    recovery: 'pressure मध्येही recovery speed सुधारली',
    difficulty: 'कमी संख्येत tougher wins घेतले',
    autonomy: 'महत्त्वाच्या वेळी guidance dependence कमी झाली',
  },
  ta: {
    discipline: 'நீங்கள் consistency உடன் தொடர்ந்து திரும்பி வந்தீர்கள்',
    recovery: 'pressure இருந்தும் recovery speed மேம்பட்டது',
    difficulty: 'குறைந்த எண்ணிக்கையிலும் tougher wins எடுத்தீர்கள்',
    autonomy: 'முக்கிய நேரங்களில் guidance மீது சார்பு குறைந்தது',
  },
  ur: {
    discipline: 'آپ مسلسل واپس آتے رہے',
    recovery: 'pressure میں بھی recovery speed بہتر ہوئی',
    difficulty: 'کم تعداد میں بھی tougher wins لیے',
    autonomy: 'اہم لمحات میں guidance پر انحصار کم ہوا',
  },
  gu: {
    discipline: 'તમે consistency સાથે પાછા ફરતા રહ્યાં',
    recovery: 'pressureમાં પણ recovery speed સુધરી',
    difficulty: 'ઓછી સંખ્યામાં tougher wins લીધા',
    autonomy: 'મહત્વના સમયે guidance dependence ઘટી',
  },
  kn: {
    discipline: 'ನೀವು ನಿರಂತರವಾಗಿ ಮತ್ತೆ ಬರುತ್ತಿದ್ದೀರಿ',
    recovery: 'pressure ನಲ್ಲೂ recovery speed ಸುಧಾರಿಸಿದೆ',
    difficulty: 'ಕಡಿಮೆ ಸಂಖ್ಯೆಯಲ್ಲೂ tougher wins ಪಡೆದಿರಿ',
    autonomy: 'ಮುಖ್ಯ ಕ್ಷಣಗಳಲ್ಲಿ guidance ಅವಲಂಬನೆ ಕಡಿಮೆಯಾಯಿತು',
  },
  ml: {
    discipline: 'നിങ്ങൾ സ്ഥിരമായി തിരിച്ചെത്തി',
    recovery: 'pressure ലും recovery speed മെച്ചപ്പെട്ടു',
    difficulty: 'കുറഞ്ഞ എണ്ണത്തിലും tougher wins നേടി',
    autonomy: 'പ്രധാന സമയങ്ങളിൽ guidance dependence കുറഞ്ഞു',
  },
  or: {
    discipline: 'ଆପଣ ସତତାରେ ପୁଣି ଫେରିଛନ୍ତି',
    recovery: 'pressure ମଧ୍ୟରେ recovery speed ଭଲ ହୋଇଛି',
    difficulty: 'କମ୍ ସଂଖ୍ୟାରେ ମଧ୍ୟ tougher wins ନେଇଛନ୍ତି',
    autonomy: 'ମୁଖ୍ୟ ସମୟରେ guidance dependence କମିଛି',
  },
  pa: {
    discipline: 'ਤੁਸੀਂ ਲਗਾਤਾਰ ਵਾਪਸ ਆਉਂਦੇ ਰਹੇ',
    recovery: 'pressure ਵਿੱਚ ਵੀ recovery speed ਸੁਧਰੀ',
    difficulty: 'ਘੱਟ ਗਿਣਤੀ ਵਿੱਚ ਵੀ tougher wins ਲਏ',
    autonomy: 'ਮੁੱਖ ਸਮਿਆਂ ਵਿੱਚ guidance dependence ਘਟੀ',
  },
  as: {
    discipline: 'আপুনি নিয়মিতভাৱে ঘূৰি আহিছে',
    recovery: 'pressure তেও recovery speed উন্নত হৈছে',
    difficulty: 'কম সংখ্যাতেও tougher wins লৈছে',
    autonomy: 'গুৰুত্বপূর্ণ সময়ত guidance dependence কমিছে',
  },
}

const STRUGGLE_LABELS: Record<AppLanguageCode, Record<string, string>> = {
  en: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  hi: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  bn: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  te: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  mr: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  ta: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  ur: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  gu: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  kn: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  ml: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  or: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  pa: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
  as: {
    syntax_error: 'syntax accuracy',
    runtime_error: 'runtime stability',
    wrong_answer: 'logic precision',
    time_limit: 'time complexity pressure',
    api_failure: 'platform/API interruptions',
  },
}

function sanitizeName(name: string | null | undefined) {
  if (!name) return ''
  const cleaned = name.replace(/[^\p{L}\p{N} _.-]/gu, '').trim()
  return cleaned.slice(0, 24)
}

function formatTemplate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return String(vars[key])
    }
    return ''
  })
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

function normalizePercent(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  if (value <= 1) return clamp(Math.round(value * 100), 0, 100)
  return clamp(Math.round(value), 0, 100)
}

function normalizeNumber(value: number | undefined, fallback = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return value
}

function pickVariant<T>(seed: number, rows: readonly T[]) {
  if (rows.length === 0) {
    throw new Error('Variant set is empty.')
  }
  return rows[Math.abs(seed) % rows.length]
}

function chooseTone(summary: RecapSummary) {
  const solves = normalizeNumber(summary.solvesLast7, 0)
  const passRateDelta = normalizeNumber(summary.passRateDelta, 0)
  const trend = summary.trendDirection
  const activity = normalizeNumber(summary.daysActiveLast7, 0)
  const streakDelta = normalizeNumber(summary.streakDelta, 0)

  if (trend === 'improving' && (solves >= 5 || passRateDelta >= 6)) {
    return 'celebratory' as const
  }
  if (trend === 'worsening' && activity >= 3) {
    return 'empathetic' as const
  }
  if (trend === 'worsening') {
    return 'reflective' as const
  }
  if (streakDelta > 0 || activity >= 5) {
    return 'determined' as const
  }
  return 'encouraging' as const
}

function chooseStrength(summary: RecapSummary): 'discipline' | 'recovery' | 'difficulty' | 'autonomy' {
  const activity = normalizeNumber(summary.daysActiveLast7, 0)
  const recoveryDelta = normalizeNumber(summary.avgRecoveryTimeDeltaSec, 0)
  const guidanceDelta = normalizeNumber(summary.guidanceRelianceDeltaPct, 0)
  const hardest = summary.hardestSolvedDifficulty

  if (hardest === 'hard' || hardest === 'medium') {
    return 'difficulty'
  }
  if (recoveryDelta < -8) {
    return 'recovery'
  }
  if (guidanceDelta < -6) {
    return 'autonomy'
  }
  if (activity >= 4) {
    return 'discipline'
  }
  return 'recovery'
}

function chooseHumor(summary: RecapSummary) {
  const struggle = summary.biggestStruggle ?? ''
  const guidance = normalizeNumber(summary.guidanceReliancePct, 0)
  const solves = normalizeNumber(summary.solvesLast7, 0)
  const eligible = solves >= 2
  if (!eligible) {
    return null
  }
  if (struggle === 'wrong_answer') {
    return 'humorLogic' as const
  }
  if (struggle === 'runtime_error') {
    return 'humorRuntime' as const
  }
  if (guidance >= 45) {
    return 'humorReliance' as const
  }
  return null
}

function chooseNextAction(summary: RecapSummary, lang: AppLanguageCode) {
  const track = (summary.trackLanguage ?? 'your selected').toUpperCase()
  const struggle = summary.biggestStruggle
  const activity = normalizeNumber(summary.daysActiveLast7, 0)
  const solves = normalizeNumber(summary.solvesLast7, 0)

  if (activity <= 2 || solves <= 1) {
    if (lang === 'en') return `one ${track} problem on at least 4 days`
    if (lang === 'hi') return `कम से कम 4 दिनों में एक ${track} problem`
    if (lang === 'bn') return `কমপক্ষে ৪ দিনে একটি ${track} problem`
    return `at least 4 days of one ${track} problem`
  }
  if (struggle === 'syntax_error') {
    if (lang === 'en') return 'slowing your first run by 30 seconds to catch syntax slips early'
    if (lang === 'hi') return 'पहला run 30 सेकंड धीमा करके syntax slips जल्दी पकड़ना'
    if (lang === 'bn') return 'প্রথম run ৩০ সেকেন্ড ধীরে করে syntax slip আগে ধরা'
    return 'catching syntax slips before first run'
  }
  if (struggle === 'runtime_error') {
    if (lang === 'en') return 'running one edge-case checklist before every submit'
    if (lang === 'hi') return 'हर submit से पहले एक edge-case checklist चलाना'
    if (lang === 'bn') return 'প্রতি submit-এর আগে একটি edge-case checklist চালানো'
    return 'one edge-case checklist before each submit'
  }
  if (lang === 'en') return 'one tougher problem than your comfort zone'
  if (lang === 'hi') return 'comfort zone से एक स्तर कठिन problem'
  if (lang === 'bn') return 'comfort zone-এর চেয়ে এক ধাপ কঠিন problem'
  return 'one problem just above your comfort zone'
}

function chooseInterpretationKey(summary: RecapSummary) {
  if (summary.trendDirection === 'improving') return 'interpretUp' as const
  if (summary.trendDirection === 'worsening') return 'interpretDown' as const
  return 'interpretStable' as const
}

function chooseStreakKey(summary: RecapSummary) {
  const streak = normalizeNumber(summary.streakDays, 0)
  if (streak >= 7) return 'streakStrong' as const
  if (streak >= 2) return 'streakGrowing' as const
  return 'streakReset' as const
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function buildRecapNarrative(summary: RecapSummary): RecapNarrative {
  const appLanguage = normalizeAppLanguageCode(summary.appLanguage)
  const copy = SEGMENTS_BY_LANGUAGE[appLanguage]
  const userName = sanitizeName(summary.userName)
  const tone = chooseTone(summary)
  const strengthKey = chooseStrength(summary)
  const humorKey = chooseHumor(summary)
  const interpretationKey = chooseInterpretationKey(summary)
  const streakKey = chooseStreakKey(summary)

  const solves = clamp(Math.round(normalizeNumber(summary.solvesLast7, 0)), 0, 999)
  const activeDays = clamp(Math.round(normalizeNumber(summary.daysActiveLast7, 0)), 0, 7)
  const streakDays = clamp(Math.round(normalizeNumber(summary.streakDays, 0)), 0, 999)
  const passRate = normalizePercent(summary.passRateLast7)
  const passRateDelta = normalizeNumber(summary.passRateDelta, 0)
  const recoverySec = Math.max(0, Math.round(normalizeNumber(summary.avgRecoveryTimeSec, 0)))
  const recoveryDelta = normalizeNumber(summary.avgRecoveryTimeDeltaSec, 0)
  const guidancePct = normalizePercent(summary.guidanceReliancePct)
  const struggleLabel = summary.biggestStruggle
    ? STRUGGLE_LABELS[appLanguage][summary.biggestStruggle] ?? summary.biggestStruggle
    : appLanguage === 'en'
      ? 'consistency under pressure'
      : appLanguage === 'hi'
        ? 'consistency under pressure'
        : 'consistency under pressure'

  const strengthLine = STRENGTH_COPY[appLanguage][strengthKey]
  const nextAction = chooseNextAction(summary, appLanguage)
  const seed = solves * 31 + activeDays * 17 + streakDays * 13 + Math.round(guidancePct)

  const lines: string[] = []
  lines.push(
    formatTemplate(userName ? copy.openNamed : copy.openGeneric, {
      name: userName,
    }),
  )
  lines.push(
    formatTemplate(copy.headline, {
      solves,
      days: activeDays,
    }),
  )
  lines.push(
    formatTemplate(copy[streakKey], {
      streak: streakDays,
    }),
  )
  lines.push(
    formatTemplate(copy.strength, {
      strength: strengthLine,
    }),
  )
  lines.push(
    formatTemplate(copy.struggle, {
      struggle: struggleLabel,
    }),
  )
  lines.push(copy[interpretationKey])

  if (humorKey) {
    lines.push(copy[humorKey])
  }

  // Extra personalization sentence chosen deterministically to reduce repetition.
  const personalizationRows = [
    appLanguage === 'en'
      ? `Pass rate this week was ${passRate}%, and average recovery settled around ${recoverySec} seconds.`
      : appLanguage === 'hi'
        ? `इस हफ्ते pass rate ${passRate}% रहा, और average recovery लगभग ${recoverySec} सेकंड रही।`
        : appLanguage === 'bn'
          ? `এই সপ্তাহে pass rate ছিল ${passRate}% এবং average recovery প্রায় ${recoverySec} সেকেন্ড।`
          : `Pass rate ${passRate}% and recovery around ${recoverySec} seconds this week.`,
    appLanguage === 'en'
      ? `Compared to last week, pass-rate moved ${passRateDelta >= 0 ? 'up' : 'down'} by ${Math.abs(Math.round(passRateDelta))} points.`
      : appLanguage === 'hi'
        ? `पिछले हफ्ते की तुलना में pass-rate ${Math.abs(Math.round(passRateDelta))} points ${passRateDelta >= 0 ? 'ऊपर' : 'नीचे'} गया।`
        : appLanguage === 'bn'
          ? `গত সপ্তাহের তুলনায় pass-rate ${Math.abs(Math.round(passRateDelta))} points ${passRateDelta >= 0 ? 'উপরে' : 'নিচে'} গেছে।`
          : `Pass-rate moved ${passRateDelta >= 0 ? 'up' : 'down'} by ${Math.abs(Math.round(passRateDelta))} points.`,
    appLanguage === 'en'
      ? `Guidance reliance sat near ${guidancePct}%, while recovery delta was ${Math.round(recoveryDelta)} seconds versus last week.`
      : appLanguage === 'hi'
        ? `guidance reliance लगभग ${guidancePct}% रही, और recovery delta पिछले हफ्ते से ${Math.round(recoveryDelta)} सेकंड रहा।`
        : appLanguage === 'bn'
          ? `guidance reliance ছিল প্রায় ${guidancePct}%, আর recovery delta ছিল ${Math.round(recoveryDelta)} সেকেন্ড।`
          : `Guidance reliance was ${guidancePct}%, recovery delta ${Math.round(recoveryDelta)} seconds.`,
  ]
  lines.push(pickVariant(seed, personalizationRows))

  lines.push(
    formatTemplate(copy.nextStep, {
      nextAction,
    }),
  )
  lines.push(copy.close)

  const script = normalizeWhitespace(lines.join(' '))
  return {
    script,
    tone,
    usedHumor: Boolean(humorKey),
  }
}

/**
 * Backward-compatible helper.
 */
export function buildRecapScript(summary: RecapSummary): string {
  return buildRecapNarrative(summary).script
}

/**
 * Basic safety filter for recap scripts.
 */
export function isScriptSafe(script: string): boolean {
  if (/BEGIN (RSA|EC|PRIVATE|CERTIFICATE)|AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{32}/.test(script)) {
    return false
  }
  if (/```|def |function |import |class |#!\//.test(script)) {
    return false
  }
  if (script.length > 2600) {
    return false
  }
  return true
}
