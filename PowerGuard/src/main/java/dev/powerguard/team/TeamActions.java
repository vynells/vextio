package dev.powerguard.team;

import dev.powerguard.Messages;
import dev.powerguard.PowerGuard;
import org.bukkit.Bukkit;
import org.bukkit.Sound;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Every player-facing team action, with its permission checks and messages. Both /team and the GUI
 * call these, so the rules are identical everywhere.
 */
public final class TeamActions {

    private static final Pattern WARP_NAME = Pattern.compile("^[A-Za-z0-9_]{1,16}$");
    private static final long DISBAND_CONFIRM_MILLIS = 15_000L;

    private final PowerGuard plugin;
    private final Map<UUID, Long> disbandRequests = new HashMap<>();

    public TeamActions(PowerGuard plugin) {
        this.plugin = plugin;
    }

    private Messages msg() {
        return plugin.messages();
    }

    private TeamManager teams() {
        return plugin.teams();
    }

    private static String[] teamVars(Team team, String... extra) {
        String[] vars = new String[extra.length + 4];
        vars[0] = "team";
        vars[1] = team.name();
        vars[2] = "color";
        vars[3] = team.color().code();
        System.arraycopy(extra, 0, vars, 4, extra.length);
        return vars;
    }

    /** True if the player may use team features right now (not in combat). */
    public boolean notInCombat(Player player) {
        if (plugin.combat().isTagged(player)) {
            msg().send(player, "combat-team-blocked");
            return false;
        }
        return true;
    }

    /** The player's team, or null after telling them they have none. */
    public Team requireTeam(Player player) {
        Team team = teams().teamOf(player.getUniqueId());
        if (team == null) {
            msg().send(player, "not-in-team");
        }
        return team;
    }

    public TeamRank requiredRank(String action) {
        return TeamRank.parse(plugin.getConfig().getString("teams.rank-permissions." + action), TeamRank.OFFICER);
    }

    public boolean can(Player player, Team team, String action) {
        TeamRank rank = team.rankOf(player.getUniqueId());
        return rank != null && rank.isAtLeast(requiredRank(action));
    }

    private boolean check(Player player, Team team, String action) {
        if (can(player, team, action)) {
            return true;
        }
        msg().send(player, "rank-too-low", "rank", requiredRank(action).displayName());
        fail(player);
        return false;
    }

    private boolean ownerOnly(Player player, Team team) {
        if (team.rankOf(player.getUniqueId()) == TeamRank.OWNER) {
            return true;
        }
        msg().send(player, "owner-only");
        fail(player);
        return false;
    }

    private void fail(Player player) {
        plugin.menuSounds().error(player);
    }

    private void success(Player player) {
        plugin.menuSounds().success(player);
    }

    private void broadcast(Team team, String key, String... vars) {
        for (Player member : teams().onlineMembers(team)) {
            msg().send(member, key, vars);
        }
    }

    // ------------------------------------------------------------------ names

    /** Validates a team name, telling the player why it's rejected. */
    public boolean validName(Player player, String name) {
        int min = plugin.getConfig().getInt("teams.name-min-length", 3);
        int max = plugin.getConfig().getInt("teams.name-max-length", 16);
        String pattern = plugin.getConfig().getString("teams.name-pattern", "^[A-Za-z0-9_]+$");
        if (name.length() < min || name.length() > max || !Pattern.compile(pattern).matcher(name).matches()) {
            msg().send(player, "team-name-invalid", "min", String.valueOf(min), "max", String.valueOf(max));
            fail(player);
            return false;
        }
        if (teams().byName(name) != null) {
            msg().send(player, "team-name-taken", "team", name);
            fail(player);
            return false;
        }
        return true;
    }

    // ------------------------------------------------------------------ lifecycle

    public void create(Player player, String name) {
        if (!player.hasPermission("powerguard.team.create")) {
            msg().send(player, "no-permission");
            return;
        }
        if (teams().teamOf(player.getUniqueId()) != null) {
            msg().send(player, "already-in-team");
            fail(player);
            return;
        }
        if (!validName(player, name)) {
            return;
        }
        Team team = teams().create(name, player);
        plugin.invites().clearPlayer(player.getUniqueId());
        msg().send(player, "team-created", teamVars(team));
        success(player);
    }

    /** /team disband: asks for confirmation first. */
    public void requestDisband(Player player) {
        Team team = requireTeam(player);
        if (team == null || !ownerOnly(player, team)) {
            return;
        }
        disbandRequests.put(player.getUniqueId(), System.currentTimeMillis() + DISBAND_CONFIRM_MILLIS);
        msg().send(player, "team-disband-confirm", teamVars(team));
    }

