package com.vextio.disasters.disasters;

import com.vextio.disasters.NaturalDisasters;
import com.vextio.disasters.core.Disaster;
import com.vextio.disasters.core.DisasterType;
import com.vextio.disasters.util.FX;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.Tag;
import org.bukkit.block.Block;
import org.bukkit.block.data.Levelled;
import org.bukkit.boss.BarColor;
import org.bukkit.entity.Player;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

public class Drought extends Disaster {

    private final double radius;
    private final int duration;
    private final boolean evaporate, killPlants, wildfires;

    public Drought(NaturalDisasters plugin, Location center, int level) {
        super(plugin, DisasterType.DROUGHT, center, level);
        radius = cfg("drought").getDouble("radius", 80) + level * 10;
        duration = (cfg("drought").getInt("base-duration-seconds", 120) + level * 25) * 20;
        evaporate = cfg("drought").getBoolean("evaporate-water", true);
        killPlants = cfg("drought").getBoolean("kill-plants", true);
        wildfires = cfg("drought").getBoolean("wildfires", true);
    }

    @Override protected double radius() { return radius; }
    @Override protected BarColor barColor() { return BarColor.YELLOW; }

    @Override
    protected void onStart() {
        bar.setTitle("§e§l☀ DROUGHT ☀ §7— Level " + level);
        world.setStorm(false);
        world.setThundering(false);
        world.setClearWeatherDuration(duration + 200);
        for (Player p : nearbyPlayers(radius + 40)) {
            FX.title(p, "§6§l☀ DROUGHT ☀", "§eExtreme heat warning. Conserve water.", 10, 60, 20);
            FX.sound(p, Sound.BLOCK_FIRE_AMBIENT, 1f, 0.5f);
            FX.sound(p, Sound.ENTITY_BLAZE_AMBIENT, 0.6f, 0.5f);
        }
    }

