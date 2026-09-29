package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;

/** The /team menu for players without a team: create one or answer invites. */
public final class NoTeamMenu extends Menu {

    public NoTeamMenu(PowerGuard plugin, Player viewer) {
        super(plugin, viewer);
    }

    @Override
    protected int rows() {
        return 3;
    }

    @Override
    protected Component title() {
        return items().title("no-team");
    }

    @Override
    protected void draw() {
        set(11, items().item("create"), click -> plugin.chatPrompt().ask(viewer, "prompt-team-name", name -> {
            plugin.teamActions().create(viewer, name);
            if (plugin.teams().teamOf(viewer.getUniqueId()) != null) {
                new MainMenu(plugin, viewer).open();
            }
        }));
        set(13, items().item("received-invites", "count",
                String.valueOf(plugin.invites().received(viewer.getUniqueId()).size())),
                click -> new ReceivedInvitesMenu(plugin, viewer).open());
        set(15, items().item("team-list", "count", String.valueOf(plugin.teams().teams().size())), click -> {
            viewer.closeInventory();
            plugin.teamActions().list(viewer);
        });
        set(22, items().item("close"), click -> viewer.closeInventory());
    }
}
