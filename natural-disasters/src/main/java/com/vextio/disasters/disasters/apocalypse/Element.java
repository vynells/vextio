package com.vextio.disasters.disasters.apocalypse;

import org.bukkit.Color;
import org.bukkit.Material;
import org.bukkit.entity.EntityType;

public enum Element {
    FIRE("§6§lPyromancer", EntityType.ZOMBIE, Material.MAGMA_BLOCK, Color.fromRGB(255, 80, 0), 40, 1.1, 0.26, 7),
    WATER("§9§lTidecaller", EntityType.DROWNED, Material.SEA_LANTERN, Color.fromRGB(30, 110, 255), 45, 1.1, 0.25, 6),
    WIND("§f§lStormwalker", EntityType.ZOMBIE, Material.WHITE_STAINED_GLASS, Color.fromRGB(220, 240, 255), 30, 0.9, 0.34, 5),
    EARTH("§2§lStonebreaker", EntityType.HUSK, Material.MOSSY_COBBLESTONE, Color.fromRGB(90, 70, 40), 80, 1.45, 0.21, 10),
    LIGHTNING("§e§lVoltbringer", EntityType.ZOMBIE, Material.LIGHTNING_ROD, Color.fromRGB(255, 240, 60), 35, 1.0, 0.3, 6),
    WARLORD("§4§l☠ The Undying Warlord ☠", EntityType.ZOMBIE, Material.CRYING_OBSIDIAN, Color.fromRGB(90, 0, 20), 400, 2.3, 0.27, 16);

    public final String name;
    public final EntityType entity;
    public final Material helmet;
    public final Color armor;
    public final double health, scale, speed, damage;

    Element(String name, EntityType entity, Material helmet, Color armor, double health, double scale, double speed, double damage) {
        this.name = name; this.entity = entity; this.helmet = helmet; this.armor = armor;
        this.health = health; this.scale = scale; this.speed = speed; this.damage = damage;
    }

    public static final Element[] REGULAR = {FIRE, WATER, WIND, EARTH, LIGHTNING};
}
