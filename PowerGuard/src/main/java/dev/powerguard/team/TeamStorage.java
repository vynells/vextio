package dev.powerguard.team;

import dev.powerguard.PowerGuard;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.InvalidConfigurationException;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.inventory.ItemStack;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;

/**
 * Saves each team to plugins/PowerGuard/teams/&lt;id&gt;.yml. Data is serialised on the main thread
 * and written by a single background thread through a temp file + atomic move, so a crash mid-write
 * can never leave a half-written team file.
 */
public final class TeamStorage {

    private final PowerGuard plugin;
    private final File folder;
    private final ExecutorService writer = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "PowerGuard-Storage");
        thread.setDaemon(true);
        return thread;
    });

    public TeamStorage(PowerGuard plugin) {
        this.plugin = plugin;
        this.folder = new File(plugin.getDataFolder(), "teams");
    }

    public List<Team> loadAll() {
        List<Team> teams = new ArrayList<>();
        File[] files = folder.listFiles((dir, name) -> name.endsWith(".yml"));
        if (files == null) {
            return teams;
        }
        for (File file : files) {
            YamlConfiguration yaml = new YamlConfiguration();
            try {
                yaml.load(file);
                teams.add(read(yaml));
            } catch (IOException | InvalidConfigurationException | RuntimeException e) {
                plugin.getLogger().log(Level.SEVERE, "Could not load team file " + file.getName(), e);
            }
        }
        return teams;
    }

    private Team read(YamlConfiguration yaml) {
        Team team = new Team(UUID.fromString(yaml.getString("id")), yaml.getString("name"),
                TeamColor.parse(yaml.getString("color"), TeamColor.WHITE), yaml.getBoolean("friendly-fire"));
        ConfigurationSection members = yaml.getConfigurationSection("members");
        if (members != null) {
            for (String key : members.getKeys(false)) {
                team.putMember(UUID.fromString(key), TeamRank.parse(members.getString(key), TeamRank.MEMBER));
            }
        }
        team.setHome(TeamLocation.load(yaml.getConfigurationSection("home")));
        ConfigurationSection warps = yaml.getConfigurationSection("warps");
        if (warps != null) {
            for (String key : warps.getKeys(false)) {
                TeamLocation location = TeamLocation.load(warps.getConfigurationSection(key));
                if (location != null) {
                    team.putWarp(key, location);
                }
            }
        }
        List<?> chest = yaml.getList("echest", List.of());
        ItemStack[] contents = new ItemStack[chest.size()];
        for (int i = 0; i < contents.length; i++) {
            contents[i] = chest.get(i) instanceof ItemStack item ? item : null;
        }
        team.setChestContents(contents);
        return team;
    }

    /** Queues a save of the team's current state. Must be called on the main thread. */
    public void save(Team team) {
        String data = serialise(team);
        Path target = file(team.id()).toPath();
        writer.execute(() -> write(target, data));
    }

    public void delete(Team team) {
        Path target = file(team.id()).toPath();
        writer.execute(() -> {
            try {
                Files.deleteIfExists(target);
            } catch (IOException e) {
                plugin.getLogger().log(Level.SEVERE, "Could not delete team file " + target, e);
            }
        });
    }

    /** Waits for every queued write to finish. Used on shutdown. */
    public void shutdown() {
        writer.shutdown();
        try {
            if (!writer.awaitTermination(30, TimeUnit.SECONDS)) {
                plugin.getLogger().severe("Timed out waiting for team data to save.");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private String serialise(Team team) {
        YamlConfiguration yaml = new YamlConfiguration();
        yaml.set("id", team.id().toString());
        yaml.set("name", team.name());
        yaml.set("color", team.color().name());
        yaml.set("friendly-fire", team.friendlyFire());
        for (Map.Entry<UUID, TeamRank> entry : team.members().entrySet()) {
            yaml.set("members." + entry.getKey(), entry.getValue().name());
        }
        if (team.home() != null) {
            team.home().save(yaml.createSection("home"));
        }
        for (Map.Entry<String, TeamLocation> entry : team.warps().entrySet()) {
            entry.getValue().save(yaml.createSection("warps." + entry.getKey()));
        }
        yaml.set("echest", java.util.Arrays.asList(team.chestContents()));
        return yaml.saveToString();
    }

    private File file(UUID id) {
        return new File(folder, id + ".yml");
    }

    private void write(Path target, String data) {
        try {
            Files.createDirectories(target.getParent());
            Path temp = target.resolveSibling(target.getFileName() + ".tmp");
            Files.writeString(temp, data, StandardCharsets.UTF_8);
            try {
                Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (java.nio.file.AtomicMoveNotSupportedException e) {
                Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            plugin.getLogger().log(Level.SEVERE, "Could not save team file " + target, e);
        }
    }
}
