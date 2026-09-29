package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import net.kyori.adventure.text.Component;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemStack;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

/**
 * Base class for every PowerGuard menu: owns the inventory, draws filler/border panes, and maps
 * slots to click actions. Items can never be taken out of a menu.
 */
public abstract class Menu implements InventoryHolder {

    /** Inner slots of a menu with a one-slot border, left to right, top to bottom. */
    protected static int[] innerSlots(int rows) {
        int[] slots = new int[(rows - 2) * 7];
        int index = 0;
        for (int row = 1; row < rows - 1; row++) {
            for (int column = 1; column < 8; column++) {
                slots[index++] = row * 9 + column;
            }
        }
        return slots;
    }

    protected final PowerGuard plugin;
    protected final Player viewer;
    private final Map<Integer, Consumer<InventoryClickEvent>> actions = new HashMap<>();
    private Inventory inventory;

    protected Menu(PowerGuard plugin, Player viewer) {
        this.plugin = plugin;
        this.viewer = viewer;
    }

    protected abstract int rows();

    protected abstract Component title();

    protected abstract void draw();

    protected MenuItems items() {
        return plugin.menuItems();
    }

    public void open() {
        inventory = Bukkit.createInventory(this, rows() * 9, title());
        redraw();
        viewer.openInventory(inventory);
    }

    /** Clears and redraws the menu in place (keeps the same window open). */
    protected void redraw() {
        actions.clear();
        ItemStack filler = items().pane(items().configuredMaterial("gui.filler", Material.GRAY_STAINED_GLASS_PANE));
        ItemStack border = items().pane(items().configuredMaterial("gui.border", Material.BLACK_STAINED_GLASS_PANE));
        int size = inventory.getSize();
        for (int slot = 0; slot < size; slot++) {
            int row = slot / 9;
            int column = slot % 9;
            boolean edge = row == 0 || row == size / 9 - 1 || column == 0 || column == 8;
            inventory.setItem(slot, edge ? border : filler);
        }
        draw();
    }

    protected void set(int slot, ItemStack item, Consumer<InventoryClickEvent> action) {
        inventory.setItem(slot, item);
        if (action != null) {
            actions.put(slot, action);
        }
    }

    protected void set(int slot, ItemStack item) {
        set(slot, item, null);
    }

    /** Standard "back" button in the given slot. */
    protected void back(int slot, Runnable target) {
        set(slot, items().item("back"), click -> target.run());
    }

    void handleClick(InventoryClickEvent event) {
        Consumer<InventoryClickEvent> action = actions.get(event.getRawSlot());
        if (action == null) {
            return;
        }
        plugin.menuSounds().click(viewer);
        action.accept(event);
    }

    @Override
    public Inventory getInventory() {
        return inventory;
    }
}
