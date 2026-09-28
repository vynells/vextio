package com.vextio.disasters.util;

import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.HeightMap;
import org.bukkit.Location;
import org.bukkit.NamespacedKey;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.SoundCategory;
import org.bukkit.World;
import org.bukkit.block.data.BlockData;
import org.bukkit.entity.FallingBlock;
import org.bukkit.entity.Player;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.util.Vector;

import java.util.concurrent.ThreadLocalRandom;

/** Shared visual / audio helpers. */
public final class FX {

    public static final NamespacedKey VISUAL_DEBRIS = new NamespacedKey("naturaldisasters", "visual_debris");
    private static final LegacyComponentSerializer LEGACY = LegacyComponentSerializer.legacySection();

    private FX() {}

    public static void title(Player p, String title, String sub, int in, int stay, int out) {
        p.sendTitle(title, sub, in, stay, out);
    }

    public static void actionBar(Player p, String msg) {
        p.sendActionBar(LEGACY.deserialize(msg));
    }

    public static void sound(Player p, Sound s, float vol, float pitch) {
        p.playSound(p.getLocation(), s, SoundCategory.WEATHER, vol, pitch);
    }

    public static void sound(Location l, Sound s, float vol, float pitch) {
        l.getWorld().playSound(l, s, SoundCategory.WEATHER, vol, pitch);
    }

    /** Camera shake: jitters the view and nudges the body. Amplitude ~ degrees. */
    public static void shake(Player p, double amp) {
        if (p.isInsideVehicle() || p.isGliding() || amp <= 0) return;
        ThreadLocalRandom r = ThreadLocalRandom.current();
        Location l = p.getLocation();
        Vector vel = p.getVelocity();
        l.setYaw((float) (l.getYaw() + r.nextGaussian() * amp));
        l.setPitch((float) Math.max(-90, Math.min(90, l.getPitch() + r.nextGaussian() * amp * 0.7)));
        p.teleport(l);
        double push = Math.min(0.35, amp * 0.03);
        vel.add(new Vector(r.nextGaussian() * push, p.isOnGround() && r.nextDouble() < amp * 0.02 ? 0.25 : 0, r.nextGaussian() * push));
        p.setVelocity(vel);
    }

    /** Spawns a falling block. Visual debris vanishes on landing instead of placing a block. */
    public static FallingBlock debris(Location l, BlockData data, Vector velocity, boolean visualOnly) {
        FallingBlock fb = l.getWorld().spawnFallingBlock(l, data);
        fb.setDropItem(false);
        fb.setHurtEntities(true);
        fb.setVelocity(velocity);
        if (visualOnly) fb.getPersistentDataContainer().set(VISUAL_DEBRIS, PersistentDataType.BYTE, (byte) 1);
        return fb;
    }

    /** Expanding flat ring of particles (shockwave). */
    public static void ring(Location c, double radius, Particle particle, int points, Object data) {
        World w = c.getWorld();
        for (int i = 0; i < points; i++) {
            double a = Math.PI * 2 * i / points;
            Location l = c.clone().add(Math.cos(a) * radius, 0.2, Math.sin(a) * radius);
            if (data != null) w.spawnParticle(particle, l, 1, 0.1, 0.05, 0.1, 0, data);
            else w.spawnParticle(particle, l, 1, 0.1, 0.05, 0.1, 0);
        }
    }

    public static boolean exposedToSky(Player p) {
        Location l = p.getLocation();
        return l.getWorld().getHighestBlockYAt(l.getBlockX(), l.getBlockZ(), HeightMap.MOTION_BLOCKING_NO_LEAVES) <= l.getBlockY();
    }

    public static int surfaceY(World w, int x, int z) {
        return w.getHighestBlockYAt(x, z, HeightMap.MOTION_BLOCKING_NO_LEAVES);
    }

    public static Particle.DustOptions dust(int r, int g, int b, float size) {
        return new Particle.DustOptions(org.bukkit.Color.fromRGB(r, g, b), size);
    }

    // ---------------------------------------------------- packed block positions

    public static long pack(int x, int y, int z) {
        return ((long) (x & 0x3FFFFFF) << 38) | ((long) (z & 0x3FFFFFF) << 12) | (y & 0xFFFL);
    }
    public static int unpackX(long p) { return (int) (p >> 38); }
    public static int unpackY(long p) { return (int) (p << 52 >> 52); }
    public static int unpackZ(long p) { return (int) (p << 26 >> 38); }

    public static long column(int x, int z) { return ((long) x << 32) | (z & 0xFFFFFFFFL); }
    public static int colX(long c) { return (int) (c >> 32); }
    public static int colZ(long c) { return (int) c; }
}
