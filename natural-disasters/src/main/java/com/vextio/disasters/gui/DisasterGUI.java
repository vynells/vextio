package com.vextio.disasters.gui;

import com.vextio.disasters.NaturalDisasters;
import com.vextio.disasters.core.Disaster;
import com.vextio.disasters.core.DisasterType;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Sound;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemFlag;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

public class DisasterGUI implements Listener {

    enum Target {
        SELF("At your location", Material.COMPASS),
        LOOKING("Where you are looking", Material.SPYGLASS),
        RANDOM("On a random player", Material.ENDER_PEARL);
        final String label; final Material icon;
        Target(String label, Material icon) { this.label = label; this.icon = icon; }
    }

    static final class Selection { int level = 3; Target target = Target.SELF; }

    static final class Menu implements InventoryHolder {
        final String id; final DisasterType type; Inventory inv;
        Menu(String id, DisasterType type) { this.id = id; this.type = type; }
        @Override public Inventory getInventory() { return inv; }
    }

    private static final int[] TYPE_SLOTS = {19, 20, 21, 22, 23, 24, 25};
    private static final int[] LEVEL_SLOTS = {20, 21, 22, 23, 24};
    private static final Material[] LEVEL_ICONS = {Material.LIME_STAINED_GLASS_PANE, Material.YELLOW_STAINED_GLASS_PANE,
            Material.ORANGE_STAINED_GLASS_PANE, Material.RED_STAINED_GLASS_PANE, Material.PURPLE_STAINED_GLASS_PANE};
    private static final String[] LEVEL_NAMES = {"§aMinor", "§eModerate", "§6Severe", "§cExtreme", "§5§lCATASTROPHIC"};

    private final NaturalDisasters plugin;
    private final Map<UUID, Selection> selections = new HashMap<>();

    public DisasterGUI(NaturalDisasters plugin) { this.plugin = plugin; }

    // ------------------------------------------------------------------ main menu

    public void openMain(Player p) {
        Menu m = new Menu("main", null);
        Inventory inv = Bukkit.createInventory(m, 54, "§8✦ §4§lNatural Disasters §8✦");
        m.inv = inv;
        frame(inv);

        inv.setItem(4, item(Material.NETHER_STAR, "§4§lNatural Disasters",
                "§7Unleash the forces of nature.", "", "§eLeft-click §7a disaster to configure", "§eRight-click §7to quick-start (level 3)"));

        DisasterType[] types = DisasterType.values();
        for (int i = 0; i < types.length && i < TYPE_SLOTS.length; i++) {
            DisasterType t = types[i];
            long running = plugin.getManager().getActive().stream().filter(d -> d.getType() == t).count();
            List<String> lore = new ArrayList<>();
            for (String s : t.description) lore.add("§7" + s);
            lore.add("");
            if (running > 0) lore.add("§a● Active: §f" + running);
            lore.add("§e▸ Left-click §7to configure");
            lore.add("§e▸ Right-click §7to quick-start");
            ItemStack it = item(t.icon, t.pretty(), lore.toArray(new String[0]));
            if (running > 0) glow(it);
            inv.setItem(TYPE_SLOTS[i], it);
        }
        inv.setItem(40, item(Material.ENDER_EYE, "§d§lRandom Disaster", "§7Pick a random disaster and", "§7a random player. Good luck.", "", "§e▸ Click to roll"));

        List<Disaster> active = plugin.getManager().getActive();
        List<String> lore = new ArrayList<>();
        if (active.isEmpty()) lore.add("§7No disasters are active.");
        for (Disaster d : active) {
            Location c = d.getCenter();
            lore.add(d.getType().pretty() + " §7L" + d.getLevel() + " §8@ §7" + c.getWorld().getName() + " "
                    + c.getBlockX() + ", " + c.getBlockZ());
        }
        inv.setItem(31, item(Material.CLOCK, "§6§lActive Disasters §7(" + active.size() + ")", lore.toArray(new String[0])));

        boolean rnd = plugin.getManager().isRandomEnabled();
        ItemStack toggle = item(rnd ? Material.LIME_DYE : Material.GRAY_DYE, "§f§lRandom Disasters: " + (rnd ? "§aON" : "§cOFF"),
                "§7Disasters strike on their own every", "§f" + plugin.getConfig().getInt("random.min-interval") / 60 + "-"
                        + plugin.getConfig().getInt("random.max-interval") / 60 + " §7minutes.", "", "§e▸ Click to toggle");
        if (rnd) glow(toggle);
        inv.setItem(48, toggle);
        inv.setItem(49, item(Material.BARRIER, "§c§lStop All Disasters", "§7Ends every active disaster.", "§7Flood water recedes over time."));
        inv.setItem(50, item(Material.BOOK, "§b§lCommands",
                "§f/disaster gui", "§f/disaster start <type> [level] [player]", "§f/disaster stop [type]",
                "§f/disaster random <on|off|now>", "§f/disaster list", "§f/disaster reload"));
        p.openInventory(inv);
    }

