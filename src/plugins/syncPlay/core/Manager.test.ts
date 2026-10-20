import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Manager from './Manager';

vi.mock('./Settings', () => ({ getSetting: () => null }));
vi.mock('../../../components/toast/toast', () => ({ default: vi.fn() }));
vi.mock('../../../lib/globalize', () => ({ default: { translate: (key: string) => key } }));
vi.mock('./timeSync/TimeSyncCore', () => ({
    default: class {
        localDateToRemote(date: Date) { return date; }
        remoteDateToLocal(date: Date) { return date; }
    }
}));

describe('SyncPlay group rate lifecycle', () => {
    let manager: Manager;
    let actualRate: number;
    const localPause = vi.fn();
    const isPlaybackActive = vi.fn();

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));
        actualRate = 1.75;
        localPause.mockClear();
        isPlaybackActive.mockReturnValue(true);
        manager = new Manager({});
        manager.playerWrapper = {
            isPlaybackActive,
            isRemote: () => false,
            hasPlaybackRate: () => true,
            localSetPlaybackRate: (rate: number) => { actualRate = rate; },
            localPause,
            unbindFromPlayer: () => { actualRate = 1.75; }
        };
        manager.playbackCore.init(manager);
        manager.queueCore.getCurrentPlaylistItemId = () => 'item';
        manager.syncPlayEnabledAt = new Date(Date.now() - 1000);
        manager.syncPlayReady = true;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('cancels correction and scheduled commands before restoring personal speed on leave', () => {
        const core = manager.playbackCore;
        core.setBasePlaybackRate(1.5);
        core.schedulePause(new Date(Date.now() + 5000), 10_000_000);
        core.lastCommand = {
            Command: 'Unpause',
            PlaylistItemId: 'item',
            PositionTicks: 10_000_000,
            When: new Date()
        };
        core.lastSyncTime = new Date(Date.now() - 2000);
        core.syncEnabled = true;
        core.enableSyncCorrection = true;
        core.syncPlaybackTime({ currentTime: new Date(), currentPosition: 900 });
        expect(actualRate).toBe(1.6);
        expect(vi.getTimerCount()).toBe(2);

        manager.disableSyncPlay();
        vi.advanceTimersByTime(6000);

        expect(actualRate).toBe(1.75);
        expect(localPause).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
        expect(core.lastCommand).toBeNull();
        expect(core.getBasePlaybackRate()).toBe(1);
        expect(core.syncEnabled).toBe(false);
    });

    it('retains the authoritative idle Stop rate without touching a local player', () => {
        isPlaybackActive.mockReturnValue(false);

        manager.processCommand({
            Command: 'Stop',
            EmittedAt: new Date().toISOString(),
            When: new Date().toISOString(),
            PositionTicks: 0,
            PlaybackRate: 1.25
        });

        expect(manager.playbackCore.getBasePlaybackRate()).toBe(1.25);
        expect(actualRate).toBe(1.75);
    });

    it('ignores idle rate commands emitted before joining the current group', () => {
        isPlaybackActive.mockReturnValue(false);

        manager.processCommand({
            Command: 'Stop',
            EmittedAt: new Date(Date.now() - 2000),
            When: new Date(),
            PlaybackRate: 1.5
        });

        expect(manager.playbackCore.getBasePlaybackRate()).toBe(1);
    });

    it('applies the same group queue again after leaving and rejoining', () => {
        const queue = manager.queueCore;
        queue.init(manager);
        const update = {
            Reason: 'NewPlaylist',
            LastUpdate: '2026-10-11T11:59:00Z',
            Playlist: [],
            PlayingItemIndex: -1,
            StartPositionTicks: 0,
            PlaybackRate: 1
        };
        const apiClient = { serverInfo: () => ({ Id: 'server' }) };
        const onPlayQueueUpdate = vi.spyOn(queue, 'onPlayQueueUpdate');

        queue.updatePlayQueue(apiClient, { ...update });
        expect(queue.getLastUpdateTime()).toBe(Date.parse(update.LastUpdate));

        manager.disableSyncPlay();
        expect(queue.getLastUpdateTime()).toBe(0);

        queue.updatePlayQueue(apiClient, { ...update });
        expect(onPlayQueueUpdate).toHaveBeenCalledTimes(2);
    });
});
