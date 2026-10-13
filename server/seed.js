const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { connectDb, closeDb, getDb } = require('./db');
const { userCreateSchema } = require('./validations/userValidation');
const { profileCreateSchema } = require('./validations/profileValidation');
const { preferencesCreateSchema } = require('./validations/preferencesValidation');
const { matchmakerSchema } = require('./validations/matchmakerValidation');

const DEFAULT_PASSWORD = '123456';
const SALT_ROUNDS = 10;

const matchmakers = [
  {
    name: 'הרב אהרן גולדשמידט',
    phone: '052-4112201',
    email: 'aharon.goldschmidt@matchpoint.test',
    weeklySuccessCount: 4,
  },
  {
    name: 'הרב יוסף מזרחי',
    phone: '053-7884410',
    email: 'yosef.mizrahi@matchpoint.test',
    weeklySuccessCount: 2,
  },
  {
    name: 'גב׳ רבקה שטיין',
    phone: '050-6621933',
    email: 'rivka.stein@matchpoint.test',
    weeklySuccessCount: 7,
  },
];

// Two Litvish pairs produce different scores. The Hasidic and Sephardi pairs match inside their sector.
const people = [
  {
    email: 'avraham.levi@matchpoint.test',
    firstName: 'אברהם',
    lastName: 'לוי',
    gender: 'Male',
    sector: 'ליטאי',
    age: 23,
    city: 'ירושלים',
    languages: ['עברית', 'אנגלית'],
    education: 'ישיבה',
    lifestyle: 'לימוד מלא',
    description:
      'אברהם לומד בישיבה גבוהה בירושלים ומקדיש את רוב היום לגמרא בעיון. הוא שקט, יציב ואוהב שיחות על אמונה, מוסר ודרך ארץ. בזמנו הפנוי הוא מטייל בעיר העתיקה וקורא ספרי מחשבה, ומחפש בית שנבנה על תורה, עדינות וכבוד הדדי.',
    preferences: {
      gender: 'Female',
      sector: 'ליטאי',
      ageRange: { min: 20, max: 26 },
      cities: ['ירושלים'],
      languages: ['עברית'],
      education: 'סמינר',
      lifestyle: 'לימוד מלא',
      additionalCriteria: {},
    },
  },
  {
    email: 'shimon.berkovich@matchpoint.test',
    firstName: 'שמעון',
    lastName: 'ברקוביץ',
    gender: 'Male',
    sector: 'ליטאי',
    age: 27,
    city: 'בני ברק',
    languages: ['עברית'],
    education: 'ישיבה',
    lifestyle: 'לימוד ועבודה',
    description:
      'שמעון משלב סדר לימוד בישיבה עם עבודה חלקית בהוראה. הוא חברותי, אחראי ושמח למסור שיעור תורה לצעירים בקהילה. חשוב לו בית של יראת שמים יחד עם פרנסה בכבוד, והוא נהנה מטיולים רגליים ומבישול ארוחות שבת למשפחה.',
    preferences: {
      gender: 'Female',
      sector: 'ליטאי',
      ageRange: { min: 22, max: 28 },
      cities: ['בני ברק', 'ירושלים'],
      languages: ['עברית'],
      education: 'סמינר',
      lifestyle: 'לימוד ועבודה',
      additionalCriteria: {},
    },
  },
  {
    email: 'yosef.friedman@matchpoint.test',
    firstName: 'יוסף',
    lastName: 'פרידמן',
    gender: 'Male',
    sector: 'חסידי',
    age: 24,
    city: 'בני ברק',
    languages: ['עברית'],
    education: 'ישיבה',
    lifestyle: 'לימוד מלא',
    description:
      'יוסף גדל בחצר חסידית ומקפיד על תפילה בכוונה ועל לימוד יומי בחברותא. הוא שמח, מוזיקלי ואוהב ניגונים, שולחן שבת וקבלת אורחים. הוא מחפש שותפה לחיים של שמחה, צניעות והתמדה בעבודת השם.',
    preferences: {
      gender: 'Female',
      sector: 'חסידי',
      ageRange: { min: 19, max: 25 },
      cities: ['בני ברק'],
      languages: ['עברית'],
      education: 'סמינר',
      lifestyle: 'לימוד מלא',
      additionalCriteria: {},
    },
  },
  {
    email: 'david.azoulay@matchpoint.test',
    firstName: 'דוד',
    lastName: 'אזולאי',
    gender: 'Male',
    sector: 'ספרדי',
    age: 26,
    city: 'אשדוד',
    languages: ['עברית', 'צרפתית'],
    education: 'כולל',
    lifestyle: 'לימוד ועבודה',
    description:
      'דוד לומד בכולל באשדוד ומשלב את הלימוד עם עבודה מסודרת. הוא חם, משפחתי ומחובר למסורת הספרדית, לכבוד הורים ולתפילה בבית הכנסת של הקהילה. בערבים הוא קורא תהילים, מבשל אוכל ביתי ואוהב לבלות עם אחים ואחיינים.',
    preferences: {
      gender: 'Female',
      sector: 'ספרדי',
      ageRange: { min: 21, max: 28 },
      cities: ['אשדוד'],
      languages: ['עברית'],
      education: 'סמינר',
      lifestyle: 'לימוד ועבודה',
      additionalCriteria: {},
    },
  },
  {
    email: 'sarah.cohen@matchpoint.test',
    firstName: 'שרה',
    lastName: 'כהן',
    gender: 'Female',
    sector: 'ליטאי',
    age: 21,
    city: 'ירושלים',
    languages: ['עברית', 'אנגלית'],
    education: 'סמינר',
    lifestyle: 'לימוד מלא',
    description:
      'שרה סיימה סמינר בירושלים וממשיכה ללמוד תורה כמה פעמים בשבוע. היא עדינה, מסודרת ואוהבת הוראה, אפייה וביקור חולים. חשוב לה בית של לימוד, צניעות ושמחת חיים, עם שיח פתוח וכבוד בין בני הזוג.',
    preferences: {
      gender: 'Male',
      sector: 'ליטאי',
      ageRange: { min: 21, max: 28 },
      cities: ['ירושלים'],
      languages: ['עברית'],
      education: 'ישיבה',
      lifestyle: 'לימוד מלא',
      additionalCriteria: {},
    },
  },
  {
    email: 'leah.klein@matchpoint.test',
    firstName: 'לאה',
    lastName: 'קליין',
    gender: 'Female',
    sector: 'ליטאי',
    age: 25,
    city: 'בני ברק',
    languages: ['עברית', 'רוסית'],
    education: 'סמינר',
    lifestyle: 'עבודה וקביעות עיתים',
    description:
      'לאה גרה בבני ברק ועובדת בהוראה לצד קביעות עיתים בלימוד. היא נעימה, מעשית ואוהבת ספרות תורנית, טיולים קצרים וארגון חסד בקהילה. היא מחפשת אדם רציני שמשלב יראת שמים עם אחריות לבית ולפרנסה.',
    preferences: {
      gender: 'Male',
      sector: 'ליטאי',
      ageRange: { min: 22, max: 30 },
      cities: ['בני ברק'],
      languages: ['עברית'],
      education: 'ישיבה',
      lifestyle: 'לימוד מלא',
      additionalCriteria: {},
    },
  },
  {
    email: 'miriam.horowitz@matchpoint.test',
    firstName: 'מרים',
    lastName: 'הורוביץ',
    gender: 'Female',
    sector: 'חסידי',
    age: 21,
    city: 'בני ברק',
    languages: ['עברית'],
    education: 'סמינר',
    lifestyle: 'לימוד מלא',
    description:
      'מרים גדלה בבית חסידי ומחפשת חיים של תפילה, ניגון וקבלת אורחים. היא שמחה, יצירתית ואוהבת לאפות חלות, לשיר בשבת וללמוד את פרשת השבוע. צניעות, אמונה פשוטה וכבוד להורים עומדים אצלה במרכז.',
    preferences: {
      gender: 'Male',
      sector: 'חסידי',
      ageRange: { min: 22, max: 27 },
      cities: ['בני ברק'],
      languages: ['עברית'],
      education: 'ישיבה',
      lifestyle: 'לימוד מלא',
      additionalCriteria: {},
    },
  },
  {
    email: 'rivka.biton@matchpoint.test',
    firstName: 'רבקה',
    lastName: 'ביטון',
    gender: 'Female',
    sector: 'ספרדי',
    age: 24,
    city: 'אשדוד',
    languages: ['עברית', 'צרפתית'],
    education: 'סמינר',
    lifestyle: 'לימוד ועבודה',
    description:
      'רבקה מאשדוד משלבת עבודה עם לימוד קבוע ושמירה על מנהגי הבית. היא חמה, ישירה ואוהבת משפחה גדולה, בישול מסורתי ועזרה לזקני הקהילה. היא מחפשת בן זוג יציב ומכבד, שבונה בית על תורה ומסורת ספרד.',
    preferences: {
      gender: 'Male',
      sector: 'ספרדי',
      ageRange: { min: 24, max: 30 },
      cities: ['אשדוד'],
      languages: ['עברית'],
      education: 'כולל',
      lifestyle: 'לימוד ועבודה',
      additionalCriteria: {},
    },
  },
];

