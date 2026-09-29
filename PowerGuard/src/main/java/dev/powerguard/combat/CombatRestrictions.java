package dev.powerguard.combat;

import com.destroystokyo.paper.event.player.PlayerElytraBoostEvent;
import dev.powerguard.PowerGuard;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityToggleGlideEvent;
import org.bukkit.event.player.PlayerItemConsumeEvent;

/** Optional combat restrictions: no Elytra gliding/boosting, no Chorus Fruit. Both off by default. */
public final class CombatRestrictions implements Listener {

    private final PowerGuard plugin;

    public CombatRestrictions(PowerGuard plugin) {
        this.plugin = plugin;
    }

    private boolean restricted(Player player, String option) {
        return plugin.getConfig().getBoolean("combat.restrictions." + option, false) && plugin.combat().isTagged(player);
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onGlide(EntityToggleGlideEvent event) {
        if (event.isGliding() && event.getEntity() instanceof Player player && restricted(player, "block-elytra")) {
            event.setCancelled(true);
            plugin.messages().send(player, "combat-elytra-blocked");
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onBoost(PlayerElytraBoostEvent event) {
        if (restricted(event.getPlayer(), "block-elytra")) {
            event.setCancelled(true);
            event.setShouldConsume(false);
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onConsume(PlayerItemConsumeEvent event) {
        if (event.getItem().getType() == Material.CHORUS_FRUIT && restricted(event.getPlayer(), "block-chorus-fruit")) {
            event.setCancelled(true);
            plugin.messages().send(event.getPlayer(), "combat-chorus-blocked");
        }
    }
}
