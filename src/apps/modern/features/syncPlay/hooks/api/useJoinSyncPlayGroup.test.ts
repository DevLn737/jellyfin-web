import { describe, expect, it, vi } from 'vitest';
import { useMutation } from '@tanstack/react-query';

import { useJoinSyncPlayGroup } from './useJoinSyncPlayGroup';

const toast = vi.hoisted(() => vi.fn());
vi.mock('components/toast/toast', () => ({ default: toast }));
vi.mock('lib/globalize', () => ({ default: { translate: (key: string) => key } }));
vi.mock('hooks/useApi', () => ({ useApi: () => ({ api: {} }) }));
vi.mock('utils/query/queryClient', () => ({ queryClient: { invalidateQueries: vi.fn() } }));
vi.mock('@tanstack/react-query', () => ({ useMutation: vi.fn(() => ({})) }));

describe('Modern SyncPlay group join', () => {
    it('shows the capability explanation for an SDK 409 response', () => {
        useJoinSyncPlayGroup();
        const options = vi.mocked(useMutation).mock.calls[0][0] as {
            onError: (error: unknown) => void;
        };

        options.onError({ response: { status: 409 } });

        expect(toast).toHaveBeenCalledWith('MessageSyncPlayPlaybackRateNotSupported');
    });
});
