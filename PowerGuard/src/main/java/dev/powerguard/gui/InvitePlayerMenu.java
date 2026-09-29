package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import net.kyori.adventure.text.Component;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Online players without a team who haven't been invited yet. Click one to invite them. */
public final class InvitePlayerMenu extends TeamMenu {

    public InvitePlayerMenu(PowerGuard plugin, Player viewer) {
        super(plugin, viewer);
    }

    @Override
    protected int rows() {
        return 6;
    }

    @Override
    protected Component title() {
        return items().title("invite-player", teamVars());
    }

    @Override
    protected void drawTeam() {
        List<Player> candidates = new ArrayList<>();
        for (Player player : Bukkit.getOnlinePlayers()) {
            if (!player.equals(viewer) && !player.hasMetadata("NPC") && viewer.canSee(player)
                    && plugin.teams().teamOf(player.getUniqueId()) == null
                    && !plugin.invites().has(player.getUniqueId(), team)) {
                candidates.add(player);
            }
        }
        candidates.sort(Comparator.comparing(Player::getName, String.CASE_INSENSITIVE_ORDER));
        int[] slots = innerSlots(rows());
        for (int i = 0; i < candidates.size() && i < slots.length; i++) {
            Player target = candidates.get(i);
            set(slots[i], items().head("invite-target", target, "player", target.getName()), click -> {
                if (target.isOnline()) {
                    thenRefresh(() -> actions().invite(viewer, target));
                }
            });
        }
        back(49, () -> new InvitesMenu(plugin, viewer).open());
    }
}