    @Override
    protected void tick() {
        double prog = ticks / (double) duration;
        bar.setProgress(Math.max(0, 1 - prog));
        if (ticks >= duration) { finish(); return; }
        double env = Math.min(1, prog / 0.15);

        for (Player p : nearbyPlayers(radius)) {
            Location l = p.getLocation();
            // Heat shimmer: rising pale motes + warm dust near the ground
            for (int i = 0; i < 6 + level * 3; i++) {
                Location s = l.clone().add(rnd(-10, 10), rnd(-0.5, 1.5), rnd(-10, 10));
                world.spawnParticle(Particle.WHITE_ASH, s, 0, 0, 0.3, 0, 0.3);
            }
            if (ticks % 3 == 0)
                world.spawnParticle(Particle.DUST, l.clone().add(0, 0.3, 0), 6 + level * 2, 8, 0.2, 8, 0, FX.dust(222, 190, 130, 1.4f));
            if (ticks % 6 == 0) world.spawnParticle(Particle.DUST, l.clone().add(0, 2, 0), 5, 6, 1.5, 6, 0, FX.dust(255, 170, 60, 0.9f));
            // Tumbling dust devils at higher levels
            if (level >= 3 && ticks % 100 == 0) dustDevil(l.clone().add(rnd(-15, 15), 0, rnd(-15, 15)));

            if (ticks % 80 == 0) FX.sound(p, Sound.BLOCK_FIRE_AMBIENT, 0.6f, 0.6f);

            boolean exposed = FX.exposedToSky(p) && world.getTime() % 24000 < 12500;
            if (!exposed || ticks % 40 != 0) continue;
            p.setExhaustion(p.getExhaustion() + 0.8f * level * (float) env);
            if (level >= 2) p.addPotionEffect(new PotionEffect(PotionEffectType.HUNGER, 80, level >= 4 ? 1 : 0, true, false, false));
            if (level >= 4) p.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS, 60, 0, true, false, false));
            if (level >= 5 && random.nextDouble() < 0.2) {
                p.addPotionEffect(new PotionEffect(PotionEffectType.NAUSEA, 120, 0, true, false, false));
                FX.actionBar(p, "§c☀ §6Heatstroke! §eGet into the shade §c☀");
            } else {
                FX.actionBar(p, "§6☀ §eThe sun is scorching. §7Stay in the shade §6☀");
            }
        }

        if (ticks % 4 == 0) for (Player p : nearbyPlayers(radius)) scorch(p.getLocation(), env);
    }

    private void dustDevil(Location base) {
        for (int step = 0; step < 60; step++) {
            final int s = step;
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                for (int h = 0; h < 12; h++) {
                    double a = s * 0.5 + h * 0.6;
                    double r = 0.4 + h * 0.18;
                    Location l = base.clone().add(Math.cos(a) * r + s * 0.08, h * 0.5, Math.sin(a) * r);
                    world.spawnParticle(Particle.DUST, l, 1, 0, 0, 0, 0, FX.dust(200, 170, 110, 1.6f));
                    if (h % 3 == 0) world.spawnParticle(Particle.BLOCK, l, 1, 0.1, 0.1, 0.1, 0, Material.SAND.createBlockData());
                }
            }, step);
        }
    }

    private void scorch(Location around, double env) {
        int tries = (int) (level * 8 * env) + 2;
        for (int i = 0; i < tries; i++) {
            int x = around.getBlockX() + random.nextInt(-30, 31);
            int z = around.getBlockZ() + random.nextInt(-30, 31);
            int y = world.getHighestBlockYAt(x, z);
            Block top = world.getBlockAt(x, y, z);
            // Plants/crops sit above the heightmap surface
            Block plant = top.getRelative(0, 1, 0);
            if (killPlants && isPlant(plant.getType())) top = plant;
            if (plugin.getManager().isProtected(top)) continue;
            Material m = top.getType();
            Location fx = top.getLocation().add(0.5, 1, 0.5);

            if (evaporate && m == Material.WATER) {
                // Shallow water evaporates, deep lakes slowly lower
                if (top.getBlockData() instanceof Levelled lv && lv.getLevel() > 0 || random.nextDouble() < 0.15 * level) {
                    top.setType(Material.AIR);
                    world.spawnParticle(Particle.CLOUD, fx, 6, 0.3, 0.2, 0.3, 0.03);
                    world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, fx, 1, 0.2, 0.1, 0.2, 0.01);
                    FX.sound(fx, Sound.BLOCK_FIRE_EXTINGUISH, 0.4f, 1.6f);
                }
                continue;
            }
            if (!killPlants) continue;
            if (m == Material.GRASS_BLOCK) {
                top.setType(random.nextDouble() < 0.3 ? Material.COARSE_DIRT : Material.DIRT);
                world.spawnParticle(Particle.BLOCK, fx, 6, 0.3, 0.1, 0.3, 0, Material.DIRT.createBlockData());
            } else if (m == Material.DIRT && level >= 4 && random.nextDouble() < 0.1) {
                top.setType(Material.COARSE_DIRT);
            } else if (m == Material.FARMLAND) {
                top.setType(Material.DIRT);
            } else if (Tag.CROPS.isTagged(m)) {
                top.setType(Material.DEAD_BUSH);
                Block below = top.getRelative(0, -1, 0);
                if (below.getType() == Material.FARMLAND) below.setType(Material.COARSE_DIRT);
                world.spawnParticle(Particle.BLOCK, fx, 6, 0.3, 0.1, 0.3, 0, Material.DEAD_BUSH.createBlockData());
            } else if (isPlant(m)) {
                boolean tall = m == Material.TALL_GRASS || m == Material.LARGE_FERN
                        || m == Material.SUNFLOWER || m == Material.LILAC || m == Material.ROSE_BUSH || m == Material.PEONY;
                if (tall) top.getRelative(0, 1, 0).setType(Material.AIR, false);
                top.setType(random.nextDouble() < 0.4 ? Material.DEAD_BUSH : Material.AIR, false);
            } else if (Tag.LEAVES.isTagged(m) && random.nextDouble() < 0.25 * level) {
                world.spawnParticle(Particle.BLOCK, fx, 8, 0.4, 0.4, 0.4, 0, top.getBlockData());
                top.setType(Material.AIR);
            } else if (m == Material.SNOW || m == Material.ICE) {
                top.setType(m == Material.ICE ? Material.WATER : Material.AIR);
            }

            // Wildfires on dry vegetation
            if (wildfires && level >= 3 && random.nextDouble() < 0.01 * (level - 2)) {
                Material t = world.getBlockAt(x, y, z).getType();
                if (Tag.LEAVES.isTagged(t) || t == Material.DEAD_BUSH || t == Material.HAY_BLOCK || Tag.LOGS.isTagged(t)) {
                    Block above = world.getBlockAt(x, y + 1, z);
                    if (above.getType().isAir()) {
                        above.setType(Material.FIRE);
                        world.spawnParticle(Particle.FLAME, above.getLocation().add(0.5, 0.5, 0.5), 15, 0.3, 0.3, 0.3, 0.02);
                        world.spawnParticle(Particle.LARGE_SMOKE, above.getLocation().add(0.5, 1, 0.5), 10, 0.3, 0.5, 0.3, 0.02);
                    }
                }
            }
        }
    }

    private static boolean isPlant(Material m) {
        return m == Material.SHORT_GRASS || m == Material.TALL_GRASS || m == Material.FERN || m == Material.LARGE_FERN
                || Tag.FLOWERS.isTagged(m) || Tag.SAPLINGS.isTagged(m) || Tag.CROPS.isTagged(m);
    }
}
