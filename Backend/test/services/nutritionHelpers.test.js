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
    });

    describe('getRecommendedCalories', () => {
        it('uses the minimum floor for weight loss recommendations', () => {
            expect(helpers.getRecommendedCalories('weightLoss', 40)).toBe(1400);
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
    });

    describe('pickDeterministicMeal', () => {
        it('returns the same meal for the same inputs', () => {
            const candidates = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];

            expect(helpers.pickDeterministicMeal('breakfast', candidates, 123)).toEqual(
                helpers.pickDeterministicMeal('breakfast', candidates, 123)
            );
        });
    });

    describe('buildDailyRecommendations', () => {
        it('returns an empty recommendation set when the user opted out', () => {
            const result = helpers.buildDailyRecommendations({
                userId: 5,
                goal: 'fitness',
                weightKg: 70,
                dietTypes: '[]',
                allergies: '',
                wantsDietRecommendations: 'no'
            });

            expect(result.recommendations).toEqual([]);
            expect(result.calorieTarget).toBe(0);
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
            expect(result.recommendationNote).toContain('24 óránként');
        });
    });
});