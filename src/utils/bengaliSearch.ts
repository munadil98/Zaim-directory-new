/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const BN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function normalizeDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => BN_DIGITS[d] || d);
}

// Common geographic, organizational, and name aliases where standard English
// spelling diverges from strict letter-by-letter Bengali transliteration.
const PHRASE_ALIASES: Array<[string, string]> = [
  // Regions & Districts
  ['ঢাকা', 'dhaka dacca'],
  ['চট্টগ্রাম', 'chattogram chittagong chottogram ctg'],
  ['কক্সবাজার', 'coxsbazar coxs bazar cox bazar koxbazar'],
  ['যশোর', 'jessore jashore joshor'],
  ['কুমিল্লা', 'cumilla comilla kumilla'],
  ['বগুড়া', 'bogura bogra'],
  ['বরিশাল', 'barishal barisal'],
  ['বড়গুনা', 'barguna borguna'],
  ['সিলেট', 'sylhet silet'],
  ['ময়মনসিংহ', 'mymensingh moymonsingho'],
  ['ব্রাহ্মণবাড়িয়া', 'brahmanbaria bbaria bramhonbaria'],
  ['বিবাড়ীয়া', 'bbaria brahmanbaria bibaria'],
  ['নারাণয়গঞ্জ', 'narayanganj narayangonj'],
  ['নারায়ণগঞ্জ', 'narayanganj narayangonj'],
  ['নরসিংদি', 'narsingdi norshingdi'],
  ['নরসিংদী', 'narsingdi norshingdi'],
  ['কিশোরগঞ্জ', 'kishoreganj kishorganj kishoregonj'],
  ['মৌলবীবাজার', 'moulvibazar maulvibazar moulavibazar'],
  ['হবিগঞ্জ', 'habiganj hobiganj habigonj'],
  ['সুনামগঞ্জ', 'sunamganj sunamgonj'],
  ['লক্ষীপুর', 'lakshmipur laxmipur lokkhipur'],
  ['নিলফামারী', 'nilphamari'],
  ['নীলফামারী', 'nilphamari'],
  ['চাঁদপুর', 'chandpur chadpur'],
  ['পার্বত্য', 'parbatya hill tracts cht'],
  ['খুলনা', 'khulna'],
  ['সাতক্ষীরা', 'satkhira shatkhira'],
  ['সুন্দরবন', 'sundarban sundorbon'],
  ['কুষ্টিয়া', 'kushtia kustia'],
  ['চুয়াডাঙ্গা', 'chuadanga'],
  ['চূয়াডাঙ্গা', 'chuadanga'],
  ['পটুয়াখালী', 'patuakhali'],
  ['নাটোর', 'natore nator'],
  ['রাজশাহী', 'rajshahi'],
  ['পাবনা', 'pabna'],
  ['রংপুর', 'rangpur rongpur'],
  ['গাইবান্ধা', 'gaibandha'],
  ['দিনাজপুর', 'dinajpur'],
  ['পঞ্চগড়', 'panchagarh panchagar ponchogor'],
  ['ঠাকুরগাঁও', 'thakurgaon'],
  ['জামালপুর', 'jamalpur'],
  ['টাঙ্গাইল', 'tangail'],
  ['শেরপুর', 'sherpur'],
  ['নেত্রকোনা', 'netrokona netrakona'],
  ['গাজীপুর', 'gazipur gajipur'],
  ['সাভার', 'savar sabhar'],
  ['আশুলিয়া', 'ashulia'],
  ['মিরপুর', 'mirpur'],
  ['তেজগাঁও', 'tejgaon'],
  ['মাদারটেক', 'madartek'],
  ['নাখালপাড়া', 'nakhalpara'],
  ['আশকোনা', 'ashkona'],
  ['ভৈরববাজার', 'bhairab bhairab bazar voirab'],
  ['আখাউড়া', 'akhaura'],
  ['নবীনগর', 'nabinagar nobinagar'],
  ['সরাইল', 'sarail sorail'],
  ['কটিয়াদী', 'katiadi kotiadi'],
  ['সরিষাবাড়ী', 'sarishabari shorishabari'],
  ['বকশীগঞ্জ', 'bakshiganj bokshigonj'],
  ['ফুলবাড়ীয়া', 'fulbaria phulbaria'],
  ['ফতুল্লা', 'fatullah fotulla'],
  ['সোনারগাঁও', 'sonargaon'],
  ['ফরিদপুর', 'faridpur foridpur'],
  ['মানিকগঞ্জ', 'manikganj manikgonj'],
  ['মুন্সিগঞ্জ', 'munshiganj munshigonj'],
  ['টাংগাইল', 'tangail'],
  ['শরীয়তপুর', 'shariatpur'],
  ['মাদারীপুর', 'madaripur'],
  ['গোপালগঞ্জ', 'gopalganj gopalgonj'],
  ['নড়াইল', 'narail norail'],
  ['মাগুরা', 'magura'],
  ['ঝিনাইদহ', 'jhenaidah jhenidah'],
  ['বাগেরহাট', 'bagerhat'],
  ['মেহেরপুর', 'meherpur'],
  ['ভোলা', 'bhola vola'],
  ['ঝালকাঠি', 'jhalokati jhalokathi'],
  ['পিরোজপুর', 'pirojpur'],
  ['জয়পুরহাট', 'joypurhat'],
  ['নওগাঁ', 'naogaon'],
  ['চাঁপাইনবাবগঞ্জ', 'chapainawabganj nawabganj'],
  ['সিরাজগঞ্জ', 'sirajganj sirajgonj'],
  ['কুড়িগ্রাম', 'kurigram'],
  ['লালমনিরহাট', 'lalmonirhat'],
  ['আহমদ নগর', 'ahmad nagar ahmed nagar'],
  ['আহ্মদনগর', 'ahmadnagar ahmednagar'],
  // Titles, Designations, & Common Terms
  ['যয়ীম', 'zaim zaeem'],
  ['যয়িম', 'zaim zaeem'],
  ['মজলিস', 'majlis mojlish'],
  ['মেট্রো', 'metro'],
  ['জেলা', 'zilla zila jila district'],
  ['রিজিওন', 'region regional'],
  ['রিজিওনাল', 'regional region'],
  ['নাযেম', 'nazem najem'],
  ['আলা', 'ala aala'],
  ['সদর', 'sadar sodor'],
  ['নায়েব', 'naib nayeb'],
  ['আউয়াল', 'awwal awal'],
  ['সফে দওম', 'safe daom dawam'],
  ['কায়েদ', 'qaid kaid kayed'],
  ['উমুমী', 'umumi omumi'],
  ['তালীম', 'talim taleem'],
  ['তালিমুল কুরআন', 'talimul quran taleemul quran'],
  ['তরবীয়ত', 'tarbiyat torbiyat'],
  ['তবলীগ', 'tabligh tablig'],
  ['তাজনীদ', 'tajnid tajneed'],
  ['ইশায়াত', 'ishayat ishaat'],
  ['মাল', 'mal maal'],
  ['জিয়াফত', 'ziafat jiafot'],
  ['রিশতানাতা', 'rishtanata rishta nata'],
  ['ওসিয়্যত', 'wasiyyat osiyot'],
  ['সিকিউরিটি', 'security'],
  ['অডিটর', 'auditor'],
  ['রুকনে খুসূসী', 'rukne khususi khusushi'],
  ['মোয়াবিন', 'moawin moabin'],
  ['মোহতরম', 'mohtaram mohtorom'],
  ['আলহাজ¦', 'alhaj alhajj'],
  ['আলহাজ্ব', 'alhaj alhajj'],
  ['আলহাজ্জ্ব', 'alhaj alhajj'],
  ['মোহ.', 'md mohammad muhammad moh'],
  ['মোহাম্মদ', 'md mohammad muhammad'],
  ['মুহাম্মদ', 'md muhammad mohammad'],
  ['আহমদ', 'ahmad ahmed'],
  ['আহমেদ', 'ahmed ahmad'],
  ['রহমান', 'rahman rohman'],
  ['হোসেন', 'hossain hosen husain'],
  ['স্বপন', 'swapon shopon shapon'],
  ['পাটোয়ারী', 'patwary patwari patoary'],
  ['উত্তর', 'uttar uttor north'],
  ['দক্ষিণ', 'dakshin dokkhin south'],
  ['পূর্ব', 'purba purbo east'],
  ['পশ্চিম', 'pashchim poschim west'],
];

