package dev.powerguard.combat;

import dev.powerguard.PowerGuard;
import net.kyori.adventure.bossbar.BossBar;
import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** Shows the combat countdown in the action bar and/or a boss bar. */
final class CombatDisplay {

    private final PowerGuard plugin;
    private final Map<UUID, BossBar> bars = new HashMap<>();

    CombatDisplay(PowerGuard plugin) {
        this.plugin = plugin;
    }

    void show(Player player, CombatTag tag) {
        String seconds = String.valueOf(tag.secondsLeft());
        if (plugin.getConfig().getBoolean("combat.display.actionbar", true)) {
            player.sendActionBar(plugin.messages().component("combat-actionbar", "seconds", seconds));
        }
        if (!plugin.getConfig().getBoolean("combat.display.bossbar", true)) {
            hideBar(player);
            return;
        }
        Component title = plugin.messages().component("combat-bossbar", "seconds", seconds);
        BossBar bar = bars.get(player.getUniqueId());
        if (bar == null) {
            bar = BossBar.bossBar(title, tag.progress(), color(), overlay());
            bars.put(player.getUniqueId(), bar);
            player.showBossBar(bar);
        } else {
            bar.name(title);
            bar.progress(tag.progress());
        }
    }

    void hide(Player player) {
        hideBar(player);
        if (plugin.getConfig().getBoolean("combat.display.actionbar", true)) {
            player.sendActionBar(Component.empty());
        }
    }

    private void hideBar(Player player) {
        BossBar bar = bars.remove(player.getUniqueId());
        if (bar != null) {
            player.hideBossBar(bar);
        }
    }

    /** Re-applies colour/style after /pg reload. */
    void reload() {
        for (BossBar bar : bars.values()) {
            bar.color(color());
            bar.overlay(overlay());
        }
    }

    private BossBar.Color color() {
        try {
            return BossBar.Color.valueOf(plugin.getConfig().getString("combat.display.bossbar-color", "RED").toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return BossBar.Color.RED;
        }
    }

    private BossBar.Overlay overlay() {
        try {
            return BossBar.Overlay.valueOf(plugin.getConfig().getString("combat.display.bossbar-style", "PROGRESS").toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return BossBar.Overlay.PROGRESS;
        }
    }
}
