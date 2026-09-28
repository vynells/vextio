package com.vextio.disasters.core;

import com.vextio.disasters.NaturalDisasters;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.block.TileState;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitTask;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public class DisasterManager {

    private final NaturalDisasters plugin;
    private final List<Disaster> active = new ArrayList<>();
    private BukkitTask randomTask;

    public DisasterManager(NaturalDisasters plugin) {
        this.plugin = plugin;
    }

    /** @return null on success, otherwise an error message. */
    public String start(DisasterType type, Location center, int level) {
        if (center == null || center.getWorld() == null) return "Invalid location.";
        if (plugin.getConfig().getStringList("disabled-worlds").contains(center.getWorld().getName()))
            return "Disasters are disabled in this world.";
        if (active.size() >= plugin.getConfig().getInt("max-active", 3))
            return "Too many active disasters (" + active.size() + "). Stop one first.";
        Disaster d = type.create(plugin, center, level);
        active.add(d);
        d.start();
        plugin.getLogger().info("Started " + type + " level " + level + " at "
                + center.getWorld().getName() + " " + center.getBlockX() + "," + center.getBlockY() + "," + center.getBlockZ());
        return null;
    }

    void unregister(Disaster d) { active.remove(d); }

    public List<Disaster> getActive() { return new ArrayList<>(active); }

    public int stopAll(boolean force) {
        List<Disaster> copy = new ArrayList<>(active);
        for (Disaster d : copy) {
            if (force) d.forceStop(); else d.finish();
        }
        return copy.size();
    }

    public int stopType(DisasterType type) {
        int n = 0;
        for (Disaster d : new ArrayList<>(active)) if (d.getType() == type) { d.finish(); n++; }
        return n;
    }

    // ------------------------------------------------------------ random events

    public void startRandomScheduler() {
        if (randomTask != null) randomTask.cancel();
        randomTask = null;
        if (!plugin.getConfig().getBoolean("random.enabled", true)) return;
        int min = Math.max(30, plugin.getConfig().getInt("random.min-interval", 900));
        int max = Math.max(min, plugin.getConfig().getInt("random.max-interval", 2400));
        long delay = 20L * ThreadLocalRandom.current().nextInt(min, max + 1);
        randomTask = Bukkit.getScheduler().runTaskLater(plugin, () -> {
            if (ThreadLocalRandom.current().nextDouble() < plugin.getConfig().getDouble("random.chance", 0.6)) {
                triggerRandom();
            }
            startRandomScheduler();
        }, delay);
    }

    public boolean isRandomEnabled() { return plugin.getConfig().getBoolean("random.enabled", true); }

    public void setRandomEnabled(boolean enabled) {
        plugin.getConfig().set("random.enabled", enabled);
        plugin.saveConfig();
        startRandomScheduler();
        if (!enabled && randomTask != null) { randomTask.cancel(); randomTask = null; }
    }

    /** Picks a random eligible player and unleashes a random disaster on them. */
    public String triggerRandom() {
        List<Player> candidates = new ArrayList<>();
        List<String> disabled = plugin.getConfig().getStringList("disabled-worlds");
        for (Player p : Bukkit.getOnlinePlayers()) {
            if (p.hasPermission("disasters.bypass") && !p.isOp()) continue;
            if (disabled.contains(p.getWorld().getName())) continue;
            candidates.add(p);
        }
        if (candidates.isEmpty()) return "No eligible players online.";
        List<DisasterType> types = new ArrayList<>();
        for (String s : plugin.getConfig().getStringList("random.types")) {
            DisasterType t = DisasterType.parse(s);
            if (t != null) types.add(t);
        }
        if (types.isEmpty()) return "No random types configured.";
        ThreadLocalRandom r = ThreadLocalRandom.current();
        Player target = candidates.get(r.nextInt(candidates.size()));
        DisasterType type = types.get(r.nextInt(types.size()));
        int minL = Math.max(1, plugin.getConfig().getInt("random.min-level", 1));
        int maxL = Math.min(5, Math.max(minL, plugin.getConfig().getInt("random.max-level", 5)));
        int level = r.nextInt(minL, maxL + 1);
        return start(type, target.getLocation(), level);
    }

    // ---------------------------------------------------------------- blocks

    /** Blocks disasters must never touch. */
    public boolean isProtected(Block b) {
        Material m = b.getType();
        if (m == Material.BEDROCK || m == Material.BARRIER || m == Material.END_PORTAL_FRAME
                || m == Material.END_PORTAL || m == Material.NETHER_PORTAL || m == Material.COMMAND_BLOCK
                || m == Material.CHAIN_COMMAND_BLOCK || m == Material.REPEATING_COMMAND_BLOCK
                || m == Material.STRUCTURE_BLOCK || m == Material.JIGSAW || m == Material.SPAWNER
                || m == Material.REINFORCED_DEEPSLATE) return true;
        if (plugin.getConfig().getBoolean("protect-containers", true)) {
            return b.getState(false) instanceof TileState;
        }
        return false;
    }

    public int blockBudget() { return Math.max(100, plugin.getConfig().getInt("block-budget-per-tick", 4000)); }
}
