package dev.powerguard;

import dev.powerguard.util.Text;
import net.kyori.adventure.text.Component;
import org.bukkit.command.CommandSender;
import org.bukkit.configuration.file.FileConfiguration;

import java.util.Map;

/** Reads every player-facing message from the "messages" section of config.yml. */
public final class Messages {

    private final PowerGuard plugin;

    public Messages(PowerGuard plugin) {
        this.plugin = plugin;
    }

    private FileConfiguration config() {
        return plugin.getConfig();
    }

    public String raw(String key) {
        return config().getString("messages." + key, "&cMissing message: " + key);
    }

    public Component component(String key, String... placeholders) {
        return Text.parse(Text.apply(raw(key), Text.pairs(placeholders)));
    }

    /** Sends a prefixed message; list-valued messages are sent line by line without the prefix. */
    public void send(CommandSender sender, String key, String... placeholders) {
        Map<String, String> map = Text.pairs(placeholders);
        if (config().isList("messages." + key)) {
            for (String line : config().getStringList("messages." + key)) {
                sender.sendMessage(Text.parse(Text.apply(line, map)));
            }
            return;
        }
        String text = raw(key);
        if (text.isEmpty()) {
            return;
        }
        sender.sendMessage(Text.parse(raw("prefix") + Text.apply(text, map)));
    }
}
