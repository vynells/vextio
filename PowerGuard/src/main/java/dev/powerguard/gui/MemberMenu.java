package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.TeamManager;
import dev.powerguard.team.TeamRank;
import net.kyori.adventure.text.Component;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.util.UUID;

/** Actions for one member. Each button is only shown when the viewer is allowed to use it. */
public final class MemberMenu extends TeamMenu {

    private final UUID target;

    public MemberMenu(PowerGuard plugin, Player viewer, UUID target) {
        super(plugin, viewer);
        this.target = target;
    }

    @Override
    protected int rows() {
        return 3;
    }

    @Override
    protected Component title() {
        return items().title("member", "player", TeamManager.nameOf(target));
    }

    @Override
    protected void drawTeam() {
        TeamRank targetRank = team.rankOf(target);
        if (targetRank == null) {
            back(22, () -> new MembersMenu(plugin, viewer).open());
            return;
        }
        String name = TeamManager.nameOf(target);
        boolean online = Bukkit.getPlayer(target) != null;
        set(4, items().head("member", Bukkit.getOfflinePlayer(target), "player", name, "rank", targetRank.displayName(),
                "rankcolor", targetRank.colorCode(), "status", online ? "&aOnline" : "&7Offline"));

        TeamRank viewerRank = team.rankOf(viewer.getUniqueId());
        boolean self = target.equals(viewer.getUniqueId());
        boolean owner = viewerRank == TeamRank.OWNER;
        if (owner && targetRank == TeamRank.MEMBER) {
            set(11, items().item("promote"), click -> thenRefresh(() -> actions().promote(viewer, team, target)));
        }
        if (owner && targetRank == TeamRank.OFFICER) {
            set(11, items().item("demote"), click -> thenRefresh(() -> actions().demote(viewer, team, target)));
        }
        if (owner && !self) {
            set(13, items().item("transfer"), click -> new ConfirmMenu(plugin, viewer,
                    () -> actions().transfer(viewer, team, target), this::open).open());
        }
        if (!self && actions().can(viewer, team, "kick") && viewerRank != null && viewerRank.isAbove(targetRank)) {
            set(15, items().item("kick"), click -> new ConfirmMenu(plugin, viewer, () -> {
                actions().kick(viewer, team, target);
                new MembersMenu(plugin, viewer).open();
            }, this::open).open());
        }
        back(22, () -> new MembersMenu(plugin, viewer).open());
    }
}
