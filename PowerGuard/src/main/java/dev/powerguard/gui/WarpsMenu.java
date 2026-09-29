package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.TeamLocation;
import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;

import java.util.Map;

/** Team warps: click to teleport, shift-click to delete, empty slots to set a new warp. */
public final class WarpsMenu extends TeamMenu {

    public WarpsMenu(PowerGuard plugin, Player viewer) {
        super(plugin, viewer);
    }

    @Override
    protected int rows() {
        return 4;
    }

    @Override
    protected Component title() {
        return items().title("warps", teamVars());
    }

    @Override
    protected void drawTeam() {
        int[] slots = innerSlots(rows());
        int index = 0;
        for (Map.Entry<String, TeamLocation> warp : team.warps().entrySet()) {
            if (index >= slots.length) {
                break;
            }
            String name = warp.getKey();
            set(slots[index++], items().item("warp", "warp", name, "location", warp.getValue().describe()), click -> {
                if (click.isShiftClick()) {
                    thenRefresh(() -> actions().deleteWarp(viewer, name));
                } else {
                    actions().warp(viewer, name);
                }
            });
        }
        int max = plugin.getConfig().getInt("teams.max-warps", 4);
        if (actions().can(viewer, team, "setwarp")) {
            for (int i = team.warps().size(); i < max && index < slots.length; i++) {
                set(slots[index++], items().item("warp-empty"), click -> plugin.chatPrompt().ask(viewer, "prompt-warp-name", name -> {
                    actions().setWarp(viewer, name);
                    new WarpsMenu(plugin, viewer).open();
                }));
            }
        }
        back(31, () -> new MainMenu(plugin, viewer).open());
    }
}
