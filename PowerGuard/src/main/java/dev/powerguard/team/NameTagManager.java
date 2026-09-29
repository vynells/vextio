package dev.powerguard.team;

import dev.powerguard.PowerGuard;
import dev.powerguard.util.Text;
import net.kyori.adventure.text.Component;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Puts the team tag in front of player names in chat (display name) and the tab list.
 * Only names PowerGuard changed are ever reset, so other plugins' names are left alone.
 */
public final class NameTagManager implements Listener {

    private final PowerGuard plugin;
    private final Set<UUID> chatTagged = new HashSet<>();
    private final Set<UUID> tabTagged = new HashSet<>();

    public NameTagManager(PowerGuard plugin) {
        this.plugin = plugin;
    }

    public void apply(Player player) {
        if (player.hasMetadata("NPC")) {
            return;
        }
        Team team = plugin.teams().teamOf(player.getUniqueId());
        Component tagged = null;
        if (team != null) {
            String prefix = Text.apply(plugin.getConfig().getString("teams.nametags.format", "{color}[{team}] "),
                    Text.pairs("color", team.color().code(), "team", team.name()));
            tagged = Text.parse(prefix).append(Component.text(player.getName()));
        }
        boolean chat = team != null && plugin.getConfig().getBoolean("teams.nametags.chat");
        boolean tab = team != null && plugin.getConfig().getBoolean("teams.nametags.tablist");
        UUID uuid = player.getUniqueId();
        if (chat) {
            player.displayName(tagged);
            chatTagged.add(uuid);
        } else if (chatTagged.remove(uuid)) {
            player.displayName(null);
        }
        if (tab) {
            player.playerListName(tagged);
            tabTagged.add(uuid);
        } else if (tabTagged.remove(uuid)) {
            player.playerListName(null);
        }
    }

    public void applyAll() {
        for (Player player : Bukkit.getOnlinePlayers()) {
            apply(player);
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onJoin(PlayerJoinEvent event) {
        apply(event.getPlayer());
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent event) {
        chatTagged.remove(event.getPlayer().getUniqueId());
        tabTagged.remove(event.getPlayer().getUniqueId());
    }
}
