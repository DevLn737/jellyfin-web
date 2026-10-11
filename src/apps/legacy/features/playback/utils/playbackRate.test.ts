import { beforeEach, describe, expect, it, vi } from 'vitest';

import { restoreSavedPlaybackRate } from './playbackRate';

describe('personal playback speed on item start', () => {
    beforeEach(() => {
        sessionStorage.clear();
        sessionStorage.setItem('playbackRateSpeed', '1.75');
    });

    it('preserves the authoritative group speed and personal preference in SyncPlay', () => {
        const player = { setPlaybackRate: vi.fn() };

        restoreSavedPlaybackRate(player, true);

        expect(player.setPlaybackRate).not.toHaveBeenCalled();
        expect(sessionStorage.getItem('playbackRateSpeed')).toBe('1.75');
    });

    it('restores the personal speed after leaving SyncPlay', () => {
        const player = { setPlaybackRate: vi.fn() };

        restoreSavedPlaybackRate(player, false);

        expect(player.setPlaybackRate).toHaveBeenCalledWith('1.75');
    });
});
