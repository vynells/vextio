package dev.powerguard.team;

import dev.powerguard.PowerGuard;
import net.kyori.adventure.title.Title;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Sound;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.event.player.PlayerTeleportEvent;
import org.bukkit.scheduler.BukkitTask;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Warm-up before /team home and /team warp, with an on-screen countdown. */
public final class TeleportWarmup implements Listener {

    private static final class Pending {
        private final Player player;
        private final TeamLocation target;
        private final Location start;
        private int ticksLeft;
        private BukkitTask task;

        private Pending(Player player, TeamLocation target, int ticks) {
            this.player = player;
            this.target = target;
            this.start = player.getLocation();
            this.ticksLeft = ticks;
        }
    }

    private final PowerGuard plugin;
    private final Map<UUID, Pending> pending = new HashMap<>();

    public TeleportWarmup(PowerGuard plugin) {
        this.plugin = plugin;
    }

    public void start(Player player, TeamLocation target) {
        cancel(player, null);
        int seconds = plugin.getConfig().getInt("teams.teleport.warmup-seconds", 3);
        if (seconds <= 0 || player.hasPermission("powerguard.bypass.warmup")) {
            teleport(player, target);
            return;
        }
        Pending entry = new Pending(player, target, seconds * 20);
        pending.put(player.getUniqueId(), entry);
        plugin.messages().send(player, "teleport-warmup", "seconds", String.valueOf(seconds));
        showCountdown(player, seconds);
        entry.task = Bukkit.getScheduler().runTaskTimer(plugin, () -> tick(entry), 1L, 1L);
    }

    private void tick(Pending entry) {
        Player player = entry.player;
        if (!player.isOnline()) {
            cancel(player, null);
            return;
        }
        if (plugin.getConfig().getBoolean("teams.teleport.cancel-on-move", true) && moved(entry.start, player.getLocation())) {
            cancel(player, "teleport-cancelled-move");
            return;
        }
        entry.ticksLeft--;
        if (entry.ticksLeft <= 0) {
            pending.remove(player.getUniqueId());
            entry.task.cancel();
            player.clearTitle();
            teleport(player, entry.target);
            return;
        }
        if (entry.ticksLeft % 20 == 0) {
            showCountdown(player, entry.ticksLeft / 20);
        }
    }

    private static boolean moved(Location from, Location to) {
        return from.getWorld() != to.getWorld()
                || from.getBlockX() != to.getBlockX()
                || from.getBlockY() != to.getBlockY()
                || from.getBlockZ() != to.getBlockZ();
    }

    private void showCountdown(Player player, int seconds) {
        String mode = plugin.getConfig().getString("teams.teleport.countdown-display", "TITLE").toUpperCase(java.util.Locale.ROOT);
        String secondsText = String.valueOf(seconds);
        if (mode.equals("TITLE") || mode.equals("BOTH")) {
            player.showTitle(Title.title(
                    plugin.messages().component("teleport-countdown-title", "seconds", secondsText),
                    plugin.messages().component("teleport-countdown-subtitle", "seconds", secondsText),
                    Title.Times.times(Duration.ZERO, Duration.ofMillis(1100), Duration.ofMillis(200))));
        }
        if (mode.equals("ACTIONBAR") || mode.equals("BOTH")) {
            player.sendActionBar(plugin.messages().component("teleport-countdown-actionbar", "seconds", secondsText));
        }
        player.playSound(player.getLocation(), Sound.BLOCK_NOTE_BLOCK_HAT, 0.6f, 1.4f);
    }

    private void teleport(Player player, TeamLocation target) {
        Location location = target.toLocation();
        if (location == null) {
            plugin.messages().send(player, "location-world-missing", "world", target.world());
            return;
        }
        player.teleportAsync(location, PlayerTeleportEvent.TeleportCause.PLUGIN).thenAccept(success -> {
            if (success) {
                plugin.messages().send(player, "teleport-done");
                player.playSound(player.getLocation(), Sound.ENTITY_ENDERMAN_TELEPORT, 0.7f, 1.2f);
            }
        });
    }

    /** Cancels a pending teleport, sending the given message key if not null. */
    public void cancel(Player player, String messageKey) {
        Pending entry = pending.remove(player.getUniqueId());
        if (entry == null) {
            return;
        }
        entry.task.cancel();
        if (player.isOnline()) {
            player.clearTitle();
            if (messageKey != null) {
                plugin.messages().send(player, messageKey);
                player.playSound(player.getLocation(), Sound.ENTITY_VILLAGER_NO, 0.7f, 1f);
            }
        }
    }

    public void cancelAll() {
        for (Pending entry : Map.copyOf(pending).values()) {
            cancel(entry.player, null);
        }
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onDamage(EntityDamageEvent event) {
        if (event.getEntity() instanceof Player player
                && plugin.getConfig().getBoolean("teams.teleport.cancel-on-damage", true)) {
            cancel(player, "teleport-cancelled-damage");
        }
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        cancel(event.getPlayer(), null);
    }
}
