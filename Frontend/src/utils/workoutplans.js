// 10 ELŐRE BETÁPLÁLT EDZÉSTERV
export const WORKOUT_PLANS = [
  {
    id: 1,
    name: "Kezdő Zsírégető",
    goal: "weightLoss",
    experience: "beginner",
    weeklyDays: 3,
    description: "Heti 3 edzés, kardióval kombinált körzetek. Kezdőknek ideális.",
    schedule: {
      monday: { name: "Kardió + Alsótest", exercises: ["Futópad (20 perc)", "Guggolás (3x12)", "Kitörés (3x10)", "Vádli (3x15)"] },
      wednesday: { name: "Felsőtest erősítés", exercises: ["Fekvenyomás (3x10)", "Evezés csigán (3x10)", "Vállból nyomás (3x10)", "Bicepsz (3x12)"] },
      friday: { name: "Teljes testes körzet", exercises: ["Burpees (3x10)", "Plank (3x30mp)", "Kettlebell swing (3x12)", "Kerékpározás (20 perc)"] }
    },
    tips: "Fókuszálj a technikára, ne a súlyra!"
  },
  {
    id: 2,
    name: "Haladó Zsírégető",
    goal: "weightLoss",
    experience: "intermediate",
    weeklyDays: 4,
    description: "Heti 4 edzés, HIIT és erősítés kombinációja.",
    schedule: {
      monday: { name: "HIIT + Mell", exercises: ["Sprint (30mp) - Pihenő (30mp) x10", "Fekvenyomás (4x8)", "Tárogatás (3x12)", "Tricepsz (3x12)"] },
      tuesday: { name: "Kardió + Hát", exercises: ["Futás (5km)", "Húzódzkodás (max x3)", "Evezés (4x10)", "Bicepsz (3x12)"] },
      thursday: { name: "HIIT + Láb", exercises: ["Burpees (10x10)", "Guggolás (4x10)", "Lábnyomás (4x12)", "Kitörés (3x10)"] },
      friday: { name: "Aktív pihenő", exercises: ["Séta (30 perc)", "Nyújtás", "Mobilizáció"] }
    },
    tips: "Az edzések között legalább 48 óra pihenőt tarts!"
  },
  {
    id: 3,
    name: "Kezdő Izomépítő",
    goal: "muscleGain",
    experience: "beginner",
    weeklyDays: 3,
    description: "Heti 3 teljes testes edzés kezdőknek.",
    schedule: {
      monday: { name: "Teljes test A", exercises: ["Guggolás (3x10)", "Fekvenyomás (3x10)", "Evezés (3x10)", "Vállból nyomás (3x10)", "Bicepsz (3x12)", "Tricepsz (3x12)"] },
      wednesday: { name: "Teljes test B", exercises: ["Felhúzás (3x8)", "Ferde pados nyomás (3x10)", "Lehúzás csigán (3x10)", "Oldalemelés (3x12)", "Lábnyomás (3x12)", "Hasprés (3x15)"] },
      friday: { name: "Teljes test C", exercises: ["Kitörés (3x10)", "Döntött törzsű evezés (3x10)", "Katonai nyomás (3x10)", "Lábnyújtás (3x12)", "Plank (3x45mp)"] }
    },
    tips: "Egyél kalóriatöbbletben, minimum 1.6g fehérje/testsúlykg!"
  },
  {
    id: 4,
    name: "Haladó Izomépítő - PPL",
    goal: "muscleGain",
    experience: "intermediate",
    weeklyDays: 5,
    description: "Heti 5 edzés, Push/Pull/Legs split.",
    schedule: {
      monday: { name: "Push (Mell, Váll, Tricepsz)", exercises: ["Fekvenyomás (4x8)", "Vállból nyomás (4x10)", "Ferde pados (3x10)", "Oldalemelés (3x12)", "Tricepsz letolás (3x12)"] },
      tuesday: { name: "Pull (Hát, Bicepsz)", exercises: ["Húzódzkodás (4xmax)", "Evezés (4x10)", "Felhúzás (3x5)", "Bicepsz rúddal (3x10)", "Koncentrált bicepsz (3x12)"] },
      wednesday: { name: "Legs (Láb)", exercises: ["Guggolás (4x8)", "Lábnyomás (4x12)", "Kitörés (3x10)", "Vádli (4x15)"] },
      thursday: { name: "Push + Pull", exercises: ["Fekvenyomás (3x8)", "Evezés (3x10)", "Oldalemelés (3x12)", "Bicepsz (3x10)", "Tricepsz (3x10)"] },
      friday: { name: "Legs + Segéd", exercises: ["Felhúzás (3x5)", "Guggolás (3x8)", "Combfeszítő (3x12)", "Combhajlító (3x12)", "Has (3x15)"] }
    },
    tips: "Progresszív túlterhelés: minden héten próbálj többet emelni!"
  },
  {
    id: 5,
    name: "Erőemelő Kezdő",
    goal: "strength",
    experience: "beginner",
    weeklyDays: 3,
    description: "3 napos erőemelő alapozó program.",
    schedule: {
      monday: { name: "Guggolás fókusz", exercises: ["Guggolás (5x5)", "Fekvenyomás (5x5)", "Evezés (5x5)", "Lábnyomás (3x10)"] },
      wednesday: { name: "Fekvenyomás fókusz", exercises: ["Fekvenyomás (5x5)", "Guggolás (3x8)", "Vállból nyomás (3x8)", "Felhúzás (3x5)"] },
      friday: { name: "Felhúzás fókusz", exercises: ["Felhúzás (5x5)", "Guggolás (3x8)", "Fekvenyomás (3x8)", "Evezés (3x10)"] }
    },
    tips: "A nagy hármas (guggolás, fekvenyomás, felhúzás) a legfontosabb!"
  },
  {
    id: 6,
    name: "Erőemelő Haladó",
    goal: "strength",
    experience: "advanced",
    weeklyDays: 4,
    description: "4 napos erőemelő program, periodizációval.",
    schedule: {
      monday: { name: "Nehéz guggolás", exercises: ["Guggolás (3x3)", "Nehéz guggolás (2x5)", "Lábnyomás (3x10)", "Combfeszítő (3x12)"] },
      tuesday: { name: "Nehéz fekvenyomás", exercises: ["Fekvenyomás (3x3)", "Ferde pados (3x5)", "Katonai nyomás (3x8)", "Tricepsz (3x10)"] },
      thursday: { name: "Erőgyakorlatok", exercises: ["Felhúzás (3x3)", "Evezés (3x5)", "Bicepsz (3x8)", "Húzódzkodás (3xmax)"] },
      friday: { name: "Kiegészítő nap", exercises: ["Guggolás (3x8)", "Fekvenyomás (3x8)", "Felhúzás (3x5)", "Törzsizomzat (3x12)"] }
    },
    tips: "Tarts edzésnaplót, és havi szinten mérd a maximumaidat!"
  },
  {
    id: 7,
    name: "Funkcionális Fitness",
    goal: "fitness",
    experience: "beginner",
    weeklyDays: 3,
    description: "Középpontban a mozgáskoordináció és állóképesség.",
    schedule: {
      monday: { name: "Funkcionális erősítés", exercises: ["Kettlebell swing (3x12)", "Guggolás (3x10)", "Medicinlabda dobások (3x10)", "Plank (3x45mp)"] },
      wednesday: { name: "Kardió + Koordináció", exercises: ["Agility létra (10 perc)", "Sprint (6x50m)", "Burpees (3x12)", "Jumping Jacks (3x30)"] },
      friday: { name: "Teljes testes körzet", exercises: ["Súlyzós kitörés (3x10)", "Evezés (3x10)", "Vállból nyomás (3x10)", "Kettlebell swing (3x12)", "Plank (3x60mp)"] }
    },
    tips: "A mozgásminőség fontosabb, mint a súly!"
  },
  {
    id: 8,
    name: "Kardió és Állóképesség",
    goal: "fitness",
    experience: "intermediate",
    weeklyDays: 4,
    description: "Futás, úszás, kerékpár kombinációja.",
    schedule: {
      monday: { name: "Futás", exercises: ["Könnyű futás (30 perc)", "Tempófutás (20 perc)", "Lassú kocogás (10 perc)"] },
      tuesday: { name: "Erősítés", exercises: ["Guggolás (3x10)", "Kitörés (3x10)", "Plank (3x45mp)", "Hasprés (3x15)"] },
      thursday: { name: "Intervall futás", exercises: ["Bemelegítés (10 perc)", "Sprint (400m x6)", "Levezetés (10 perc)"] },
      saturday: { name: "Hosszú táv", exercises: ["Lassú futás (60 perc)", "Nyújtás (15 perc)"] }
    },
    tips: "Heti 10% szabály: ne növeld a távot 10%-nál többel!"
  },
  {
    id: 9,
    name: "Otthoni Edzés",
    goal: "fitness",
    experience: "beginner",
    weeklyDays: 4,
    description: "Csak testsúlyos és minimális eszközös edzés otthonra.",
    schedule: {
      monday: { name: "Felsőtest", exercises: ["Fekvőtámasz (3x12)", "Inverz evezés (3x10)", "Plank (3x45mp)", "Dips széken (3x10)"] },
      tuesday: { name: "Alsótest", exercises: ["Guggolás (3x15)", "Kitörés (3x10)", "Glute bridge (3x15)", "Vádli (3x20)"] },
      thursday: { name: "Kardió", exercises: ["Burpees (3x12)", "Jumping Jacks (3x30)", "Mountain climbers (3x20)", "Séta (30 perc)"] },
      friday: { name: "Teljes test", exercises: ["Fekvőtámasz (3x12)", "Guggolás (3x15)", "Plank (3x45mp)", "Kitörés (3x10)", "Hasprés (3x15)"] }
    },
    tips: "Ne hagyd ki a bemelegítést és a nyújtást!"
  },
  {
    id: 10,
    name: "Prémium Haladó Split",
    goal: "muscleGain",
    experience: "advanced",
    weeklyDays: 6,
    description: "6 napos, 3 naponként ismétlődő split edzés.",
    schedule: {
      monday: { name: "Mell + Tricepsz", exercises: ["Fekvenyomás (4x8)", "Ferde pados (4x10)", "Tárogatás (3x12)", "Tricepsz letolás (3x12)", "Koponyazúzó (3x10)"] },
      tuesday: { name: "Hát + Bicepsz", exercises: ["Húzódzkodás (4xmax)", "Evezés (4x10)", "Felhúzás (3x5)", "Bicepsz rúddal (3x10)", "Kalapács bicepsz (3x12)"] },
      wednesday: { name: "Láb + Váll", exercises: ["Guggolás (4x8)", "Lábnyomás (4x12)", "Kitörés (3x10)", "Vállból nyomás (4x10)", "Oldalemelés (3x12)"] },
      thursday: { name: "Mell + Tricepsz (2)", exercises: ["Ferde pados (4x8)", "Kábelkereszt (3x12)", "Francia nyomás (3x10)", "Lórúgás (3x12)"] },
      friday: { name: "Hát + Bicepsz (2)", exercises: ["Lehúzás csigán (4x10)", "T-rudas evezés (4x10)", "Scott-pad (3x12)", "Koncentrált bicepsz (3x12)"] },
      saturday: { name: "Láb + Váll (2)", exercises: ["Felhúzás (3x5)", "Guggolás (3x8)", "Vállvonogatás (3x12)", "Előreemelés (3x12)"] }
    },
    tips: "Figyelj a regenerációra! Aludj legalább 8 órát!"
  }
];