    // ---------------------------------------------------------------- config menu

    public void openConfig(Player p, DisasterType type) {
        Selection sel = selections.computeIfAbsent(p.getUniqueId(), k -> new Selection());
        Menu m = new Menu("config", type);
        Inventory inv = Bukkit.createInventory(m, 45, "§8✦ " + type.pretty() + " §8✦");
        m.inv = inv;
        frame(inv);

        List<String> desc = new ArrayList<>();
        for (String s : type.description) desc.add("§7" + s);
        inv.setItem(4, glow(item(type.icon, type.pretty(), desc.toArray(new String[0]))));

        inv.setItem(13, item(Material.PAPER, "§f§lIntensity", "§7Choose how devastating it is."));
        for (int i = 0; i < 5; i++) {
            int lvl = i + 1;
            List<String> lore = new ArrayList<>(Arrays.asList(levelInfo(type, lvl)));
            lore.add("");
            lore.add(sel.level == lvl ? "§a▶ SELECTED" : "§e▸ Click to select");
            ItemStack it = item(LEVEL_ICONS[i], "§fLevel " + lvl + " §8— " + LEVEL_NAMES[i], lore.toArray(new String[0]));
            it.setAmount(lvl);
            if (sel.level == lvl) glow(it);
            inv.setItem(LEVEL_SLOTS[i], it);
        }

        int[] targetSlots = {29, 31, 33};
        Target[] targets = Target.values();
        for (int i = 0; i < targets.length; i++) {
            Target t = targets[i];
            ItemStack it = item(t.icon, "§b§l" + t.label, sel.target == t ? "§a▶ SELECTED" : "§e▸ Click to select");
            if (sel.target == t) glow(it);
            inv.setItem(targetSlots[i], it);
        }

        inv.setItem(36, item(Material.ARROW, "§7« Back"));
        inv.setItem(40, glow(item(Material.RED_CONCRETE, "§4§l☠ UNLEASH " + type.display.toUpperCase() + " ☠",
                "§7Level: §f" + sel.level + " §8(" + LEVEL_NAMES[sel.level - 1] + "§8)",
                "§7Target: §f" + sel.target.label, "", "§c▸ Click to begin")));
        inv.setItem(44, item(Material.BARRIER, "§cStop all " + type.display + "s"));
        p.openInventory(inv);
    }

    private String[] levelInfo(DisasterType type, int l) {
        return switch (type) {
            case EARTHQUAKE -> new String[]{"§7Magnitude: §f~" + String.format("%.1f", 4.7 + l * 0.9),
                    "§7Duration: §f" + (plugin.getConfig().getInt("earthquake.base-duration-seconds", 12) + l * 4) + "s",
                    l >= 2 ? "§7Fissures: §cYes" : "§7Fissures: §aNo"};
            case METEOR_SHOWER -> new String[]{"§7Meteors/sec: §f~" + String.format("%.1f", (0.04 + l * 0.035) * 20),
                    l >= 4 ? "§7Finale: §cGiant meteor" : "§7Finale: §aNone"};
            case BLIZZARD -> new String[]{"§7Snow depth: §fup to " + (l + 2) + " layers", l >= 3 ? "§7Whiteout: §cYes" : "§7Whiteout: §aNo"};
            case DROUGHT -> new String[]{"§7Heat damage: " + (l >= 4 ? "§cSevere" : "§eMild"), l >= 3 ? "§7Wildfires: §cYes" : "§7Wildfires: §aNo"};
            case TSUNAMI -> new String[]{"§7Wave height: §f" + (3 + l * 4) + "m §7+ " + l + "m surge",
                    "§7Wave width: §f" + (70 + l * 25) + " blocks", "§7Destroys: §f" + switch (l) {
                        case 1, 2 -> "plants, glass, leaves";
                        case 3 -> "+ fences, doors, wool";
                        case 4 -> "+ wood, sand, dirt";
                        default -> "+ logs, bricks, stone";
                    }};
            case ZOMBIE_APOCALYPSE -> new String[]{"§7Waves: §f" + (plugin.getConfig().getInt("zombie-apocalypse.base-waves", 2) + l),
                    "§7Zombie power: §f+" + (l - 1) * 20 + "%", "§7Final wave: §4Undying Warlord boss"};
            case FLOOD -> new String[]{"§7Water rise: §f" + (3 + l * 2) + " blocks", "§7Area radius: §f" + (35 + l * 13)};
        };
    }

    // -------------------------------------------------------------------- clicks

