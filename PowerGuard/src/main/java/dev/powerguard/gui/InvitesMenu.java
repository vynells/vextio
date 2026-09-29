package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.InviteManager;
import dev.powerguard.team.TeamManager;
import net.kyori.adventure.text.Component;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.util.Map;
import java.util.UUID;

/** The team's pending invites (click to cancel) and a button to invite someone new. */
public final class InvitesMenu extends TeamMenu {

    public InvitesMenu(PowerGuard plugin, Player viewer) {
        super(plugin, viewer);
    }

    @Override
    protected int rows() {
        return 5;
    }

    @Override
    protected Component title() {
        return items().title("invites", teamVars());
    }

    @Override
    protected void drawTeam() {
        boolean canInvite = actions().can(viewer, team, "invite");
        int[] slots = innerSlots(rows());
        int index = 0;
        for (Map.Entry<UUID, InviteManager.Invite> entry : plugin.invites().sent(team).entrySet()) {
            if (index >= slots.length) {
                break;
            }
            UUID invited = entry.getKey();
            set(slots[index++], items().head("pending-invite", Bukkit.getOfflinePlayer(invited),
                    "player", TeamManager.nameOf(invited), "seconds", String.valueOf(entry.getValue().secondsLeft())),
                    canInvite ? click -> thenRefresh(() -> actions().cancelInvite(viewer, invited)) : null);
        }
        if (canInvite) {
            set(40, items().item("invite-button"), click -> new InvitePlayerMenu(plugin, viewer).open());
        }
        back(36, () -> new MainMenu(plugin, viewer).open());
    }
}
