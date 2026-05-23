/**
 * dictionary.js — SignVision v4
 * Smart Word Validation, Fuzzy Correction & Sentence Validation
 */

// ── Comprehensive word list ───────────────────────────────────
const WORD_LIST = new Set([
  // Single letters (always valid in ASL context)
  'a','b','c','d','e','f','g','h','i','j','k','l','m',
  'n','o','p','q','r','s','t','u','v','w','x','y','z',
  // Common 2-letter
  'am','an','as','at','be','by','do','go','he','if','in',
  'is','it','me','my','no','of','on','or','so','to','up',
  'us','we','ok','hi','mr','ms','dr','vs','oh','ah','uh',
  // 3-letter
  'act','add','age','ago','aid','aim','air','all','and','any',
  'arm','art','ask','bad','bag','bar','bed','big','bit','box',
  'boy','but','buy','can','car','cat','cry','cup','cut','day',
  'did','die','dog','dry','due','ear','eat','end','eye','far',
  'few','fly','for','fun','get','god','got','gun','guy','had',
  'has','hat','her','him','his','hit','hot','how','ice','its',
  'job','joy','key','kid','law','lay','led','leg','let','lie',
  'lot','low','man','map','may','men','met','mix','mom','mud',
  'net','new','nor','not','now','nut','odd','off','oil','old',
  'one','our','out','own','pay','per','pet','pig','pin','pit',
  'pop','pot','pro','put','ran','raw','red','rid','run','sad',
  'sat','say','sea','set','she','sir','sit','six','sky','son',
  'sun','tax','tea','ten','the','tie','tip','top','try','two',
  'use','van','war','was','way','who','why','win','won','yes',
  'yet','you','zoo','ago','app','ate','awe','axe','bay','bee',
  'bow','bud','bug','bus','cab','cub','cue','dew','dip','dot',
  'dug','duo','ego','elf','elm','emu','era','eve','ew','fad',
  'fan','fat','fax','fed','fee','few','fig','fin','fit','fix',
  'fog','foe','fro','fry','fur','gal','gap','gas','gel','gem',
  'gin','gnu','gut','gym','hack','hay','hen','hex','hid','him',
  'hip','his','hob','hog','hop','hub','hug','hum','hun','hut',
  'imp','inn','ion','ivy','jab','jag','jam','jar','jaw','jay',
  'jet','jig','jot','jug','jut','keg','ken','kin','kit','knob',
  'lab','lad','lag','lap','lax','lea','lip','lit','lob','log',
  'lop','lug','mad','mar','mat','mob','mod','mop','mow','nab',
  'nag','nap','nit','nob','nod','nun','oar','odd','ode','ore',
  'orb','owl','paw','pay','peg','pen','pew','pie','pod','pow',
  'pox','pun','pup','pus','rag','rap','rat','rib','rim','rip',
  'rob','rod','rot','row','rub','rug','rum','rut','rye','sag',
  'sap','sow','soy','spa','spy','sty','sub','sue','sup','tab',
  'tan','tap','tar','tat','tic','tin','tip','toe','ton','too',
  'toy','tub','tug','tun','urn','vat','via','vim','vow','wad',
  'wag','wed','wee','wet','wig','wit','woe','wok','woo','wow',
  'yak','yam','yap','yew','yon','zap','zen','zip','zit',
  // 4-letter
  'able','also','area','army','away','baby','back','ball','band',
  'bank','base','bath','bear','beat','been','bell','best','bill',
  'bird','blow','blue','boat','body','bold','bone','book','born',
  'both','bulk','burn','call','calm','came','card','care','case',
  'cash','cast','cell','chat','chip','city','clap','clay','clip',
  'club','coal','coat','code','cold','come','cool','cope','copy',
  'core','cost','crew','crop','cure','dark','data','date','dawn',
  'dead','deal','dear','deck','deep','deny','desk','dial','dirt',
  'dish','disk','done','door','dose','down','draw','drop','drug',
  'drum','dual','dull','dump','dust','duty','each','earn','ease',
  'east','edge','else','even','ever','evil','exam','face','fact',
  'fail','fair','fake','fall','fame','farm','fast','fate','feel',
  'feet','fell','felt','file','fill','film','find','fine','fire',
  'firm','fish','fist','five','flag','flat','flew','flip','flow',
  'foam','fold','folk','fond','font','food','foot','ford','form',
  'fort','four','free','from','fuel','full','fund','fuse','gain',
  'game','gang','gave','gear','gift','girl','give','glad','glow',
  'glue','goal','gold','golf','gone','good','grab','grey','grid',
  'grin','grip','grit','grow','gulf','gust','half','hall','hand',
  'hang','hard','harm','hate','have','head','heal','heap','hear',
  'heat','heel','held','help','here','hero','hide','high','hill',
  'hint','hire','hold','hole','holy','home','hook','hope','horn',
  'host','hour','huge','hunt','hurt','icon','idea','idle','inch',
  'info','into','iron','isle','item','jack','jail','join','joke',
  'jump','just','keep','kill','kind','king','knee','knew','lack',
  'laid','lake','lamp','land','lane','last','late','lead','leaf',
  'leak','lean','left','lend','life','lift','like','lime','line',
  'link','list','live','load','lock','logo','lone','long','look',
  'loop','loss','lost','love','luck','made','mail','main','make',
  'male','mall','mark','mask','mass','math','meal','mean','meet',
  'melt','memo','menu','mere','mesh','mess','mild','mile','milk',
  'mind','mine','miss','mode','more','most','move','much','must',
  'name','navy','near','neck','need','next','nice','nine','none',
  'note','null','oath','once','only','open','oral','over','pace',
  'pack','page','paid','pair','palm','park','part','pass','past',
  'path','peak','pick','pile','pink','pipe','plan','play','plot',
  'plug','plus','poem','poll','pond','pool','poor','port','pose',
  'post','pour','prey','pull','pump','pure','push','race','rage',
  'rain','rake','ramp','rang','rank','rate','read','real','rear',
  'rest','rice','rich','ride','ring','riot','rise','risk','road',
  'rock','role','roll','roof','room','root','rope','rose','rule',
  'rush','rust','safe','sail','sake','sale','salt','same','sand',
  'sang','save','scan','seat','seed','seek','seem','self','sell',
  'send','sent','shed','shin','ship','shop','show','shut','sick',
  'side','sigh','sign','silk','sing','sink','site','size','skin',
  'slip','slot','slow','slug','snap','snow','soak','soar','soil',
  'sole','some','song','soon','sort','soul','span','spin','spot',
  'star','stay','stem','step','stop','such','suit','sure','swap',
  'swim','sync','tail','tale','talk','tall','tank','tape','task',
  'tell','tend','term','test','text','than','them','then','they',
  'thin','this','thus','tide','till','time','tire','told','toll',
  'tomb','tone','took','tool','tore','torn','tour','town','trap',
  'tree','trim','trip','true','tube','tuck','tune','turn','type',
  'undo','unit','upon','used','user','vary','vast','very','view',
  'void','vote','wade','wait','walk','wall','want','warm','warn',
  'wash','wave','weak','wear','week','well','went','were','west',
  'what','when','whom','wide','wife','wild','will','wind','wine',
  'wing','wire','wise','wish','with','wolf','wood','word','wore',
  'work','worm','wrap','yard','year','your',
  // 5-letter
  'about','above','abuse','agree','ahead','alarm','album','alert',
  'alien','align','allow','alone','along','alter','angle','angry',
  'apply','arise','array','aside','asset','audit','avoid','awake',
  'award','aware','badly','basic','basis','batch','beach','begin',
  'being','below','bench','black','blade','blank','blast','bleed',
  'bless','blind','block','blood','board','bonus','boost','bound',
  'brain','brand','brave','bread','break','breed','brick','brief',
  'bring','broad','broke','brown','brush','build','built','bunch',
  'cabin','cable','candy','cargo','carry','cause','cease','chair',
  'chaos','charm','chart','chase','cheap','check','cheek','cheer',
  'chief','child','civic','claim','class','clean','clear','clerk',
  'click','cliff','climb','close','cloud','coach','coast','could',
  'count','court','cover','craft','crash','crazy','cream','crime',
  'cross','crowd','crown','cruel','crush','curve','cycle','daily',
  'dance','death','depot','depth','diary','digit','dirty','ditch',
  'dodge','donor','doubt','draft','drain','drama','drawn','dream',
  'drive','dying','eager','early','earth','eight','elite','email',
  'empty','enemy','enter','equal','error','event','every','exact',
  'exist','extra','faith','false','fancy','fatal','fault','feast',
  'fence','fiber','field','fifth','fifty','fight','final','first',
  'fixed','flame','flash','flesh','flood','floor','focus','force',
  'forge','forth','forum','found','frank','fraud','front','frost',
  'frown','fruit','fully','funny','giant','given','glass','globe',
  'going','grace','grade','grain','grand','grant','grasp','grass',
  'grave','great','green','greet','grief','grill','groan','gross',
  'group','grown','guard','guess','guide','guild','guilt','habit',
  'handy','happy','harsh','heart','heavy','hence','hinge','honey',
  'honor','horse','hotel','house','human','hurry','ideal','image',
  'imply','index','inner','input','intro','issue','juice','juicy',
  'known','label','large','later','laugh','layer','learn','lease',
  'leave','legal','level','light','liner','logic','loose','lower',
  'lucky','lunch','magic','major','maker','march','match','mayor',
  'media','mercy','metal','might','minor','minus','model','money',
  'month','moral','motor','motto','mount','mouth','movie','music',
  'naive','never','night','noise','north','novel','nurse','occur',
  'ocean','often','order','organ','other','ought','outer','owner',
  'paint','panel','paper','patch','pause','peace','penny','phase',
  'phone','photo','piano','pitch','pixel','pizza','place','plain',
  'plant','plate','plead','point','power','press','price','pride',
  'prime','print','prior','prize','probe','proof','prose','proud',
  'prove','proxy','pulse','purse','queen','query','quest','queue',
  'quick','quiet','quite','quota','quote','radio','raise','rally',
  'range','rapid','ratio','reach','ready','realm','rebel','refer',
  'reign','relax','repay','reply','reset','rider','ridge','right',
  'rigid','risky','river','rough','round','route','royal','ruler',
  'rural','saint','sauce','scale','scene','scope','score','scout',
  'screw','sense','serve','seven','shall','shame','shape','share',
  'sharp','shift','shine','shirt','shock','shoot','shore','short',
  'sight','silly','since','sixth','sixty','skill','slave','sleep',
  'slice','slide','slope','small','smart','smell','smile','smoke',
  'solar','solid','solve','sorry','sound','south','space','spare',
  'spark','speak','speed','spend','spill','split','spoke','spoon',
  'spray','squad','stack','staff','stage','stake','stand','stark',
  'start','state','steak','steal','steel','steep','stick','still',
  'stock','stone','stood','store','storm','story','stove','study',
  'style','sugar','suite','sunny','super','surge','swamp','swear',
  'sweet','swift','sword','syrup','table','taste','teach','tears',
  'teeth','thank','there','thick','thing','third','those','three',
  'threw','throw','thumb','tight','timer','tired','title','today',
  'token','total','touch','tough','towel','tower','track','trade',
  'train','trait','trash','treat','trial','tribe','trick','tried',
  'troop','truck','truly','trust','truth','tumor','twist','ultra',
  'under','union','until','upper','upset','urban','usual','valid',
  'value','valve','video','viral','virus','visit','vital','voice',
  'watch','water','weigh','weird','where','which','while','white',
  'whole','whose','width','witty','woman','women','world','worry',
  'worse','worst','worth','would','write','wrong','yacht','young',
  // 6+ letter
  'accept','access','across','action','active','actual','afford',
  'afraid','agenda','almost','always','animal','answer','anyone',
  'anyway','appear','around','arrive','asking','attach','attend',
  'author','battle','beauty','become','before','behalf','behind',
  'better','beyond','bigger','bitter','border','bottle','bottom',
  'bought','branch','bridge','bright','broken','budget','burden',
  'button','camera','cancer','cannot','carbon','career','castle',
  'caught','center','chance','change','charge','chosen','cinema',
  'circle','closed','closer','coffee','coming','common','corner',
  'cotton','county','course','create','crisis','culture','custom',
  'danger','dealer','decide','defend','define','degree','delete',
  'demand','depend','deploy','design','detail','detect','device',
  'differ','dinner','direct','doctor','domain','donate','double',
  'engine','enough','ensure','escape','estate','except','expand',
  'expect','fabric','factor','family','famous','father','figure',
  'filter','finger','finish','flower','flying','follow','formal',
  'friend','future','garden','gather','gender','global','harder',
  'health','height','hidden','highly','history','hollow','honest',
  'impact','income','indeed','inside','invite','island','itself',
  'junior','killed','length','lesson','letter','likely','listen',
  'little','living','longer','looked','manage','manner','matter',
  'member','mental','middle','mirror','mobile','modern','moment',
  'mother','moving','murder','muscle','myself','native','nation',
  'nature','nearly','notice','object','obtain','office','online',
  'option','output','parent','people','period','person','phrase',
  'planet','player','please','police','policy','portal','pretty',
  'public','purple','random','reason','recent','record','reduce',
  'remind','remote','rename','remove','repair','repeat','report',
  'rescue','result','return','reveal','review','reward','safety',
  'screen','search','second','secret','secure','select','senior',
  'series','server','simple','single','sister','slowly','social',
  'solely','source','string','strong','submit','summer','switch',
  'system','target','ticket','toward','travel','trying','update',
  'upload','useful','values','victim','visual','volume','wanted',
  'weight','window','winter','within','wonder','worker','yellow',
  // ASL/sign language context
  'hello','please','thanks','sorry','help','stop','start','name',
  'sign','spell','learn','teach','translate','understand','again',
  'slowly','faster','louder','clearer','together','goodbye',
  'morning','evening','night','letter','finger','signing','signed',
  'letters','words','sentence','meaning','language','alphabet',
]);

