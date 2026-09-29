package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import dev.powerguard.util.Text;
import net.kyori.adventure.text.Component;
import org.bukkit.Material;
import org.bukkit.OfflinePlayer;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.MemoryConfiguration;
import org.bukkit.inventory.ItemFlag;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.inventory.meta.SkullMeta;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Builds GUI items from the gui.items section of config.yml. Names never render in italics. */
public final class MenuItems {

    private final PowerGuard plugin;

    public MenuItems(PowerGuard plugin) {
        this.plugin = plugin;
    }

    private ConfigurationSection section(String key) {
        ConfigurationSection section = plugin.getConfig().getConfigurationSection("gui.items." + key);
        return section != null ? section : new MemoryConfiguration();
    }

    private static Material material(String name, Material fallback) {
        Material material = name == null ? null : Material.matchMaterial(name);
        return material == null || material.isAir() || !material.isItem() ? fallback : material;
    }

    public Material configuredMaterial(String path, Material fallback) {
        return material(plugin.getConfig().getString(path), fallback);
    }

    public Component title(String key, String... placeholders) {
        return Text.parse(Text.apply(plugin.getConfig().getString("gui.titles." + key, key), Text.pairs(placeholders)));
    }

    /** An item using the configured material. */
    public ItemStack item(String key, String... placeholders) {
        return item(key, material(section(key).getString("material"), Material.PAPER), placeholders);
    }

    /** An item with a forced material (e.g. a colour icon) and configured name/lore. */
    public ItemStack item(String key, Material material, String... placeholders) {
        ConfigurationSection section = section(key);
        return build(material, section.getString("name", " "), section.getStringList("lore"), Text.pairs(placeholders));
    }

    /** A player head with the configured name/lore. */
    public ItemStack head(String key, OfflinePlayer owner, String... placeholders) {
        ItemStack item = item(key, Material.PLAYER_HEAD, placeholders);
        if (item.getItemMeta() instanceof SkullMeta meta) {
            meta.setOwningPlayer(owner);
            item.setItemMeta(meta);
        }
        return item;
    }

    public ItemStack pane(Material material) {
        return build(material, " ", List.of(), Map.of());
    }

    private static ItemStack build(Material material, String name, List<String> lore, Map<String, String> placeholders) {
        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        meta.displayName(Text.parse(Text.apply(name, placeholders)));
        List<Component> lines = new ArrayList<>();
        for (String line : lore) {
            lines.add(Text.parse(Text.apply(line, placeholders)));
        }
        meta.lore(lines);
        meta.addItemFlags(ItemFlag.values());
        item.setItemMeta(meta);
        return item;
    }
}
