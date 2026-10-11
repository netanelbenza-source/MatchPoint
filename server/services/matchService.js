const WEIGHTS = {
  age: 20,
  location: 15,
  languages: 15,
  education: 10,
  lifestyle: 20,
  additionalCriteria: 20,
};

const OPPOSITE_GENDER = {
  Male: 'Female',
  Female: 'Male',
};

const OTHER_SECTOR = 'אחר';

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function ageMatches(age, ageRange) {
  if (!ageRange || typeof age !== 'number') return false;
  return age >= ageRange.min && age <= ageRange.max;
}

// An empty preference means that side has no constraint, so the check passes.
function locationMatches(city, cities) {
  if (!Array.isArray(cities) || cities.length === 0) return true;
  const target = normalize(city);
  return cities.some((preferredCity) => normalize(preferredCity) === target);
}

function languagesMatch(spoken, preferred) {
  if (!Array.isArray(preferred) || preferred.length === 0) return true;
  const spokenSet = new Set((spoken || []).map(normalize));
  return preferred.some((language) => spokenSet.has(normalize(language)));
}

function textPreferenceMatches(actual, preferred) {
  if (preferred == null || normalize(preferred) === '') return true;
  return normalize(actual) === normalize(preferred);
}

function additionalValueMatches(actual, expected) {
  if (Array.isArray(expected)) {
    if (expected.length === 0) return true;
    const actualValues = Array.isArray(actual) ? actual : [actual];
    const actualSet = new Set(actualValues.map(normalize));
    return expected.every((value) => actualSet.has(normalize(value)));
  }
  if (typeof expected === 'string') {
    return normalize(actual) === normalize(expected);
  }
  return actual === expected;
}

// additionalCriteria is free-form, so each key is checked against the same field on the other profile.
function additionalCriteriaMatch(profile, requiredCriteria) {
  if (!requiredCriteria || typeof requiredCriteria !== 'object' || Array.isArray(requiredCriteria)) {
    return true;
  }
  const entries = Object.entries(requiredCriteria);
  if (entries.length === 0) return true;
  return entries.every(([key, expected]) => additionalValueMatches(profile?.[key], expected));
}

function buildCriterion(name, userMatchesCandidate, candidateMatchesUser) {
  return {
    criterion: name,
    weight: WEIGHTS[name],
    passed: userMatchesCandidate && candidateMatchesUser,
    userMatchesCandidate,
    candidateMatchesUser,
  };
}

function passesGenderFilter(profile, preferences, candidateProfile, candidatePreferences) {
  // Each person must be looking for the other gender, and the other profile must be that gender.
  return (
    preferences.gender === OPPOSITE_GENDER[profile.gender] &&
    candidatePreferences.gender === OPPOSITE_GENDER[candidateProfile.gender] &&
    candidateProfile.gender === preferences.gender &&
    profile.gender === candidatePreferences.gender
  );
}

function acceptsSector(actualSector, preferredSector) {
  // A preference of אחר accepts every sector. Every other value must match exactly.
  if (preferredSector === OTHER_SECTOR) return true;
  return actualSector === preferredSector;
}

function passesSectorFilter(profile, preferences, candidateProfile, candidatePreferences) {
  return (
    acceptsSector(candidateProfile.sector, preferences.sector) &&
    acceptsSector(profile.sector, candidatePreferences.sector)
  );
}

function scoreCriteria(criteriaResults) {
  return criteriaResults.reduce((total, result) => {
    return total + (result.passed ? result.weight : 0);
  }, 0);
}

function findMatches({ userId, profile, preferences, profiles, allPreferences }) {
  const userKey = String(userId);
  const preferencesByUserId = new Map(
    allPreferences.map((item) => [String(item.userId), item])
  );
  const matches = [];

  for (const candidateProfile of profiles) {
    const candidateId = String(candidateProfile.userId);
    if (candidateId === userKey) continue;

    // Busy candidates are removed before gender, sector, or score checks.
    if (candidateProfile.isAvailable !== true) continue;

    const candidatePreferences = preferencesByUserId.get(candidateId);
    // Mutual scoring needs both a profile and preferences for the candidate.
    if (!candidatePreferences) continue;

    // Gender and sector remove a candidate before any percentage is calculated.
    if (!passesGenderFilter(profile, preferences, candidateProfile, candidatePreferences)) continue;
    if (!passesSectorFilter(profile, preferences, candidateProfile, candidatePreferences)) continue;

    const ageUserMatchesCandidate = ageMatches(candidateProfile.age, preferences.ageRange);
    const ageCandidateMatchesUser = ageMatches(profile.age, candidatePreferences.ageRange);
    // Age range is the basic filter: drop candidates outside either person's range.
    if (!ageUserMatchesCandidate || !ageCandidateMatchesUser) continue;

    // A criterion counts only when both directions pass.
    const criteriaResults = [
      buildCriterion('age', ageUserMatchesCandidate, ageCandidateMatchesUser),
      buildCriterion(
        'location',
        locationMatches(candidateProfile.city, preferences.cities),
        locationMatches(profile.city, candidatePreferences.cities)
      ),
      buildCriterion(
        'languages',
        languagesMatch(candidateProfile.languages, preferences.languages),
        languagesMatch(profile.languages, candidatePreferences.languages)
      ),
      buildCriterion(
        'education',
        textPreferenceMatches(candidateProfile.education, preferences.education),
        textPreferenceMatches(profile.education, candidatePreferences.education)
      ),
      buildCriterion(
        'lifestyle',
        textPreferenceMatches(candidateProfile.lifestyle, preferences.lifestyle),
        textPreferenceMatches(profile.lifestyle, candidatePreferences.lifestyle)
      ),
      buildCriterion(
        'additionalCriteria',
        additionalCriteriaMatch(candidateProfile, preferences.additionalCriteria),
        additionalCriteriaMatch(profile, candidatePreferences.additionalCriteria)
      ),
    ];

    matches.push({
      userId,
      candidateId: String(candidateProfile.userId),
      score: scoreCriteria(criteriaResults),
      criteriaResults,
      profile: {
        firstName: candidateProfile.firstName,
        age: candidateProfile.age,
        city: candidateProfile.city,
        gender: candidateProfile.gender,
        sector: candidateProfile.sector,
        languages: candidateProfile.languages,
        education: candidateProfile.education,
        lifestyle: candidateProfile.lifestyle,
        description: candidateProfile.description,
        matchmaker: candidateProfile.matchmaker
          ? {
              _id: candidateProfile.matchmaker._id,
              name: candidateProfile.matchmaker.name,
              phone: candidateProfile.matchmaker.phone,
              email: candidateProfile.matchmaker.email,
            }
          : null,
      },
    });
  }

  matches.sort((left, right) => right.score - left.score);
  return matches;
}

module.exports = {
  WEIGHTS,
  findMatches,
};