    /** /team disband confirm */
    public void confirmDisband(Player player) {
        Long expires = disbandRequests.remove(player.getUniqueId());
        if (expires == null || expires < System.currentTimeMillis()) {
            requestDisband(player);
            return;
        }
        disbandNow(player);
    }

    /** Disbands the player's own team (already confirmed, e.g. from the GUI). */
    public void disbandNow(Player player) {
        Team team = requireTeam(player);
        if (team == null || !ownerOnly(player, team)) {
            return;
        }
        disband(team, player);
    }

    /** Disbands a team. Ender chest items go to the recipient (or are dropped at their feet). */
    public void disband(Team team, CommandSender recipient) {
        List<ItemStack> items = plugin.teamChests().drain(team);
        if (recipient instanceof Player player) {
            for (ItemStack leftover : player.getInventory().addItem(items.toArray(new ItemStack[0])).values()) {
                player.getWorld().dropItemNaturally(player.getLocation(), leftover);
            }
        } else if (!items.isEmpty()) {
            plugin.getLogger().warning("Team " + team.name() + " was disbanded from the console; "
                    + items.size() + " ender chest stacks were discarded.");
        }
        broadcast(team, "team-disbanded", teamVars(team));
        plugin.invites().clearTeam(team);
        teams().disband(team);
    }

    public void leave(Player player) {
        Team team = requireTeam(player);
        if (team == null) {
            return;
        }
        if (team.rankOf(player.getUniqueId()) == TeamRank.OWNER) {
            msg().send(player, "owner-cannot-leave");
            fail(player);
            return;
        }
        removeFromTeam(team, player.getUniqueId());
        msg().send(player, "left-team", teamVars(team));
        broadcast(team, "member-left", "player", player.getName());
    }

    /** Removes a member and closes anything team-only they had open. */
    public void removeFromTeam(Team team, UUID uuid) {
        teams().removeMember(team, uuid);
        Player online = Bukkit.getPlayer(uuid);
        if (online != null) {
            plugin.teamChests().closeFor(online);
            plugin.teamChat().disable(uuid);
        }
    }

    // ------------------------------------------------------------------ invites