    @EventHandler
    public void onClick(InventoryClickEvent e) {
        if (!(e.getInventory().getHolder() instanceof Menu menu)) return;
        e.setCancelled(true);
        if (!(e.getWhoClicked() instanceof Player p)) return;
        if (e.getClickedInventory() == null || e.getClickedInventory() != e.getView().getTopInventory()) return;
        if (!p.hasPermission("disasters.admin")) { p.closeInventory(); return; }
        int slot = e.getRawSlot();

        if (menu.id.equals("main")) {
            for (int i = 0; i < TYPE_SLOTS.length; i++) {
                if (slot != TYPE_SLOTS[i]) continue;
                DisasterType t = DisasterType.values()[i];
                click(p);
                if (e.isRightClick()) { p.closeInventory(); launch(p, t, 3, Target.SELF); }
                else openConfig(p, t);
                return;
            }
            switch (slot) {
                case 40 -> { p.closeInventory(); String err = plugin.getManager().triggerRandom(); feedback(p, err, "§dThe dice have been rolled..."); }
                case 48 -> { click(p); plugin.getManager().setRandomEnabled(!plugin.getManager().isRandomEnabled()); openMain(p); }
                case 49 -> { int n = plugin.getManager().stopAll(false); p.sendMessage("§a✔ Stopped " + n + " disaster(s)."); click(p); openMain(p); }
                default -> {}
            }
            return;
        }

        Selection sel = selections.computeIfAbsent(p.getUniqueId(), k -> new Selection());
        for (int i = 0; i < LEVEL_SLOTS.length; i++) {
            if (slot == LEVEL_SLOTS[i]) {
                sel.level = i + 1;
                p.playSound(p.getLocation(), Sound.BLOCK_NOTE_BLOCK_PLING, 1f, 0.6f + i * 0.2f);
                openConfig(p, menu.type);
                return;
            }
        }
        switch (slot) {
            case 29 -> { sel.target = Target.SELF; click(p); openConfig(p, menu.type); }
            case 31 -> { sel.target = Target.LOOKING; click(p); openConfig(p, menu.type); }
            case 33 -> { sel.target = Target.RANDOM; click(p); openConfig(p, menu.type); }
            case 36 -> { click(p); openMain(p); }
            case 40 -> { p.closeInventory(); launch(p, menu.type, sel.level, sel.target); }
            case 44 -> { int n = plugin.getManager().stopType(menu.type); p.sendMessage("§a✔ Stopped " + n + " " + menu.type.display + "(s)."); click(p); }
            default -> {}
        }
    }

    @EventHandler
    public void onDrag(InventoryDragEvent e) {
        if (e.getInventory().getHolder() instanceof Menu) e.setCancelled(true);
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent e) { selections.remove(e.getPlayer().getUniqueId()); }

    private void launch(Player p, DisasterType type, int level, Target target) {
        Location loc = p.getLocation();
        if (target == Target.LOOKING) {
            Block b = p.getTargetBlockExact(200);
            if (b == null) { p.sendMessage("§cYou are not looking at any block (max 200 blocks)."); return; }
            loc = b.getLocation().add(0.5, 1, 0.5);
        } else if (target == Target.RANDOM) {
            List<Player> all = new ArrayList<>(Bukkit.getOnlinePlayers());
            all.removeIf(pl -> pl.hasPermission("disasters.bypass") && !pl.isOp());
            if (all.isEmpty()) { p.sendMessage("§cNo eligible players."); return; }
            Player victim = all.get(ThreadLocalRandom.current().nextInt(all.size()));
            loc = victim.getLocation();
            p.sendMessage("§7Target: §f" + victim.getName());
        }
        String err = plugin.getManager().start(type, loc, level);
        feedback(p, err, "§a✔ " + type.pretty() + " §alevel " + level + " unleashed.");
    }

    private void feedback(Player p, String err, String ok) {
        if (err != null) {
            p.sendMessage("§c✖ " + err);
            p.playSound(p.getLocation(), Sound.ENTITY_VILLAGER_NO, 1f, 1f);
        } else {
            p.sendMessage(ok);
            p.playSound(p.getLocation(), Sound.ENTITY_ENDER_DRAGON_GROWL, 0.5f, 1.2f);
        }
    }

    // ------------------------------------------------------------------- helpers

    private void click(Player p) { p.playSound(p.getLocation(), Sound.UI_BUTTON_CLICK, 0.7f, 1f); }

    private void frame(Inventory inv) {
        ItemStack fill = item(Material.GRAY_STAINED_GLASS_PANE, " ");
        ItemStack border = item(Material.BLACK_STAINED_GLASS_PANE, " ");
        int rows = inv.getSize() / 9;
        for (int i = 0; i < inv.getSize(); i++) {
            int r = i / 9, c = i % 9;
            inv.setItem(i, (r == 0 || r == rows - 1 || c == 0 || c == 8) ? border : fill);
        }
    }

    private static ItemStack item(Material mat, String name, String... lore) {
        ItemStack it = new ItemStack(mat);
        ItemMeta meta = it.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name);
            if (lore.length > 0) meta.setLore(Arrays.asList(lore));
            meta.addItemFlags(ItemFlag.values());
            it.setItemMeta(meta);
        }
        return it;
    }

    private static ItemStack glow(ItemStack it) {
        ItemMeta meta = it.getItemMeta();
        if (meta != null) { meta.setEnchantmentGlintOverride(true); it.setItemMeta(meta); }
        return it;
    }
}