const MALE_NAMES = ['אברהם', 'יצחק', 'יעקב', 'משה', 'אהרן', 'דוד', 'יוסף', 'שמעון', 'בנימין', 'נפתלי', 'אשר', 'זאב', 'חיים', 'פנחס', 'אליהו', 'מרדכי', 'ברוך', 'גרשון', 'יהודה', 'ראובן', 'לוי', 'ישראל', 'נחמן', 'מנחם', 'שניאור', 'יחיאל', 'חנוך', 'דב', 'אריה', 'נתן', 'עקיבא', 'הלל', 'מאיר', 'רפאל', 'שלום', 'ציון', 'אביחי', 'יונתן', 'נריה', 'אלי', 'עמית', 'איתי', 'נועם', 'עידו', 'יאיר', 'אלון', 'רועי', 'גל', 'אורי', 'יובל', 'איתן', 'דניאל', 'אריאל', 'מתן', 'עומר', 'ינאי', 'אורן', 'בועז', 'גד', 'חגי'];
const FEMALE_NAMES = ['שרה', 'לאה', 'רבקה', 'רחל', 'מרים', 'חנה', 'אסתר', 'דינה', 'תמר', 'יעל', 'נועה', 'מיכל', 'שירה', 'הדסה', 'מלכה', 'ברכה', 'פייגה', 'הינדא', 'חיה', 'גיטל', 'דבורה', 'יהודית', 'ציפורה', 'אביגיל', 'הילה', 'מאיה', 'תהילה', 'עדי', 'נעמה', 'הודיה', 'אורה', 'זהבה', 'שמחה', 'פנינה', 'שושנה', 'ורד', 'יפה', 'מרגלית', 'אסנת', 'הדר', 'ליאת', 'סיגל', 'אורית', 'מוריה', 'רות', 'נעמי', 'אביטל', 'חוה', 'צביה', 'אהובה', 'ברוריה', 'ביילא', 'גולדה', 'פרידה', 'מינה', 'אלטע', 'שיינא', 'רייזל', 'בלומא', 'חנה'];
const LAST_NAMES = ['לוי', 'כהן', 'ברקוביץ', 'פרידמן', 'אזולאי', 'הורוביץ', 'ביטון', 'קליין', 'מזרחי', 'שטיין', 'גולדשמידט', 'אברמוביץ', 'רוזנברג', 'שוורץ', 'גרינברג', 'וייס', 'כץ', 'סגל', 'הלפרין', 'אוחיון', 'אלפסי', 'טולדנו', 'אמסלם', 'חדד', 'סופר', 'גרוס', 'ברגר', 'פישר', 'נחמני', 'אדלר', 'בלוי', 'דויטש', 'יעקבי', 'מלמד', 'פרץ', 'אוחנה', 'גבאי', 'עמר', 'מרציאנו', 'אסולין', 'דיין', 'חזן', 'אלבז', 'שטרן', 'גולדברג', 'רוזן', 'קפלן', 'מנדל', 'סבג', 'דהן'];
const CITIES = ['ירושלים', 'בני ברק', 'אשדוד', 'בית שמש', 'מודיעין עילית', 'אלעד', 'נתיבות', 'פתח תקווה', 'חיפה', 'צפת', 'ביתר עילית', 'תל אביב'];
const EXTRA_LANGUAGES = ['אנגלית', 'צרפתית', 'רוסית', 'ספרדית'];
const MALE_EDUCATION = ['ישיבה', 'כולל', 'הכשרה מקצועית', 'לימודים אקדמאים', 'ללא מסגרת'];
const FEMALE_EDUCATION = ['סמינר', 'הכשרה מקצועית', 'לימודים אקדמאים', 'ללא מסגרת'];
const MALE_LIFESTYLE = ['לימוד מלא', 'לימוד ועבודה', 'עבודה וקביעות עיתים', 'עבודה'];
const FEMALE_LIFESTYLE = ['לימוד ועבודה', 'עבודה'];

