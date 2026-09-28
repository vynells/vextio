package com.vextio.disasters.disasters.apocalypse;

import org.bukkit.Location;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

import java.util.function.BiConsumer;
import java.util.function.Consumer;

/** A magic projectile made purely of particles. Travels, draws itself, and calls onHit. */
public class Bolt extends BukkitRunnable {

    private final Location loc;
    private final Vector step;
    private final int maxTicks;
    private final Entity caster;
    private final Consumer<Location> draw;
    private final BiConsumer<Location, LivingEntity> onHit;
    private final double hitRadius;
    private int age;

    public Bolt(Location from, Vector dir, double speed, int maxTicks, double hitRadius, Entity caster,
                Consumer<Location> draw, BiConsumer<Location, LivingEntity> onHit) {
        this.loc = from.clone();
        this.step = dir.clone().normalize().multiply(speed / 3.0);
        this.maxTicks = maxTicks;
        this.caster = caster;
        this.draw = draw;
        this.onHit = onHit;
        this.hitRadius = hitRadius;
    }

    public void launch(Plugin plugin) { runTaskTimer(plugin, 0L, 1L); }

    @Override
    public void run() {
        // 3 sub-steps per tick for smooth, dense trails and reliable hits
        for (int i = 0; i < 3; i++) {
            loc.add(step);
            draw.accept(loc);
            if (!loc.getBlock().isPassable()) { hit(null); return; }
            for (Entity e : loc.getWorld().getNearbyEntities(loc, hitRadius, hitRadius, hitRadius)) {
                if (e == caster || !(e instanceof LivingEntity le)) continue;
                if (!(e instanceof Player) && ZombieApocalypse.isApocalypseMob(e)) continue;
                hit(le);
                return;
            }
        }
        if (++age >= maxTicks) hit(null);
    }

    private void hit(LivingEntity target) {
        cancel();
        onHit.accept(loc, target);
    }
}
