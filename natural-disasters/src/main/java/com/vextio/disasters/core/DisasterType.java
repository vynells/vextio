package com.vextio.disasters.core;

import com.vextio.disasters.NaturalDisasters;
import com.vextio.disasters.disasters.*;
import org.bukkit.Location;
import org.bukkit.Material;

import java.util.Locale;

public enum DisasterType {
    EARTHQUAKE("Earthquake", "§6", Material.CRACKED_STONE_BRICKS,
            "The ground heaves and splits apart.", "Shakes players, opens fissures,", "and collapses buildings."),
    METEOR_SHOWER("Meteor Shower", "§c", Material.FIRE_CHARGE,
            "Burning rocks rain from the sky.", "Blazing trails, craters,", "and scattered debris."),
    BLIZZARD("Blizzard", "§b", Material.POWDER_SNOW_BUCKET,
            "A howling whiteout storm.", "Freezing wind, piling snow,", "and frozen lakes."),
    DROUGHT("Drought", "§e", Material.DEAD_BUSH,
            "Scorching, relentless heat.", "Water evaporates, crops wither,", "wildfires ignite."),
    TSUNAMI("Tsunami", "§9", Material.HEART_OF_THE_SEA,
            "A towering wall of water.", "Rolls in from the horizon and", "drowns everything. Level = size."),
    FLOOD("Flood", "§3", Material.WATER_BUCKET,
            "Torrential rain and rising water.", "Low ground fills up block", "by block as the rivers overflow.");

    public final String display;
    public final String color;
    public final Material icon;
    public final String[] description;

    DisasterType(String display, String color, Material icon, String... description) {
        this.display = display;
        this.color = color;
        this.icon = icon;
        this.description = description;
    }

    public String pretty() { return color + "§l" + display; }

    public Disaster create(NaturalDisasters plugin, Location center, int level) {
        return switch (this) {
            case EARTHQUAKE -> new Earthquake(plugin, center, level);
            case METEOR_SHOWER -> new MeteorShower(plugin, center, level);
            case BLIZZARD -> new Blizzard(plugin, center, level);
            case DROUGHT -> new Drought(plugin, center, level);
            case TSUNAMI -> new Tsunami(plugin, center, level);
            case FLOOD -> new Flood(plugin, center, level);
        };
    }

    public static DisasterType parse(String s) {
        if (s == null) return null;
        String k = s.toUpperCase(Locale.ROOT).replace('-', '_');
        if (k.equals("METEOR") || k.equals("METEORS")) k = "METEOR_SHOWER";
        try { return valueOf(k); } catch (IllegalArgumentException e) { return null; }
    }
}