function buildPool() {
  const sectors = ['חסידי', 'ליטאי', 'ספרדי', 'חבד', 'חרדי מודרני', 'אחר'];
  const ages = [];
  for (let age = 18; age <= 80; age += 1) ages.push(age);

  const pool = [];
  let index = 0;
  for (const sector of sectors) {
    for (const gender of ['Male', 'Female']) {
      const firstNames = gender === 'Male' ? MALE_NAMES : FEMALE_NAMES;
      const educations = gender === 'Male' ? MALE_EDUCATION : FEMALE_EDUCATION;
      const lifestyles = gender === 'Male' ? MALE_LIFESTYLE : FEMALE_LIFESTYLE;
      ages.forEach((age, ageIndex) => {
        const firstName = firstNames[index % firstNames.length];
        const lastName = LAST_NAMES[(index * 3 + ageIndex) % LAST_NAMES.length];
        const city = CITIES[(index + ageIndex) % CITIES.length];
        const education = educations[ageIndex % educations.length];
        const lifestyle = lifestyles[ageIndex % lifestyles.length];
        const extra = EXTRA_LANGUAGES[index % EXTRA_LANGUAGES.length];
        const sectorKey = sectors.indexOf(sector);
        pool.push({
          email: `pool.${gender === 'Male' ? 'm' : 'f'}.${sectorKey}.${age}@matchpoint.test`,
          firstName,
          lastName,
          gender,
          sector,
          age,
          city,
          languages: ['עברית', extra],
          education,
          lifestyle,
          description: `${firstName} ${lastName} מ${city}, במגזר ${sector}. ${gender === 'Male' ? 'הוא' : 'היא'} ${education === 'ללא מסגרת' ? 'בלי מסגרת קבועה' : `ב${education}`} ובסדר יום של ${lifestyle}.`,
          preferences: {
            gender: gender === 'Male' ? 'Female' : 'Male',
            sector: 'אחר',
            ageRange: { min: 18, max: 120 },
            cities: [],
            languages: [],
            education: 'ללא מסגרת',
            lifestyle: gender === 'Male' ? 'עבודה' : 'לימוד מלא',
            additionalCriteria: {},
          },
        });
        index += 1;
      });
    }
  }
  return pool;
}

