package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import io.papermc.paper.event.player.AsyncChatEvent;
import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerQuitEvent;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/** Asks a player to type a value (team name, warp name) in chat. The reply never reaches public chat. */
public final class ChatPrompt implements Listener {

    private final PowerGuard plugin;
    private final Map<UUID, Consumer<String>> pending = new ConcurrentHashMap<>();

    public ChatPrompt(PowerGuard plugin) {
        this.plugin = plugin;
    }

    public void ask(Player player, String messageKey, Consumer<String> onAnswer) {
        player.closeInventory();
        pending.put(player.getUniqueId(), onAnswer);
        plugin.messages().send(player, messageKey);
        plugin.messages().send(player, "prompt-cancel-hint");
    }

    @EventHandler(priority = EventPriority.LOWEST)
    public void onChat(AsyncChatEvent event) {
        Player player = event.getPlayer();
        Consumer<String> callback = pending.remove(player.getUniqueId());
        if (callback == null) {
            return;
        }
        event.setCancelled(true);
        String answer = PlainTextComponentSerializer.plainText().serialize(event.message()).trim();
        Bukkit.getScheduler().runTask(plugin, () -> {
            if (!player.isOnline()) {
                return;
            }
            if (answer.equalsIgnoreCase("cancel")) {
                plugin.messages().send(player, "prompt-cancelled");
                return;
            }
            if (plugin.combat().isTagged(player)) {
                plugin.messages().send(player, "combat-team-blocked");
                return;
            }
            callback.accept(answer);
        });
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        pending.remove(event.getPlayer().getUniqueId());
    }
}