// ── Common misspelling corrections ───────────────────────────
const CORRECTIONS = {
  'teh':'the','hte':'the','thw':'the','yuo':'you','adn':'and',
  'nad':'and','ot':'to','fo':'of','si':'is','ti':'it','ni':'in',
  'iam':'i am','dont':'do not','cant':'cannot','wont':'will not',
  'im':'i am','ive':'i have','youre':'you are','theyre':'they are',
  'isnt':'is not','arent':'are not','wasnt':'was not',
  'werent':'were not','havent':'have not','hasnt':'has not',
  'hadnt':'had not','didnt':'did not','doesnt':'does not',
  'couldnt':'could not','wouldnt':'would not','shouldnt':'should not',
  'alot':'a lot','definately':'definitely','occured':'occurred',
  'seperate':'separate','recieve':'receive','beleive':'believe',
  'freind':'friend','wierd':'weird','accomodate':'accommodate',
  'wich':'which','becuase':'because','untill':'until','truely':'truly',
  'noone':'no one','alright':'all right','goverment':'government',
  'sory':'sorry','sorrey':'sorry','helo':'hello','helllo':'hello',
  'thnak':'thank','thankyou':'thank you','thnks':'thanks',
  'pleas':'please','pleese':'please','plz':'please',
  'wrold':'world','wolrd':'world','langauge':'language',
  'lagnuage':'language','languge':'language',
};

