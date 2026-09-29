package dev.powerguard.team;

import dev.powerguard.PowerGuard;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.util.Collections;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Pending team invites with expiry. Keyed by the invited player, then by team id. */
public final class InviteManager {

    /** When the invite expires, in epoch millis. */
    public record Invite(UUID teamId, UUID inviter, long expiresAt) {
        public long secondsLeft() {
            return Math.max(0, (expiresAt - System.currentTimeMillis() + 999) / 1000);
        }
    }

    private final PowerGuard plugin;
    private final Map<UUID, Map<UUID, Invite>> invites = new ConcurrentHashMap<>();

    public InviteManager(PowerGuard plugin) {
        this.plugin = plugin;
    }

    public void start() {
        Bukkit.getScheduler().runTaskTimer(plugin, this::expire, 20L, 20L);
    }

    public void invite(UUID target, Team team, UUID inviter) {
        long expires = System.currentTimeMillis() + plugin.getConfig().getLong("teams.invite-expire-seconds", 120) * 1000L;
        invites.computeIfAbsent(target, key -> new LinkedHashMap<>()).put(team.id(), new Invite(team.id(), inviter, expires));
    }

    public boolean has(UUID target, Team team) {
        Map<UUID, Invite> map = invites.get(target);
        return map != null && map.containsKey(team.id());
    }

    /** Invites received by a player, oldest first. */
    public Map<UUID, Invite> received(UUID target) {
        Map<UUID, Invite> map = invites.get(target);
        return map == null ? Map.of() : Collections.unmodifiableMap(map);
    }

    /** Invites sent by a team, keyed by invited player. */
    public Map<UUID, Invite> sent(Team team) {
        Map<UUID, Invite> result = new LinkedHashMap<>();
        for (Map.Entry<UUID, Map<UUID, Invite>> entry : invites.entrySet()) {
            Invite invite = entry.getValue().get(team.id());
            if (invite != null) {
                result.put(entry.getKey(), invite);
            }
        }
        return result;
    }

    public void remove(UUID target, Team team) {
        Map<UUID, Invite> map = invites.get(target);
        if (map != null) {
            map.remove(team.id());
            if (map.isEmpty()) {
                invites.remove(target);
            }
        }
    }

    public void clearPlayer(UUID target) {
        invites.remove(target);
    }

    public void clearTeam(Team team) {
        for (UUID target : Map.copyOf(invites).keySet()) {
            remove(target, team);
        }
    }

    private void expire() {
        long now = System.currentTimeMillis();
        for (Map.Entry<UUID, Map<UUID, Invite>> entry : invites.entrySet()) {
            Iterator<Invite> iterator = entry.getValue().values().iterator();
            while (iterator.hasNext()) {
                Invite invite = iterator.next();
                if (invite.expiresAt() > now) {
                    continue;
                }
                iterator.remove();
                Team team = plugin.teams().byId(invite.teamId());
                Player player = Bukkit.getPlayer(entry.getKey());
                if (team != null && player != null) {
                    plugin.messages().send(player, "invite-expired", "team", team.name(), "color", team.color().code());
                }
            }
        }
        invites.values().removeIf(Map::isEmpty);
    }
}
