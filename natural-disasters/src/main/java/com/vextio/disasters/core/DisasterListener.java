package com.vextio.disasters.core;

import com.vextio.disasters.NaturalDisasters;
import com.vextio.disasters.disasters.MeteorShower;
import org.bukkit.entity.Fireball;
import org.bukkit.entity.FallingBlock;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityChangeBlockEvent;
import org.bukkit.event.entity.EntityExplodeEvent;
import org.bukkit.event.entity.ProjectileHitEvent;
import org.bukkit.event.entity.EntityCombustEvent;
import org.bukkit.event.entity.EntityCombustByEntityEvent;
import org.bukkit.event.entity.EntityCombustByBlockEvent;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.entity.EntityTargetEvent;
import org.bukkit.entity.Player;
import com.vextio.disasters.disasters.apocalypse.Element;
import com.vextio.disasters.disasters.apocalypse.ZombieApocalypse;
import org.bukkit.persistence.PersistentDataType;

public class DisasterListener implements Listener {

    private final NaturalDisasters plugin;

    public DisasterListener(NaturalDisasters plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onMeteorHit(ProjectileHitEvent e) {
        if (!(e.getEntity() instanceof Fireball fb)) return;
        Integer size = fb.getPersistentDataContainer().get(MeteorShower.KEY, PersistentDataType.INTEGER);
        if (size == null) return;
        MeteorShower.impact(plugin, fb, size);
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onMeteorExplode(EntityExplodeEvent e) {
        // Our own impact code does the damage; stop the vanilla fireball explosion.
        if (e.getEntity() instanceof Fireball fb
                && fb.getPersistentDataContainer().has(MeteorShower.KEY, PersistentDataType.INTEGER)) {
            e.setCancelled(true);
        }
    }

    @EventHandler
    public void onDebrisLand(EntityChangeBlockEvent e) {
        // Purely visual debris (tagged) vanishes on landing instead of placing a block.
        if (e.getEntity() instanceof FallingBlock fb
                && fb.getPersistentDataContainer().has(com.vextio.disasters.util.FX.VISUAL_DEBRIS, PersistentDataType.BYTE)) {
            e.setCancelled(true);
            fb.remove();
        }
    }

    // ------------------------------------------------------- apocalypse mobs

    @EventHandler
    public void onSunburn(EntityCombustEvent e) {
        // Elemental undead don't burn in daylight (fire damage from players still applies)
        if (e instanceof EntityCombustByEntityEvent || e instanceof EntityCombustByBlockEvent) return;
        if (ZombieApocalypse.isApocalypseMob(e.getEntity())) e.setCancelled(true);
    }

    @EventHandler(ignoreCancelled = true)
    public void onFriendlyFire(EntityDamageByEntityEvent e) {
        if (ZombieApocalypse.isApocalypseMob(e.getEntity()) && ZombieApocalypse.isApocalypseMob(e.getDamager())) e.setCancelled(true);
    }

    @EventHandler(ignoreCancelled = true)
    public void onTarget(EntityTargetEvent e) {
        if (ZombieApocalypse.isApocalypseMob(e.getEntity()) && e.getTarget() != null && !(e.getTarget() instanceof Player))
            e.setCancelled(true);
    }

    @EventHandler
    public void onUndeadDeath(EntityDeathEvent e) {
        Element el = ZombieApocalypse.elementOf(e.getEntity());
        if (el == null) return;
        e.getDrops().clear();
        e.setDroppedExp(el == Element.WARLORD ? 500 : 25);
        if (el == Element.WARLORD) {
            e.getDrops().add(new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHERITE_INGOT, 2));
            e.getDrops().add(new org.bukkit.inventory.ItemStack(org.bukkit.Material.TOTEM_OF_UNDYING));
        } else if (Math.random() < 0.3) {
            e.getDrops().add(new org.bukkit.inventory.ItemStack(switch (el) {
                case FIRE -> org.bukkit.Material.BLAZE_POWDER;
                case WATER -> org.bukkit.Material.PRISMARINE_CRYSTALS;
                case WIND -> org.bukkit.Material.WIND_CHARGE;
                case EARTH -> org.bukkit.Material.EMERALD;
                default -> org.bukkit.Material.GLOWSTONE_DUST;
            }, 1 + (int) (Math.random() * 3)));
        }
        ZombieApocalypse.deathFx(e.getEntity(), el);
    }
}