people.push(...buildPool());

function buildDocuments(passwordHash, matchmakerDocs) {
  const users = [];
  const profiles = [];
  const preferences = [];

  people.forEach((person, index) => {
    const userId = new ObjectId();
    const matchmaker = matchmakerDocs[index % matchmakerDocs.length];

    const user = userCreateSchema.parse({
      email: person.email,
      passwordHash,
      role: 'user',
      status: 'active',
    });
    users.push({ ...user, _id: userId });

    const profile = profileCreateSchema.parse({
      userId: String(userId),
      firstName: person.firstName,
      age: person.age,
      city: person.city,
      gender: person.gender,
      sector: person.sector,
      matchmakerId: String(matchmaker._id),
      languages: person.languages,
      education: person.education,
      lifestyle: person.lifestyle,
      description: person.description,
      isAvailable: true,
    });
    profiles.push({
      ...profile,
      lastName: person.lastName,
      userId,
      matchmakerId: matchmaker._id,
    });

    const preference = preferencesCreateSchema.parse({
      userId: String(userId),
      ...person.preferences,
    });
    preferences.push({ ...preference, userId });
  });

  return { users, profiles, preferences };
}

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Set MONGO_URI in server/.env');
  }

  await connectDb(uri);
  const db = getDb();

  const demoUsers = await db.collection('users').find({ email: /@matchpoint\.test$/i }).project({ _id: 1 }).toArray();
  const demoIds = demoUsers.map((user) => user._id);
  if (demoIds.length > 0) {
    await Promise.all([
      db.collection('users').deleteMany({ _id: { $in: demoIds } }),
      db.collection('profiles').deleteMany({ userId: { $in: demoIds } }),
      db.collection('preferences').deleteMany({ userId: { $in: demoIds } }),
      db.collection('matches').deleteMany({ $or: [{ userId: { $in: demoIds } }, { candidateId: { $in: demoIds } }] }),
      db.collection('engagements').deleteMany({ $or: [{ maleId: { $in: demoIds } }, { femaleId: { $in: demoIds } }] }),
    ]);
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  const matchmakerDocs = [];
  for (const item of matchmakers) {
    const parsed = matchmakerSchema.parse(item);
    const existing = await db.collection('matchmakers').findOne({ email: parsed.email });
    if (existing) {
      await db.collection('matchmakers').updateOne(
        { _id: existing._id },
        { $set: { name: parsed.name, phone: parsed.phone, email: parsed.email } },
      );
      matchmakerDocs.push(existing);
    } else {
      const created = { ...parsed, _id: new ObjectId() };
      await db.collection('matchmakers').insertOne(created);
      matchmakerDocs.push(created);
    }
  }
  const documents = buildDocuments(passwordHash, matchmakerDocs);

  await db.collection('users').insertMany(documents.users);
  await db.collection('profiles').insertMany(documents.profiles);
  await db.collection('preferences').insertMany(documents.preferences);

  console.log(`Seed completed. Demo profiles: ${people.length}`);
  console.log(`Default password for demo accounts: ${DEFAULT_PASSWORD}`);
  console.log('Sample accounts:');
  people.slice(0, 8).forEach((person) => {
    console.log(`- ${person.email} (${person.firstName} ${person.lastName}, ${person.sector})`);
  });
}

seed()
  .catch((error) => {
    const message = String(error.message || error).replace(/mongodb(\+srv)?:\/\/\S+/gi, '[uri]');
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb().catch(() => {});
    process.exit(process.exitCode || 0);
  });
