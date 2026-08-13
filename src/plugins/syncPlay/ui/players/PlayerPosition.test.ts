import { describe, expect, it } from 'vitest';

import { normalizeAsyncPlayerPosition } from './PlayerPosition';

describe('normalizeAsyncPlayerPosition', () => {
    it('converts a seconds-based native position to milliseconds', () => {
        expect(normalizeAsyncPlayerPosition(228, 228_770)).toBe(228_000);
    });

    it('preserves a millisecond-based position', () => {
        expect(normalizeAsyncPlayerPosition(228_750, 228_770)).toBe(228_750);
    });

    it('preserves a non-finite result for existing fallback handling', () => {
        expect(normalizeAsyncPlayerPosition(Number.NaN, 228_770)).toBeNaN();
    });
});
