package dev.powerguard.combat;

import dev.powerguard.PowerGuard;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.player.PlayerQuitEvent;

import java.util.Locale;

/** Starts combat on player-vs-player damage, clears it on death, and punishes combat logging. */
public final class CombatListener implements Listener {

    private final PowerGuard plugin;

    public CombatListener(PowerGuard plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onDamage(EntityDamageEvent event) {
        if (!(event.getEntity() instanceof Player victim) || DamageAttribution.isNpc(victim)) {
            return;
        }
        Player attacker = plugin.attribution().attacker(event);
        if (attacker == null || attacker.equals(victim)) {
            return;
        }
        String kind = DamageAttribution.kind(event).name().toLowerCase(Locale.ROOT);
        String key = kind.equals("explosion") ? "explosions" : kind.equals("projectile") ? "projectiles" : kind;
        if (plugin.getConfig().getBoolean("combat.tag-sources." + key, true)) {
            plugin.combat().tag(victim, attacker);
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onDeath(PlayerDeathEvent event) {
        plugin.combat().handleDeath(event.getPlayer());
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void onQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        CombatManager combat = plugin.combat();
        if (!combat.isTagged(player)) {
            return;
        }
        if (!shouldPunish(event.getReason())) {
            combat.handleDeath(player);
            return;
        }
        // Killing the player drops their items and XP at the logout spot (normal death drops,
        // so keepInventory and other death plugins behave as usual). PlayerDeathEvent clears the tags.
        player.setHealth(0);
        if (combat.isTagged(player)) {
            combat.handleDeath(player); // death was cancelled by another plugin
        }
        if (plugin.getConfig().getBoolean("combat.logout.broadcast", true)) {
            Bukkit.broadcast(plugin.messages().component("combat-logout-broadcast", "player", player.getName()));
        }
    }

    private boolean shouldPunish(PlayerQuitEvent.QuitReason reason) {
        if (!plugin.getConfig().getBoolean("combat.logout.kill", true) || Bukkit.isStopping()) {
            return false;
        }
        return switch (reason) {
            case DISCONNECTED -> true;
            case TIMED_OUT -> plugin.getConfig().getBoolean("combat.logout.punish-timeouts", true);
            default -> false; // kicks (admin or anti-cheat) and errors are never punished
        };
    }
}
