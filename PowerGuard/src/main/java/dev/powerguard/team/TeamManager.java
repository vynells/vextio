package dev.powerguard.team;

import dev.powerguard.PowerGuard;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Owns every team and the member index. All changes go through here so the team is saved and
 * name tags are refreshed on every change.
 */
public final class TeamManager {

    private final PowerGuard plugin;
    private final TeamStorage storage;
    private final Map<UUID, Team> teamsById = new ConcurrentHashMap<>();
    private final Map<String, Team> teamsByName = new ConcurrentHashMap<>();
    private final Map<UUID, Team> teamsByMember = new ConcurrentHashMap<>();

    public TeamManager(PowerGuard plugin, TeamStorage storage) {
        this.plugin = plugin;
        this.storage = storage;
    }

    public void load() {
        for (Team team : storage.loadAll()) {
            if (team.members().isEmpty()) {
                continue;
            }
            index(team);
        }
        plugin.getLogger().info("Loaded " + teamsById.size() + " teams.");
    }

    private void index(Team team) {
        teamsById.put(team.id(), team);
        teamsByName.put(team.key(), team);
        for (UUID member : team.members().keySet()) {
            teamsByMember.put(member, team);
        }
    }

    public Collection<Team> teams() {
        return Collections.unmodifiableCollection(teamsById.values());
    }

    public Team byId(UUID id) {
        return teamsById.get(id);
    }

    public Team byName(String name) {
        return name == null ? null : teamsByName.get(name.toLowerCase(Locale.ROOT));
    }

    public Team teamOf(UUID player) {
        return teamsByMember.get(player);
    }

    public List<Player> onlineMembers(Team team) {
        List<Player> online = new ArrayList<>();
        for (UUID uuid : team.members().keySet()) {
            Player player = Bukkit.getPlayer(uuid);
            if (player != null) {
                online.add(player);
            }
        }
        return online;
    }

    public static String nameOf(UUID uuid) {
        OfflinePlayer player = Bukkit.getOfflinePlayer(uuid);
        return player.getName() == null ? uuid.toString().substring(0, 8) : player.getName();
    }

    public Team create(String name, Player owner) {
        TeamColor color = TeamColor.parse(plugin.getConfig().getString("teams.default-color"), TeamColor.AQUA);
        Team team = new Team(UUID.randomUUID(), name, color, plugin.getConfig().getBoolean("teams.friendly-fire-default"));
        team.putMember(owner.getUniqueId(), TeamRank.OWNER);
        index(team);
        changed(team);
        return team;
    }

    public void disband(Team team) {
        teamsById.remove(team.id());
        teamsByName.remove(team.key());
        for (UUID member : team.members().keySet()) {
            teamsByMember.remove(member);
        }
        storage.delete(team);
        for (UUID member : team.members().keySet()) {
            refreshNameTag(member);
        }
    }

    public void addMember(Team team, UUID uuid) {
        team.putMember(uuid, TeamRank.MEMBER);
        teamsByMember.put(uuid, team);
        changed(team);
        refreshNameTag(uuid);
    }

    public void removeMember(Team team, UUID uuid) {
        team.removeMember(uuid);
        teamsByMember.remove(uuid);
        changed(team);
        refreshNameTag(uuid);
    }

    public void setRank(Team team, UUID uuid, TeamRank rank) {
        team.putMember(uuid, rank);
        changed(team);
    }

    public void transfer(Team team, UUID newOwner) {
        team.putMember(team.owner(), TeamRank.OFFICER);
        team.putMember(newOwner, TeamRank.OWNER);
        changed(team);
    }

    public void rename(Team team, String name) {
        teamsByName.remove(team.key());
        team.setName(name);
        teamsByName.put(team.key(), team);
        changed(team);
        refreshNameTags(team);
    }

    public void setColor(Team team, TeamColor color) {
        team.setColor(color);
        changed(team);
        refreshNameTags(team);
    }

    public void setFriendlyFire(Team team, boolean enabled) {
        team.setFriendlyFire(enabled);
        changed(team);
    }

    public void setHome(Team team, TeamLocation home) {
        team.setHome(home);
        changed(team);
    }

    public void setWarp(Team team, String name, TeamLocation location) {
        String existing = team.findWarp(name);
        if (existing != null) {
            team.removeWarp(existing);
        }
        team.putWarp(name, location);
        changed(team);
    }

    public void deleteWarp(Team team, String name) {
        team.removeWarp(name);
        changed(team);
    }

    public void setChestContents(Team team, org.bukkit.inventory.ItemStack[] contents) {
        team.setChestContents(contents);
        changed(team);
    }

    /** Saves the team to disk. */
    public void changed(Team team) {
        if (teamsById.containsKey(team.id())) {
            storage.save(team);
        }
    }

    public void saveAll() {
        for (Team team : teamsById.values()) {
            storage.save(team);
        }
    }

    private void refreshNameTags(Team team) {
        for (UUID member : team.members().keySet()) {
            refreshNameTag(member);
        }
    }

    private void refreshNameTag(UUID uuid) {
        Player player = Bukkit.getPlayer(uuid);
        if (player != null) {
            plugin.nameTags().apply(player);
        }
    }
}
