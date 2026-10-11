import { beforeEach, describe, expect, it, vi } from 'vitest';

import NoActivePlayer from './NoActivePlayer';

const mocks = vi.hoisted(() => ({
    playbackManager: {
        syncPlayEnabled: false,
        setPlaybackRate: vi.fn(),
        getPlaybackRate: vi.fn(() => 1.6)
    },
    toast: vi.fn()
}));

vi.mock('../../../../components/playback/playbackmanager', () => ({
    playbackManager: mocks.playbackManager
}));
vi.mock('../../../../components/toast/toast', () => ({ default: mocks.toast }));
vi.mock('../../../../lib/globalize', () => ({ default: { translate: (key: string) => key } }));
vi.mock('../../core', async () => ({
    default: {
        Players: {
            GenericPlayer: (await import('../../core/players/GenericPlayer')).default
        }
    }
}));

describe('SyncPlay playback manager adapter', () => {
    const setPlaybackRate = vi.fn();
    const nativePlayer = { setPlaybackRate: vi.fn() };
    const localSendCommand = vi.fn();
    let wrapper: NoActivePlayer;

    beforeEach(() => {
        vi.clearAllMocks();
        setPlaybackRate.mockResolvedValue(undefined);
        mocks.playbackManager.syncPlayEnabled = false;
        mocks.playbackManager.setPlaybackRate = vi.fn();
        mocks.playbackManager.getPlaybackRate = vi.fn(() => 1.6);
        sessionStorage.setItem('playbackRateSpeed', '1.75');
        wrapper = new NoActivePlayer(nativePlayer, {
            getPlaybackCore: () => ({ getBasePlaybackRate: () => 1.5 }),
            getQueueCore: () => ({}),
            getController: () => ({ setPlaybackRate }),
            getPlayerWrapper: () => ({ localSendCommand })
        });
    });

    it('sends a general PlaybackRate command to the group without changing the native player', async () => {
        await wrapper.sendCommandRequest({
            Name: 'PlaybackRate',
            Arguments: { PlaybackRate: '1.25' }
        }, nativePlayer);

        expect(setPlaybackRate).toHaveBeenCalledWith(1.25);
        expect(nativePlayer.setPlaybackRate).not.toHaveBeenCalled();
        expect(localSendCommand).not.toHaveBeenCalled();
        expect(sessionStorage.getItem('playbackRateSpeed')).toBe('1.75');
    });

    it('reports an SDK capability conflict without changing local speed or saved preference', async () => {
        setPlaybackRate.mockRejectedValue({ response: { status: 409 } });

        await wrapper.setPlaybackRateRequest(1.25);

        expect(mocks.toast).toHaveBeenCalledWith('MessageSyncPlayPlaybackRateNotSupported');
        expect(nativePlayer.setPlaybackRate).not.toHaveBeenCalled();
        expect(sessionStorage.getItem('playbackRateSpeed')).toBe('1.75');
    });

    it('uses the group base for controls during drift correction and restores local controls on exit', () => {
        const personalRateGetter = mocks.playbackManager.getPlaybackRate;
        const personalRateSetter = mocks.playbackManager.setPlaybackRate;
        wrapper.localBindToPlayer();

        expect(mocks.playbackManager.getPlaybackRate()).toBe(1.5);
        wrapper.localUnbindFromPlayer();

        expect(mocks.playbackManager.getPlaybackRate).toBe(personalRateGetter);
        expect(mocks.playbackManager.setPlaybackRate).toBe(personalRateSetter);
        expect(mocks.playbackManager.getPlaybackRate()).toBe(1.6);
    });

    it('applies temporary correction locally without writing the group or personal preference', () => {
        wrapper.localSetPlaybackRate(1.6);

        expect(nativePlayer.setPlaybackRate).toHaveBeenCalledWith(1.6);
        expect(setPlaybackRate).not.toHaveBeenCalled();
        expect(sessionStorage.getItem('playbackRateSpeed')).toBe('1.75');
    });
});
