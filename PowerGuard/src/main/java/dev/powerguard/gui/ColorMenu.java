package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.TeamColor;
import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;

/** Team colour picker. */
public final class ColorMenu extends TeamMenu {

    private static final int[] SLOTS = {10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 30, 32};

    public ColorMenu(PowerGuard plugin, Player viewer) {
        super(plugin, viewer);
    }

    @Override
    protected int rows() {
        return 5;
    }

    @Override
    protected Component title() {
        return items().title("color", teamVars());
    }

    @Override
    protected void drawTeam() {
        TeamColor[] colors = TeamColor.values();
        for (int i = 0; i < colors.length; i++) {
            TeamColor color = colors[i];
            set(SLOTS[i], items().item("color", color.icon(), "color", color.code(), "colorname", color.displayName()), click -> {
                actions().setColor(viewer, color);
                new SettingsMenu(plugin, viewer).open();
            });
        }
        back(40, () -> new SettingsMenu(plugin, viewer).open());
    }
}
