package com.vextio.disasters.disasters;

import com.vextio.disasters.NaturalDisasters;
import com.vextio.disasters.core.Disaster;
import com.vextio.disasters.core.DisasterType;
import com.vextio.disasters.util.FX;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.boss.BarColor;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Fireball;
import org.bukkit.entity.LargeFireball;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.util.Vector;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public class MeteorShower extends Disaster {

    public static final NamespacedKey KEY = new NamespacedKey("naturaldisasters", "meteor");
    private static final Material[] ROCK = {Material.MAGMA_BLOCK, Material.NETHERRACK, Material.BLACKSTONE,
            Material.BASALT, Material.OBSIDIAN, Material.COBBLED_DEEPSLATE};

    private final double radius;
    private final int duration;
    private final List<Fireball> meteors = new ArrayList<>();

    public MeteorShower(NaturalDisasters plugin, Location center, int level) {
        super(plugin, DisasterType.METEOR_SHOWER, center, level);
        radius = cfg("meteor-shower").getDouble("radius", 70) + level * 10;
        duration = (cfg("meteor-shower").getInt("base-duration-seconds", 30) + level * 8) * 20;
    }

    @Override protected double radius() { return radius; }
    @Override protected BarColor barColor() { return BarColor.YELLOW; }

    @Override
    protected void onStart() {
        bar.setTitle("§c§l☄ METEOR SHOWER ☄ §7— Level " + level);
        for (Player p : nearbyPlayers(radius + 40)) {
            FX.title(p, "§c§l☄ METEOR SHOWER ☄", "§6The sky is falling. Get underground!", 10, 60, 20);
            FX.sound(p, Sound.ENTITY_WITHER_SPAWN, 0.8f, 0.6f);
            FX.sound(p, Sound.ITEM_TRIDENT_THUNDER, 1f, 0.5f);
        }
    }

    @Override
    protected void tick() {
        bar.setProgress(Math.max(0, 1 - ticks / (double) duration));
        meteors.removeIf(f -> !f.isValid());

        // Trails
        for (Fireball f : meteors) {
            Location l = f.getLocation();
            int size = f.getPersistentDataContainer().getOrDefault(KEY, PersistentDataType.INTEGER, 1);
            double s = 0.3 + size * 0.25;
            world.spawnParticle(Particle.FLAME, l, 6 * size, s, s, s, 0.02);
            world.spawnParticle(Particle.LARGE_SMOKE, l, 3 * size, s, s, s, 0.01);
            world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, l, size, s * 0.5, s * 0.5, s * 0.5, 0.005);
            world.spawnParticle(Particle.DUST, l, 5 * size, s, s, s, 0, FX.dust(255, 110 + random.nextInt(80), 20, 2.2f));
            world.spawnParticle(Particle.LAVA, l, 1, s, s, s, 0);
            if (ticks % 12 == 0) FX.sound(l, Sound.ENTITY_BLAZE_SHOOT, 2f + size, 0.5f);
            if (size >= 3) world.spawnParticle(Particle.EXPLOSION, l, 1, 0.2, 0.2, 0.2, 0);
        }

        if (ticks >= duration) {
            if (meteors.isEmpty()) finish();
            return;
        }

        // Sky glow: embers drifting down near players
        for (Player p : nearbyPlayers(radius)) {
            if (ticks % 3 == 0) world.spawnParticle(Particle.WHITE_ASH, p.getLocation().add(0, 8, 0), 25, 12, 4, 12, 0);
            if (ticks % 5 == 0) world.spawnParticle(Particle.DUST, p.getLocation().add(rnd(-15, 15), rnd(12, 20), rnd(-15, 15)),
                    3, 2, 1, 2, 0, FX.dust(255, 90, 20, 1.5f));
        }

        double spawnChance = 0.04 + level * 0.035;
        if (random.nextDouble() < spawnChance) spawnMeteor(random.nextDouble() < 0.08 * level ? 3 : random.nextInt(1, 3));
        // Grand finale meteor
        if (level >= 4 && ticks == duration - 100) spawnMeteor(4 + (level == 5 ? 1 : 0));
    }

    private void spawnMeteor(int size) {
        List<Player> players = nearbyPlayers(radius);
        Location target;
        if (!players.isEmpty() && random.nextDouble() < 0.4) {
            Location pl = players.get(random.nextInt(players.size())).getLocation();
            target = pl.add(rnd(-20, 20), 0, rnd(-20, 20));
        } else {
            target = center.clone().add(rnd(-radius, radius), 0, rnd(-radius, radius));
        }
        target.setY(FX.surfaceY(world, target.getBlockX(), target.getBlockZ()));
        double ang = random.nextDouble() * Math.PI * 2;
        double slant = rnd(25, 55);
        Location from = target.clone().add(Math.cos(ang) * slant, rnd(70, 100), Math.sin(ang) * slant);
        from.setY(Math.min(from.getY(), world.getMaxHeight() - 5));
        Vector dir = target.toVector().subtract(from.toVector()).normalize();

        LargeFireball fb = world.spawn(from, LargeFireball.class, f -> {
            f.setYield(0);
            f.setIsIncendiary(false);
            f.getPersistentDataContainer().set(KEY, PersistentDataType.INTEGER, size);
        });
        fb.setDirection(dir.clone().multiply(0.1));
        fb.setVelocity(dir.clone().multiply(1.4 + size * 0.15));
        meteors.add(fb);
        for (Player p : nearbyPlayers(radius + 30)) {
            if (p.getLocation().distanceSquared(target) < 60 * 60) FX.sound(p, Sound.ENTITY_GHAST_SHOOT, 0.8f, 0.5f);
        }
    }

    /** Called from the listener when a meteor fireball hits something. */
    public static void impact(NaturalDisasters plugin, Fireball fb, int size) {
        Location l = fb.getLocation();
        World w = l.getWorld();
        ThreadLocalRandom r = ThreadLocalRandom.current();
        fb.remove();
        boolean blockDamage = plugin.getConfig().getBoolean("meteor-shower.block-damage", true);
        float power = 2.5f + size * 1.3f;
        w.createExplosion(l, power, blockDamage, blockDamage);

        // Flash + mushroom plume
        w.spawnParticle(Particle.EXPLOSION_EMITTER, l, 1 + size / 2, 0.5, 0.5, 0.5, 0);
        w.spawnParticle(Particle.LAVA, l, 30 * size, 1.5, 1, 1.5, 0);
        w.spawnParticle(Particle.FLAME, l, 80 * size, 1.5, 1, 1.5, 0.25);
        w.spawnParticle(Particle.CAMPFIRE_SIGNAL_SMOKE, l, 12 * size, 1.5, 0.5, 1.5, 0.08);
        w.spawnParticle(Particle.LARGE_SMOKE, l, 60 * size, 2, 1, 2, 0.15);
        w.playSound(l, Sound.ENTITY_GENERIC_EXPLODE, 6f + size * 2, 0.5f);
        w.playSound(l, Sound.ENTITY_DRAGON_FIREBALL_EXPLODE, 4f, 0.6f);
        w.playSound(l, Sound.ITEM_TRIDENT_THUNDER, 4f, 0.6f);

        // Molten ejecta
        int chunks = 6 + size * 6;
        for (int i = 0; i < chunks; i++) {
            Material m = ROCK[r.nextInt(ROCK.length)];
            Vector v = new Vector(r.nextGaussian() * 0.45, 0.6 + r.nextDouble() * 0.6, r.nextGaussian() * 0.45);
            FX.debris(l.clone().add(0, 1.5, 0), m.createBlockData(), v, !blockDamage || r.nextDouble() < 0.5);
        }

        // Scorch / molten crater floor
        if (blockDamage) {
            int rad = 2 + size;
            for (int dx = -rad; dx <= rad; dx++) for (int dz = -rad; dz <= rad; dz++) {
                if (dx * dx + dz * dz > rad * rad || r.nextDouble() < 0.4) continue;
                int y = FX.surfaceY(w, l.getBlockX() + dx, l.getBlockZ() + dz);
                Block b = w.getBlockAt(l.getBlockX() + dx, y, l.getBlockZ() + dz);
                if (!b.getType().isSolid() || plugin.getManager().isProtected(b)) continue;
                double roll = r.nextDouble();
                b.setType(roll < 0.25 ? Material.MAGMA_BLOCK : roll < 0.55 ? Material.NETHERRACK : roll < 0.7 ? Material.BLACKSTONE : Material.COBBLED_DEEPSLATE);
                Block above = b.getRelative(0, 1, 0);
                if (above.getType().isAir() && r.nextDouble() < 0.3) above.setType(Material.FIRE);
            }
            if (size >= 4) {
                Block core = w.getBlockAt(l.getBlockX(), FX.surfaceY(w, l.getBlockX(), l.getBlockZ()), l.getBlockZ());
                if (!plugin.getManager().isProtected(core)) core.setType(Material.ANCIENT_DEBRIS);
            }
        }

        // Shockwave: expanding ring + knockback + screen shake
        for (int ring = 1; ring <= 6; ring++) {
            final double rad = ring * (1.5 + size * 0.6);
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                FX.ring(l, rad, Particle.CLOUD, (int) (rad * 8), null);
                FX.ring(l, rad, Particle.DUST, (int) (rad * 6), FX.dust(255, 120, 40, 2f));
            }, ring * 2L);
        }
        double shockR = 8 + size * 5;
        for (Entity e : w.getNearbyEntities(l, shockR, shockR, shockR)) {
            if (!(e instanceof LivingEntity le)) continue;
            Vector push = e.getLocation().toVector().subtract(l.toVector());
            double dist = Math.max(1, push.length());
            double f = (1 - dist / shockR) * (0.5 + size * 0.2);
            if (f <= 0) continue;
            le.setVelocity(push.normalize().multiply(f).setY(0.35 + f * 0.3));
            le.setFireTicks(Math.max(le.getFireTicks(), (int) (40 * f)));
        }
        for (Player p : w.getPlayers()) {
            double d = p.getLocation().distance(l);
            if (d < 60 + size * 15) {
                double amp = Math.max(0.3, (1 - d / (60 + size * 15)) * (2 + size));
                for (int i = 0; i < 6; i++) {
                    final int k = i;
                    plugin.getServer().getScheduler().runTaskLater(plugin, () -> FX.shake(p, amp * (1 - k / 6.0)), i * 2L);
                }
            }
        }
    }
}
