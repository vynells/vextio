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
import org.bukkit.block.data.BlockData;
import org.bukkit.boss.BarColor;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.util.Vector;

import java.util.List;

public class Earthquake extends Disaster {

    private final int countdownTicks;
    private final int quakeTicks;
    private final double radius;
    private final boolean structureDamage;
    private final boolean fissures;
    private final double magnitude;

    public Earthquake(NaturalDisasters plugin, Location center, int level) {
        super(plugin, DisasterType.EARTHQUAKE, center, level);
        countdownTicks = Math.max(3, cfg("earthquake").getInt("countdown-seconds", 10)) * 20;
        quakeTicks = (cfg("earthquake").getInt("base-duration-seconds", 12) + level * 4) * 20;
        radius = cfg("earthquake").getDouble("radius", 60) + level * 8;
        structureDamage = cfg("earthquake").getBoolean("structure-damage", true);
        fissures = cfg("earthquake").getBoolean("fissures", true);
        magnitude = 4.5 + level * 0.9 + random.nextDouble() * 0.5;
    }

    @Override protected double radius() { return radius; }
    @Override protected BarColor barColor() { return BarColor.RED; }

    @Override
    protected void onStart() {
        bar.setTitle("§4§l⚠ SEISMIC ALERT ⚠ §c— Earthquake incoming");
        for (Player p : nearbyPlayers(radius + 40)) {
            FX.sound(p, Sound.ENTITY_ELDER_GUARDIAN_CURSE, 1f, 0.5f);
            p.sendMessage("§4§l[!] §cEMERGENCY BROADCAST: §fSeismic activity detected. Magnitude §4§l"
                    + String.format("%.1f", magnitude) + "§f expected. §cTake cover immediately.");
        }
    }

    @Override
    protected void tick() {
        if (ticks < countdownTicks) countdown();
        else if (ticks < countdownTicks + quakeTicks) quake(ticks - countdownTicks);
        else finish();
    }

    // ---------------------------------------------------------------- countdown

    private void countdown() {
        long left = countdownTicks - ticks;
        int secs = (int) Math.ceil(left / 20.0);
        bar.setProgress(Math.max(0, Math.min(1, left / (double) countdownTicks)));
        boolean flash = (ticks / 5) % 2 == 0;
        bar.setColor(flash ? BarColor.RED : BarColor.WHITE);
        List<Player> players = nearbyPlayers(radius + 40);

        if (left % 20 == 0) {
            String num = secs <= 3 ? "§4§l" + secs : "§c§l" + secs;
            for (Player p : players) {
                FX.title(p, (flash ? "§4§l" : "§c§l") + "⚠ EARTHQUAKE ⚠",
                        "§7Impact in " + num + " §7second" + (secs == 1 ? "" : "s") + " §8| §7Magnitude §f"
                                + String.format("%.1f", magnitude), 0, 25, 5);
                float pitch = 0.5f + (1f - left / (float) countdownTicks) * 1.2f;
                FX.sound(p, Sound.BLOCK_NOTE_BLOCK_BASS, 1f, pitch);
                FX.sound(p, Sound.ENTITY_WARDEN_HEARTBEAT, 1.5f, 1f);
                if (secs <= 3) {
                    FX.sound(p, Sound.BLOCK_BELL_USE, 1f, 0.5f);
                    FX.sound(p, Sound.ENTITY_WITHER_SPAWN, 0.3f, 0.5f + 0.2f * (3 - secs));
                }
            }
        }
        // Alarm siren between beats
        if (left % 10 == 5) for (Player p : players) FX.sound(p, Sound.BLOCK_NOTE_BLOCK_PLING, 0.6f, secs <= 3 ? 2f : 1.5f);

        // Flashing action bar
        for (Player p : players) {
            FX.actionBar(p, (flash ? "§4§l▌▌▌ " : "§c§l▌▌▌ ") + "§f§lSEEK SHELTER — STAY AWAY FROM WINDOWS"
                    + (flash ? " §4§l▌▌▌" : " §c§l▌▌▌"));
        }

        // Foreshocks during the last 4 seconds
        if (left < 80) {
            double amp = (80 - left) / 80.0 * 1.2;
            for (Player p : players) {
                if (ticks % 3 == 0) FX.shake(p, amp);
                Location l = p.getLocation();
                Block below = l.clone().subtract(0, 1, 0).getBlock();
                if (!below.getType().isAir())
                    world.spawnParticle(Particle.BLOCK, l, 6, 1.5, 0.1, 1.5, 0, below.getBlockData());
                if (ticks % 20 == 0) FX.sound(p, Sound.BLOCK_GRAVEL_BREAK, 1f, 0.5f);
            }
        }
    }

    // --------------------------------------------------------------------- quake

