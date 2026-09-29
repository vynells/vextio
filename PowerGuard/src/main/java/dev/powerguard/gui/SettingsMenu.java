package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.TeamRank;
import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;

/** Friendly fire, colour, rename and disband. */
public final class SettingsMenu extends TeamMenu {

    public SettingsMenu(PowerGuard plugin, Player viewer) {
        super(plugin, viewer);
    }

    @Override
    protected int rows() {
        return 3;
    }

    @Override
    protected Component title() {
        return items().title("settings", teamVars());
    }

    @Override
    protected void drawTeam() {
        boolean ff = team.friendlyFire();
        set(10, items().item("friendly-fire", "state", plugin.messages().raw(ff ? "state-on" : "state-off")),
                click -> thenRefresh(() -> actions().setFriendlyFire(viewer, !ff)));
        set(12, items().item("color", team.color().icon(), teamVars("colorname", team.color().displayName())),
                click -> new ColorMenu(plugin, viewer).open());
        set(14, items().item("rename"), click -> plugin.chatPrompt().ask(viewer, "prompt-team-name", name -> {
            actions().rename(viewer, name);
            new SettingsMenu(plugin, viewer).open();
        }));
        if (team.rankOf(viewer.getUniqueId()) == TeamRank.OWNER) {
            set(16, items().item("disband"), click -> new ConfirmMenu(plugin, viewer,
                    () -> actions().disbandNow(viewer), this::open).open());
        }
        back(22, () -> new MainMenu(plugin, viewer).open());
    }
}