/**
 * isValidWord(word) — dictionary lookup, case-insensitive
 * Single letters always valid (ASL context)
 */
export function isValidWord(word) {
  if (!word) return true;
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (w.length === 0) return true;
  if (w.length === 1) return true;
  return WORD_LIST.has(w);
}

/**
 * levenshtein(a, b) — classic edit distance
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * getFuzzySuggestions(word, maxResults)
 * Finds closest dictionary matches using edit distance.
 * Returns [] if word is already valid.
 */
export function getFuzzySuggestions(word, maxResults = 4) {
  if (!word || word.length < 2) return [];
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!w || isValidWord(w)) return [];

  // First check direct corrections dictionary
  if (CORRECTIONS[w]) return [CORRECTIONS[w]];

  const maxDist = w.length <= 4 ? 1 : w.length <= 7 ? 2 : 3;
  const results = [];

  for (const dictWord of WORD_LIST) {
    if (Math.abs(dictWord.length - w.length) > maxDist + 1) continue;
    if (dictWord.length < 2) continue;
    const dist = levenshtein(w, dictWord);
    if (dist <= maxDist) results.push({ word: dictWord, dist });
  }

  return results
    .sort((a, b) => a.dist - b.dist || a.word.length - b.word.length)
    .slice(0, maxResults)
    .map(r => r.word);
}