// 10 ELŐRE BETÁPLÁLT ÉTREND
export const DIET_PLANS = [
  {
    id: 1,
    name: "Zsírégető Kezdő",
    goal: "weightLoss",
    dailyCalories: 1800,
    description: "Alacsony szénhidrát, magas fehérje tartalmú étrend.",
    schedule: {
      breakfast: "Zabkása (40g) + 1 alma + 3 tojásfehérje",
      lunch: "Grillezett csirkemell (150g) + párolt brokkoli (200g) + barna rizs (80g)",
      dinner: "Tonhal saláta (120g tonhal, vegyes zöldség, olívaolaj)",
      snack: "Görög joghurt (150g) + marék dió"
    },
    macros: { protein: "120g", carbs: "150g", fat: "50g" }
  },
  {
    id: 2,
    name: "Zsírégető Haladó",
    goal: "weightLoss",
    dailyCalories: 1600,
    description: "Ketogén jellegű, alacsony szénhidrát étrend.",
    schedule: {
      breakfast: "Omlett (3 tojás, sonka, zöldségek)",
      lunch: "Sült lazac (150g) + avokádó saláta",
      dinner: "Grillezett csirkemell (150g) + spenót (200g)",
      snack: "Fehérje shake (1 gombóc) + mandula (20g)"
    },
    macros: { protein: "130g", carbs: "50g", fat: "70g" }
  },
  {
    id: 3,
    name: "Izomépítő Kezdő",
    goal: "muscleGain",
    dailyCalories: 2800,
    description: "Magas fehérje, magas szénhidrát étrend.",
    schedule: {
      breakfast: "Zabkása (80g) + banán + 4 tojás + méz",
      lunch: "Csirkemell (200g) + édesburgonya (250g) + zöldségek",
      dinner: "Marhahús (200g) + barna rizs (100g) + brokkoli",
      snack: "Görög joghurt (200g) + zabpehely (40g) + fehérje shake"
    },
    macros: { protein: "180g", carbs: "300g", fat: "70g" }
  },
  {
    id: 4,
    name: "Izomépítő Haladó",
    goal: "muscleGain",
    dailyCalories: 3200,
    description: "Tömegnövelő, magas kalóriatartalmú étrend.",
    schedule: {
      breakfast: "Zabkása (100g) + 2 banán + 5 tojás + mogyoróvaj",
      lunch: "Marhahús (250g) + quinoa (150g) + édesburgonya (200g)",
      dinner: "Lazac (200g) + barna rizs (100g) + spárga",
      snack: "Túró (250g) + dió (30g) + fehérje shake + rizskása (50g)"
    },
    macros: { protein: "200g", carbs: "350g", fat: "90g" }
  },
  {
    id: 5,
    name: "Erőemelő Étrend",
    goal: "strength",
    dailyCalories: 3000,
    description: "Energiadús étrend a maximális erőfejlesztéshez.",
    schedule: {
      breakfast: "Zabkása (100g) + 4 tojás + méz + banán",
      lunch: "Csirkecomb (250g) + krumplipüré (300g) + zöldségek",
      dinner: "Marhapörkölt (200g) + tarhonya (100g) + savanyúság",
      snack: "Túró (200g) + fehérje shake + kenyér (2 szelet)"
    },
    macros: { protein: "190g", carbs: "320g", fat: "80g" }
  },
  {
    id: 6,
    name: "Funkcionális Fitness",
    goal: "fitness",
    dailyCalories: 2400,
    description: "Egyensúlyozott makrókkal, változatos ételekkel.",
    schedule: {
      breakfast: "Teljes kiőrlésű kenyér (2 szelet) + avokádó + 3 tojás",
      lunch: "Grillezett csirkemell (180g) + quinoa (100g) + vegyes saláta",
      dinner: "Hal (150g) + bulgur (80g) + párolt zöldségek",
      snack: "Gyümölcsök + görög joghurt"
    },
    macros: { protein: "140g", carbs: "220g", fat: "60g" }
  },
  {
    id: 7,
    name: "Vegetáriánus Étrend",
    goal: "fitness",
    dailyCalories: 2200,
    description: "Növényi alapú, magas fehérjetartalmú étrend.",
    schedule: {
      breakfast: "Zabkása (60g) + fehérje por + banán + mandula",
      lunch: "Tofu (200g) + quinoa (100g) + zöldségek",
      dinner: "Csicseriborsó curry (250g) + barna rizs (80g)",
      snack: "Fehérje shake + dió (30g) + alma"
    },
    macros: { protein: "120g", carbs: "250g", fat: "55g" }
  },
  {
    id: 8,
    name: "Alacsony Szénhidrát",
    goal: "weightLoss",
    dailyCalories: 1700,
    description: "Keto stílusú, alacsony szénhidrát étrend.",
    schedule: {
      breakfast: "Omlett (4 tojás, sajt, bacon)",
      lunch: "Grillezett lazac (180g) + spenót (200g) + avokádó",
      dinner: "Csirkemell (180g) + zöldségmix (200g) + olívaolaj",
      snack: "Mogyoró (30g) + fehérje shake"
    },
    macros: { protein: "130g", carbs: "40g", fat: "85g" }
  },
  {
    id: 9,
    name: "Magas Fehérje",
    goal: "muscleGain",
    dailyCalories: 2600,
    description: "Fokozott fehérjebevitel az izomépítéshez.",
    schedule: {
      breakfast: "Zabkása (60g) + fehérje por + 3 tojás",
      lunch: "Csirkemell (200g) + barna rizs (100g) + brokkoli",
      dinner: "Túró (250g) + magvak + fehérje shake",
      snack: "Görög joghurt (200g) + dió + fehérje szelet"
    },
    macros: { protein: "200g", carbs: "180g", fat: "60g" }
  },
  {
    id: 10,
    name: "Teljes értékű alap",
    goal: "fitness",
    dailyCalories: 2100,
    description: "Minimálisan feldolgozott ételek, egészséges összetétel.",
    schedule: {
      breakfast: "Zabkása (50g) + friss gyümölcs + chia mag",
      lunch: "Lencseleves + teljes kiőrlésű kenyér + zöldségek",
      dinner: "Grillezett hal (150g) + quinoa (80g) + vegyes saláta",
      snack: "Alma + mandula + görög joghurt"
    },
    macros: { protein: "100g", carbs: "230g", fat: "50g" }
  }
];

