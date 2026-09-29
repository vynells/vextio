package dev.powerguard.util;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.TextDecoration;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;

import java.util.Map;

/** Colour-code parsing and placeholder replacement shared by messages and GUI items. */
public final class Text {

    private static final LegacyComponentSerializer LEGACY = LegacyComponentSerializer.builder()
            .character('&')
            .hexColors()
            .build();

    private Text() {
    }

    /** Parses '&' colour codes into a component with italics explicitly disabled. */
    public static Component parse(String text) {
        return LEGACY.deserialize(text).decoration(TextDecoration.ITALIC, TextDecoration.State.FALSE);
    }

    public static String apply(String text, Map<String, String> placeholders) {
        String result = text;
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            result = result.replace("{" + entry.getKey() + "}", entry.getValue());
        }
        return result;
    }

    /** Builds a placeholder map from alternating key/value arguments. */
    public static Map<String, String> pairs(String... keyValues) {
        Map<String, String> map = new java.util.LinkedHashMap<>();
        for (int i = 0; i + 1 < keyValues.length; i += 2) {
            map.put(keyValues[i], keyValues[i + 1]);
        }
        return map;
    }
}
