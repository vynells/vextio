package dev.powerguard.combat;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/** One player's combat state: when it ends and who they are fighting. */
final class CombatTag {

    private long expiresAt;
    private long durationMillis;
    private final Set<UUID> opponents = new HashSet<>();

    CombatTag(long durationMillis) {
        refresh(durationMillis);
    }

    void refresh(long durationMillis) {
        this.durationMillis = durationMillis;
        this.expiresAt = System.currentTimeMillis() + durationMillis;
    }

    long millisLeft() {
        return Math.max(0, expiresAt - System.currentTimeMillis());
    }

    /** Remaining fraction of the tag, from 1 (just hit) to 0 (expired). */
    float progress() {
        return durationMillis <= 0 ? 0f : Math.max(0f, Math.min(1f, (float) millisLeft() / durationMillis));
    }

    int secondsLeft() {
        return (int) ((millisLeft() + 999) / 1000);
    }

    Set<UUID> opponents() {
        return opponents;
    }
}
