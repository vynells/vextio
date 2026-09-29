package dev.powerguard.command;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.Team;
import dev.powerguard.team.TeamManager;
import dev.powerguard.team.TeamRank;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabExecutor;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** /powerguard (alias /pg): reload, combat status, untag, exempt and team administration. */
public final class AdminCommand implements TabExecutor {

    private final PowerGuard plugin;

    public AdminCommand(PowerGuard plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("powerguard.admin")) {
            plugin.messages().send(sender, "no-permission");
            return true;
        }
        if (args.length == 0) {
            plugin.messages().send(sender, "admin-help");
            return true;
        }
        switch (args[0].toLowerCase(Locale.ROOT)) {
            case "reload" -> {
                plugin.reload();
                plugin.messages().send(sender, "reloaded");
            }
            case "combat" -> {
                Player target = onlineTarget(sender, args);
                if (target != null) {
                    showStatus(sender, target);
                }
            }
            case "untag" -> {
                Player target = onlineTarget(sender, args);
                if (target != null) {
                    plugin.combat().handleDeath(target);
                    plugin.messages().send(sender, "admin-untagged", "player", target.getName());
                }
            }
            case "exempt" -> exempt(sender, args);
            case "team" -> team(sender, args);
            default -> plugin.messages().send(sender, "admin-help");
        }
        return true;
    }

    private Player onlineTarget(CommandSender sender, String[] args) {
        if (args.length < 2) {
            plugin.messages().send(sender, "usage", "usage", "/pg " + args[0].toLowerCase(Locale.ROOT) + " <player>");
            return null;
        }
        Player target = Bukkit.getPlayerExact(args[1]);
        if (target == null) {
            plugin.messages().send(sender, "player-not-found", "player", args[1]);
        }
        return target;
    }

    private void showStatus(CommandSender sender, Player target) {
        String status;
        if (plugin.combat().isTagged(target)) {
            List<String> opponents = plugin.combat().opponentNames(target);
            status = plugin.messages().raw("admin-combat-in")
                    .replace("{seconds}", String.valueOf(plugin.combat().secondsLeft(target)))
                    .replace("{opponents}", opponents.isEmpty() ? "-" : String.join(", ", opponents));
        } else {
            status = plugin.messages().raw("admin-combat-out");
        }
        if (plugin.combat().exemptions().isExempt(target.getUniqueId())) {
            status += " " + plugin.messages().raw("admin-combat-exempt");
        }
        plugin.messages().send(sender, "admin-combat-status", "player", target.getName(), "status", status);
    }

    private void exempt(CommandSender sender, String[] args) {
        if (args.length < 2) {
            plugin.messages().send(sender, "usage", "usage", "/pg exempt <player>");
            return;
        }
        OfflinePlayer target = Bukkit.getOfflinePlayerIfCached(args[1]);
        if (target == null) {
            plugin.messages().send(sender, "player-not-found", "player", args[1]);
            return;
        }
        boolean exempt = plugin.combat().exemptions().toggle(target.getUniqueId());
        if (exempt && target.getPlayer() != null) {
            plugin.combat().handleDeath(target.getPlayer());
        }
        String name = target.getName() == null ? args[1] : target.getName();
        plugin.messages().send(sender, exempt ? "admin-exempt-on" : "admin-exempt-off", "player", name);
    }

    private void team(CommandSender sender, String[] args) {
        if (args.length < 3) {
            plugin.messages().send(sender, "usage", "usage", "/pg team <name> info|disband|kick <player>");
            return;
        }
        Team team = plugin.teams().byName(args[1]);
        if (team == null) {
            plugin.messages().send(sender, "team-not-found", "team", args[1]);
            return;
        }
        switch (args[2].toLowerCase(Locale.ROOT)) {
            case "info" -> plugin.teamActions().info(sender, team);
            case "disband" -> {
                String name = team.name();
                plugin.teamActions().disband(team, sender);
                plugin.messages().send(sender, "admin-team-disbanded", "team", name);
            }
            case "kick" -> {
                if (args.length < 4) {
                    plugin.messages().send(sender, "usage", "usage", "/pg team <name> kick <player>");
                    return;
                }
                UUID member = null;
                for (UUID uuid : team.members().keySet()) {
                    if (TeamManager.nameOf(uuid).equalsIgnoreCase(args[3])) {
                        member = uuid;
                    }
                }
                if (member == null) {
                    plugin.messages().send(sender, "player-not-found", "player", args[3]);
                } else if (team.rankOf(member) == TeamRank.OWNER) {
                    plugin.messages().send(sender, "admin-cannot-kick-owner");
                } else {
                    plugin.teamActions().removeFromTeam(team, member);
                    Player online = Bukkit.getPlayer(member);
                    if (online != null) {
                        plugin.messages().send(online, "kicked", "team", team.name(), "color", team.color().code());
                    }
                    plugin.messages().send(sender, "admin-team-kicked", "player", args[3], "team", team.name());
                }
            }
            default -> plugin.messages().send(sender, "usage", "usage", "/pg team <name> info|disband|kick <player>");
        }
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (!sender.hasPermission("powerguard.admin")) {
            return List.of();
        }
        List<String> options = new ArrayList<>();
        if (args.length == 1) {
            options.addAll(List.of("reload", "combat", "untag", "exempt", "team"));
        } else if (args.length == 2 && List.of("combat", "untag", "exempt").contains(args[0].toLowerCase(Locale.ROOT))) {
            Bukkit.getOnlinePlayers().forEach(player -> options.add(player.getName()));
        } else if (args.length == 2 && args[0].equalsIgnoreCase("team")) {
            plugin.teams().teams().forEach(team -> options.add(team.name()));
        } else if (args.length == 3 && args[0].equalsIgnoreCase("team")) {
            options.addAll(List.of("info", "disband", "kick"));
        } else if (args.length == 4 && args[0].equalsIgnoreCase("team") && args[2].equalsIgnoreCase("kick")) {
            Team team = plugin.teams().byName(args[1]);
            if (team != null) {
                team.members().keySet().forEach(uuid -> options.add(TeamManager.nameOf(uuid)));
            }
        }
        return TeamCommand.filter(options, args[args.length - 1]);
    }
}
