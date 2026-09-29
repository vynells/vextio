package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import org.bukkit.entity.Player;

/** The configurable click / error / success sounds used by menus and team actions. */
public final class MenuSounds {

    private final PowerGuard plugin;

    public MenuSounds(PowerGuard plugin) {
        this.plugin = plugin;
    }

    public void click(Player player) {
        play(player, "gui.click-sound", 1.0f);
    }

    public void error(Player player) {
        play(player, "gui.error-sound", 1.0f);
    }

    public void success(Player player) {
        play(player, "gui.success-sound", 1.2f);
    }

    private void play(Player player, String path, float pitch) {
        String sound = plugin.getConfig().getString(path, "");
        if (!sound.isEmpty()) {
            player.playSound(player.getLocation(), sound, 0.6f, pitch);
        }
    }
}
