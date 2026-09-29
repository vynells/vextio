package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import dev.powerguard.team.TeamManager;
import dev.powerguard.team.TeamRank;
import net.kyori.adventure.text.Component;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Member heads with rank and online status. Click one to manage them. */
public final class MembersMenu extends TeamMenu {

    public MembersMenu(PowerGuard plugin, Player viewer) {
        super(plugin, viewer);
    }

    @Override
    protected int rows() {
        return 6;
    }

    @Override
    protected Component title() {
        return items().title("members", teamVars());
    }

    @Override
    protected void drawTeam() {
        List<Map.Entry<UUID, TeamRank>> members = new ArrayList<>(team.members().entrySet());
        members.sort(Comparator.<Map.Entry<UUID, TeamRank>>comparingInt(entry -> entry.getValue().ordinal())
                .thenComparing(entry -> Bukkit.getPlayer(entry.getKey()) == null)
                .thenComparing(entry -> TeamManager.nameOf(entry.getKey()).toLowerCase(java.util.Locale.ROOT)));
        int[] slots = innerSlots(rows());
        for (int i = 0; i < members.size() && i < slots.length; i++) {
            UUID uuid = members.get(i).getKey();
            TeamRank rank = members.get(i).getValue();
            boolean online = Bukkit.getPlayer(uuid) != null;
            set(slots[i], items().head("member", Bukkit.getOfflinePlayer(uuid),
                    "player", TeamManager.nameOf(uuid), "rank", rank.displayName(), "rankcolor", rank.colorCode(),
                    "status", online ? "&aOnline" : "&7Offline"),
                    click -> new MemberMenu(plugin, viewer, uuid).open());
        }
        back(49, () -> new MainMenu(plugin, viewer).open());
    }
}
