package dev.powerguard.team;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.configuration.ConfigurationSection;

/**
 * A saved position that keeps the world by name, so homes and warps survive worlds that load
 * after PowerGuard (e.g. from a world manager).
 */
public record TeamLocation(String world, double x, double y, double z, float yaw, float pitch) {

    public static TeamLocation of(Location location) {
        return new TeamLocation(location.getWorld().getName(), location.getX(), location.getY(), location.getZ(),
                location.getYaw(), location.getPitch());
    }

    /** Returns the Bukkit location, or null if the world isn't loaded. */
    public Location toLocation() {
        World bukkitWorld = Bukkit.getWorld(world);
        return bukkitWorld == null ? null : new Location(bukkitWorld, x, y, z, yaw, pitch);
    }

    public String describe() {
        return world + " " + (int) Math.floor(x) + ", " + (int) Math.floor(y) + ", " + (int) Math.floor(z);
    }

    void save(ConfigurationSection section) {
        section.set("world", world);
        section.set("x", x);
        section.set("y", y);
        section.set("z", z);
        section.set("yaw", yaw);
        section.set("pitch", pitch);
    }

    static TeamLocation load(ConfigurationSection section) {
        if (section == null || section.getString("world") == null) {
            return null;
        }
        return new TeamLocation(section.getString("world"), section.getDouble("x"), section.getDouble("y"),
                section.getDouble("z"), (float) section.getDouble("yaw"), (float) section.getDouble("pitch"));
    }
}
