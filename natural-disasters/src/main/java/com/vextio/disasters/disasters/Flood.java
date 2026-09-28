package com.vextio.disasters.disasters;

import com.vextio.disasters.NaturalDisasters;
import com.vextio.disasters.core.Disaster;
import com.vextio.disasters.core.DisasterType;
import com.vextio.disasters.util.FX;
import com.vextio.disasters.util.LongList;
import com.vextio.disasters.util.WaterEngine;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.boss.BarColor;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

import java.util.EnumSet;
import java.util.Set;

/**
 * Torrential rain while the water table climbs one block at a time. Low ground floods first,
 * then the water creeps up streets and into houses. Water only fills connected low areas
 * (every column is filled from its own ground upwards), so hills stay dry islands.
 */
public class Flood extends Disaster {

    private enum Phase { RAIN, RISING, PEAK, RECEDE }

    private final WaterEngine water;
    private final double radius;
    private final int startLevel, peakLevel, riseInterval, recedeAfter;
    private final LongList columns = new LongList(); // packed (x, groundY, z)
    private final boolean prevStorm, prevThunder;
    private Vector drift;

    private Phase phase = Phase.RAIN;
    private long phaseStart;
    private int waterLevel;

    public Flood(NaturalDisasters plugin, Location center, int level) {
        super(plugin, DisasterType.FLOOD, center, level);
        water = new WaterEngine(world, plugin.getManager());
        radius = cfg("flood").getDouble("radius-base", 35) + level * 13;
        int ground = FX.surfaceY(world, center.getBlockX(), center.getBlockZ());
        startLevel = Math.max(world.getSeaLevel() - 1, ground - 3);
        peakLevel = startLevel + 3 + level * 2;           // +5 .. +13 blocks
        riseInterval = Math.max(40, 220 - level * 35);    // ticks between each block of rise
        recedeAfter = cfg("flood").getInt("recede-after-seconds", 90);
        prevStorm = world.hasStorm();
        prevThunder = world.isThundering();
        double a = random.nextDouble() * Math.PI * 2;
        drift = new Vector(Math.cos(a), 0, Math.sin(a));

        Set<Material> wash = EnumSet.noneOf(Material.class);
        for (Material m : Material.values()) {
            if (!m.isBlock() || m.isLegacy()) continue;
            String n = m.name();
            if (n.endsWith("CARPET")) wash.add(m);
            if (level >= 4 && (n.endsWith("LEAVES") || n.contains("GLASS_PANE"))) wash.add(m);
        }
        water.setWashAway(wash, 0.5);
    }

    @Override protected double radius() { return radius; }
    @Override protected BarColor barColor() { return BarColor.BLUE; }

    @Override
    protected void onStart() {
        bar.setTitle("§3§l☔ FLOOD WARNING §7— Level " + level);
        world.setStorm(true);
        world.setThundering(level >= 3);
        world.setWeatherDuration(20 * 60 * 10);
        // Scan the terrain once
        int r = (int) radius;
        for (int dx = -r; dx <= r; dx++) for (int dz = -r; dz <= r; dz++) {
            if (dx * dx + dz * dz > r * r) continue;
            int x = center.getBlockX() + dx, z = center.getBlockZ() + dz;
            if (!world.isChunkLoaded(x >> 4, z >> 4)) continue;
            int g = FX.surfaceY(world, x, z);
            if (g < peakLevel + 2) columns.add(FX.pack(x, g, z));
        }
        for (Player p : nearbyPlayers(radius + 40)) {
            FX.title(p, "§3§l☔ FLASH FLOOD ☔", "§bRivers are overflowing. Move to higher ground!", 10, 60, 20);
            FX.sound(p, Sound.ENTITY_LIGHTNING_BOLT_THUNDER, 1f, 0.7f);
        }
    }

    @Override
    protected void onEnd() {
        if (!prevStorm) world.setStorm(false);
        if (!prevThunder) world.setThundering(false);
    }

    @Override
    public void forceStop() {
        if (recedeAfter >= 0) while (!water.drain(100000)) { /* drain fully */ }
        super.forceStop();
    }

