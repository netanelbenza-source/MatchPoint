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

  await Promise.all([
    db.collection('matchmakers').deleteMany({}),
    db.collection('users').deleteMany({}),
    db.collection('profiles').deleteMany({}),
    db.collection('preferences').deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  const matchmakerDocs = matchmakers.map((item) => ({
    ...matchmakerSchema.parse(item),
    _id: new ObjectId(),
  }));
  const documents = buildDocuments(passwordHash, matchmakerDocs);

  await db.collection('matchmakers').insertMany(matchmakerDocs);
  await db.collection('users').insertMany(documents.users);
  await db.collection('profiles').insertMany(documents.profiles);
  await db.collection('preferences').insertMany(documents.preferences);

  console.log('Seed completed.');
  console.log(`Default password: ${DEFAULT_PASSWORD}`);
  console.log('Test accounts:');
  people.forEach((person) => {
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
