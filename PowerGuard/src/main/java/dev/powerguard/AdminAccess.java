package dev.powerguard;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.permissions.PermissionAttachment;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Grants powerguard.admin to the players listed under "admins" in config.yml (Haidak by default),
 * whether or not they are op.
 */
public final class AdminAccess implements Listener {

    private final PowerGuard plugin;
    private final Map<UUID, PermissionAttachment> attachments = new HashMap<>();

    public AdminAccess(PowerGuard plugin) {
        this.plugin = plugin;
    }

    private boolean isListed(Player player) {
        for (String name : plugin.getConfig().getStringList("admins")) {
            if (name.equalsIgnoreCase(player.getName())) {
                return true;
            }
        }
        return false;
    }

    private void apply(Player player) {
        PermissionAttachment old = attachments.remove(player.getUniqueId());
        if (old != null) {
            player.removeAttachment(old);
        }
        if (isListed(player)) {
            PermissionAttachment attachment = player.addAttachment(plugin);
            attachment.setPermission("powerguard.admin", true);
            attachments.put(player.getUniqueId(), attachment);
        }
        player.updateCommands();
    }

    /** Re-checks everyone online; used on enable and after /pg reload. */
    public void applyAll() {
        for (Player player : Bukkit.getOnlinePlayers()) {
            apply(player);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void onJoin(PlayerJoinEvent event) {
        apply(event.getPlayer());
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent event) {
        attachments.remove(event.getPlayer().getUniqueId());
    }
}
