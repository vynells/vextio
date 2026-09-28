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
}
