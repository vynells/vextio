package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryDragEvent;

/** Routes clicks to menus and makes sure nothing can be moved in or out of them. */
public final class MenuListener implements Listener {

    private final PowerGuard plugin;

    public MenuListener(PowerGuard plugin) {
        this.plugin = plugin;
    }

    /** Closes any PowerGuard menu the player has open (used when they enter combat). */
    public void closeFor(Player player) {
        if (player.getOpenInventory().getTopInventory().getHolder(false) instanceof Menu) {
            player.closeInventory();
        }
    }

    public void closeAll() {
        for (Player player : Bukkit.getOnlinePlayers()) {
            if (player.getOpenInventory().getTopInventory().getHolder(false) instanceof Menu) {
                player.closeInventory();
            }
        }
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void onClick(InventoryClickEvent event) {
        if (!(event.getView().getTopInventory().getHolder(false) instanceof Menu menu)) {
            return;
        }
        event.setCancelled(true);
        if (event.getClickedInventory() != event.getView().getTopInventory() || !(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        if (plugin.combat().isTagged(player)) {
            player.closeInventory();
            plugin.messages().send(player, "combat-team-blocked");
            return;
        }
        menu.handleClick(event);
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void onDrag(InventoryDragEvent event) {
        if (event.getView().getTopInventory().getHolder(false) instanceof Menu) {
            event.setCancelled(true);
        }
    }
}
