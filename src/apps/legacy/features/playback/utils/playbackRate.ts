interface PlaybackRatePlayer {
    setPlaybackRate: (value: string) => void;
}

/** Restores the personal speed only outside a server-controlled SyncPlay group. */
export function restoreSavedPlaybackRate(player: PlaybackRatePlayer, syncPlayEnabled: boolean): void {
    if (syncPlayEnabled) return;

    const savedRate = sessionStorage.getItem('playbackRateSpeed');
    if (savedRate !== null) {
        player.setPlaybackRate(savedRate);
    }
}
