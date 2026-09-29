package dev.powerguard.team;

import org.bukkit.Material;

import java.util.Locale;

/** The 16 chat colours a team can pick, with their legacy code and GUI icon. */
public enum TeamColor {
    BLACK('0', Material.BLACK_WOOL),
    DARK_BLUE('1', Material.BLUE_WOOL),
    DARK_GREEN('2', Material.GREEN_WOOL),
    DARK_AQUA('3', Material.CYAN_WOOL),
    DARK_RED('4', Material.RED_WOOL),
    DARK_PURPLE('5', Material.PURPLE_WOOL),
    GOLD('6', Material.ORANGE_WOOL),
    GRAY('7', Material.LIGHT_GRAY_WOOL),
    DARK_GRAY('8', Material.GRAY_WOOL),
    BLUE('9', Material.LIGHT_BLUE_WOOL),
    GREEN('a', Material.LIME_WOOL),
    AQUA('b', Material.LIGHT_BLUE_CONCRETE),
    RED('c', Material.RED_CONCRETE),
    LIGHT_PURPLE('d', Material.MAGENTA_WOOL),
    YELLOW('e', Material.YELLOW_WOOL),
    WHITE('f', Material.WHITE_WOOL);

    private final char code;
    private final Material icon;

    TeamColor(char code, Material icon) {
        this.code = code;
        this.icon = icon;
    }

    /** Legacy colour code such as "&b". */
    public String code() {
        return "&" + code;
    }

    public Material icon() {
        return icon;
    }

    public String displayName() {
        String[] words = name().toLowerCase(Locale.ROOT).split("_");
        StringBuilder builder = new StringBuilder();
        for (String word : words) {
            if (!builder.isEmpty()) {
                builder.append(' ');
            }
            builder.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        return builder.toString();
    }

    public static TeamColor parse(String name, TeamColor fallback) {
        try {
            return valueOf(name.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException e) {
            return fallback;
        }
    }
}
