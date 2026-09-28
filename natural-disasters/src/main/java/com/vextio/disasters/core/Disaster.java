package com.vextio.disasters.core;

import com.vextio.disasters.NaturalDisasters;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.boss.BarColor;
import org.bukkit.boss.BarStyle;
import org.bukkit.boss.BossBar;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitTask;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Base class for every disaster. Runs once per tick until {@link #finish()} is called.
 */
public abstract class Disaster {

    protected final NaturalDisasters plugin;
    protected final DisasterType type;
    protected final int level;
    protected final Location center;
    protected final World world;
    protected final ThreadLocalRandom random = ThreadLocalRandom.current();

    protected long ticks;
    protected BossBar bar;
    private BukkitTask task;
    private boolean finished;

    protected Disaster(NaturalDisasters plugin, DisasterType type, Location center, int level) {
        this.plugin = plugin;
        this.type = type;
        this.center = center.clone();
        this.world = center.getWorld();
        this.level = Math.max(1, Math.min(5, level));
    }

    public final void start() {
        bar = Bukkit.createBossBar(type.pretty() + " §7— Level " + level, barColor(), BarStyle.SEGMENTED_10);
        bar.setProgress(1.0);
        onStart();
        task = Bukkit.getScheduler().runTaskTimer(plugin, () -> {
            try {
                updateBarViewers();
                tick();
                ticks++;
            } catch (Throwable t) {
                plugin.getLogger().severe("Error in " + type + ": " + t);
                t.printStackTrace();
                finish();
            }
        }, 1L, 1L);
    }

    /** Called when the disaster ends naturally or is stopped. */
    public final void finish() {
        if (finished) return;
        finished = true;
        if (task != null) task.cancel();
        if (bar != null) bar.removeAll();
        try { onEnd(); } catch (Throwable t) { t.printStackTrace(); }
        plugin.getManager().unregister(this);
    }

    /** Hard stop (plugin disable): skip slow cleanup animations. */
    public void forceStop() { finish(); }

    public boolean isFinished() { return finished; }

    protected abstract void onStart();
    protected abstract void tick();
    protected void onEnd() {}
    protected abstract double radius();
    protected BarColor barColor() { return BarColor.RED; }

    // ----------------------------------------------------------------- helpers

    protected ConfigurationSection cfg(String path) {
        ConfigurationSection s = plugin.getConfig().getConfigurationSection(path);
        return s != null ? s : plugin.getConfig().createSection(path);
    }

    public List<Player> nearbyPlayers(double r) {
        List<Player> list = new ArrayList<>();
        double r2 = r * r;
        for (Player p : world.getPlayers()) {
            Location l = p.getLocation();
            double dx = l.getX() - center.getX(), dz = l.getZ() - center.getZ();
            if (dx * dx + dz * dz <= r2) list.add(p);
        }
        return list;
    }

    protected void updateBarViewers() {
        if (ticks % 20 != 0) return;
        List<Player> inside = nearbyPlayers(radius() + 40);
        for (Player p : new ArrayList<>(bar.getPlayers())) if (!inside.contains(p)) bar.removePlayer(p);
        for (Player p : inside) if (!bar.getPlayers().contains(p)) bar.addPlayer(p);
    }

    protected double rnd(double min, double max) { return min + random.nextDouble() * (max - min); }

    public DisasterType getType() { return type; }
    public int getLevel() { return level; }
    public Location getCenter() { return center.clone(); }
    public World getWorld() { return world; }
}
