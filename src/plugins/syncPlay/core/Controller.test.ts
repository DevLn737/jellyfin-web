import { describe, expect, it, vi } from 'vitest';

import Controller from './Controller';

describe('Controller.setPlaybackRate', () => {
    it('sends the requested rate without changing the local player', async () => {
        const ajax = vi.fn().mockResolvedValue(undefined);
        const apiClient = {
            ajax,
            getUrl: vi.fn((path: string) => `/api/${path}`)
        };
        const manager = {
            getApiClient: vi.fn(() => apiClient),
            getPlayerWrapper: vi.fn()
        };
        const controller = new Controller();
        controller.init(manager);

        await controller.setPlaybackRate(1.5);

        expect(ajax).toHaveBeenCalledWith({
            type: 'POST',
            data: JSON.stringify({ PlaybackRate: 1.5 }),
            url: '/api/SyncPlay/SetPlaybackRate',
            contentType: 'application/json'
        });
        expect(manager.getPlayerWrapper).not.toHaveBeenCalled();
    });
});
