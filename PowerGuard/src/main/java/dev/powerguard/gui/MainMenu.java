package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.TeamManager;
import dev.powerguard.team.TeamRank;
import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;

/** The /team menu. Players without a team are sent to {@link NoTeamMenu} instead. */
public final class MainMenu extends TeamMenu {

    public MainMenu(PowerGuard plugin, Player viewer) {
        super(plugin, viewer);
    }

    @Override
    protected int rows() {
        return 5;
    }

    @Override
    protected Component title() {
        return items().title("main", teamVars());
    }

    @Override
    protected void drawTeam() {
        String online = String.valueOf(plugin.teams().onlineMembers(team).size());
        String size = String.valueOf(team.members().size());
        String ff = plugin.messages().raw(team.friendlyFire() ? "state-on" : "state-off");

        set(13, items().item("overview", team.color().icon(), teamVars("owner", TeamManager.nameOf(team.owner()),
                "colorname", team.color().displayName(), "online", online, "size", size, "ff", ff)));

        set(20, items().item("home", "home", team.home() == null ? "Not set" : team.home().describe()), click -> {
            if (click.isShiftClick()) {
                thenRefresh(() -> actions().setHome(viewer));
            } else {
                actions().home(viewer);
            }
        });
        set(21, items().item("warps", "count", String.valueOf(team.warps().size()),
                "max", String.valueOf(plugin.getConfig().getInt("teams.max-warps", 4))),
                click -> new WarpsMenu(plugin, viewer).open());
        set(22, items().head("members", viewer, "online", online, "size", size),
                click -> new MembersMenu(plugin, viewer).open());
        set(23, items().item("invites", "count", String.valueOf(plugin.invites().sent(team).size())),
                click -> new InvitesMenu(plugin, viewer).open());
        set(24, items().item("settings"), click -> new SettingsMenu(plugin, viewer).open());

        set(30, items().item("echest"), click -> actions().openChest(viewer));
        boolean chat = plugin.teamChat().isToggled(viewer.getUniqueId());
        set(32, items().item("chat", "state", plugin.messages().raw(chat ? "state-on" : "state-off")),
                click -> thenRefresh(() -> actions().toggleChat(viewer)));

        if (team.rankOf(viewer.getUniqueId()) != TeamRank.OWNER) {
            set(36, items().item("leave"), click -> new ConfirmMenu(plugin, viewer,
                    () -> actions().leave(viewer), () -> new MainMenu(plugin, viewer).open()).open());
        }
        set(40, items().item("close"), click -> viewer.closeInventory());
    }
}
