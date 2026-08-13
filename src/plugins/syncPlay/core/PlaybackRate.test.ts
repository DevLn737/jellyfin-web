import { describe, expect, it } from 'vitest';

import {
    DEFAULT_PLAYBACK_RATE,
    estimatePositionTicks,
    getPlaybackRateCorrection,
    getPlaybackRateErrorMessage,
    normalizePlaybackRate
} from './PlaybackRate';

describe('getPlaybackRateErrorMessage', () => {
    it('uses the capability explanation for conflicts', () => {
        expect(getPlaybackRateErrorMessage(409)).toBe('MessageSyncPlayPlaybackRateNotSupported');
    });

    it('uses the generic explanation for other failures', () => {
        expect(getPlaybackRateErrorMessage(500)).toBe('MessageSyncPlayPlaybackRateError');
    });
});

describe('normalizePlaybackRate', () => {
    it.each([undefined, null, Number.NaN, Number.POSITIVE_INFINITY, 0.1, 5.1])(
        'uses the legacy default for %s',
        playbackRate => {
            expect(normalizePlaybackRate(playbackRate)).toBe(DEFAULT_PLAYBACK_RATE);
        }
    );

    it.each([1, 1.25, 1.5])('accepts %s', playbackRate => {
        expect(normalizePlaybackRate(playbackRate)).toBe(playbackRate);
    });
});

describe('estimatePositionTicks', () => {
    it.each([
        [1, 20_000_000],
        [1.25, 22_500_000],
        [1.5, 25_000_000]
    ])('scales elapsed wall time at %sx', (playbackRate, expectedTicks) => {
        expect(estimatePositionTicks(10_000_000, 1000, playbackRate)).toBe(expectedTicks);
    });
});

describe('getPlaybackRateCorrection', () => {
    it('corrects around the group base rate', () => {
        const catchUp = getPlaybackRateCorrection(1.5, 100, 1000);
        expect(catchUp?.playbackRate).toBe(1.6);
        expect(catchUp?.durationMs).toBeCloseTo(1000);

        const slowDown = getPlaybackRateCorrection(1.5, -100, 1000);
        expect(slowDown?.playbackRate).toBe(1.4);
        expect(slowDown?.durationMs).toBeCloseTo(1000);
    });

    it('bounds the effective rate and adjusts the duration', () => {
        const correction = getPlaybackRateCorrection(4.9, 200, 1000);
        expect(correction?.playbackRate).toBe(5);
        expect(correction?.durationMs).toBeCloseTo(2000);
    });

    it('falls back when a bounded correction would take too long', () => {
        expect(getPlaybackRateCorrection(4.9, 600, 1000)).toBeNull();
        expect(getPlaybackRateCorrection(5, 100, 1000)).toBeNull();
    });
});