const BN_INDEPENDENT_VOWELS: Record<string, string> = {
  'অ': 'o',
  'আ': 'a',
  'ই': 'i',
  'ঈ': 'i',
  'উ': 'u',
  'ঊ': 'u',
  'ঋ': 'ri',
  'এ': 'e',
  'ঐ': 'oi',
  'ও': 'o',
  'ঔ': 'ou',
};

const BN_KAR: Record<string, string> = {
  'া': 'a',
  'ি': 'i',
  'ী': 'i',
  'ু': 'u',
  'ূ': 'u',
  'ৃ': 'ri',
  'ে': 'e',
  'ৈ': 'oi',
  'ো': 'o',
  'ৌ': 'ou',
};

const BN_CONSONANTS: Record<string, string> = {
  'ক': 'k',
  'খ': 'kh',
  'গ': 'g',
  'ঘ': 'gh',
  'ঙ': 'ng',
  'চ': 'ch',
  'ছ': 'chh',
  'জ': 'j',
  'ঝ': 'jh',
  'ঞ': 'n',
  'ট': 't',
  'ঠ': 'th',
  'ড': 'd',
  'ঢ': 'dh',
  'ণ': 'n',
  'ত': 't',
  'থ': 'th',
  'দ': 'd',
  'ধ': 'dh',
  'ন': 'n',
  'প': 'p',
  'ফ': 'f',
  'ব': 'b',
  'ভ': 'bh',
  'ম': 'm',
  'য': 'j',
  'র': 'r',
  'ল': 'l',
  'শ': 'sh',
  'ষ': 'sh',
  'স': 's',
  'হ': 'h',
  'ড়': 'r',
  'ঢ়': 'rh',
  'য়': 'y',
  'ৎ': 't',
  'ং': 'ng',
  'ঃ': 'h',
  'ঁ': '',
};

