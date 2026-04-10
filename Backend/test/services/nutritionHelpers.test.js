const mockPool = {
    query: jest.fn(),
    getConnection: jest.fn()
};

jest.mock('mysql2/promise', () => ({
    createPool: jest.fn(() => mockPool)
}));

const { helpers } = require('../../server');

describe('server.js nutrition helpers', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('parseJsonArray', () => {
        it('returns empty array for null input', () => {
            expect(helpers.parseJsonArray(null)).toEqual([]);
        });

        it('returns the same array when the input is already an array', () => {
            expect(helpers.parseJsonArray(['vegan', 'keto'])).toEqual(['vegan', 'keto']);
        });

        it('parses a valid JSON array string', () => {
            expect(helpers.parseJsonArray('["vegan","keto"]')).toEqual(['vegan', 'keto']);
        });

        it('returns empty array for invalid JSON', () => {
            expect(helpers.parseJsonArray('{invalid')).toEqual([]);
        });
    });

    describe('getDietPreference', () => {
        it('prioritizes vegan over every other diet type', () => {
            expect(helpers.getDietPreference('["keto","vegan","vegetarian"]')).toBe('vegan');
        });

        it('returns keto when keto is the strongest known preference present', () => {
            expect(helpers.getDietPreference('["high-protein","keto"]')).toBe('keto');
        });

        it('falls back to balanced when no known preference is present', () => {
            expect(helpers.getDietPreference('["high-protein"]')).toBe('balanced');
        });
    });

    describe('getAllergyFlags', () => {
        it('detects multiple allergy keywords from free text', () => {
            expect(helpers.getAllergyFlags('tej, glutén, tojás')).toMatchObject({
                lactose: true,
                gluten: true,
                egg: true
            });
        });

        it('detects accentless soy and dairy related keywords as allergies', () => {
            expect(helpers.getAllergyFlags('turo es szoja')).toMatchObject({
                lactose: true,
                soy: true
            });
        });
    });

    describe('getRecommendedCalories', () => {
        it('uses the minimum floor for weight loss recommendations', () => {
            expect(helpers.getRecommendedCalories('weightLoss', 40)).toBe(1400);
        });

        it('uses the safe default weight when the provided weight is invalid', () => {
            expect(helpers.getRecommendedCalories('fitness', 0)).toBe(2100);
        });

        it('scales muscle gain recommendations above the minimum floor for heavier users', () => {
            expect(helpers.getRecommendedCalories('muscleGain', 90)).toBe(2970);
        });
    });

    describe('isMealCompatible', () => {
        const sampleMeal = {
            diets: ['balanced', 'vegetarian'],
            allergens: ['lactose'],
            goals: ['fitness', 'muscleGain']
        };

        it('rejects a meal when the selected diet does not match', () => {
            expect(helpers.isMealCompatible(sampleMeal, 'vegan', { lactose: false }, 'fitness')).toBe(false);
        });

        it('rejects a meal when an enabled allergy is present', () => {
            expect(helpers.isMealCompatible(sampleMeal, 'vegetarian', { lactose: true }, 'fitness')).toBe(false);
        });

        it('accepts a compatible vegetarian meal when diet allergy and goal all match', () => {
            expect(helpers.isMealCompatible(sampleMeal, 'vegetarian', { lactose: false }, 'fitness')).toBe(true);
        });

        it('rejects a meal for keto users when the meal is not keto compatible', () => {
            expect(helpers.isMealCompatible(sampleMeal, 'keto', { lactose: false }, 'fitness')).toBe(false);
        });
    });

    describe('pickDeterministicMeal', () => {
        it('returns the same meal for the same inputs', () => {
            const candidates = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];

            expect(helpers.pickDeterministicMeal('breakfast', candidates, 123)).toEqual(
                helpers.pickDeterministicMeal('breakfast', candidates, 123)
            );
        });

        it('returns null when no meal candidates are available', () => {
            expect(helpers.pickDeterministicMeal('snack', [], 99)).toBeNull();
        });
    });

    describe('buildDailyRecommendations', () => {
        it('still returns a full fallback recommendation set when the user previously opted out', () => {
            const result = helpers.buildDailyRecommendations({
                userId: 5,
                goal: 'fitness',
                weightKg: 70,
                dietTypes: '[]',
                allergies: '',
                wantsDietRecommendations: 'no'
            });

            expect(result.recommendations).toHaveLength(4);
            expect(result.calorieTarget).toBeGreaterThan(0);
        });

        it('builds four daily meal recommendations with labels and calories', () => {
            const result = helpers.buildDailyRecommendations({
                userId: 11,
                goal: 'muscleGain',
                weightKg: 82,
                dietTypes: '["vegetarian"]',
                allergies: '',
                wantsDietRecommendations: 'yes'
            });

            expect(result.recommendations).toHaveLength(4);
            expect(result.recommendations.every((meal) => meal.mealTypeLabel && meal.calories > 0)).toBe(true);
            expect(result.recommendationNote).toContain('étrendi ajánlást');
        });

        it('builds the standard ordered meal types for active recommendations', () => {
            const result = helpers.buildDailyRecommendations({
                userId: 7,
                goal: 'strength',
                weightKg: 100,
                dietTypes: '["balanced"]',
                allergies: '',
                wantsDietRecommendations: 'yes'
            });

            expect(result.calorieTarget).toBe(3200);
            expect(result.recommendations.map((meal) => meal.meal_type)).toEqual(['breakfast', 'lunch', 'dinner', 'snack']);
        });

        it('changes each meal type from one day to the next when alternatives exist', () => {
            const firstDay = helpers.buildDailyRecommendations({
                userId: 9,
                goal: 'fitness',
                weightKg: 78,
                dietTypes: '["balanced"]',
                allergies: '',
                wantsDietRecommendations: 'yes',
                dateInput: '2026-04-07'
            });
            const secondDay = helpers.buildDailyRecommendations({
                userId: 9,
                goal: 'fitness',
                weightKg: 78,
                dietTypes: '["balanced"]',
                allergies: '',
                wantsDietRecommendations: 'yes',
                dateInput: '2026-04-08'
            });

            firstDay.recommendations.forEach((meal, index) => {
                expect(secondDay.recommendations[index].name).not.toBe(meal.name);
            });
        });
    });

    describe('buildWeeklyRecommendations', () => {
        it('builds all seven days for the selected week', () => {
            const result = helpers.buildWeeklyRecommendations({
                userId: 12,
                goal: 'fitness',
                weightKg: 74,
                dietTypes: '["balanced"]',
                allergies: '',
                wantsDietRecommendations: 'yes',
                startDate: '2026-04-07'
            });

            expect(result).toHaveLength(7);
            expect(result.every((day) => day.recommendations.length === 4)).toBe(true);
        });

        it('builds fallback recommendations for all seven days even when the user opted out earlier', () => {
            const result = helpers.buildWeeklyRecommendations({
                userId: 21,
                goal: 'fitness',
                weightKg: 74,
                dietTypes: '[]',
                allergies: '',
                wantsDietRecommendations: 'no',
                startDate: '2026-04-14'
            });

            expect(result).toHaveLength(7);
            expect(result.every((day) => day.calorieTarget > 0)).toBe(true);
            expect(result.every((day) => day.recommendations.length === 4)).toBe(true);
        });

        it('keeps consecutive days different even across week boundaries', () => {
            const currentWeek = helpers.buildWeeklyRecommendations({
                userId: 15,
                goal: 'fitness',
                weightKg: 80,
                dietTypes: '["balanced"]',
                allergies: '',
                wantsDietRecommendations: 'yes',
                startDate: '2026-04-07'
            });
            const nextWeek = helpers.buildWeeklyRecommendations({
                userId: 15,
                goal: 'fitness',
                weightKg: 80,
                dietTypes: '["balanced"]',
                allergies: '',
                wantsDietRecommendations: 'yes',
                startDate: '2026-04-14'
            });

            const sundayMeals = currentWeek[currentWeek.length - 1].recommendations;
            const mondayMeals = nextWeek[0].recommendations;

            sundayMeals.forEach((meal, index) => {
                expect(mondayMeals[index].name).not.toBe(meal.name);
            });
        });
    });
});