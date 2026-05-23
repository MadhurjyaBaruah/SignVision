/**
 * translate.js — SignVision v5
 * Language Translation, Auto-Correct & TTS
 *
 * Key fix: speakText() now uses a comprehensive BCP-47 locale map,
 * gracefully falls back when a language has no installed voice,
 * and shows a visible warning instead of silently failing.
 */

// ── Auto-correct dictionary ───────────────────────────────────
const CORRECTIONS = {
  'teh':'the','hte':'the','thw':'the','adn':'and','nad':'and',
  'yuo':'you','ot':'to','fo':'of','si':'is','ti':'it','ni':'in',
  'dont':"don't",'cant':"can't",'wont':"won't",'im':"I'm",
  'ive':"I've",'youre':"you're",'theyre':"they're",
  'isnt':"isn't",'arent':"aren't",'wasnt':"wasn't",
  'werent':"weren't",'havent':"haven't",'hasnt':"hasn't",
  'hadnt':"hadn't",'didnt':"didn't",'doesnt':"doesn't",
  'couldnt':"couldn't",'wouldnt':"wouldn't",'shouldnt':"shouldn't",
  'alot':'a lot','definately':'definitely','occured':'occurred',
  'seperate':'separate','recieve':'receive','beleive':'believe',
  'freind':'friend','wierd':'weird','accomodate':'accommodate',
  'wich':'which','becuase':'because','untill':'until','truely':'truly',
  'noone':'no one','goverment':'government','sory':'sorry',
  'sorrey':'sorry','helo':'hello','helllo':'hello','thnak':'thank',
  'thankyou':'thank you','thnks':'thanks','pleas':'please',
  'pleese':'please','plz':'please','wrold':'world','wolrd':'world',
  'langauge':'language','lagnuage':'language','languge':'language',
  'allright':'all right','wihtout':'without','insted':'instead',
  'aboute':'about','abotu':'about','reccomend':'recommend',
  'occassion':'occasion','accomodation':'accommodation',
  'embarass':'embarrass','necesary':'necessary',
  'toghether':'together','togther':'together',
  'mornig':'morning','evning':'evening','nigth':'night',
};

/**
 * autoCorrect(text)
 * Returns { corrected: string, changed: boolean }
 */
