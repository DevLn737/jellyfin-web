import { beforeEach, describe, expect, it, vi } from 'vitest';

import groupSelectionMenu from './groupSelectionMenu';

const toast = vi.hoisted(() => vi.fn());
vi.mock('components/toast/toast', () => ({ default: toast }));
vi.mock('lib/globalize', () => ({ default: { translate: (key: string) => key } }));
vi.mock('components/pluginManager', () => ({ pluginManager: { firstOfType: () => undefined } }));
vi.mock('utils/events', () => ({ default: { on: vi.fn() } }));
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));
vi.mock('components/loading/loading', () => ({ default: { hide: vi.fn() } }));
vi.mock('components/actionSheet/actionSheet', () => ({ default: { show: vi.fn(() => Promise.resolve('group')) } }));
vi.mock('./settings/SettingsEditor', () => ({ default: vi.fn() }));
vi.mock('./playbackPermissionManager', () => ({ default: {} }));

describe('Legacy SyncPlay group join', () => {
    beforeEach(() => {
        toast.mockClear();
    });

    it.each([
        [409, 'MessageSyncPlayPlaybackRateNotSupported'],
        [500, 'MessageSyncPlayErrorAccessingGroups']
    ])('reports HTTP %s without an unhandled join rejection', async (status, message) => {
        const apiClient = {
            getSyncPlayGroups: vi.fn(() => Promise.resolve({
                json: () => Promise.resolve([{ GroupId: 'group', GroupName: 'Test', Participants: [] }])
            })),
            joinSyncPlayGroup: vi.fn(() => Promise.reject(Object.assign(new Error('Join rejected'), { status })))
        };

        await groupSelectionMenu.showNewJoinGroupSelection(document.createElement('button'), {
            localUser: { Policy: { SyncPlayAccess: 'JoinGroups' } }
        }, apiClient);

        expect(apiClient.joinSyncPlayGroup).toHaveBeenCalledWith({ GroupId: 'group' });
        expect(toast).toHaveBeenCalledWith(message);
    });
});
