package dev.powerguard.team;

import dev.powerguard.PowerGuard;
import dev.powerguard.util.Text;
import io.papermc.paper.event.player.AsyncChatEvent;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerQuitEvent;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Team-only chat: toggled with /team chat, or one message at a time with a prefix like "@t " or "!". */
public final class TeamChat implements Listener {

    private final PowerGuard plugin;
    private final Set<UUID> toggled = ConcurrentHashMap.newKeySet();

    public TeamChat(PowerGuard plugin) {
        this.plugin = plugin;
    }

    /** Toggles team chat and returns the new state. */
    public boolean toggle(UUID uuid) {
        if (toggled.remove(uuid)) {
            return false;
        }
        toggled.add(uuid);
        return true;
    }

    public void disable(UUID uuid) {
        toggled.remove(uuid);
    }

    public boolean isToggled(UUID uuid) {
        return toggled.contains(uuid);
    }

    @EventHandler(priority = EventPriority.LOW, ignoreCancelled = true)
    public void onChat(AsyncChatEvent event) {
        Player player = event.getPlayer();
        String message = PlainTextComponentSerializer.plainText().serialize(event.message());
        String body = null;
        for (String prefix : plugin.getConfig().getStringList("teams.chat.prefixes")) {
            if (!prefix.isEmpty() && message.startsWith(prefix) && message.length() > prefix.length()) {
                body = message.substring(prefix.length()).trim();
                break;
            }
        }
        if (body == null && toggled.contains(player.getUniqueId())) {
            body = message;
        }
        if (body == null || body.isEmpty() || !player.hasPermission("powerguard.team.chat")) {
            return;
        }
        Team team = plugin.teams().teamOf(player.getUniqueId());
        if (team == null) {
            toggled.remove(player.getUniqueId()); // no team any more: this message goes to normal chat
            return;
        }
        event.setCancelled(true);
        Component formatted = format(player, team, body);
        String spyPermission = plugin.getConfig().getString("teams.chat.spy-permission", "");
        for (Player online : Bukkit.getOnlinePlayers()) {
            if (team.isMember(online.getUniqueId()) || (!spyPermission.isEmpty() && online.hasPermission(spyPermission))) {
                online.sendMessage(formatted);
            }
        }
        plugin.getComponentLogger().info(formatted);
    }

    private Component format(Player player, Team team, String body) {
        TeamRank rank = team.rankOf(player.getUniqueId());
        String symbol = rank == null ? "" : plugin.getConfig().getString("teams.rank-symbols." + rank.name(), "");
        String format = Text.apply(plugin.getConfig().getString("teams.chat.format", "&8[&bTeam&8] {player}&7: &f{message}"),
                Text.pairs("color", team.color().code(), "team", team.name(), "rank_symbol", symbol, "player", player.getName()));
        int split = format.indexOf("{message}");
        if (split < 0) {
            return Text.parse(format);
        }
        String before = format.substring(0, split);
        String after = format.substring(split + "{message}".length());
        // The message is inserted as plain text so players can't use colour codes; it keeps the colour before it.
        return Text.parse(before + "\u0000" + after)
                .replaceText(builder -> builder.matchLiteral("\u0000").replacement(Component.text(body)));
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        toggled.remove(event.getPlayer().getUniqueId());
    }
}