    @Override
    protected void tick() {
        long t = ticks - phaseStart;
        rainFx();
        switch (phase) {
            case RAIN -> {
                bar.setProgress(Math.max(0, 1 - t / 200.0));
                if (t >= 200) { waterLevel = startLevel; next(Phase.RISING); bar.setTitle("§3§l☔ FLOOD §7— Level " + level + " §8| §bWater rising"); }
            }
            case RISING -> {
                bar.setProgress(Math.min(1, (waterLevel - startLevel) / (double) (peakLevel - startLevel)));
                if (t % riseInterval == 0 && water.pending() == 0) {
                    waterLevel++;
                    raiseTo(waterLevel);
                    for (Player p : nearbyPlayers(radius + 20)) {
                        FX.sound(p, Sound.BLOCK_WATER_AMBIENT, 1.5f, 0.6f);
                        FX.actionBar(p, "§3☔ §bWater level: §f" + (waterLevel - startLevel) + "m §7/ " + (peakLevel - startLevel) + "m");
                    }
                }
                currents();
                if (waterLevel >= peakLevel && water.pending() == 0) {
                    next(Phase.PEAK);
                    for (Player p : nearbyPlayers(radius + 20)) FX.title(p, "", "§bThe flood has crested", 10, 40, 20);
                }
            }
            case PEAK -> {
                currents();
                if (recedeAfter < 0) { finish(); return; }
                bar.setTitle("§3§l☔ FLOOD §8| §7Receding in " + Math.max(0, (recedeAfter * 20 - t) / 20) + "s");
                bar.setProgress(Math.max(0, 1 - t / (double) (recedeAfter * 20 + 1)));
                if (t >= recedeAfter * 20L) { next(Phase.RECEDE); bar.setTitle("§3§l☔ FLOOD §8| §7Waters receding..."); world.setStorm(false); }
            }
            case RECEDE -> {
                if (water.drain(Math.max(200, plugin.getManager().blockBudget() / 4))) finish();
            }
        }
        water.process(plugin.getManager().blockBudget());
    }

    private void next(Phase p) { phase = p; phaseStart = ticks; }

    private void raiseTo(int y) {
        for (int i = 0; i < columns.size(); i++) {
            long p = columns.get(i);
            int g = FX.unpackY(p);
            if (g >= y) continue;
            int x = FX.unpackX(p), z = FX.unpackZ(p);
            if (y == startLevel + 1) for (int yy = g + 1; yy <= y; yy++) water.queue(x, yy, z);
            else if (g + 1 >= y) water.queue(x, y, z);
            else { water.queue(x, y - 1, z); water.queue(x, y, z); } // fill gaps from washed away blocks
        }
    }

    private void rainFx() {
        if (phase == Phase.RECEDE) return;
        for (Player p : nearbyPlayers(radius + 20)) {
            Location l = p.getLocation();
            for (int i = 0; i < 8 + level * 4; i++) {
                Location s = l.clone().add(rnd(-10, 10), rnd(4, 12), rnd(-10, 10));
                world.spawnParticle(Particle.FALLING_WATER, s, 1, 0, 0, 0, 0);
            }
            if (ticks % 2 == 0) {
                for (int i = 0; i < 4 + level; i++) {
                    int x = l.getBlockX() + random.nextInt(-10, 11), z = l.getBlockZ() + random.nextInt(-10, 11);
                    Location s = new Location(world, x + random.nextDouble(), world.getHighestBlockYAt(x, z) + 1.05, z + random.nextDouble());
                    world.spawnParticle(Particle.SPLASH, s, 3, 0.2, 0, 0.2, 0);
                }
            }
            if (level >= 3 && ticks % 4 == 0) world.spawnParticle(Particle.CLOUD, l.clone().add(0, 1, 0), 2, 8, 1, 8, 0.01);
            if (ticks % 60 == 0) FX.sound(p, Sound.WEATHER_RAIN_ABOVE, 1f, 0.8f);
        }
        if (level >= 3 && random.nextDouble() < 0.004 * level) {
            Location strike = center.clone().add(rnd(-radius, radius), 0, rnd(-radius, radius));
            strike.setY(world.getHighestBlockYAt(strike) + 1);
            world.strikeLightningEffect(strike);
        }
    }

    private void currents() {
        if (ticks % 200 == 0) drift.rotateAroundY(rnd(-0.5, 0.5));
        if (ticks % 3 != 0) return;
        for (Entity e : world.getNearbyEntities(center, radius, 30, radius)) {
            if (!e.isInWater()) continue;
            if (e instanceof Player p && p.isFlying()) continue;
            e.setVelocity(e.getVelocity().add(drift.clone().multiply(0.02 + level * 0.008)));
        }
        if (ticks % 6 == 0) for (Player p : nearbyPlayers(radius)) {
            if (!p.isInWater()) continue;
            Location l = p.getLocation();
            world.spawnParticle(Particle.BUBBLE, l.add(0, 0.5, 0), 10, 2, 1, 2, 0.05);
            world.spawnParticle(Particle.CLOUD, new Location(world, l.getX(), waterLevel + 1.0, l.getZ()), 0,
                    drift.getX() * 0.2, 0, drift.getZ() * 0.2, 1);
        }
    }
}
