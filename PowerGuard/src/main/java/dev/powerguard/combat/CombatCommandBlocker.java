package dev.powerguard.combat;

import dev.powerguard.PowerGuard;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerCommandPreprocessEvent;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Blocks commands while in combat. Handles namespaced forms (minecraft:tp, essentials:home) and
 * aliases: a command is matched by the typed label, the label without its namespace, and the real
 * command's name and aliases.
 */
public final class CombatCommandBlocker implements Listener {

    private static final Set<String> TEAM_COMMANDS = Set.of("team", "t");
    private static final Set<String> ADMIN_COMMANDS = Set.of("powerguard", "pg");

    private final PowerGuard plugin;

    public CombatCommandBlocker(PowerGuard plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onCommand(PlayerCommandPreprocessEvent event) {
        Player player = event.getPlayer();
        if (!plugin.combat().isTagged(player)) {
            return;
        }
        String label = event.getMessage().substring(1).trim().split("\\s+", 2)[0].toLowerCase(Locale.ROOT);
        if (label.isEmpty()) {
            return;
        }
        Set<String> names = namesFor(label);
        if (containsAny(names, ADMIN_COMMANDS) && player.hasPermission("powerguard.admin")) {
            return;
        }
        if (containsAny(names, TEAM_COMMANDS) && isPowerGuardTeamCommand(label)) {
            event.setCancelled(true);
            plugin.messages().send(player, "combat-team-blocked");
            return;
        }
        if (player.hasPermission("powerguard.bypass.commands")) {
            return;
        }
        boolean whitelist = "WHITELIST".equalsIgnoreCase(plugin.getConfig().getString("combat.commands.mode", "BLACKLIST"));
        boolean blocked = whitelist
                ? !containsAny(names, lower(plugin.getConfig().getStringList("combat.commands.allowed")))
                : containsAny(names, lower(plugin.getConfig().getStringList("combat.commands.blocked")));
        if (blocked) {
            event.setCancelled(true);
            plugin.messages().send(player, "combat-command-blocked", "command", label);
        }
    }

    /** The typed label, without namespace, plus the resolved command's name and aliases. */
    private static Set<String> namesFor(String label) {
        Set<String> names = new HashSet<>();
        names.add(label);
        int colon = label.indexOf(':');
        if (colon >= 0 && colon < label.length() - 1) {
            names.add(label.substring(colon + 1));
        }
        Command command = Bukkit.getCommandMap().getCommand(label);
        if (command != null) {
            names.add(command.getName().toLowerCase(Locale.ROOT));
            for (String alias : command.getAliases()) {
                names.add(alias.toLowerCase(Locale.ROOT));
            }
        }
        return names;
    }

    /** /t could belong to another plugin; only block it if it resolves to PowerGuard's /team. */
    private boolean isPowerGuardTeamCommand(String label) {
        Command command = Bukkit.getCommandMap().getCommand(label);
        return command == null || command.equals(plugin.getCommand("team"));
    }

    private static Set<String> lower(List<String> list) {
        Set<String> set = new HashSet<>();
        for (String entry : list) {
            set.add(entry.toLowerCase(Locale.ROOT).replaceFirst("^/", ""));
        }
        return set;
    }

    private static boolean containsAny(Set<String> names, Set<String> list) {
        for (String name : names) {
            if (list.contains(name)) {
                return true;
            }
        }
        return false;
    }
}
