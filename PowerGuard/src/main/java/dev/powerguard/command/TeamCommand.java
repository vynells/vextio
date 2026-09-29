package dev.powerguard.command;

import dev.powerguard.PowerGuard;
import dev.powerguard.gui.MainMenu;
import dev.powerguard.team.InviteManager;
import dev.powerguard.team.Team;
import dev.powerguard.team.TeamActions;
import dev.powerguard.team.TeamColor;
import dev.powerguard.team.TeamManager;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabExecutor;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** /team (alias /t). Without arguments it opens the team menu. */
public final class TeamCommand implements TabExecutor {

    private static final List<String> SUBCOMMANDS = List.of("create", "disband", "leave", "invite", "accept", "deny",
            "kick", "promote", "demote", "transfer", "sethome", "home", "setwarp", "warp", "delwarp", "warps", "echest",
            "info", "list", "chat", "rename", "friendlyfire", "color", "help");

    private final PowerGuard plugin;

    public TeamCommand(PowerGuard plugin) {
        this.plugin = plugin;
    }

    private TeamActions actions() {
        return plugin.teamActions();
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player player)) {
            if (args.length >= 1 && args[0].equalsIgnoreCase("list")) {
                actions().list(sender);
            } else {
                plugin.messages().send(sender, "players-only");
            }
            return true;
        }
        if (!actions().notInCombat(player)) {
            return true;
        }
        if (args.length == 0) {
            new MainMenu(plugin, player).open();
            return true;
        }
        String sub = args[0].toLowerCase(Locale.ROOT);
        String arg = args.length >= 2 ? args[1] : null;
        switch (sub) {
            case "create" -> {
                if (require(player, arg, "/" + label + " create <name>")) {
                    actions().create(player, arg);
                }
            }
            case "disband" -> {
                if ("confirm".equalsIgnoreCase(arg)) {
                    actions().confirmDisband(player);
                } else {
                    actions().requestDisband(player);
                }
            }
            case "leave" -> actions().leave(player);
            case "invite" -> {
                if (require(player, arg, "/" + label + " invite <player>")) {
                    Player target = Bukkit.getPlayerExact(arg);
                    if (target == null || !player.canSee(target)) {
                        plugin.messages().send(player, "player-not-found", "player", arg);
                    } else {
                        actions().invite(player, target);
                    }
                }
            }
            case "accept", "join" -> actions().accept(player, arg);
            case "deny", "decline" -> actions().deny(player, arg);
            case "kick" -> {
                if (require(player, arg, "/" + label + " kick <player>")) {
                    actions().kick(player, arg);
                }
            }
            case "promote" -> {
                if (require(player, arg, "/" + label + " promote <player>")) {
                    actions().promote(player, arg);
                }
            }
            case "demote" -> {
                if (require(player, arg, "/" + label + " demote <player>")) {
                    actions().demote(player, arg);
                }
            }
            case "transfer" -> {
                if (require(player, arg, "/" + label + " transfer <player>")) {
                    actions().transfer(player, arg);
                }
            }
            case "sethome" -> actions().setHome(player);
            case "home" -> actions().home(player);
            case "setwarp" -> {
                if (require(player, arg, "/" + label + " setwarp <name>")) {
                    actions().setWarp(player, arg);
                }
            }
            case "warp" -> {
                if (arg == null) {
                    actions().listWarps(player);
                } else {
                    actions().warp(player, arg);
                }
            }
            case "delwarp" -> {
                if (require(player, arg, "/" + label + " delwarp <name>")) {
                    actions().deleteWarp(player, arg);
                }
            }
            case "warps" -> actions().listWarps(player);
            case "echest", "ec", "enderchest" -> actions().openChest(player);
            case "info" -> info(player, arg);
            case "list" -> actions().list(player);
            case "chat", "c" -> actions().toggleChat(player);
            case "rename" -> {
                if (require(player, arg, "/" + label + " rename <name>")) {
                    actions().rename(player, arg);
                }
            }
            case "friendlyfire", "ff" -> {
                if (arg == null || !(arg.equalsIgnoreCase("on") || arg.equalsIgnoreCase("off"))) {
                    plugin.messages().send(player, "usage", "usage", "/" + label + " friendlyfire <on|off>");
                } else {
                    actions().setFriendlyFire(player, arg.equalsIgnoreCase("on"));
                }
            }
            case "color", "colour" -> {
                TeamColor color = arg == null ? null : TeamColor.parse(arg, null);
                if (color == null) {
                    plugin.messages().send(player, "usage", "usage", "/" + label + " color <colour>");
                } else {
                    actions().setColor(player, color);
                }
            }
            case "help" -> plugin.messages().send(player, "team-help");
            default -> plugin.messages().send(player, "unknown-subcommand");
        }
        return true;
    }

    private boolean require(Player player, String arg, String usage) {
        if (arg == null) {
            plugin.messages().send(player, "usage", "usage", usage);
            return false;
        }
        return true;
    }

    private void info(Player player, String teamName) {
        Team team = teamName == null ? actions().requireTeam(player) : plugin.teams().byName(teamName);
        if (team == null) {
            if (teamName != null) {
                plugin.messages().send(player, "team-not-found", "team", teamName);
            }
            return;
        }
        actions().info(player, team);
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (!(sender instanceof Player player)) {
            return List.of();
        }
        if (args.length == 1) {
            return filter(SUBCOMMANDS, args[0]);
        }
        if (args.length != 2) {
            return List.of();
        }
        Team team = plugin.teams().teamOf(player.getUniqueId());
        List<String> options = new ArrayList<>();
        switch (args[0].toLowerCase(Locale.ROOT)) {
            case "invite" -> {
                for (Player online : Bukkit.getOnlinePlayers()) {
                    if (player.canSee(online) && plugin.teams().teamOf(online.getUniqueId()) == null && !online.equals(player)) {
                        options.add(online.getName());
                    }
                }
            }
            case "kick", "promote", "demote", "transfer" -> {
                if (team != null) {
                    for (UUID member : team.members().keySet()) {
                        if (!member.equals(player.getUniqueId())) {
                            options.add(TeamManager.nameOf(member));
                        }
                    }
                }
            }
            case "warp", "delwarp", "setwarp" -> {
                if (team != null) {
                    options.addAll(team.warps().keySet());
                }
            }
            case "accept", "join", "deny", "decline" -> {
                for (InviteManager.Invite invite : plugin.invites().received(player.getUniqueId()).values()) {
                    Team invited = plugin.teams().byId(invite.teamId());
                    if (invited != null) {
                        options.add(invited.name());
                    }
                }
            }
            case "info" -> plugin.teams().teams().forEach(t -> options.add(t.name()));
            case "friendlyfire", "ff" -> options.addAll(List.of("on", "off"));
            case "color", "colour" -> {
                for (TeamColor color : TeamColor.values()) {
                    options.add(color.name().toLowerCase(Locale.ROOT));
                }
            }
            case "disband" -> options.add("confirm");
            default -> {
                return List.of();
            }
        }
        return filter(options, args[1]);
    }

    static List<String> filter(List<String> options, String prefix) {
        String lower = prefix.toLowerCase(Locale.ROOT);
        List<String> result = new ArrayList<>();
        for (String option : options) {
            if (option.toLowerCase(Locale.ROOT).startsWith(lower)) {
                result.add(option);
            }
        }
        return result;
    }
}