// MATCH-ELŐ FUNKCIÓ: kiválasztja a legjobb edzéstervet
export const matchWorkoutPlan = (questionnaireData) => {
  const goal = questionnaireData?.goals?.mainGoal || 'fitness';
  const experience = questionnaireData?.experience_level || 'beginner';
  const weeklyDays = questionnaireData?.weekly_training_days || '3-4';
  
  let targetDays = 3;
  if (weeklyDays === '1-2') targetDays = 2;
  else if (weeklyDays === '3-4') targetDays = 3;
  else if (weeklyDays === '5+') targetDays = 4;
  
  let bestMatch = WORKOUT_PLANS[0];
  let bestScore = 0;
  
  for (const plan of WORKOUT_PLANS) {
    let score = 0;
    if (plan.goal === goal) score += 30;
    if (plan.experience === experience) score += 20;
    else if (plan.experience === 'beginner' && experience === 'never') score += 15;
    
    const daysDiff = Math.abs(plan.weeklyDays - targetDays);
    if (daysDiff === 0) score += 25;
    else if (daysDiff === 1) score += 15;
    else if (daysDiff === 2) score += 5;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = plan;
    }
  }
  
  return bestMatch;
};

// MATCH-ELŐ FUNKCIÓ: kiválasztja a legjobb étrendet
export const matchDietPlan = (questionnaireData) => {
  const goal = questionnaireData?.goals?.mainGoal || 'fitness';
  const weight = parseFloat(questionnaireData?.personalInfo?.weight) || 70;
  
  let bmr = 66 + (13.7 * weight) + (5 * 170) - (6.8 * 25);
  let targetCalories = 0;
  
  if (goal === 'weightLoss') targetCalories = bmr - 300;
  else if (goal === 'muscleGain') targetCalories = bmr + 300;
  else targetCalories = bmr;
  
  targetCalories = Math.round(targetCalories / 100) * 100;
  
  let bestMatch = DIET_PLANS[0];
  let bestScore = 0;
  
  for (const plan of DIET_PLANS) {
    let score = 0;
    if (plan.goal === goal) score += 30;
    
    const caloriesDiff = Math.abs(plan.dailyCalories - targetCalories);
    if (caloriesDiff <= 100) score += 25;
    else if (caloriesDiff <= 200) score += 15;
    else if (caloriesDiff <= 300) score += 10;
    else if (caloriesDiff <= 500) score += 5;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = plan;
    }
  }
  
  return bestMatch;
};