    private void quake(long t) {
        if (t == 0) {
            bar.setColor(BarColor.RED);
            bar.setTitle("§4§lEARTHQUAKE §8— §cMagnitude " + String.format("%.1f", magnitude));
            for (Player p : nearbyPlayers(radius + 40)) {
                FX.title(p, "§4§lEARTHQUAKE", "§cMagnitude " + String.format("%.1f", magnitude) + " — HOLD ON!", 0, 40, 20);
                FX.sound(p, Sound.ENTITY_GENERIC_EXPLODE, 2f, 0.5f);
                FX.sound(p, Sound.ENTITY_RAVAGER_ROAR, 1.2f, 0.5f);
            }
            FX.sound(center, Sound.ENTITY_GENERIC_EXPLODE, 6f, 0.4f);
        }
        // Envelope: quick ramp up, sustained, slow decay
        double prog = t / (double) quakeTicks;
        double env = prog < 0.15 ? prog / 0.15 : prog > 0.7 ? Math.max(0, (1 - prog) / 0.3) : 1.0;
        double intensity = env * (0.5 + level * 0.5) * (0.85 + random.nextDouble() * 0.3);
        bar.setProgress(Math.max(0, 1 - prog));

        List<Player> players = nearbyPlayers(radius);
        for (Player p : players) {
            double dist = p.getLocation().distance(center.clone().add(0, p.getLocation().getY() - center.getY(), 0));
            double local = intensity * Math.max(0.25, 1 - dist / radius);
            if (ticks % 2 == 0) FX.shake(p, local * 2.2);
            if (t % 40 == 0 && local > 0.8) p.addPotionEffect(new PotionEffect(PotionEffectType.NAUSEA, 100, 0, true, false, false));
            if (local > 1.2 && p.isOnGround() && random.nextDouble() < 0.02 * level) {
                p.setVelocity(p.getVelocity().add(new Vector(rnd(-0.4, 0.4), 0.45, rnd(-0.4, 0.4))));
            }
            // Ground dust + debris crumbs around each player
            Location l = p.getLocation();
            Block below = l.clone().subtract(0, 1, 0).getBlock();
            if (!below.getType().isAir()) {
                world.spawnParticle(Particle.BLOCK, l, (int) (10 * local) + 2, 3, 0.1, 3, 0, below.getBlockData());
            }
            if (t % 4 == 0) world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, l.clone().add(rnd(-8, 8), 0.2, rnd(-8, 8)), 1, 0.5, 0, 0.5, 0.01);
            if (t % 25 == 0) {
                FX.sound(p, Sound.BLOCK_STONE_BREAK, 1.5f, 0.5f);
                FX.sound(p, Sound.ENTITY_GENERIC_EXPLODE, (float) (0.3 + local * 0.3), 0.3f);
            }
            if (t % 12 == 0) FX.sound(p, Sound.BLOCK_GRAVEL_BREAK, 1f, 0.6f);
            if (t % 60 == 0) FX.sound(p, Sound.ENTITY_WARDEN_HEARTBEAT, 1.5f, 0.5f);
        }

        // Mobs and items get tossed too
        if (t % 5 == 0) {
            for (Entity e : world.getNearbyEntities(center, radius, 40, radius)) {
                if (e instanceof Player) continue;
                if (e instanceof LivingEntity && e.isOnGround()) {
                    e.setVelocity(e.getVelocity().add(new Vector(rnd(-0.2, 0.2) * intensity, 0.12 * intensity, rnd(-0.2, 0.2) * intensity)));
                }
            }
        }

        if (env < 0.2) return;

        // Ground heave: surface blocks jump up and drop back into place
        int heaves = (int) Math.ceil(intensity * 1.5);
        for (Player p : players) {
            for (int i = 0; i < heaves; i++) {
                if (random.nextDouble() > 0.35) continue;
                int x = p.getLocation().getBlockX() + random.nextInt(-14, 15);
                int z = p.getLocation().getBlockZ() + random.nextInt(-14, 15);
                int y = FX.surfaceY(world, x, z);
                Block b = world.getBlockAt(x, y, z);
                if (!b.getType().isSolid() || plugin.getManager().isProtected(b)) continue;
                BlockData data = b.getBlockData();
                b.setType(Material.AIR, false);
                FX.debris(b.getLocation().add(0.5, 0.1, 0.5), data, new Vector(rnd(-0.05, 0.05), rnd(0.25, 0.45) * Math.min(2, intensity), rnd(-0.05, 0.05)), false);
                world.spawnParticle(Particle.BLOCK, b.getLocation().add(0.5, 1, 0.5), 15, 0.4, 0.2, 0.4, 0, data);
            }
        }

        // Fissures tear open
        if (fissures && level >= 2 && t % Math.max(30, 110 - level * 15) == 0 && !players.isEmpty()) {
            Player p = players.get(random.nextInt(players.size()));
            fissure(p.getLocation().add(rnd(-12, 12), 0, rnd(-12, 12)));
        }

