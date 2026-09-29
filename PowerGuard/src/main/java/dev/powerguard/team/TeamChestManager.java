package dev.powerguard.team;

import dev.powerguard.PowerGuard;
import dev.powerguard.util.Text;
import org.bukkit.Bukkit;
import org.bukkit.entity.HumanEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemStack;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * The shared team ender chest. Every member views the same live Inventory instance, so two members
 * using it at once see each other's changes immediately and nothing can be duplicated. Contents are
 * written back to the team (and disk) one tick after every change and whenever a viewer closes it.
 */
public final class TeamChestManager implements Listener {

    /** Marks an inventory as a team ender chest. */
    public static final class Holder implements InventoryHolder {
        private final UUID teamId;
        private Inventory inventory;

        private Holder(UUID teamId) {
            this.teamId = teamId;
        }

        public UUID teamId() {
            return teamId;
        }

        @Override
        public Inventory getInventory() {
            return inventory;
        }
    }

    private final PowerGuard plugin;
    private final Map<UUID, Inventory> open = new HashMap<>();
    private final Set<UUID> pendingSync = new HashSet<>();

    public TeamChestManager(PowerGuard plugin) {
        this.plugin = plugin;
    }

    private int size() {
        int rows = Math.max(1, Math.min(6, plugin.getConfig().getInt("teams.echest-rows", 3)));
        return rows * 9;
    }

    public void open(Player player, Team team) {
        Inventory inventory = open.computeIfAbsent(team.id(), id -> create(team));
        player.openInventory(inventory);
    }

    private Inventory create(Team team) {
        Holder holder = new Holder(team.id());
        Inventory inventory = Bukkit.createInventory(holder, size(),
                Text.parse(team.color().code() + team.name() + " &8Ender Chest"));
        holder.inventory = inventory;
        ItemStack[] stored = team.chestContents();
        for (int i = 0; i < Math.min(stored.length, inventory.getSize()); i++) {
            inventory.setItem(i, stored[i]);
        }
        return inventory;
    }

    /** Copies the live inventory into the team, keeping any stored items beyond the current size. */
    private void sync(UUID teamId) {
        Inventory inventory = open.get(teamId);
        Team team = plugin.teams().byId(teamId);
        if (inventory == null || team == null) {
            return;
        }
        ItemStack[] stored = team.chestContents();
        ItemStack[] merged = new ItemStack[Math.max(stored.length, inventory.getSize())];
        System.arraycopy(stored, 0, merged, 0, stored.length);
        ItemStack[] live = inventory.getContents();
        for (int i = 0; i < live.length; i++) {
            merged[i] = live[i] == null ? null : live[i].clone();
        }
        plugin.teams().setChestContents(team, merged);
    }

    private void scheduleSync(UUID teamId) {
        if (pendingSync.add(teamId)) {
            Bukkit.getScheduler().runTask(plugin, () -> {
                pendingSync.remove(teamId);
                sync(teamId);
            });
        }
    }

    /** Closes the chest for one player (e.g. entering combat, leaving the team). */
    public void closeFor(Player player) {
        if (player.getOpenInventory().getTopInventory().getHolder(false) instanceof Holder) {
            player.closeInventory();
        }
    }

    /** Closes the chest for everyone viewing it and saves it. */
    public void close(Team team) {
        Inventory inventory = open.get(team.id());
        if (inventory == null) {
            return;
        }
        for (HumanEntity viewer : new ArrayList<>(inventory.getViewers())) {
            viewer.closeInventory();
        }
        sync(team.id());
        open.remove(team.id());
    }

    /** Takes every item out of a team's chest (used when a team is disbanded). */
    public List<ItemStack> drain(Team team) {
        close(team);
        List<ItemStack> items = new ArrayList<>();
        for (ItemStack item : team.chestContents()) {
            if (item != null && !item.getType().isAir()) {
                items.add(item);
            }
        }
        team.setChestContents(new ItemStack[0]);
        return items;
    }

    /** Saves and closes every open chest; used on reload (size may change) and shutdown. */
    public void closeAll() {
        for (UUID teamId : new ArrayList<>(open.keySet())) {
            Team team = plugin.teams().byId(teamId);
            if (team != null) {
                close(team);
            } else {
                open.remove(teamId);
            }
        }
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onClick(InventoryClickEvent event) {
        if (event.getView().getTopInventory().getHolder(false) instanceof Holder holder) {
            scheduleSync(holder.teamId());
        }
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onDrag(InventoryDragEvent event) {
        if (event.getView().getTopInventory().getHolder(false) instanceof Holder holder) {
            scheduleSync(holder.teamId());
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onClose(InventoryCloseEvent event) {
        if (!(event.getInventory().getHolder(false) instanceof Holder holder)) {
            return;
        }
        sync(holder.teamId());
        Inventory inventory = open.get(holder.teamId());
        if (inventory != null && inventory.getViewers().size() <= 1) {
            Bukkit.getScheduler().runTask(plugin, () -> {
                Inventory current = open.get(holder.teamId());
                if (current != null && current.getViewers().isEmpty()) {
                    open.remove(holder.teamId());
                }
            });
        }
    }
}