    public void invite(Player player, Player target) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "invite")) {
            return;
        }
        if (target.equals(player)) {
            msg().send(player, "cannot-target-self");
            return;
        }
        if (teams().teamOf(target.getUniqueId()) != null) {
            msg().send(player, "target-already-in-team", "player", target.getName());
            fail(player);
            return;
        }
        if (plugin.invites().has(target.getUniqueId(), team)) {
            msg().send(player, "invite-already", "player", target.getName());
            fail(player);
            return;
        }
        if (isFull(player, team)) {
            return;
        }
        plugin.invites().invite(target.getUniqueId(), team, player.getUniqueId());
        String seconds = String.valueOf(plugin.getConfig().getLong("teams.invite-expire-seconds", 120));
        msg().send(player, "invite-sent", "player", target.getName(), "seconds", seconds);
        msg().send(target, "invite-received", teamVars(team, "inviter", player.getName()));
        target.playSound(target.getLocation(), Sound.BLOCK_NOTE_BLOCK_PLING, 0.8f, 1.5f);
        success(player);
    }

    public void cancelInvite(Player player, UUID target) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "invite")) {
            return;
        }
        plugin.invites().remove(target, team);
        msg().send(player, "invite-cancelled", "player", TeamManager.nameOf(target));
    }

    private boolean isFull(Player player, Team team) {
        int max = plugin.getConfig().getInt("teams.max-members", 10);
        if (team.members().size() >= max) {
            msg().send(player, "team-full", "max", String.valueOf(max));
            fail(player);
            return true;
        }
        return false;
    }

    /** Resolves which invite /team accept|deny [team] refers to. */
    private Team resolveInvite(Player player, String teamName) {
        Map<UUID, InviteManager.Invite> received = plugin.invites().received(player.getUniqueId());
        if (received.isEmpty()) {
            msg().send(player, "invite-none");
            return null;
        }
        if (teamName == null) {
            if (received.size() > 1) {
                List<String> names = new ArrayList<>();
                for (UUID id : received.keySet()) {
                    Team team = teams().byId(id);
                    if (team != null) {
                        names.add(team.name());
                    }
                }
                msg().send(player, "invite-specify", "teams", String.join(", ", names));
                return null;
            }
            Team team = teams().byId(received.keySet().iterator().next());
            if (team == null) {
                msg().send(player, "invite-none");
            }
            return team;
        }
        Team team = teams().byName(teamName);
        if (team == null || !received.containsKey(team.id())) {
            msg().send(player, "invite-none");
            return null;
        }
        return team;
    }

    public void accept(Player player, String teamName) {
        if (teams().teamOf(player.getUniqueId()) != null) {
            msg().send(player, "already-in-team");
            return;
        }
        Team team = resolveInvite(player, teamName);
        if (team == null || isFull(player, team)) {
            return;
        }
        plugin.invites().clearPlayer(player.getUniqueId());
        broadcast(team, "member-joined", "player", player.getName());
        teams().addMember(team, player.getUniqueId());
        msg().send(player, "member-joined", "player", player.getName());
        success(player);
    }

    public void deny(Player player, String teamName) {
        Team team = resolveInvite(player, teamName);
        if (team == null) {
            return;
        }
        plugin.invites().remove(player.getUniqueId(), team);
        msg().send(player, "invite-denied", teamVars(team));
        broadcast(team, "invite-denied-team", "player", player.getName());
    }

    // ------------------------------------------------------------------ members

    private UUID memberByName(Player player, Team team, String name) {
        for (UUID uuid : team.members().keySet()) {
            if (TeamManager.nameOf(uuid).equalsIgnoreCase(name)) {
                return uuid;
            }
        }
        msg().send(player, "target-not-in-your-team", "player", name);
        fail(player);
        return null;
    }

    public void kick(Player player, String targetName) {
        Team team = requireTeam(player);
        if (team == null) {
            return;
        }
        UUID target = memberByName(player, team, targetName);
        if (target != null) {
            kick(player, team, target);
        }
    }

    public void kick(Player player, Team team, UUID target) {
        if (!check(player, team, "kick")) {
            return;
        }
        if (target.equals(player.getUniqueId())) {
            msg().send(player, "cannot-target-self");
            return;
        }
        if (!team.isMember(target) || !team.rankOf(player.getUniqueId()).isAbove(team.rankOf(target))) {
            msg().send(player, "cannot-kick-rank");
            fail(player);
            return;
        }
        String name = TeamManager.nameOf(target);
        removeFromTeam(team, target);
        Player online = Bukkit.getPlayer(target);
        if (online != null) {
            msg().send(online, "kicked", teamVars(team));
        }
        broadcast(team, "member-kicked", "player", name);
    }

    public void promote(Player player, String targetName) {
        Team team = requireTeam(player);
        if (team == null) {
            return;
        }
        UUID target = memberByName(player, team, targetName);
        if (target != null) {
            promote(player, team, target);
        }
    }

    public void promote(Player player, Team team, UUID target) {
        if (!ownerOnly(player, team)) {
            return;
        }
        String name = TeamManager.nameOf(target);
        if (team.rankOf(target) != TeamRank.MEMBER) {
            msg().send(player, "already-officer", "player", name);
            fail(player);
            return;
        }
        teams().setRank(team, target, TeamRank.OFFICER);
        broadcast(team, "promoted", "player", name);
    }

    public void demote(Player player, String targetName) {
        Team team = requireTeam(player);
        if (team == null) {
            return;
        }
        UUID target = memberByName(player, team, targetName);
        if (target != null) {
            demote(player, team, target);
        }
    }

    public void demote(Player player, Team team, UUID target) {
        if (!ownerOnly(player, team)) {
            return;
        }
        String name = TeamManager.nameOf(target);
        if (team.rankOf(target) != TeamRank.OFFICER) {
            msg().send(player, "not-officer", "player", name);
            fail(player);
            return;
        }
        teams().setRank(team, target, TeamRank.MEMBER);
        broadcast(team, "demoted", "player", name);
    }

    public void transfer(Player player, String targetName) {
        Team team = requireTeam(player);
        if (team == null) {
            return;
        }
        UUID target = memberByName(player, team, targetName);
        if (target != null) {
            transfer(player, team, target);
        }
    }

    public void transfer(Player player, Team team, UUID target) {
        if (!ownerOnly(player, team)) {
            return;
        }
        if (target.equals(player.getUniqueId())) {
            msg().send(player, "cannot-target-self");
            return;
        }
        teams().transfer(team, target);
        broadcast(team, "transferred", "player", TeamManager.nameOf(target));
    }

    // ------------------------------------------------------------------ home & warps

    public void setHome(Player player) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "sethome")) {
            return;
        }
        teams().setHome(team, TeamLocation.of(player.getLocation()));
        msg().send(player, "home-set");
        success(player);
    }

    public void home(Player player) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "home")) {
            return;
        }
        if (team.home() == null) {
            msg().send(player, "home-not-set");
            fail(player);
            return;
        }
        player.closeInventory();
        plugin.warmup().start(player, team.home());
    }

    public void setWarp(Player player, String name) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "setwarp")) {
            return;
        }
        if (!WARP_NAME.matcher(name).matches()) {
            msg().send(player, "warp-name-invalid");
            fail(player);
            return;
        }
        int max = plugin.getConfig().getInt("teams.max-warps", 4);
        if (team.findWarp(name) == null && team.warps().size() >= max) {
            msg().send(player, "warp-limit", "max", String.valueOf(max));
            fail(player);
            return;
        }
        teams().setWarp(team, name, TeamLocation.of(player.getLocation()));
        msg().send(player, "warp-set", "warp", name);
        success(player);
    }

    public void warp(Player player, String name) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "warp")) {
            return;
        }
        String key = team.findWarp(name);
        if (key == null) {
            msg().send(player, "warp-not-found", "warp", name);
            fail(player);
            return;
        }
        player.closeInventory();
        plugin.warmup().start(player, team.warps().get(key));
    }

    public void deleteWarp(Player player, String name) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "delwarp")) {
            return;
        }
        String key = team.findWarp(name);
        if (key == null) {
            msg().send(player, "warp-not-found", "warp", name);
            fail(player);
            return;
        }
        teams().deleteWarp(team, key);
        msg().send(player, "warp-deleted", "warp", key);
    }

    public void listWarps(Player player) {
        Team team = requireTeam(player);
        if (team == null) {
            return;
        }
        if (team.warps().isEmpty()) {
            msg().send(player, "warps-none");
            return;
        }
        msg().send(player, "warps-list", "warps", String.join(", ", team.warps().keySet()));
    }

    // ------------------------------------------------------------------ misc

    public void openChest(Player player) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "echest")) {
            return;
        }
        plugin.teamChests().open(player, team);
        player.playSound(player.getLocation(), Sound.BLOCK_ENDER_CHEST_OPEN, 0.7f, 1f);
    }

    public void rename(Player player, String name) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "rename")) {
            return;
        }
        if (name.equalsIgnoreCase(team.name()) || !validName(player, name)) {
            return;
        }
        teams().rename(team, name);
        broadcast(team, "team-renamed", teamVars(team));
    }

    public void setFriendlyFire(Player player, boolean enabled) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "friendlyfire")) {
            return;
        }
        teams().setFriendlyFire(team, enabled);
        broadcast(team, "friendly-fire-set", "state", msg().raw(enabled ? "state-on" : "state-off"));
    }

    public void setColor(Player player, TeamColor color) {
        Team team = requireTeam(player);
        if (team == null || !check(player, team, "color")) {
            return;
        }
        teams().setColor(team, color);
        broadcast(team, "color-set", teamVars(team, "colorname", color.displayName()));
    }

    public void toggleChat(Player player) {
        if (!player.hasPermission("powerguard.team.chat")) {
            msg().send(player, "no-permission");
            return;
        }
        if (requireTeam(player) == null) {
            return;
        }
        boolean enabled = plugin.teamChat().toggle(player.getUniqueId());
        msg().send(player, enabled ? "team-chat-on" : "team-chat-off");
    }

    public void info(CommandSender sender, Team team) {
        List<String> officers = new ArrayList<>();
        List<String> members = new ArrayList<>();
        int online = 0;
        for (Map.Entry<UUID, TeamRank> entry : team.members().entrySet()) {
            if (Bukkit.getPlayer(entry.getKey()) != null) {
                online++;
            }
            if (entry.getValue() == TeamRank.OFFICER) {
                officers.add(TeamManager.nameOf(entry.getKey()));
            } else if (entry.getValue() == TeamRank.MEMBER) {
                members.add(TeamManager.nameOf(entry.getKey()));
            }
        }
        msg().send(sender, "team-info", teamVars(team,
                "owner", TeamManager.nameOf(team.owner()),
                "online", String.valueOf(online),
                "size", String.valueOf(team.members().size()),
                "officers", officers.isEmpty() ? "-" : String.join(", ", officers),
                "members", members.isEmpty() ? "-" : String.join(", ", members),
                "ff", msg().raw(team.friendlyFire() ? "state-on" : "state-off"),
                "home", team.home() == null ? "-" : team.home().describe(),
                "warps", team.warps().isEmpty() ? "-" : String.join(", ", team.warps().keySet())));
    }

    public void list(CommandSender sender) {
        List<Team> all = new ArrayList<>(teams().teams());
        all.sort((a, b) -> a.name().toLowerCase(Locale.ROOT).compareTo(b.name().toLowerCase(Locale.ROOT)));
        msg().send(sender, "team-list-header", "count", String.valueOf(all.size()));
        for (Team team : all) {
            msg().send(sender, "team-list-entry", teamVars(team,
                    "online", String.valueOf(teams().onlineMembers(team).size()),
                    "size", String.valueOf(team.members().size())));
        }
    }
}
