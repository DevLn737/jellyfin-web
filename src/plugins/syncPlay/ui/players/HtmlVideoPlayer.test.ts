import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Events from '../../../../utils/events';
import HtmlVideoPlayer from './HtmlVideoPlayer';

vi.mock('../../../../components/playback/playbackmanager', () => ({ playbackManager: {} }));
vi.mock('../../../../components/toast/toast', () => ({ default: vi.fn() }));
vi.mock('../../../../lib/globalize', () => ({ default: { translate: (key: string) => key } }));
vi.mock('../../core', async () => ({
    default: {
        Players: {
            GenericPlayer: (await import('../../core/players/GenericPlayer')).default
        }
    }
}));

describe('SyncPlay HTML video player buffering', () => {
    let paused: boolean;
    let player: Record<string, unknown>;
    let wrapper: HtmlVideoPlayer;
    const onBuffering = vi.fn();
    const onReady = vi.fn();

    beforeEach(() => {
        vi.useFakeTimers();
        onBuffering.mockClear();
        onReady.mockClear();
        paused = false;
        player = {
            paused: () => paused,
            getPlaybackRate: () => 1,
            setPlaybackRate: vi.fn()
        };
        const playbackCore = { onBuffering, onReady, onPause: vi.fn(), onUnpause: vi.fn() };
        wrapper = new HtmlVideoPlayer(player, { getPlaybackCore: () => playbackCore, getQueueCore: () => ({}) });
        wrapper.localBindToPlayer();
    });

    afterEach(() => {
        wrapper.localUnbindFromPlayer();
        vi.useRealTimers();
    });

    it('reports Buffering when playback stalls', () => {
        Events.trigger(player, 'waiting');
        vi.advanceTimersByTime(3000);

        expect(onBuffering).toHaveBeenCalledTimes(1);
    });

    it('does not report Buffering for a seek while paused', () => {
        paused = true;
        Events.trigger(player, 'waiting');
        vi.advanceTimersByTime(5000);

        expect(onBuffering).not.toHaveBeenCalled();
    });

    it('drops a pending Buffering report when the player pauses', () => {
        // The group seek unpauses, seeks and pauses again; 'playing' never follows.
        Events.trigger(player, 'waiting');
        paused = true;
        Events.trigger(player, 'pause');
        vi.advanceTimersByTime(5000);

        expect(onBuffering).not.toHaveBeenCalled();
    });
});
