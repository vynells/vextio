package dev.powerguard.team;

import dev.powerguard.PowerGuard;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.entity.ThrownPotion;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.AreaEffectCloudApplyEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.entity.PotionSplashEvent;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectTypeCategory;
import org.bukkit.projectiles.ProjectileSource;

/**
 * Stops teammates hurting each other when their team has friendly fire off: melee, projectiles,
 * explosions they caused, harmful potions, and plugin damage (e.g. Powers) where the player is the source.
 */
public final class FriendlyFireListener implements Listener {

    private final PowerGuard plugin;

    public FriendlyFireListener(PowerGuard plugin) {
        this.plugin = plugin;
    }

    /** True if damage from attacker to victim must be blocked by friendly fire. */
    private boolean blocks(Player attacker, Player victim) {
        if (attacker.equals(victim)) {
            return false;
        }
        Team team = plugin.teams().teamOf(attacker.getUniqueId());
        return team != null && !team.friendlyFire() && team.isMember(victim.getUniqueId());
    }

    @EventHandler(priority = EventPriority.LOW, ignoreCancelled = true)
    public void onDamage(EntityDamageEvent event) {
        if (!(event.getEntity() instanceof Player victim)) {
            return;
        }
        Player attacker = plugin.attribution().attacker(event);
        if (attacker != null && blocks(attacker, victim)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOW, ignoreCancelled = true)
    public void onSplash(PotionSplashEvent event) {
        ThrownPotion potion = event.getPotion();
        if (!(potion.getShooter() instanceof Player thrower) || !isHarmful(potion.getEffects())) {
            return;
        }
        for (LivingEntity entity : event.getAffectedEntities()) {
            if (entity instanceof Player victim && blocks(thrower, victim)) {
                event.setIntensity(entity, 0);
            }
        }
    }

    @EventHandler(priority = EventPriority.LOW, ignoreCancelled = true)
    public void onLingering(AreaEffectCloudApplyEvent event) {
        ProjectileSource source = event.getEntity().getSource();
        if (!(source instanceof Player thrower) || !isHarmful(event.getEntity().getCustomEffects())
                && (event.getEntity().getBasePotionType() == null || !isHarmful(event.getEntity().getBasePotionType().getPotionEffects()))) {
            return;
        }
        event.getAffectedEntities().removeIf(entity -> entity instanceof Player victim && blocks(thrower, victim));
    }

    private static boolean isHarmful(Iterable<PotionEffect> effects) {
        for (PotionEffect effect : effects) {
            if (effect.getType().getCategory() == PotionEffectTypeCategory.HARMFUL) {
                return true;
            }
        }
        return false;
    }
}
