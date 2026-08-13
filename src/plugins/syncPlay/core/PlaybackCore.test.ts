import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlaybackCore from './PlaybackCore';

vi.mock('./Settings', () => ({
    getSetting: vi.fn(() => null)
}));

describe('PlaybackCore playback rate state', () => {
    let playbackCore: PlaybackCore;
    let playerWrapper: {
        hasPlaybackRate: ReturnType<typeof vi.fn>;
        localSetPlaybackRate: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        playerWrapper = {
            hasPlaybackRate: vi.fn(() => true),
            localSetPlaybackRate: vi.fn()
        };
        const manager = {
            clearSyncIcon: vi.fn(),
            getPlayerWrapper: vi.fn(() => playerWrapper),
            getTimeSyncCore: vi.fn(() => ({
                remoteDateToLocal: (date: Date) => date,
                localDateToRemote: (date: Date) => date
            })),
            isRemote: vi.fn(() => false)
        };

        playbackCore = new PlaybackCore();
        playbackCore.init(manager);
    });

    it('restores the base rate when clearing correction state', () => {
        playbackCore.setBasePlaybackRate(1.5, false);

        playbackCore.clearScheduledCommand();

        expect(playerWrapper.localSetPlaybackRate).toHaveBeenCalledWith(1.5);
    });

    it('treats a legacy command without playback rate as 1x', async () => {
        playbackCore.scheduleSeek = vi.fn();

        await playbackCore.applyCommand({
            Command: 'Seek',
            EmittedAt: new Date(),
            PlaylistItemId: 'item',
            PositionTicks: 0,
            When: new Date()
        });

        expect(playbackCore.getBasePlaybackRate()).toBe(1);
    });

    it('stores the authoritative rate before scheduling a command', async () => {
        playbackCore.scheduleSeek = vi.fn();

        await playbackCore.applyCommand({
            Command: 'Seek',
            EmittedAt: new Date(),
            PlaybackRate: 1.25,
            PlaylistItemId: 'item',
            PositionTicks: 0,
            When: new Date()
        });

        expect(playbackCore.getBasePlaybackRate()).toBe(1.25);
        expect(playbackCore.scheduleSeek).toHaveBeenCalled();
    });
});