        // Structures crack and collapse
        if (structureDamage && t % 3 == 0) {
            for (Player p : players) structureDamage(p.getLocation(), intensity);
        }
    }

    private void fissure(Location start) {
        double angle = random.nextDouble() * Math.PI * 2;
        int length = 8 + level * 6 + random.nextInt(8);
        int maxDepth = 2 + level * 2;
        double x = start.getX(), z = start.getZ();
        FX.sound(start, Sound.ENTITY_GENERIC_EXPLODE, 3f, 0.4f);
        FX.sound(start, Sound.BLOCK_DEEPSLATE_BREAK, 3f, 0.5f);
        for (int i = 0; i < length; i++) {
            angle += rnd(-0.35, 0.35);
            x += Math.cos(angle);
            z += Math.sin(angle);
            double taper = Math.sin(Math.PI * i / length);
            int depth = (int) Math.max(1, maxDepth * taper);
            int width = taper > 0.6 && level >= 4 ? 2 : 1;
            final int fx = (int) Math.floor(x), fz = (int) Math.floor(z);
            final int d = depth, w = width, delay = i;
            // Crack propagates over time for a tearing animation
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                int top = FX.surfaceY(world, fx, fz);
                for (int ox = 0; ox < w; ox++) for (int oz = 0; oz < w; oz++) {
                    for (int dy = 0; dy < d; dy++) {
                        Block b = world.getBlockAt(fx + ox, top - dy, fz + oz);
                        if (b.getType().isAir() || plugin.getManager().isProtected(b) || b.isLiquid()) continue;
                        BlockData data = b.getBlockData();
                        b.setType(Material.AIR, false);
                        if (dy < 2 && random.nextDouble() < 0.5) {
                            FX.debris(b.getLocation().add(0.5, 1.2, 0.5), data,
                                    new Vector(rnd(-0.25, 0.25), rnd(0.4, 0.8), rnd(-0.25, 0.25)), true);
                        }
                    }
                }
                Location l = new Location(world, fx + 0.5, top + 0.5, fz + 0.5);
                world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, l, 4, 0.3, 0.3, 0.3, 0.03);
                world.spawnParticle(Particle.BLOCK, l, 30, 0.5, 0.5, 0.5, 0, Material.DIRT.createBlockData());
                if (level >= 5 && random.nextDouble() < 0.15) world.spawnParticle(Particle.LAVA, l, 3, 0.2, 0.2, 0.2, 0);
                if (delay % 3 == 0) FX.sound(l, Sound.BLOCK_ROOTED_DIRT_BREAK, 2f, 0.5f);
            }, i);
        }
    }

    private void structureDamage(Location around, double intensity) {
        int tries = (int) (intensity * 6);
        for (int i = 0; i < tries; i++) {
            Block b = around.clone().add(random.nextInt(-20, 21), random.nextInt(-4, 16), random.nextInt(-20, 21)).getBlock();
            Material m = b.getType();
            if (m.isAir() || !isManMade(m) || plugin.getManager().isProtected(b)) continue;
            String n = m.name();
            if (n.contains("GLASS")) {
                if (random.nextDouble() < 0.5 * intensity / 3) {
                    world.spawnParticle(Particle.BLOCK, b.getLocation().add(0.5, 0.5, 0.5), 25, 0.3, 0.3, 0.3, 0, b.getBlockData());
                    FX.sound(b.getLocation(), Sound.BLOCK_GLASS_BREAK, 1.5f, (float) rnd(0.7, 1.1));
                    b.setType(Material.AIR, false);
                }
                continue;
            }
            // Heavier blocks only collapse when unsupported-ish or on strong shaking
            double chance = 0.04 * intensity * (level / 3.0);
            if (b.getRelative(0, -1, 0).getType().isAir()) chance *= 4;
            if (random.nextDouble() > chance) continue;
            BlockData data = b.getBlockData();
            b.setType(Material.AIR, false);
            FX.debris(b.getLocation().add(0.5, 0, 0.5), data, new Vector(rnd(-0.15, 0.15), rnd(0, 0.2), rnd(-0.15, 0.15)), false);
            world.spawnParticle(Particle.BLOCK, b.getLocation().add(0.5, 0.5, 0.5), 20, 0.4, 0.4, 0.4, 0, data);
            world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, b.getLocation().add(0.5, 0.5, 0.5), 2, 0.3, 0.3, 0.3, 0.01);
            if (random.nextDouble() < 0.3) FX.sound(b.getLocation(), Sound.BLOCK_STONE_BREAK, 1.5f, 0.6f);
        }
    }

    static boolean isManMade(Material m) {
        String n = m.name();
        return n.contains("PLANKS") || n.contains("BRICK") || n.contains("GLASS") || n.contains("STAIRS")
                || n.contains("SLAB") || n.contains("FENCE") || n.contains("_WALL") || n.contains("WOOL")
                || n.contains("CONCRETE") || n.contains("TERRACOTTA") || n.contains("LANTERN") || n.contains("POLISHED")
                || n.contains("SMOOTH") || n.contains("CHISELED") || n.contains("CUT_") || n.contains("STRIPPED")
                || n.equals("COBBLESTONE") || n.equals("BOOKSHELF") || n.equals("HAY_BLOCK") || n.contains("_BARS")
                || n.equals("QUARTZ_BLOCK") || n.contains("QUARTZ_PILLAR") || n.contains("COPPER");
    }
}