export function autoCorrect(text) {
  if (!text || !text.trim()) return { corrected: text, changed: false };

  const tokens = text.split(/([\s]+)/);
  let changed  = false;

  const corrected = tokens.map(token => {
    if (/^\s+$/.test(token)) return token;
    const prefix = token.match(/^[^a-zA-Z']*/)?.[0] || '';
    const suffix = token.match(/[^a-zA-Z']*$/)?.[0] || '';
    const core   = token.slice(prefix.length, token.length - suffix.length || undefined);
    const lower  = core.toLowerCase();

    if (CORRECTIONS[lower]) {
      changed = true;
      const r = CORRECTIONS[lower];
      if (core === core.toUpperCase() && core.length > 1)
        return prefix + r.toUpperCase() + suffix;
      if (core[0] === core[0].toUpperCase())
        return prefix + r.charAt(0).toUpperCase() + r.slice(1) + suffix;
      return prefix + r + suffix;
    }
    if (core === 'i') { changed = true; return prefix + 'I' + suffix; }
    return token;
  }).join('');

  const finalised = corrected
    .replace(/\s{2,}/g, ' ')
    .replace(/([.!?]\s+)([a-z])/g, (_, p, c) => { changed = true; return p + c.toUpperCase(); })
    .replace(/^([a-z])/, (_, c) => { changed = true; return c.toUpperCase(); });

  return { corrected: finalised, changed };
}

/**
 * suggestCorrection(text)
 * Returns corrected string or null.
 */
export function suggestCorrection(text) {
  if (!text || text.trim().length < 3) return null;
  const { corrected, changed } = autoCorrect(text);
  if (!changed) {
    const words = text.toLowerCase().trim().split(/\s+/);
    const hasBad = words.some(w => {
      const c = w.replace(/[^a-z']/g, '');
      return c.length > 1 && CORRECTIONS[c];
    });
    if (!hasBad) return null;
  }
  return corrected !== text ? corrected : null;
}

/**
 * translateText(text, sourceLang, targetLang)
 * Calls MyMemory free translation API.
 */
export async function translateText(text, sourceLang, targetLang) {
  if (!text || !text.trim()) throw new Error('No text to translate');
  if (text.length > 5000) throw new Error('Text exceeds 5000 character limit');

  const src = sourceLang === 'auto' ? 'en' : sourceLang;
  if (src === targetLang) return { translation: text };

  const encoded  = encodeURIComponent(text.trim());
  const langPair = `${src}|${targetLang}`;
  const url      = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${langPair}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation service returned ${res.status}`);

  const data = await res.json();
  if (data.responseStatus !== 200) {
    const msg = data.responseDetails || 'Translation failed';
    throw new Error(
      msg.includes('MYMEMORY WARNING')
        ? 'Daily translation limit reached. Please try again tomorrow.'
        : msg
    );
  }

  const translation = data.responseData?.translatedText;
  if (!translation) throw new Error('Empty translation response');
  return { translation };
}

// ── BCP-47 locale map ─────────────────────────────────────────
// Maps our dropdown values → full BCP-47 tags that browsers recognise.
// Languages with no reliable browser TTS voice are marked with
// preferredFallback so we can warn the user gracefully.
const LANG_LOCALE_MAP = {
  'en':    { locale: 'en-US',  name: 'English' },
  'hi':    { locale: 'hi-IN',  name: 'Hindi' },
  'es':    { locale: 'es-ES',  name: 'Spanish' },
  'fr':    { locale: 'fr-FR',  name: 'French' },
  'de':    { locale: 'de-DE',  name: 'German' },
  'it':    { locale: 'it-IT',  name: 'Italian' },
  'pt':    { locale: 'pt-PT',  name: 'Portuguese' },
  'ru':    { locale: 'ru-RU',  name: 'Russian' },
  'ja':    { locale: 'ja-JP',  name: 'Japanese' },
  'ko':    { locale: 'ko-KR',  name: 'Korean' },
  'zh-CN': { locale: 'zh-CN',  name: 'Chinese (Simplified)' },
  'zh-TW': { locale: 'zh-TW',  name: 'Chinese (Traditional)' },
  'ar':    { locale: 'ar-SA',  name: 'Arabic' },
  'bn':    { locale: 'bn-IN',  name: 'Bengali', fallback: 'hi-IN' },
  'ta':    { locale: 'ta-IN',  name: 'Tamil',   fallback: 'hi-IN' },
  'te':    { locale: 'te-IN',  name: 'Telugu',  fallback: 'hi-IN' },
  'mr':    { locale: 'mr-IN',  name: 'Marathi', fallback: 'hi-IN' },
  'gu':    { locale: 'gu-IN',  name: 'Gujarati',fallback: 'hi-IN' },
  'kn':    { locale: 'kn-IN',  name: 'Kannada', fallback: 'hi-IN' },
  'ml':    { locale: 'ml-IN',  name: 'Malayalam',fallback: 'hi-IN' },
  'pa':    { locale: 'pa-IN',  name: 'Punjabi', fallback: 'hi-IN' },
  'ur':    { locale: 'ur-PK',  name: 'Urdu',    fallback: 'ar-SA' },
  'ne':    { locale: 'ne-NP',  name: 'Nepali',  fallback: 'hi-IN' },
  'th':    { locale: 'th-TH',  name: 'Thai' },
  'vi':    { locale: 'vi-VN',  name: 'Vietnamese' },
  'id':    { locale: 'id-ID',  name: 'Indonesian' },
  'ms':    { locale: 'ms-MY',  name: 'Malay',   fallback: 'id-ID' },
  'tr':    { locale: 'tr-TR',  name: 'Turkish' },
  'pl':    { locale: 'pl-PL',  name: 'Polish' },
  'nl':    { locale: 'nl-NL',  name: 'Dutch' },
  'sv':    { locale: 'sv-SE',  name: 'Swedish' },
  'da':    { locale: 'da-DK',  name: 'Danish' },
  'no':    { locale: 'nb-NO',  name: 'Norwegian' },
  'fi':    { locale: 'fi-FI',  name: 'Finnish' },
  'el':    { locale: 'el-GR',  name: 'Greek' },
  'cs':    { locale: 'cs-CZ',  name: 'Czech' },
  'ro':    { locale: 'ro-RO',  name: 'Romanian' },
  'hu':    { locale: 'hu-HU',  name: 'Hungarian' },
  'uk':    { locale: 'uk-UA',  name: 'Ukrainian', fallback: 'ru-RU' },
  'he':    { locale: 'he-IL',  name: 'Hebrew' },
  'fa':    { locale: 'fa-IR',  name: 'Persian',  fallback: 'ar-SA' },
  'sw':    { locale: 'sw-KE',  name: 'Swahili',  fallback: 'en-US' },
  'af':    { locale: 'af-ZA',  name: 'Afrikaans' },
  'fil':   { locale: 'fil-PH', name: 'Filipino', fallback: 'en-US' },
  'la':    { locale: 'la',     name: 'Latin',    fallback: 'it-IT' },
  // Assamese — no browser TTS engine ships this voice.
  // We speak the translated text using Hindi voice (closest Indic voice)
  // and inform the user.
  'as':    { locale: 'as-IN',  name: 'Assamese', fallback: 'hi-IN', noNativeVoice: true },
};

/**
 * getVoiceForLang(langCode)
 * Returns { voice, locale, usedFallback, langName } or null if TTS unavailable.
 *
 * Strategy (in order):
 *  1. Exact locale match (e.g. "hi-IN")
 *  2. Language prefix match (e.g. "hi")
 *  3. Defined fallback locale (e.g. "hi-IN" for Assamese)
 *  4. English fallback
 *  5. Any available voice
 */
function getVoiceForLang(langCode) {
  const voices  = window.speechSynthesis?.getVoices() || [];
  const entry   = LANG_LOCALE_MAP[langCode] || { locale: langCode, name: langCode };
  const { locale, fallback, name } = entry;

  function findVoice(tag) {
    if (!tag) return null;
    const primary  = tag.split('-')[0].toLowerCase();
    return voices.find(v => v.lang.toLowerCase() === tag.toLowerCase())
        || voices.find(v => v.lang.toLowerCase().startsWith(primary));
  }

  // 1. Try exact locale
  let voice = findVoice(locale);
  if (voice) return { voice, locale, usedFallback: false, langName: name };

  // 2. Try defined fallback
  if (fallback) {
    voice = findVoice(fallback);
    if (voice) return { voice, locale: fallback, usedFallback: true, langName: name };
  }

  // 3. English
  voice = findVoice('en-US') || findVoice('en');
  if (voice) return { voice, locale: 'en-US', usedFallback: true, langName: name };

  // 4. Any voice at all
  if (voices.length) return { voice: voices[0], locale: voices[0].lang, usedFallback: true, langName: name };

  return null;
}

/**
 * speakText(text, langCode, onFallbackWarning?)
 *
 * Speaks text in the best available voice for langCode.
 *
 * @param {string}   text
 * @param {string}   langCode    — dropdown value (e.g. 'as', 'hi', 'es')
 * @param {function} [onWarning] — called with a message if a fallback voice is used
 *                                 or if TTS is completely unavailable.
 */
export function speakText(text, langCode = 'en', onWarning = null) {
  if (!window.speechSynthesis) {
    onWarning?.('Text-to-speech is not supported in your browser.');
    return;
  }
  if (!text?.trim()) return;

  window.speechSynthesis.cancel();

  // Voices may not be loaded yet — retry once after short delay
  function doSpeak() {
    const result = getVoiceForLang(langCode);

    if (!result) {
      onWarning?.('No text-to-speech voices are available on this device.');
      return;
    }

    const { voice, usedFallback, langName } = result;
    const entry = LANG_LOCALE_MAP[langCode];

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang  = voice.lang;
    utterance.rate  = 0.90;
    utterance.pitch = 1.0;

    // Warn when using fallback (especially for Assamese + other Indic scripts)
    if (usedFallback && onWarning) {
      if (entry?.noNativeVoice) {
        onWarning(`"${langName}" voice is not available in your browser. Speaking with the closest available voice. For best results install ${langName} TTS in your OS language settings.`);
      } else {
        onWarning(`"${langName}" voice not found on this device. Using closest available voice.`);
      }
    }

    window.speechSynthesis.speak(utterance);
  }

  // If voices aren't loaded yet, wait for them
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    // One-shot listener — fires once voices load
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
    // Also try after 300ms in case onvoiceschanged doesn't fire (some browsers)
    setTimeout(doSpeak, 300);
  } else {
    doSpeak();
  }
}

/**
 * initVoices()
 * Call once at app start to pre-warm the voice list.
 */
export function initVoices() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.onvoiceschanged = null;
    window.speechSynthesis.getVoices(); // cache them
  };
}
