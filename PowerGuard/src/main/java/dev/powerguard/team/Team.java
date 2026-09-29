package dev.powerguard.team;

import org.bukkit.inventory.ItemStack;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** A team: its members and ranks, home, warps, settings and saved ender chest contents. */
public final class Team {

    private final UUID id;
    private String name;
    private TeamColor color;
    private final Map<UUID, TeamRank> members = new LinkedHashMap<>();
    private final Map<String, TeamLocation> warps = new LinkedHashMap<>();
    private TeamLocation home;
    private boolean friendlyFire;
    private ItemStack[] chestContents = new ItemStack[0];

    public Team(UUID id, String name, TeamColor color, boolean friendlyFire) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.friendlyFire = friendlyFire;
    }

    public UUID id() {
        return id;
    }

    public String name() {
        return name;
    }

    void setName(String name) {
        this.name = name;
    }

    public TeamColor color() {
        return color;
    }

    void setColor(TeamColor color) {
        this.color = color;
    }

    public boolean friendlyFire() {
        return friendlyFire;
    }

    void setFriendlyFire(boolean friendlyFire) {
        this.friendlyFire = friendlyFire;
    }

    public Map<UUID, TeamRank> members() {
        return Collections.unmodifiableMap(members);
    }

    void putMember(UUID uuid, TeamRank rank) {
        members.put(uuid, rank);
    }

    void removeMember(UUID uuid) {
        members.remove(uuid);
    }

    public boolean isMember(UUID uuid) {
        return members.containsKey(uuid);
    }

    public TeamRank rankOf(UUID uuid) {
        return members.get(uuid);
    }

    public UUID owner() {
        for (Map.Entry<UUID, TeamRank> entry : members.entrySet()) {
            if (entry.getValue() == TeamRank.OWNER) {
                return entry.getKey();
            }
        }
        throw new IllegalStateException("Team " + name + " has no owner");
    }

    public TeamLocation home() {
        return home;
    }

    void setHome(TeamLocation home) {
        this.home = home;
    }

    public Map<String, TeamLocation> warps() {
        return Collections.unmodifiableMap(warps);
    }

    /** Case-insensitive warp lookup; returns the stored key or null. */
    public String findWarp(String warpName) {
        for (String key : warps.keySet()) {
            if (key.equalsIgnoreCase(warpName)) {
                return key;
            }
        }
        return null;
    }

    void putWarp(String warpName, TeamLocation location) {
        warps.put(warpName, location);
    }

    void removeWarp(String warpName) {
        warps.remove(warpName);
    }

    public ItemStack[] chestContents() {
        return chestContents;
    }

    void setChestContents(ItemStack[] contents) {
        this.chestContents = contents;
    }

    public String key() {
        return name.toLowerCase(Locale.ROOT);
    }
}
