/**
 * translate.js — SignVision v6
 * Language Translation, Auto-Correct & TTS
 *
 * Translation engine: Google Translate (unofficial client=gtx endpoint)
 * — No API key required
 * — Excellent Indian language support (Hindi, Bengali, Tamil, Telugu,
 *   Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, etc.)
 * — Source is always English (en)
 */
/**
 * translate.js -- SignVision v7
 * Translation engine: Google Translate (unofficial client=gtx endpoint)
 * - No API key required
 * - Excellent Indian language support
 * - Source is always English
 */

// Auto-correct dictionary
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

export function autoCorrect(text) {
  if (!text || !text.trim()) return { corrected: text, changed: false };
  const tokens = text.split(/([\s]+)/);
  let changed = false;
  const corrected = tokens.map(token => {
    if (/^\s+$/.test(token)) return token;
    const prefix = token.match(/^[^a-zA-Z']*/)?.[0] || '';
    const suffix = token.match(/[^a-zA-Z']*$/)?.[0] || '';
    const core   = token.slice(prefix.length, token.length - suffix.length || undefined);
    const lower  = core.toLowerCase();
    if (CORRECTIONS[lower]) {
      changed = true;
      const r = CORRECTIONS[lower];
      if (core === core.toUpperCase() && core.length > 1) return prefix + r.toUpperCase() + suffix;
      if (core[0] === core[0].toUpperCase()) return prefix + r.charAt(0).toUpperCase() + r.slice(1) + suffix;
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

export function suggestCorrection(text) {
  if (!text || text.trim().length < 3) return null;
  const { corrected, changed } = autoCorrect(text);
  if (!changed) return null;
  // Only show if something real changed beyond capitalisation
  if (corrected.toLowerCase() === text.toLowerCase()) return null;
  return corrected !== text ? corrected : null;
}

// Google Translate language code map
const GOOGLE_LANG_MAP = {
  'as':'as','af':'af','ar':'ar','bn':'bn',
  'zh-CN':'zh-CN','zh-TW':'zh-TW','cs':'cs','da':'da','nl':'nl',
  'fil':'tl','fi':'fi','fr':'fr','de':'de','el':'el',
  'gu':'gu','he':'iw','hi':'hi','hu':'hu','id':'id',
  'it':'it','ja':'ja','kn':'kn','ko':'ko','la':'la',
  'ml':'ml','ms':'ms','mr':'mr','mni-Mtei':'mni-Mtei',
  'ne':'ne','no':'no','or':'or','fa':'fa','pl':'pl',
  'pt':'pt','pa':'pa','ro':'ro','ru':'ru','sa':'sa',
  'es':'es','sw':'sw','sv':'sv','ta':'ta','te':'te',
  'th':'th','tr':'tr','uk':'uk','ur':'ur','vi':'vi',
};

export async function translateText(text, targetLang) {
  if (!text || !text.trim()) throw new Error('No text to translate');
  if (text.length > 5000) throw new Error('Text exceeds 5000 character limit');
  const tgt = GOOGLE_LANG_MAP[targetLang] || targetLang;
  if (tgt === 'en') return { translation: text };
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tgt}&dt=t&q=${encodeURIComponent(text.trim())}`;
  let res;
  try { res = await fetch(url); } catch { throw new Error('Network error - please check your connection.'); }
  if (!res.ok) throw new Error(`Translation service returned ${res.status}. Please try again.`);
  let data;
  try { data = await res.json(); } catch { throw new Error('Unexpected response from translation service.'); }
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('Unexpected response format.');
  const translation = data[0].filter(seg => Array.isArray(seg) && seg[0]).map(seg => seg[0]).join('');
  if (!translation) throw new Error('Empty translation response. Please try again.');
  return { translation };
}

// TTS locale map
const LANG_LOCALE_MAP = {
  'as':    { locale:'as-IN',  name:'Assamese',          fallback:'hi-IN', noNativeVoice:true },
  'af':    { locale:'af-ZA',  name:'Afrikaans' },
  'ar':    { locale:'ar-SA',  name:'Arabic' },
  'bn':    { locale:'bn-IN',  name:'Bengali',           fallback:'hi-IN' },
  'zh-CN': { locale:'zh-CN',  name:'Chinese (Simplified)' },
  'zh-TW': { locale:'zh-TW',  name:'Chinese (Traditional)' },
  'cs':    { locale:'cs-CZ',  name:'Czech' },
  'da':    { locale:'da-DK',  name:'Danish' },
  'nl':    { locale:'nl-NL',  name:'Dutch' },
  'fil':   { locale:'fil-PH', name:'Filipino',          fallback:'en-US' },
  'fi':    { locale:'fi-FI',  name:'Finnish' },
  'fr':    { locale:'fr-FR',  name:'French' },
  'de':    { locale:'de-DE',  name:'German' },
  'el':    { locale:'el-GR',  name:'Greek' },
  'gu':    { locale:'gu-IN',  name:'Gujarati',          fallback:'hi-IN' },
  'he':    { locale:'he-IL',  name:'Hebrew' },
  'hi':    { locale:'hi-IN',  name:'Hindi' },
  'hu':    { locale:'hu-HU',  name:'Hungarian' },
  'id':    { locale:'id-ID',  name:'Indonesian' },
  'it':    { locale:'it-IT',  name:'Italian' },
  'ja':    { locale:'ja-JP',  name:'Japanese' },
  'kn':    { locale:'kn-IN',  name:'Kannada',           fallback:'hi-IN' },
  'ko':    { locale:'ko-KR',  name:'Korean' },
  'la':    { locale:'la',     name:'Latin',             fallback:'it-IT' },
  'ml':    { locale:'ml-IN',  name:'Malayalam',         fallback:'hi-IN' },
  'ms':    { locale:'ms-MY',  name:'Malay',             fallback:'id-ID' },
  'mr':    { locale:'mr-IN',  name:'Marathi',           fallback:'hi-IN' },
  'mni-Mtei': { locale:'mni-IN', name:'Meitei (Manipuri)', fallback:'hi-IN', noNativeVoice:true },
  'ne':    { locale:'ne-NP',  name:'Nepali',            fallback:'hi-IN' },
  'no':    { locale:'nb-NO',  name:'Norwegian' },
  'or':    { locale:'or-IN',  name:'Odia',              fallback:'hi-IN', noNativeVoice:true },
  'fa':    { locale:'fa-IR',  name:'Persian',           fallback:'ar-SA' },
  'pl':    { locale:'pl-PL',  name:'Polish' },
  'pt':    { locale:'pt-PT',  name:'Portuguese' },
  'pa':    { locale:'pa-IN',  name:'Punjabi',           fallback:'hi-IN' },
  'ro':    { locale:'ro-RO',  name:'Romanian' },
  'ru':    { locale:'ru-RU',  name:'Russian' },
  'sa':    { locale:'sa-IN',  name:'Sanskrit',          fallback:'hi-IN', noNativeVoice:true },
  'es':    { locale:'es-ES',  name:'Spanish' },
  'sw':    { locale:'sw-KE',  name:'Swahili',           fallback:'en-US' },
  'sv':    { locale:'sv-SE',  name:'Swedish' },
  'ta':    { locale:'ta-IN',  name:'Tamil',             fallback:'hi-IN' },
  'te':    { locale:'te-IN',  name:'Telugu',            fallback:'hi-IN' },
  'th':    { locale:'th-TH',  name:'Thai' },
  'tr':    { locale:'tr-TR',  name:'Turkish' },
  'uk':    { locale:'uk-UA',  name:'Ukrainian',         fallback:'ru-RU' },
  'ur':    { locale:'ur-PK',  name:'Urdu',              fallback:'ar-SA' },
  'vi':    { locale:'vi-VN',  name:'Vietnamese' },
};

function getVoiceForLang(langCode) {
  const voices = window.speechSynthesis?.getVoices() || [];
  const entry  = LANG_LOCALE_MAP[langCode] || { locale: langCode, name: langCode };
  const { locale, fallback, name } = entry;
  function findVoice(tag) {
    if (!tag) return null;
    const primary = tag.split('-')[0].toLowerCase();
    return voices.find(v => v.lang.toLowerCase() === tag.toLowerCase())
        || voices.find(v => v.lang.toLowerCase().startsWith(primary));
  }
  let voice = findVoice(locale);
  if (voice) return { voice, locale, usedFallback: false, langName: name };
  if (fallback) { voice = findVoice(fallback); if (voice) return { voice, locale: fallback, usedFallback: true, langName: name }; }
  voice = findVoice('en-US') || findVoice('en');
  if (voice) return { voice, locale: 'en-US', usedFallback: true, langName: name };
  if (voices.length) return { voice: voices[0], locale: voices[0].lang, usedFallback: true, langName: name };
  return null;
}

export function speakText(text, langCode = 'en', onWarning = null) {
  if (!window.speechSynthesis) { onWarning?.('Text-to-speech is not supported in your browser.'); return; }
  if (!text?.trim()) return;
  window.speechSynthesis.cancel();
  function doSpeak() {
    const result = getVoiceForLang(langCode);
    if (!result) { onWarning?.('No text-to-speech voices available on this device.'); return; }
    const { voice, usedFallback, langName } = result;
    const entry = LANG_LOCALE_MAP[langCode];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice; utterance.lang = voice.lang;
    utterance.rate = 0.90; utterance.pitch = 1.0;
    if (usedFallback && onWarning) {
      if (entry?.noNativeVoice) onWarning(`"${langName}" voice is not available in your browser. Speaking with closest available voice.`);
      else onWarning(`"${langName}" voice not found on this device. Using closest available voice.`);
    }
    window.speechSynthesis.speak(utterance);
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; doSpeak(); };
    setTimeout(doSpeak, 300);
  } else { doSpeak(); }
}

export function initVoices() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; window.speechSynthesis.getVoices(); };
}

