package dev.powerguard.combat;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.TeamManager;
import org.bukkit.Bukkit;
import org.bukkit.Sound;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Tracks who is in combat, with whom, and for how long. */
public final class CombatManager {

    private final PowerGuard plugin;
    private final CombatDisplay display;
    private final CombatExemptions exemptions;
    private final Map<UUID, CombatTag> tags = new HashMap<>();

    public CombatManager(PowerGuard plugin) {
        this.plugin = plugin;
        this.display = new CombatDisplay(plugin);
        this.exemptions = new CombatExemptions(plugin);
    }

    public void start() {
        exemptions.load();
        Bukkit.getScheduler().runTaskTimer(plugin, this::tick, 2L, 2L);
    }

    public CombatExemptions exemptions() {
        return exemptions;
    }

    public boolean isTagged(Player player) {
        return tags.containsKey(player.getUniqueId());
    }

    public int secondsLeft(Player player) {
        CombatTag tag = tags.get(player.getUniqueId());
        return tag == null ? 0 : tag.secondsLeft();
    }

    public List<String> opponentNames(Player player) {
        CombatTag tag = tags.get(player.getUniqueId());
        List<String> names = new ArrayList<>();
        if (tag != null) {
            for (UUID opponent : tag.opponents()) {
                names.add(TeamManager.nameOf(opponent));
            }
        }
        return names;
    }

    private long durationMillis() {
        return Math.max(1, plugin.getConfig().getLong("combat.duration-seconds", 20)) * 1000L;
    }

    /** Tags both players (unless exempt) and links them as opponents. */
    public void tag(Player victim, Player attacker) {
        if (victim.equals(attacker)
                || plugin.getConfig().getStringList("combat.disabled-worlds").contains(victim.getWorld().getName())) {
            return;
        }
        tagOne(victim, attacker);
        tagOne(attacker, victim);
    }

    private void tagOne(Player player, Player opponent) {
        if (exemptions.isExempt(player.getUniqueId())) {
            return;
        }
        CombatTag tag = tags.get(player.getUniqueId());
        if (tag == null) {
            tag = new CombatTag(durationMillis());
            tags.put(player.getUniqueId(), tag);
            onEnter(player);
        } else {
            tag.refresh(durationMillis());
        }
        if (!exemptions.isExempt(opponent.getUniqueId())) {
            tag.opponents().add(opponent.getUniqueId());
        }
        display.show(player, tag);
    }

    private void onEnter(Player player) {
        plugin.messages().send(player, "combat-enter", "seconds", String.valueOf(durationMillis() / 1000));
        player.playSound(player.getLocation(), Sound.ENTITY_ELDER_GUARDIAN_CURSE, 0.35f, 1.6f);
        // Team features are off-limits in combat: shut anything team-related that is open.
        plugin.teamChests().closeFor(player);
        plugin.menus().closeFor(player);
        plugin.warmup().cancel(player, "teleport-cancelled-combat");
    }

    /** Removes a player's tag. */
    public void untag(Player player, boolean notify) {
        CombatTag tag = tags.remove(player.getUniqueId());
        if (tag == null) {
            return;
        }
        display.hide(player);
        if (notify) {
            plugin.messages().send(player, "combat-leave");
            player.playSound(player.getLocation(), Sound.BLOCK_NOTE_BLOCK_CHIME, 0.7f, 1.4f);
        }
    }

    /**
     * Clears combat after a death, combat-log kill or unpunished logout: the player is untagged, and
     * each of their opponents who has nobody else left to fight is untagged too.
     */
    public void handleDeath(Player dead) {
        CombatTag tag = tags.get(dead.getUniqueId());
        untag(dead, false);
        if (tag == null) {
            return;
        }
        for (UUID opponentId : tag.opponents()) {
            CombatTag opponentTag = tags.get(opponentId);
            if (opponentTag == null) {
                continue;
            }
            opponentTag.opponents().remove(dead.getUniqueId());
            Player opponent = Bukkit.getPlayer(opponentId);
            if (opponentTag.opponents().isEmpty() && opponent != null) {
                untag(opponent, true);
            }
        }
    }

    private void tick() {
        Iterator<Map.Entry<UUID, CombatTag>> iterator = tags.entrySet().iterator();
        List<Player> expired = new ArrayList<>();
        while (iterator.hasNext()) {
            Map.Entry<UUID, CombatTag> entry = iterator.next();
            Player player = Bukkit.getPlayer(entry.getKey());
            if (player == null) {
                iterator.remove();
                continue;
            }
            if (entry.getValue().millisLeft() <= 0) {
                expired.add(player);
            } else {
                display.show(player, entry.getValue());
            }
        }
        for (Player player : expired) {
            untag(player, true);
        }
    }

    public void reload() {
        display.reload();
    }

    /** Hides every display; used on shutdown. */
    public void clearAll() {
        for (UUID uuid : List.copyOf(tags.keySet())) {
            Player player = Bukkit.getPlayer(uuid);
            if (player != null) {
                untag(player, false);
            }
        }
        tags.clear();
    }
}
