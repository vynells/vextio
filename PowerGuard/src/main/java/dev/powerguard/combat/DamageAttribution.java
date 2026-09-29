package dev.powerguard.combat;

import dev.powerguard.PowerGuard;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Tag;
import org.bukkit.block.Block;
import org.bukkit.damage.DamageSource;
import org.bukkit.entity.AreaEffectCloud;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Projectile;
import org.bukkit.entity.TNTPrimed;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.player.PlayerInteractEvent;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Works out which player (if any) is responsible for a piece of damage: melee, projectiles, TNT,
 * end crystals, fireworks, potions, plugin damage where a player is the source (e.g. Powers), and
 * respawn-anchor / bed explosions, which vanilla doesn't attribute to anyone.
 */
public final class DamageAttribution implements Listener {

    public enum Kind { MELEE, PROJECTILE, EXPLOSION, OTHER }

    private record Trigger(UUID player, Location location, long expiresAt) {
    }

    private final PowerGuard plugin;
    private final List<Trigger> blockTriggers = new ArrayList<>();

    public DamageAttribution(PowerGuard plugin) {
        this.plugin = plugin;
    }

    public static boolean isNpc(Entity entity) {
        return entity.hasMetadata("NPC");
    }

    /** The real player responsible for this damage, or null. NPCs (e.g. Citizens) never count. */
    public Player attacker(EntityDamageEvent event) {
        DamageSource source = event.getDamageSource();
        Player player = asPlayer(source.getCausingEntity());
        if (player == null && event instanceof EntityDamageByEntityEvent byEntity) {
            Entity damager = byEntity.getDamager();
            if (damager instanceof Projectile projectile && projectile.getShooter() instanceof Entity shooter) {
                player = asPlayer(shooter);
            } else if (damager instanceof TNTPrimed tnt) {
                player = asPlayer(tnt.getSource());
            } else if (damager instanceof AreaEffectCloud cloud && cloud.getSource() instanceof Entity cloudSource) {
                player = asPlayer(cloudSource);
            } else {
                player = asPlayer(damager);
            }
        }
        if (player == null && event.getCause() == EntityDamageEvent.DamageCause.BLOCK_EXPLOSION) {
            Location center = source.getDamageLocation() != null ? source.getDamageLocation() : event.getEntity().getLocation();
            player = blockTriggerNear(center);
        }
        return player;
    }

    private static Player asPlayer(Entity entity) {
        return entity instanceof Player player && !isNpc(player) ? player : null;
    }

    public static Kind kind(EntityDamageEvent event) {
        EntityDamageEvent.DamageCause cause = event.getCause();
        if (cause == EntityDamageEvent.DamageCause.ENTITY_EXPLOSION || cause == EntityDamageEvent.DamageCause.BLOCK_EXPLOSION) {
            return Kind.EXPLOSION;
        }
        Entity direct = event.getDamageSource().getDirectEntity();
        if (direct instanceof Projectile) {
            return Kind.PROJECTILE;
        }
        if ((cause == EntityDamageEvent.DamageCause.ENTITY_ATTACK || cause == EntityDamageEvent.DamageCause.ENTITY_SWEEP_ATTACK)
                && direct instanceof Player) {
            return Kind.MELEE;
        }
        return Kind.OTHER;
    }

    private Player blockTriggerNear(Location center) {
        long now = System.currentTimeMillis();
        blockTriggers.removeIf(trigger -> trigger.expiresAt() < now);
        Trigger best = null;
        double bestDistance = 4.0; // squared: within 2 blocks of the explosion centre
        for (Trigger trigger : blockTriggers) {
            if (trigger.location().getWorld() != center.getWorld()) {
                continue;
            }
            double distance = trigger.location().distanceSquared(center);
            if (distance <= bestDistance) {
                best = trigger;
                bestDistance = distance;
            }
        }
        return best == null ? null : asPlayer(plugin.getServer().getPlayer(best.player()));
    }

    /** Remembers who clicked a respawn anchor or bed, in case it explodes. */
    @EventHandler(priority = EventPriority.MONITOR)
    public void onInteract(PlayerInteractEvent event) {
        Block block = event.getClickedBlock();
        if (event.getAction() != Action.RIGHT_CLICK_BLOCK || block == null) {
            return;
        }
        // Recorded for every click: the record is only used if an explosion happens at that block
        // within the window, which is exactly when the anchor/bed blew up.
        if (block.getType() != Material.RESPAWN_ANCHOR && !Tag.BEDS.isTagged(block.getType())) {
            return;
        }
        long window = plugin.getConfig().getLong("combat.explosion-attribution-seconds", 3) * 1000L;
        Location center = block.getLocation().toCenterLocation();
        blockTriggers.removeIf(trigger -> trigger.location().equals(center));
        blockTriggers.add(new Trigger(event.getPlayer().getUniqueId(), center, System.currentTimeMillis() + window));
    }
}
