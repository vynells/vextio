package com.vextio.disasters.core;

import com.vextio.disasters.NaturalDisasters;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabExecutor;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class DisasterCommand implements TabExecutor {

    private final NaturalDisasters plugin;

    public DisasterCommand(NaturalDisasters plugin) { this.plugin = plugin; }

    @Override
    public boolean onCommand(CommandSender s, Command cmd, String label, String[] a) {
        if (!s.hasPermission("disasters.admin")) { s.sendMessage("§cNo permission."); return true; }
        if (a.length == 0 || a[0].equalsIgnoreCase("gui")) {
            if (s instanceof Player p) plugin.getGui().openMain(p);
            else help(s, label);
            return true;
        }
        DisasterManager m = plugin.getManager();
        switch (a[0].toLowerCase(Locale.ROOT)) {
            case "start" -> {
                if (a.length < 2) { s.sendMessage("§cUsage: /" + label + " start <type> [level 1-5] [player]"); return true; }
                DisasterType type = DisasterType.parse(a[1]);
                if (type == null) { s.sendMessage("§cUnknown disaster. Types: " + types()); return true; }
                int level = 3;
                if (a.length >= 3) {
                    try { level = Integer.parseInt(a[2]); } catch (NumberFormatException e) { s.sendMessage("§cLevel must be 1-5."); return true; }
                }
                Location loc;
                if (a.length >= 4) {
                    Player t = Bukkit.getPlayerExact(a[3]);
                    if (t == null) { s.sendMessage("§cPlayer not found."); return true; }
                    loc = t.getLocation();
                } else if (s instanceof Player p) {
                    loc = p.getLocation();
                } else { s.sendMessage("§cConsole must specify a player."); return true; }
                String err = m.start(type, loc, level);
                s.sendMessage(err == null ? "§a✔ " + type.pretty() + " §alevel " + Math.max(1, Math.min(5, level)) + " started." : "§c✖ " + err);
            }
            case "stop" -> {
                if (a.length >= 2) {
                    DisasterType type = DisasterType.parse(a[1]);
                    if (type == null) { s.sendMessage("§cUnknown disaster."); return true; }
                    s.sendMessage("§aStopped " + m.stopType(type) + " " + type.display + "(s).");
                } else s.sendMessage("§aStopped " + m.stopAll(false) + " disaster(s).");
            }
            case "random" -> {
                String opt = a.length >= 2 ? a[1].toLowerCase(Locale.ROOT) : "";
                switch (opt) {
                    case "on" -> { m.setRandomEnabled(true); s.sendMessage("§aRandom disasters enabled."); }
                    case "off" -> { m.setRandomEnabled(false); s.sendMessage("§cRandom disasters disabled."); }
                    case "now" -> { String err = m.triggerRandom(); s.sendMessage(err == null ? "§dA random disaster has been unleashed..." : "§c✖ " + err); }
                    default -> s.sendMessage("§7Random disasters are " + (m.isRandomEnabled() ? "§aON" : "§cOFF") + "§7. Use on/off/now.");
                }
            }
            case "list" -> {
                List<Disaster> list = m.getActive();
                s.sendMessage("§6Active disasters: §f" + list.size());
                for (Disaster d : list) {
                    Location c = d.getCenter();
                    s.sendMessage(" §8- " + d.getType().pretty() + " §7L" + d.getLevel() + " §8@ §7"
                            + c.getWorld().getName() + " " + c.getBlockX() + ", " + c.getBlockY() + ", " + c.getBlockZ());
                }
            }
            case "reload" -> {
                plugin.reloadConfig();
                m.startRandomScheduler();
                s.sendMessage("§aConfig reloaded.");
            }
            default -> help(s, label);
        }
        return true;
    }

    private void help(CommandSender s, String l) {
        s.sendMessage("§4§lNatural Disasters");
        s.sendMessage("§f/" + l + " gui §7- open the control panel");
        s.sendMessage("§f/" + l + " start <type> [level] [player] §7- start a disaster");
        s.sendMessage("§f/" + l + " stop [type] §7- stop disasters");
        s.sendMessage("§f/" + l + " random <on|off|now> §7- random disasters");
        s.sendMessage("§f/" + l + " list §7- active disasters");
        s.sendMessage("§f/" + l + " reload §7- reload config");
        s.sendMessage("§7Types: " + types());
    }

    private String types() {
        List<String> n = new ArrayList<>();
        for (DisasterType t : DisasterType.values()) n.add(t.name().toLowerCase(Locale.ROOT));
        return String.join(", ", n);
    }

    @Override
    public List<String> onTabComplete(CommandSender s, Command cmd, String label, String[] a) {
        List<String> out = new ArrayList<>();
        if (!s.hasPermission("disasters.admin")) return out;
        if (a.length == 1) out.addAll(List.of("gui", "start", "stop", "random", "list", "reload"));
        else if (a.length == 2 && (a[0].equalsIgnoreCase("start") || a[0].equalsIgnoreCase("stop")))
            for (DisasterType t : DisasterType.values()) out.add(t.name().toLowerCase(Locale.ROOT));
        else if (a.length == 2 && a[0].equalsIgnoreCase("random")) out.addAll(List.of("on", "off", "now"));
        else if (a.length == 3 && a[0].equalsIgnoreCase("start")) out.addAll(List.of("1", "2", "3", "4", "5"));
        else if (a.length == 4 && a[0].equalsIgnoreCase("start")) for (Player p : Bukkit.getOnlinePlayers()) out.add(p.getName());
        String last = a[a.length - 1].toLowerCase(Locale.ROOT);
        out.removeIf(x -> !x.toLowerCase(Locale.ROOT).startsWith(last));
        return out;
    }
}
