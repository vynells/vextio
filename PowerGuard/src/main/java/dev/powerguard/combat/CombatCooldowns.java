package dev.powerguard.combat;

import com.destroystokyo.paper.event.player.PlayerLaunchProjectileEvent;
import dev.powerguard.PowerGuard;
import io.papermc.paper.event.player.PlayerArmSwingEvent;
import io.papermc.paper.event.player.PlayerItemCooldownEvent;
import io.papermc.paper.registry.RegistryAccess;
import io.papermc.paper.registry.RegistryKey;
import io.papermc.paper.registry.keys.EnchantmentKeys;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.entity.Player;
import org.bukkit.entity.Trident;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.event.player.PlayerRiptideEvent;
import org.bukkit.event.player.PlayerVelocityEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.util.Vector;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Ender pearl, trident (throw + riptide) and spear Lunge cooldowns, shown with the vanilla item
 * cooldown overlay.
 *
 * <p>Lunge has no dedicated event. A Lunge is the spear jab (an arm swing with a Lunge spear in the
 * main hand) followed within a couple of ticks by the enchantment's forward impulse, which the server
 * sends to the client as a velocity update (PlayerVelocityEvent). When both happen together it's a
 * Lunge: the spear gets the cooldown, and a Lunge attempted while the spear is on cooldown has its
 * impulse removed so the dash doesn't happen.
 */
public final class CombatCooldowns implements Listener {

    private static final int LUNGE_WINDOW_TICKS = 2;

    private final PowerGuard plugin;
    private final Map<UUID, Integer> lastLungeSwing = new HashMap<>();

    public CombatCooldowns(PowerGuard plugin) {
        this.plugin = plugin;
    }

    private boolean applies(Player player) {
        if (player.hasPermission("powerguard.bypass.cooldowns")) {
            return false;
        }
        return !plugin.getConfig().getBoolean("combat.cooldowns.only-in-combat", true) || plugin.combat().isTagged(player);
    }

    private int ticks(String key) {
        return (int) Math.round(plugin.getConfig().getDouble("combat.cooldowns." + key, 0) * 20);
    }

    // ---------------------------------------------------------------- ender pearl

    /** Vanilla gives pearls a 1s cooldown when thrown; stretch it to the configured length. */
    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onPearlCooldown(PlayerItemCooldownEvent event) {
        int ticks = ticks("ender-pearl");
        if (event.getType() == Material.ENDER_PEARL && ticks > 0 && applies(event.getPlayer())) {
            event.setCooldown(Math.max(event.getCooldown(), ticks));
        }
    }

    // ---------------------------------------------------------------- trident

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onTridentThrow(PlayerLaunchProjectileEvent event) {
        if (event.getProjectile() instanceof Trident) {
            startTridentCooldown(event.getPlayer());
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onRiptide(PlayerRiptideEvent event) {
        Player player = event.getPlayer();
        if (applies(player) && player.hasCooldown(Material.TRIDENT)) {
            event.setCancelled(true);
            sendWait(player, player.getCooldown(Material.TRIDENT));
            return;
        }
        startTridentCooldown(player);
    }

    private void startTridentCooldown(Player player) {
        int ticks = ticks("trident");
        if (ticks > 0 && applies(player)) {
            player.setCooldown(Material.TRIDENT, ticks);
        }
    }

    // ---------------------------------------------------------------- spear lunge

    private static Enchantment lunge() {
        return RegistryAccess.registryAccess().getRegistry(RegistryKey.ENCHANTMENT).get(EnchantmentKeys.LUNGE);
    }

    private static boolean hasLunge(ItemStack item) {
        Enchantment lunge = lunge();
        return lunge != null && item != null && !item.getType().isAir() && item.getEnchantmentLevel(lunge) > 0;
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onSwing(PlayerArmSwingEvent event) {
        if (event.getHand() == EquipmentSlot.HAND && hasLunge(event.getPlayer().getInventory().getItemInMainHand())) {
            lastLungeSwing.put(event.getPlayer().getUniqueId(), Bukkit.getCurrentTick());
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onVelocity(PlayerVelocityEvent event) {
        Player player = event.getPlayer();
        Integer swingTick = lastLungeSwing.get(player.getUniqueId());
        if (swingTick == null || Bukkit.getCurrentTick() - swingTick > LUNGE_WINDOW_TICKS) {
            return;
        }
        ItemStack spear = player.getInventory().getItemInMainHand();
        if (!hasLunge(spear) || !isForwardDash(player, event.getVelocity())) {
            return;
        }
        lastLungeSwing.remove(player.getUniqueId());
        int ticks = ticks("lunge");
        if (ticks <= 0 || !applies(player)) {
            return;
        }
        if (player.hasCooldown(spear)) {
            // Lunge attempted during the cooldown: keep only falling speed, drop the dash.
            Vector velocity = event.getVelocity();
            event.setVelocity(new Vector(0, Math.min(0, velocity.getY()), 0));
            sendWait(player, player.getCooldown(spear));
            return;
        }
        player.setCooldown(spear, ticks);
    }

    /** The Lunge impulse pushes the player the way they're looking; knockback from a hit doesn't. */
    private static boolean isForwardDash(Player player, Vector velocity) {
        Vector horizontal = velocity.clone().setY(0);
        if (horizontal.lengthSquared() < 0.04) {
            return false;
        }
        Vector look = player.getLocation().getDirection().setY(0);
        return look.lengthSquared() > 0 && horizontal.normalize().dot(look.normalize()) > 0.5;
    }

    private void sendWait(Player player, int ticksLeft) {
        plugin.messages().send(player, "cooldown-active", "seconds", String.format(java.util.Locale.ROOT, "%.1f", ticksLeft / 20.0));
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        lastLungeSwing.remove(event.getPlayer().getUniqueId());
    }
}
