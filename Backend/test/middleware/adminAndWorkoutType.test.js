const mockPool = {
    query: jest.fn(),
    getConnection: jest.fn()
};

jest.mock('mysql2/promise', () => ({
    createPool: jest.fn(() => mockPool)
}));

const { helpers } = require('../../server');

describe('server.js admin and workout type helpers', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('normalizeUserRole', () => {
        it('normalizes admin role from mixed case text', () => {
            expect(helpers.normalizeUserRole(' Admin ')).toBe('admin');
        });
    });

    describe('normalizeWorkoutType', () => {
        it('maps full body to storage-safe full_body', () => {
            expect(helpers.normalizeWorkoutType('full body')).toBe('full_body');
        });

        it('maps leg to the stored legs enum', () => {
            expect(helpers.normalizeWorkoutType('leg')).toBe('legs');
        });

        it('keeps unknown workout type values unchanged after normalization', () => {
            expect(helpers.normalizeWorkoutType('custom-day')).toBe('custom-day');
        });
    });

    describe('isAdminUser', () => {
        it('returns false immediately when no user id is provided', async () => {
            await expect(helpers.isAdminUser(null)).resolves.toBe(false);
            expect(mockPool.query).not.toHaveBeenCalled();
        });

        it('returns true when the database role is admin', async () => {
            mockPool.query.mockResolvedValueOnce([[{ role: 'admin' }]]);

            await expect(helpers.isAdminUser(11)).resolves.toBe(true);
        });
    });

    describe('requireAdmin', () => {
        it('returns false and sends 403 when the user is not admin', async () => {
            mockPool.query.mockResolvedValueOnce([[{ role: 'user' }]]);
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await expect(helpers.requireAdmin(9, res)).resolves.toBe(false);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Nincs admin jogosultság!' });
        });

        it('returns true when the user is admin', async () => {
            mockPool.query.mockResolvedValueOnce([[{ role: 'admin' }]]);
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await expect(helpers.requireAdmin(1, res)).resolves.toBe(true);
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});