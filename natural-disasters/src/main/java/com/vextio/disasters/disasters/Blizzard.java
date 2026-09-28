package com.vextio.disasters.disasters;

import com.vextio.disasters.NaturalDisasters;
import com.vextio.disasters.core.Disaster;
import com.vextio.disasters.core.DisasterType;
import com.vextio.disasters.util.FX;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.block.Block;
import org.bukkit.block.data.type.Snow;
import org.bukkit.boss.BarColor;
import org.bukkit.entity.Player;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.util.Vector;

public class Blizzard extends Disaster {

    private final double radius;
    private final int duration;
    private final boolean accumulate;
    private final boolean freezeWater;
    private final boolean prevStorm;
    private double windAngle;

    public Blizzard(NaturalDisasters plugin, Location center, int level) {
        super(plugin, DisasterType.BLIZZARD, center, level);
        radius = cfg("blizzard").getDouble("radius", 90) + level * 10;
        duration = (cfg("blizzard").getInt("base-duration-seconds", 90) + level * 20) * 20;
        accumulate = cfg("blizzard").getBoolean("snow-accumulation", true);
        freezeWater = cfg("blizzard").getBoolean("freeze-water", true);
        prevStorm = world.hasStorm();
        windAngle = random.nextDouble() * Math.PI * 2;
    }

    @Override protected double radius() { return radius; }
    @Override protected BarColor barColor() { return BarColor.WHITE; }

    @Override
    protected void onStart() {
        bar.setTitle("§b§l❄ BLIZZARD ❄ §7— Level " + level);
        world.setStorm(true);
        world.setWeatherDuration(duration + 200);
        for (Player p : nearbyPlayers(radius + 40)) {
            FX.title(p, "§f§l❄ BLIZZARD ❄", "§bTemperatures plummeting. Find warmth!", 10, 60, 20);
            FX.sound(p, Sound.ITEM_ELYTRA_FLYING, 1f, 0.5f);
            FX.sound(p, Sound.ENTITY_PLAYER_HURT_FREEZE, 1f, 0.6f);
        }
    }

    @Override
    protected void onEnd() {
        if (!prevStorm) world.setStorm(false);
        for (Player p : nearbyPlayers(radius + 40)) FX.actionBar(p, "§bThe blizzard subsides...");
    }

    @Override
    protected void tick() {
        double prog = ticks / (double) duration;
        bar.setProgress(Math.max(0, 1 - prog));
        if (ticks >= duration) { finish(); return; }
        double env = prog < 0.1 ? prog / 0.1 : prog > 0.85 ? (1 - prog) / 0.15 : 1;
        double strength = env * level;

        windAngle += rnd(-0.03, 0.03);
        Vector wind = new Vector(Math.cos(windAngle), 0, Math.sin(windAngle));

        for (Player p : nearbyPlayers(radius)) {
            Location l = p.getLocation();
            boolean exposed = FX.exposedToSky(p);
            boolean warm = l.getBlock().getLightFromBlocks() >= 12;

            // Snow wall — dense flakes streaming sideways in the wind
            int flakes = (int) (15 + strength * 18);
            for (int i = 0; i < flakes; i++) {
                Location s = l.clone().add(rnd(-12, 12), rnd(-2, 10), rnd(-12, 12));
                world.spawnParticle(Particle.SNOWFLAKE, s, 0, wind.getX() * 0.9, -0.25, wind.getZ() * 0.9, 1);
            }
            // Gusts of powder
            if (ticks % 2 == 0) {
                for (int i = 0; i < 3 + level; i++) {
                    Location s = l.clone().add(rnd(-10, 10), rnd(0, 4), rnd(-10, 10));
                    world.spawnParticle(Particle.CLOUD, s, 0, wind.getX() * 0.5, 0.02, wind.getZ() * 0.5, 1);
                }
            }
            // Whiteout haze close to the camera
            if (level >= 3) world.spawnParticle(Particle.WHITE_ASH, l.clone().add(0, 1.6, 0), 20 * level, 3, 2, 3, 0);
            if (level >= 4 && ticks % 4 == 0)
                world.spawnParticle(Particle.DUST, l.clone().add(0, 1.5, 0), 12, 2.5, 1.5, 2.5, 0, FX.dust(235, 245, 255, 3f));

            // Wind audio
            if (ticks % 40 == 0) FX.sound(p, Sound.ITEM_ELYTRA_FLYING, (float) (0.3 + env * 0.5), (float) rnd(0.4, 0.7));
            if (ticks % 90 == 0) FX.sound(p, Sound.WEATHER_RAIN_ABOVE, 0.6f, 0.5f);

            if (!exposed || warm) {
                if (ticks % 40 == 0 && exposed) FX.actionBar(p, "§6🔥 §eThe warmth of the fire keeps you alive");
                continue;
            }
            // Wind push
            if (ticks % 5 == 0 && !p.isFlying()) {
                p.setVelocity(p.getVelocity().add(wind.clone().multiply(0.02 * strength)));
            }
            // Freezing
            int maxFreeze = p.getMaxFreezeTicks() + 40;
            int add = 1 + level;
            p.setFreezeTicks(Math.min(maxFreeze + 80, p.getFreezeTicks() + add + 2));
            if (ticks % 40 == 0) {
                p.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS, 60, level >= 4 ? 1 : 0, true, false, false));
                if (level >= 3) p.addPotionEffect(new PotionEffect(PotionEffectType.MINING_FATIGUE, 60, 0, true, false, false));
                if (level >= 5 && random.nextDouble() < 0.25)
                    p.addPotionEffect(new PotionEffect(PotionEffectType.DARKNESS, 60, 0, true, false, false));
                FX.actionBar(p, "§b❄ §fYou are freezing! §7Get indoors or near a fire §b❄");
            }
        }

        // Snow piles up, lakes freeze
        if (ticks % 5 == 0) {
            for (Player p : nearbyPlayers(radius)) weatherBlocks(p.getLocation(), env);
        }
    }

    private void weatherBlocks(Location around, double env) {
        int tries = (int) (level * 6 * env) + 2;
        for (int i = 0; i < tries; i++) {
            int x = around.getBlockX() + random.nextInt(-28, 29);
            int z = around.getBlockZ() + random.nextInt(-28, 29);
            int y = world.getHighestBlockYAt(x, z);
            Block top = world.getBlockAt(x, y, z);
            Material m = top.getType();
            if (freezeWater && m == Material.WATER) {
                top.setType(Material.ICE);
                world.spawnParticle(Particle.SNOWFLAKE, top.getLocation().add(0.5, 1, 0.5), 6, 0.3, 0.1, 0.3, 0.01);
                continue;
            }
            if (!accumulate) continue;
            if (m == Material.SNOW) {
                Snow snow = (Snow) top.getBlockData();
                int max = Math.min(snow.getMaximumLayers(), 1 + level + 1);
                if (snow.getLayers() < max) {
                    snow.setLayers(snow.getLayers() + 1);
                    top.setBlockData(snow, false);
                }
            } else if (m == Material.SHORT_GRASS || m == Material.FERN) {
                top.setType(Material.SNOW, false);
            } else if (m.isOccluding() && m != Material.ICE && m != Material.PACKED_ICE) {
                Block above = top.getRelative(0, 1, 0);
                if (above.getType().isAir()) above.setType(Material.SNOW, false);
            }
        }
    }
}
