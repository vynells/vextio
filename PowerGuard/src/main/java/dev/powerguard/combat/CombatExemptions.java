package dev.powerguard.combat;

import dev.powerguard.PowerGuard;
import org.bukkit.configuration.file.YamlConfiguration;

import java.io.File;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.logging.Level;

/** Players an admin has exempted from combat tagging. Stored in plugins/PowerGuard/exempt.yml. */
public final class CombatExemptions {

    private final PowerGuard plugin;
    private final File file;
    private final Set<UUID> exempt = new HashSet<>();

    public CombatExemptions(PowerGuard plugin) {
        this.plugin = plugin;
        this.file = new File(plugin.getDataFolder(), "exempt.yml");
    }

    public void load() {
        exempt.clear();
        for (String id : YamlConfiguration.loadConfiguration(file).getStringList("exempt")) {
            try {
                exempt.add(UUID.fromString(id));
            } catch (IllegalArgumentException e) {
                plugin.getLogger().warning("Ignoring invalid UUID in exempt.yml: " + id);
            }
        }
    }

    public boolean isExempt(UUID uuid) {
        return exempt.contains(uuid);
    }

    /** Toggles the exemption and returns the new state. */
    public boolean toggle(UUID uuid) {
        boolean nowExempt;
        if (exempt.contains(uuid)) {
            exempt.remove(uuid);
            nowExempt = false;
        } else {
            exempt.add(uuid);
            nowExempt = true;
        }
        save();
        return nowExempt;
    }

    private void save() {
        YamlConfiguration yaml = new YamlConfiguration();
        yaml.set("exempt", exempt.stream().map(UUID::toString).toList());
        try {
            yaml.save(file);
        } catch (IOException e) {
            plugin.getLogger().log(Level.SEVERE, "Could not save exempt.yml", e);
        }
    }
}