/**
 * Transliterates a Bengali string into Romanized Latin characters.
 * Preserves ASCII letters/digits and normalizes Bengali digits.
 */
export function transliterateBengali(input: string): string {
  const text = normalizeDigits(input).toLowerCase();
  let out = '';
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    const next2 = text[i + 2];

    // Special conjuncts: ক্ষ, জ্ঞ, হ্ম
    if (ch === 'ক' && next === '্' && next2 === 'ষ') {
      out += i === 0 || /\s/.test(text[i - 1]) ? 'kh' : 'kkh';
      i += 3;
      continue;
    }
    if (ch === 'জ' && next === '্' && next2 === 'ঞ') {
      out += 'gg';
      i += 3;
      continue;
    }
    if (ch === 'হ' && next === '্' && next2 === 'ম') {
      out += 'hm';
      i += 3;
      continue;
    }

    if (BN_INDEPENDENT_VOWELS[ch] !== undefined) {
      out += BN_INDEPENDENT_VOWELS[ch];
      i += 1;
      continue;
    }

    if (BN_KAR[ch] !== undefined) {
      out += BN_KAR[ch];
      i += 1;
      continue;
    }

    if (ch === '্') {
      // Hasanta followed by য (ya-phala) or ব (ba-phala) or র (ra-phala)
      if (next === 'য') {
        out += 'y';
        i += 2;
        continue;
      }
      if (next === 'ব') {
        // Ba-phala is often silent or pronounced as 'w'
        i += 2;
        continue;
      }
      if (next === 'র') {
        out += 'r';
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (BN_CONSONANTS[ch] !== undefined) {
      out += BN_CONSONANTS[ch];
      i += 1;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

/**
 * Produces a consonant + strong-vowel phonetic skeleton so minor Bengali/English
 * spelling differences (e.g., o/a/e, z/j, ph/f, bh/v, sh/s, q/k, double letters)
 * still match reliably.
 */
export function toPhoneticSkeleton(input: string): string {
  let s = normalizeDigits(input).toLowerCase();
  // Normalize common English/Romanized phonetic equivalents
  s = s
    .replace(/chh/g, 'c')
    .replace(/ch/g, 'c')
    .replace(/sh/g, 's')
    .replace(/ph/g, 'f')
    .replace(/bh/g, 'b')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/jh/g, 'j')
    .replace(/rh/g, 'r')
    .replace(/ng/g, 'n')
    .replace(/v|w/g, 'b')
    .replace(/z/g, 'j')
    .replace(/q/g, 'k')
    .replace(/ee|ea|ey|ei/g, 'i')
    .replace(/oo|ou/g, 'u')
    .replace(/y/g, 'i')
    // Unify word-initial e/i (e.g., Ebrahim/Ibrahim, Elahi/Ilahi)
    .replace(/(^|\s)[ei]+/g, '$1i')
    // Strip weak/inherent vowels (a, e, o) except keep leading a/o if word starts with one
    .replace(/(^|\s)([ao]+)/g, '$1a')
    .replace(/[aeo]/g, '')
    // Collapse consecutive duplicate characters
    .replace(/(.)\1+/g, '$1');

  return s.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Builds a precomputed searchable index string for a contact's text fields.
 */
export function buildSearchableIndex(fields: Array<string | undefined | null>): {
  rawLower: string;
  digitsNormalized: string;
  transliterated: string;
  aliasExpanded: string;
  skeletonWords: string[];
} {
  const joined = fields.filter(Boolean).join(' ');
  const rawLower = joined.toLowerCase();
  const digitsNormalized = normalizeDigits(rawLower);

  // Collect matching aliases for known Bengali words/phrases present in the record
  const extraAliases: string[] = [];
  for (const [bnPhrase, enAliases] of PHRASE_ALIASES) {
    if (rawLower.includes(bnPhrase)) {
      extraAliases.push(enAliases);
    }
  }

  const transliterated = transliterateBengali(digitsNormalized);
  const aliasExpanded = `${digitsNormalized} ${transliterated} ${extraAliases.join(' ')}`.trim();
  const skeletonStr = toPhoneticSkeleton(aliasExpanded);
  const skeletonWords = skeletonStr ? skeletonStr.split(/\s+/).filter(Boolean) : [];

  return {
    rawLower,
    digitsNormalized,
    transliterated,
    aliasExpanded,
    skeletonWords,
  };
}

/**
 * Checks whether a user query matches a contact's fields.
 * When `enableEnglishSearch` is true, English keywords like "dhaka", "mirpur",
 * "chittagong", "shafiqul", "01711", etc. match their corresponding Bengali entries.
 */
export function matchesDirectoryQuery(
  fields: Array<string | undefined | null>,
  query: string,
  enableEnglishSearch: boolean
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const normalizedQuery = normalizeDigits(trimmed).toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const joined = fields.filter(Boolean).join(' ').toLowerCase();
  const normalizedTarget = normalizeDigits(joined);
  const compactTargetDigits = normalizedTarget.replace(/[-\s()+]/g, '');

  if (!enableEnglishSearch) {
    return tokens.every(
      (token) =>
        normalizedTarget.includes(token) ||
        (/^\d+$/.test(token) && compactTargetDigits.includes(token))
    );
  }

  const index = buildSearchableIndex(fields);

  return tokens.every((token) => {
    // 1. Direct match in original text or normalized digits
    if (index.digitsNormalized.includes(token)) return true;

    // 2. Digit-only phone search ignoring dashes/spaces
    const cleanTokenDigits = token.replace(/[-\s()+]/g, '');
    if (/^\d{2,}$/.test(cleanTokenDigits) && compactTargetDigits.includes(cleanTokenDigits)) {
      return true;
    }

    // 3. Direct match in transliterated + alias-expanded text
    if (index.aliasExpanded.includes(token)) return true;

    // 4. Word-prefix/word match using phonetic skeleton (handles inherent vowels like ratan/roton, fazl/fojol)
    const tokenSkeleton = toPhoneticSkeleton(token);
    if (tokenSkeleton.length >= 2) {
      return index.skeletonWords.some(
        (word) => word.startsWith(tokenSkeleton) || (tokenSkeleton.length >= 4 && word.includes(tokenSkeleton))
      );
    }

    return false;
  });
}
