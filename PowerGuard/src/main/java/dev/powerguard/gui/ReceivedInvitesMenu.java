package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.InviteManager;
import dev.powerguard.team.Team;
import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;

import java.util.Map;
import java.util.UUID;

/** Invites the viewer has received: left-click accepts, right-click declines. */
public final class ReceivedInvitesMenu extends Menu {

    public ReceivedInvitesMenu(PowerGuard plugin, Player viewer) {
        super(plugin, viewer);
    }

    @Override
    protected int rows() {
        return 4;
    }

    @Override
    protected Component title() {
        return items().title("received-invites");
    }

    @Override
    protected void draw() {
        int[] slots = innerSlots(rows());
        int index = 0;
        for (Map.Entry<UUID, InviteManager.Invite> entry : plugin.invites().received(viewer.getUniqueId()).entrySet()) {
            Team team = plugin.teams().byId(entry.getKey());
            if (team == null || index >= slots.length) {
                continue;
            }
            String teamName = team.name();
            set(slots[index++], items().item("received-invite", team.color().icon(), "team", teamName,
                    "color", team.color().code(), "seconds", String.valueOf(entry.getValue().secondsLeft())), click -> {
                if (click.isRightClick()) {
                    plugin.teamActions().deny(viewer, teamName);
                    redraw();
                } else {
                    viewer.closeInventory();
                    plugin.teamActions().accept(viewer, teamName);
                    new MainMenu(plugin, viewer).open();
                }
            });
        }
        back(31, () -> new NoTeamMenu(plugin, viewer).open());
    }
}
