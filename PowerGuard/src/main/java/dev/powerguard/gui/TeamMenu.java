package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.Team;
import dev.powerguard.team.TeamActions;
import org.bukkit.entity.Player;

/** A menu that belongs to the viewer's team. Falls back to the no-team menu if they've lost it. */
abstract class TeamMenu extends Menu {

    protected Team team;

    TeamMenu(PowerGuard plugin, Player viewer) {
        super(plugin, viewer);
    }

    protected TeamActions actions() {
        return plugin.teamActions();
    }

    protected String[] teamVars(String... extra) {
        String[] vars = new String[extra.length + 4];
        vars[0] = "team";
        vars[1] = team.name();
        vars[2] = "color";
        vars[3] = team.color().code();
        System.arraycopy(extra, 0, vars, 4, extra.length);
        return vars;
    }

    protected abstract void drawTeam();

    @Override
    protected final void draw() {
        drawTeam();
    }

    @Override
    public void open() {
        team = plugin.teams().teamOf(viewer.getUniqueId());
        if (team == null) {
            new NoTeamMenu(plugin, viewer).open();
            return;
        }
        super.open();
    }

    /** Runs an action, then reopens this menu type with fresh data (or the right menu if the team is gone). */
    protected void thenRefresh(Runnable action) {
        action.run();
        Team current = plugin.teams().teamOf(viewer.getUniqueId());
        if (current == null) {
            new NoTeamMenu(plugin, viewer).open();
        } else if (viewer.getOpenInventory().getTopInventory().getHolder(false) == this) {
            team = current;
            redraw();
        }
    }
}