/**
 * getCurrentWord(transcript[])
 * Extracts the in-progress word from the transcript letter array.
 */
export function getCurrentWord(transcript) {
  let word = '';
  for (let i = transcript.length - 1; i >= 0; i--) {
    const ch = transcript[i];
    if (ch === ' ') break;
    word = ch + word;
  }
  return word;
}

/**
 * getLastCompletedWord(transcript[])
 * Returns the last space-delimited word (completed by a SPACE sign).
 */
export function getLastCompletedWord(transcript) {
  const text = transcript.join('').trimEnd();
  const parts = text.split(' ');
  return parts[parts.length - 1] || '';
}

/**
 * smartCorrectTranscript(transcript[])
 * Applies dictionary corrections to the full transcript text.
 * Returns corrected string.
 */
export function smartCorrectTranscript(transcript) {
  const raw   = transcript.join('').toLowerCase().trim();
  const words = raw.split(/\s+/);
  const fixed = words.map(w => {
    const clean = w.replace(/[^a-z']/g, '');
    if (!clean) return w;
    if (CORRECTIONS[clean]) return CORRECTIONS[clean];
    if (isValidWord(clean)) return w;
    const sugg = getFuzzySuggestions(clean, 1);
    return sugg.length ? sugg[0] : w;
  });
  // Capitalise first letter
  const result = fixed.join(' ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}
