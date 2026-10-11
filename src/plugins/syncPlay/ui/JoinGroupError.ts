import toast from 'components/toast/toast';
import globalize from 'lib/globalize';

import { getSyncPlayErrorStatus } from '../core/PlaybackRate';

/** Reports the same capability conflict in Modern and Legacy layouts. */
export function showJoinGroupError(error: unknown): void {
    const message = getSyncPlayErrorStatus(error) === 409 ?
        'MessageSyncPlayPlaybackRateNotSupported' :
        'MessageSyncPlayErrorAccessingGroups';
    toast(globalize.translate(message));
}
