package com.vextio.disasters.disasters.apocalypse;

import com.vextio.disasters.NaturalDisasters;
import com.vextio.disasters.core.Disaster;
import com.vextio.disasters.core.DisasterType;
import com.vextio.disasters.util.FX;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.Attribute;
import org.bukkit.attribute.AttributeInstance;
import org.bukkit.block.Block;
import org.bukkit.boss.BarColor;
import org.bukkit.boss.BarStyle;
import org.bukkit.boss.BossBar;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Mob;
import org.bukkit.entity.Player;
import org.bukkit.inventory.EntityEquipment;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.LeatherArmorMeta;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.util.Vector;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Waves of elemental undead. Each zombie bends an element and casts particle-magic at players.
 * The last wave brings the Undying Warlord, who wields every element.
 */
public class ZombieApocalypse extends Disaster {

    public static final NamespacedKey KEY = new NamespacedKey("naturaldisasters", "apocalypse_mob");

    private enum Phase { WARNING, WAVE, BREAK, VICTORY }

    private final int totalWaves, warningTicks, breakTicks, waveTimeout;
    private final double radius;
    private final Map<UUID, Mob> mobs = new HashMap<>();
    private final Map<UUID, Long> cooldown = new HashMap<>();
    private Phase phase = Phase.WARNING;
    private long phaseStart;
    private int wave;
    private int waveSize;
    private BossBar bossBar;
    private Mob boss;

    public ZombieApocalypse(NaturalDisasters plugin, Location center, int level) {
        super(plugin, DisasterType.ZOMBIE_APOCALYPSE, center, level);
        totalWaves = cfg("zombie-apocalypse").getInt("base-waves", 2) + level;
        warningTicks = cfg("zombie-apocalypse").getInt("warning-seconds", 10) * 20;
        breakTicks = cfg("zombie-apocalypse").getInt("break-seconds", 12) * 20;
        waveTimeout = cfg("zombie-apocalypse").getInt("wave-timeout-seconds", 150) * 20;
        radius = cfg("zombie-apocalypse").getDouble("radius", 70);
    }

    public static boolean isApocalypseMob(Entity e) {
        return e.getPersistentDataContainer().has(KEY, PersistentDataType.STRING);
    }

    public static Element elementOf(Entity e) {
        String s = e.getPersistentDataContainer().get(KEY, PersistentDataType.STRING);
        if (s == null) return null;
        try { return Element.valueOf(s); } catch (IllegalArgumentException ex) { return null; }
    }

    @Override protected double radius() { return radius; }
    @Override protected BarColor barColor() { return BarColor.RED; }

    @Override
    protected void onStart() {
        bar.setTitle("§4§l☣ ZOMBIE APOCALYPSE ☣ §7— The dead are rising");
        for (Player p : nearbyPlayers(radius + 40)) {
            FX.sound(p, Sound.ENTITY_WITHER_SPAWN, 1f, 0.5f);
            FX.sound(p, Sound.ENTITY_ELDER_GUARDIAN_CURSE, 1f, 0.6f);
            p.sendMessage("§4§l[☣] §cOUTBREAK DETECTED. §7Elemental undead are converging on your position. §c" + totalWaves + " waves §7incoming.");
        }
    }

    @Override
    protected void onEnd() {
        for (Mob m : mobs.values()) if (m.isValid()) { deathFx(m, elementOf(m)); m.remove(); }
        mobs.clear();
        if (bossBar != null) bossBar.removeAll();
    }

    @Override
    protected void tick() {
        long t = ticks - phaseStart;
        mobs.values().removeIf(m -> !m.isValid() || m.isDead());
        switch (phase) {
            case WARNING -> warning(t);
            case WAVE -> waveTick(t);
            case BREAK -> breakTick(t);
            case VICTORY -> { if (t > 100) finish(); }
        }
        for (Mob m : new ArrayList<>(mobs.values())) mobTick(m);
        if (ticks % 3 == 0) ambience();
    }

    private void next(Phase p) { phase = p; phaseStart = ticks; }

    // ------------------------------------------------------------------ phases

    private void warning(long t) {
        long left = warningTicks - t;
        bar.setProgress(Math.max(0, left / (double) warningTicks));
        bar.setColor((t / 6) % 2 == 0 ? BarColor.RED : BarColor.PURPLE);
        if (left % 20 == 0 && left > 0) {
            int s = (int) (left / 20);
            for (Player p : nearbyPlayers(radius + 40)) {
                FX.title(p, "§4§l☣ OUTBREAK ☣", "§cThe dead rise in §f§l" + s + "§c...", 0, 25, 5);
                FX.sound(p, Sound.ENTITY_WARDEN_HEARTBEAT, 2f, 0.8f);
                FX.sound(p, Sound.ENTITY_ZOMBIE_AMBIENT, 1f, 0.5f);
                if (s <= 3) FX.sound(p, Sound.BLOCK_BELL_USE, 1f, 0.5f);
            }
        }
        if (left <= 0) startWave();
    }

    private void startWave() {
        wave++;
        boolean last = wave == totalWaves;
        waveSize = 3 + wave * 2 + level * 2;
        bar.setTitle("§4§l☣ WAVE " + wave + "/" + totalWaves + (last ? " §8— §4§lFINAL WAVE" : ""));
        bar.setColor(BarColor.RED);
        for (Player p : nearbyPlayers(radius + 40)) {
            FX.title(p, "§4§lWAVE " + wave, last ? "§c§lThe Warlord approaches..." : "§c" + waveSize + " elemental undead", 5, 50, 15);
            FX.sound(p, Sound.ENTITY_ENDER_DRAGON_GROWL, 1f, 0.6f);
            FX.sound(p, Sound.EVENT_RAID_HORN, 3f, 1f);
        }
        List<Player> players = nearbyPlayers(radius);
        if (players.isEmpty()) players = List.of();
        for (int i = 0; i < waveSize; i++) {
            Location around = players.isEmpty() ? center : players.get(random.nextInt(players.size())).getLocation();
            final Location at = around;
            final Element el = Element.REGULAR[random.nextInt(Element.REGULAR.length)];
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> summon(el, spawnPoint(at, 14, 28)), i * 6L);
        }
        if (last) plugin.getServer().getScheduler().runTaskLater(plugin, () -> summon(Element.WARLORD, spawnPoint(center, 10, 18)), 80L);
        next(Phase.WAVE);
    }

    private void waveTick(long t) {
        int alive = mobs.size();
        int expected = waveSize + (wave == totalWaves ? 1 : 0);
        bar.setProgress(Math.max(0, Math.min(1, alive / (double) Math.max(1, expected))));
        if (t % 20 == 0) for (Player p : nearbyPlayers(radius + 20)) FX.actionBar(p, "§4☣ §cUndead remaining: §f§l" + alive + " §8| §7Wave " + wave + "/" + totalWaves);
        if (t < 120) return; // allow staggered spawns
        if (alive == 0 || t > waveTimeout) {
            for (Mob m : mobs.values()) { deathFx(m, elementOf(m)); m.remove(); }
            mobs.clear();
            if (wave >= totalWaves) {
                next(Phase.VICTORY);
                bar.setTitle("§a§lSURVIVED");
                bar.setColor(BarColor.GREEN);
                bar.setProgress(1);
                for (Player p : nearbyPlayers(radius + 40)) {
                    FX.title(p, "§a§lYOU SURVIVED", "§7The apocalypse has been repelled", 10, 70, 20);
                    FX.sound(p, Sound.UI_TOAST_CHALLENGE_COMPLETE, 1f, 1f);
                }
            } else {
                next(Phase.BREAK);
                for (Player p : nearbyPlayers(radius + 40)) {
                    FX.title(p, "§a§lWAVE CLEARED", "§7Next wave in " + breakTicks / 20 + "s — regroup!", 5, 40, 10);
                    FX.sound(p, Sound.ENTITY_PLAYER_LEVELUP, 1f, 0.7f);
                }
            }
        }
    }

    private void breakTick(long t) {
        bar.setTitle("§6§lBREATHER §7— wave " + (wave + 1) + " in " + Math.max(0, (breakTicks - t) / 20) + "s");
        bar.setColor(BarColor.YELLOW);
        bar.setProgress(Math.max(0, 1 - t / (double) breakTicks));
        if (breakTicks - t <= 60 && (breakTicks - t) % 20 == 0)
            for (Player p : nearbyPlayers(radius + 40)) FX.sound(p, Sound.ENTITY_WARDEN_HEARTBEAT, 2f, 1f);
        if (t >= breakTicks) startWave();
    }

    private void ambience() {
        for (Player p : nearbyPlayers(radius)) {
            Location l = p.getLocation();
            world.spawnParticle(Particle.DUST, l.clone().add(0, 1, 0), 6, 10, 3, 10, 0, FX.dust(90, 0, 0, 1.3f));
            world.spawnParticle(Particle.ASH, l.clone().add(0, 3, 0), 15, 10, 4, 10, 0);
            if (random.nextInt(200) == 0) FX.sound(p, Sound.ENTITY_ZOMBIE_AMBIENT, 1.5f, 0.4f);
        }
    }

    // ------------------------------------------------------------------ spawning

    private Location spawnPoint(Location around, double min, double max) {
        for (int i = 0; i < 12; i++) {
            double a = random.nextDouble() * Math.PI * 2, d = rnd(min, max);
            int x = (int) Math.floor(around.getX() + Math.cos(a) * d), z = (int) Math.floor(around.getZ() + Math.sin(a) * d);
            if (!world.isChunkLoaded(x >> 4, z >> 4)) continue;
            int y = FX.surfaceY(world, x, z);
            Block ground = world.getBlockAt(x, y, z);
            if (ground.isLiquid() || !ground.getType().isSolid()) continue;
            return new Location(world, x + 0.5, y + 1, z + 0.5);
        }
        return around.clone();
    }

    private void summon(Element el, Location at) {
        if (phase != Phase.WAVE || isFinished()) return;
        // Rising-from-the-ground ritual
        Block ground = at.clone().subtract(0, 1, 0).getBlock();
        world.spawnParticle(Particle.BLOCK, at, 60, 0.6, 0.2, 0.6, 0, ground.getType().isAir() ? Material.DIRT.createBlockData() : ground.getBlockData());
        world.spawnParticle(Particle.SOUL, at, 12, 0.5, 0.5, 0.5, 0.03);
        world.spawnParticle(Particle.DUST, at.clone().add(0, 1, 0), 40, 0.5, 1, 0.5, 0, new Particle.DustOptions(el.armor, 1.8f));
        FX.ring(at, 1.5, Particle.DUST, 24, new Particle.DustOptions(el.armor, 1.5f));
        FX.sound(at, Sound.ENTITY_ZOMBIE_VILLAGER_CURE, 1f, 0.5f);
        FX.sound(at, Sound.BLOCK_ROOTED_DIRT_BREAK, 1.5f, 0.6f);

        Entity raw = world.spawnEntity(at, el.entity);
        if (!(raw instanceof Mob mob)) { raw.remove(); return; }
        double mult = 1 + (level - 1) * 0.2 + (wave - 1) * 0.1;
        mob.getPersistentDataContainer().set(KEY, PersistentDataType.STRING, el.name());
        mob.setCustomName(el.name + (el == Element.WARLORD ? "" : " §7[Lv" + level + "]"));
        mob.setCustomNameVisible(true);
        mob.setRemoveWhenFarAway(false);
        mob.setPersistent(true);
        mob.setCanPickupItems(false);
        attr(mob, Attribute.MAX_HEALTH, el.health * mult);
        mob.setHealth(el.health * mult);
        attr(mob, Attribute.SCALE, el.scale);
        attr(mob, Attribute.MOVEMENT_SPEED, el.speed);
        attr(mob, Attribute.ATTACK_DAMAGE, el.damage * mult);
        attr(mob, Attribute.FOLLOW_RANGE, 64);
        attr(mob, Attribute.KNOCKBACK_RESISTANCE, el == Element.EARTH || el == Element.WARLORD ? 1.0 : 0.4);
        if (el == Element.FIRE || el == Element.WARLORD) {
            mob.addPotionEffect(new PotionEffect(PotionEffectType.FIRE_RESISTANCE, PotionEffect.INFINITE_DURATION, 0, false, false));
            mob.setVisualFire(true);
        }
        if (el == Element.WATER) mob.addPotionEffect(new PotionEffect(PotionEffectType.WATER_BREATHING, PotionEffect.INFINITE_DURATION, 0, false, false));

        EntityEquipment eq = mob.getEquipment();
        if (eq != null) {
            eq.setHelmet(new ItemStack(el.helmet));
            eq.setChestplate(dyed(Material.LEATHER_CHESTPLATE, el.armor));
            eq.setLeggings(dyed(Material.LEATHER_LEGGINGS, el.armor));
            eq.setBoots(dyed(Material.LEATHER_BOOTS, el.armor));
            eq.setItemInMainHand(new ItemStack(switch (el) {
                case FIRE -> Material.BLAZE_ROD;
                case WATER -> Material.TRIDENT;
                case WIND -> Material.BREEZE_ROD;
                case EARTH -> Material.MACE;
                case LIGHTNING -> Material.END_ROD;
                case WARLORD -> Material.NETHERITE_AXE;
            }));
            eq.setHelmetDropChance(0); eq.setChestplateDropChance(0); eq.setLeggingsDropChance(0);
            eq.setBootsDropChance(0); eq.setItemInMainHandDropChance(0);
        }

        if (el == Element.WARLORD) {
            boss = mob;
            mob.setGlowing(true);
            bossBar = plugin.getServer().createBossBar(el.name, BarColor.PURPLE, BarStyle.SEGMENTED_20);
            for (Player p : nearbyPlayers(radius + 40)) {
                bossBar.addPlayer(p);
                FX.title(p, "§4§l☠ THE UNDYING WARLORD ☠", "§cMaster of every element", 5, 60, 20);
                FX.sound(p, Sound.ENTITY_WITHER_SPAWN, 2f, 0.6f);
            }
            world.strikeLightningEffect(at);
            FX.ring(at, 4, Particle.SOUL_FIRE_FLAME, 60, null);
        }
        mobs.put(mob.getUniqueId(), mob);
        cooldown.put(mob.getUniqueId(), ticks + 40 + random.nextInt(40));
    }

    private static void attr(LivingEntity e, Attribute a, double v) {
        AttributeInstance i = e.getAttribute(a);
        if (i != null) i.setBaseValue(v);
    }

    private static ItemStack dyed(Material m, Color c) {
        ItemStack it = new ItemStack(m);
        if (it.getItemMeta() instanceof LeatherArmorMeta meta) { meta.setColor(c); it.setItemMeta(meta); }
        return it;
    }

    // ------------------------------------------------------------------ AI + powers

    private void mobTick(Mob m) {
        Element el = elementOf(m);
        if (el == null) return;
        aura(m, el);

        if (m == boss && bossBar != null) {
            AttributeInstance max = m.getAttribute(Attribute.MAX_HEALTH);
            bossBar.setProgress(Math.max(0, Math.min(1, m.getHealth() / (max != null ? max.getValue() : 1))));
        }

        Player target = nearestPlayer(m.getLocation(), 40);
        if (target == null) return;
        if (m.getTarget() != target && ticks % 20 == 0) m.setTarget(target);

        long ready = cooldown.getOrDefault(m.getUniqueId(), 0L);
        if (ticks < ready) return;
        double dist = m.getLocation().distance(target.getLocation());
        if (dist > 28 || !m.hasLineOfSight(target)) return;

        Element cast = el == Element.WARLORD ? Element.REGULAR[random.nextInt(Element.REGULAR.length)] : el;
        boolean close = dist < 6;
        switch (cast) {
            case FIRE -> { if (close) flameNova(m); else fireball(m, target); }
            case WATER -> { if (close || random.nextBoolean()) whirlpool(m, target); else waterBlast(m, target); }
            case WIND -> { if (close) cyclone(m); else windBlade(m, target); }
            case EARTH -> { if (close) groundSlam(m); else rockThrow(m, target); }
            case LIGHTNING -> chainLightning(m, target);
            default -> {}
        }
        int cd = (int) ((el == Element.WARLORD ? 50 : 90 - level * 8) + random.nextInt(40));
        cooldown.put(m.getUniqueId(), ticks + cd);
    }

    private Player nearestPlayer(Location l, double max) {
        Player best = null;
        double bd = max * max;
        for (Player p : world.getPlayers()) {
            if (p.getGameMode().name().equals("SPECTATOR") || p.getGameMode().name().equals("CREATIVE") || p.isDead()) continue;
            double d = p.getLocation().distanceSquared(l);
            if (d < bd) { bd = d; best = p; }
        }
        return best;
    }

    private void aura(Mob m, Element el) {
        Location l = m.getLocation().add(0, m.getHeight() * 0.6, 0);
        double w = m.getWidth() * 0.6, h = m.getHeight() * 0.4;
        switch (el) {
            case FIRE -> {
                world.spawnParticle(Particle.FLAME, l, 2, w, h, w, 0.01);
                if (ticks % 3 == 0) world.spawnParticle(Particle.LARGE_SMOKE, l.clone().add(0, h, 0), 1, w, 0.1, w, 0.01);
            }
            case WATER -> {
                world.spawnParticle(Particle.DRIPPING_WATER, l, 2, w, h, w, 0);
                if (ticks % 2 == 0) spiral(m.getLocation(), Particle.BUBBLE_POP, 1.0, ticks);
            }
            case WIND -> {
                spiral(m.getLocation(), Particle.CLOUD, 1.1, ticks);
                if (ticks % 4 == 0) world.spawnParticle(Particle.GUST, m.getLocation().add(0, 0.2, 0), 1, 0.3, 0, 0.3, 0);
            }
            case EARTH -> {
                if (ticks % 2 == 0) world.spawnParticle(Particle.BLOCK, m.getLocation().add(0, 0.1, 0), 4, w, 0.05, w, 0, Material.DIRT.createBlockData());
                world.spawnParticle(Particle.DUST, l, 1, w, h, w, 0, FX.dust(110, 80, 40, 1.5f));
            }
            case LIGHTNING -> {
                world.spawnParticle(Particle.ELECTRIC_SPARK, l, 3, w, h, w, 0.05);
                if (random.nextInt(30) == 0) FX.sound(l, Sound.BLOCK_BEACON_POWER_SELECT, 0.4f, 2f);
            }
            case WARLORD -> {
                spiral(m.getLocation(), Particle.SOUL_FIRE_FLAME, 1.6, ticks);
                spiral(m.getLocation(), Particle.DUST, 1.9, ticks + 10, FX.dust(150, 0, 30, 2f));
                world.spawnParticle(Particle.SOUL, l, 1, w, h, w, 0.01);
                world.spawnParticle(Particle.ELECTRIC_SPARK, l, 2, w, h, w, 0.05);
            }
        }
    }

    private void spiral(Location base, Particle p, double r, long t) { spiral(base, p, r, t, null); }

    private void spiral(Location base, Particle p, double r, long t, Object data) {
        for (int i = 0; i < 2; i++) {
            double a = t * 0.35 + i * Math.PI;
            Location l = base.clone().add(Math.cos(a) * r, (t % 20) / 10.0, Math.sin(a) * r);
            if (data != null) world.spawnParticle(p, l, 1, 0, 0, 0, 0, data);
            else world.spawnParticle(p, l, 1, 0, 0, 0, 0);
        }
    }

    private Location eye(Mob m) { return m.getEyeLocation(); }

    private Vector aim(Mob m, Player t) {
        return t.getLocation().add(0, 1, 0).toVector().subtract(eye(m).toVector()).normalize();
    }

    private void windup(Mob m, Particle p, Object data) {
        Location l = eye(m);
        for (int i = 0; i < 20; i++) {
            double a = Math.PI * 2 * i / 20;
            Location s = l.clone().add(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2);
            if (data != null) world.spawnParticle(p, s, 1, 0, 0, 0, 0, data);
            else world.spawnParticle(p, s, 0, -Math.cos(a) * 0.1, 0, -Math.sin(a) * 0.1, 1);
        }
    }

    private double dmg(double base) { return base * (1 + (level - 1) * 0.25); }

    // FIRE ---------------------------------------------------------------------

    private void fireball(Mob m, Player t) {
        windup(m, Particle.FLAME, null);
        FX.sound(m.getLocation(), Sound.ENTITY_BLAZE_SHOOT, 1.5f, 0.6f);
        new Bolt(eye(m), aim(m, t), 1.2, 40, 1.2, m, l -> {
            world.spawnParticle(Particle.FLAME, l, 4, 0.15, 0.15, 0.15, 0.02);
            world.spawnParticle(Particle.DUST, l, 2, 0.1, 0.1, 0.1, 0, FX.dust(255, 120, 0, 1.6f));
            if (random.nextInt(4) == 0) world.spawnParticle(Particle.LAVA, l, 1, 0, 0, 0, 0);
        }, (l, hit) -> {
            world.spawnParticle(Particle.EXPLOSION, l, 2, 0.3, 0.3, 0.3, 0);
            world.spawnParticle(Particle.FLAME, l, 60, 0.6, 0.6, 0.6, 0.15);
            FX.sound(l, Sound.ENTITY_GENERIC_EXPLODE, 1.5f, 1.2f);
            for (Entity e : world.getNearbyEntities(l, 3, 3, 3)) {
                if (e instanceof Player p) {
                    p.damage(dmg(6), m);
                    p.setFireTicks(80 + level * 20);
                    p.setVelocity(p.getLocation().toVector().subtract(l.toVector()).normalize().multiply(0.8).setY(0.4));
                }
            }
            Block b = l.getBlock();
            if (b.getType().isAir() && b.getRelative(0, -1, 0).getType().isSolid()) b.setType(Material.FIRE);
        }).launch(plugin);
    }

    private void flameNova(Mob m) {
        Location c = m.getLocation().add(0, 0.3, 0);
        FX.sound(c, Sound.ITEM_FIRECHARGE_USE, 2f, 0.5f);
        FX.sound(c, Sound.ENTITY_BLAZE_AMBIENT, 1.5f, 0.5f);
        for (int r = 1; r <= 7; r++) {
            final double rad = r;
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                FX.ring(c, rad, Particle.FLAME, (int) (rad * 10), null);
                FX.ring(c, rad, Particle.DUST, (int) (rad * 6), FX.dust(255, 70, 0, 2f));
                for (Entity e : world.getNearbyEntities(c, rad, 2, rad)) {
                    if (!(e instanceof Player p)) continue;
                    double d = p.getLocation().distance(c);
                    if (d > rad - 1 && d <= rad) {
                        p.damage(dmg(5), m);
                        p.setFireTicks(100);
                        p.setVelocity(p.getLocation().toVector().subtract(c.toVector()).normalize().multiply(1.0).setY(0.5));
                    }
                }
            }, r);
        }
    }

    // WATER --------------------------------------------------------------------

    private void waterBlast(Mob m, Player t) {
        windup(m, Particle.SPLASH, null);
        FX.sound(m.getLocation(), Sound.ITEM_TRIDENT_RIPTIDE_3, 1.5f, 0.8f);
        new Bolt(eye(m), aim(m, t), 1.3, 40, 1.3, m, l -> {
            world.spawnParticle(Particle.SPLASH, l, 10, 0.2, 0.2, 0.2, 0.1);
            world.spawnParticle(Particle.DUST, l, 3, 0.15, 0.15, 0.15, 0, FX.dust(40, 120, 255, 1.8f));
            world.spawnParticle(Particle.BUBBLE_POP, l, 2, 0.1, 0.1, 0.1, 0.02);
        }, (l, hit) -> {
            world.spawnParticle(Particle.SPLASH, l, 120, 1, 1, 1, 0.3);
            world.spawnParticle(Particle.FALLING_WATER, l, 40, 1, 1, 1, 0);
            FX.sound(l, Sound.ENTITY_GENERIC_SPLASH, 2f, 0.6f);
            for (Entity e : world.getNearbyEntities(l, 3, 3, 3)) {
                if (!(e instanceof Player p)) continue;
                p.damage(dmg(5), m);
                p.setVelocity(aim(m, p).multiply(1.8).setY(0.6));
                p.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS, 60, 1));
                p.setFireTicks(0);
            }
        }).launch(plugin);
    }

    private void whirlpool(Mob m, Player t) {
        Location c = t.getLocation();
        FX.sound(c, Sound.AMBIENT_UNDERWATER_ENTER, 2f, 0.5f);
        FX.sound(c, Sound.ITEM_BUCKET_EMPTY, 2f, 0.5f);
        for (int i = 0; i < 50; i++) {
            final int k = i;
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                if (!m.isValid()) return;
                for (int arm = 0; arm < 3; arm++) {
                    for (double r = 0.5; r < 4.5; r += 0.5) {
                        double a = k * 0.4 + arm * Math.PI * 2 / 3 + r * 0.8;
                        Location l = c.clone().add(Math.cos(a) * r, 0.15 + (4.5 - r) * 0.3, Math.sin(a) * r);
                        world.spawnParticle(Particle.DUST, l, 1, 0, 0, 0, 0, FX.dust(30, 90 + (int) (r * 30), 255, 1.4f));
                        if (r < 1.5) world.spawnParticle(Particle.BUBBLE_POP, l, 1, 0, 0, 0, 0);
                    }
                }
                world.spawnParticle(Particle.SPLASH, c, 15, 2, 0.2, 2, 0.1);
                if (k % 5 != 0) return;
                for (Entity e : world.getNearbyEntities(c, 4.5, 3, 4.5)) {
                    if (!(e instanceof Player p)) continue;
                    Vector pull = c.toVector().subtract(p.getLocation().toVector());
                    Vector swirl = new Vector(-pull.getZ(), 0, pull.getX()).normalize().multiply(0.3);
                    p.setVelocity(pull.multiply(0.12).add(swirl).setY(-0.1));
                    p.setRemainingAir(Math.max(-19, p.getRemainingAir() - 40));
                    if (k % 10 == 0) p.damage(dmg(2), m);
                }
            }, i);
        }
    }

    // WIND ---------------------------------------------------------------------

    private void windBlade(Mob m, Player t) {
        FX.sound(m.getLocation(), Sound.ENTITY_BREEZE_SHOOT, 1.5f, 0.8f);
        Vector dir = aim(m, t);
        Vector side = new Vector(-dir.getZ(), 0, dir.getX()).normalize();
        new Bolt(eye(m), dir, 1.7, 30, 1.5, m, l -> {
            for (double o = -1.2; o <= 1.2; o += 0.3) {
                Location s = l.clone().add(side.clone().multiply(o)).add(0, -Math.abs(o) * 0.3, 0);
                world.spawnParticle(Particle.CLOUD, s, 1, 0, 0, 0, 0);
            }
            if (random.nextInt(3) == 0) world.spawnParticle(Particle.SWEEP_ATTACK, l, 1, 0, 0, 0, 0);
        }, (l, hit) -> {
            world.spawnParticle(Particle.GUST_EMITTER_LARGE, l, 1, 0, 0, 0, 0);
            FX.sound(l, Sound.ENTITY_BREEZE_WIND_BURST, 2f, 0.7f);
            for (Entity e : world.getNearbyEntities(l, 3, 3, 3)) {
                if (!(e instanceof Player p)) continue;
                p.damage(dmg(4), m);
                p.setVelocity(dir.clone().multiply(1.4).setY(1.1));
            }
        }).launch(plugin);
    }

    private void cyclone(Mob m) {
        Location c = m.getLocation();
        FX.sound(c, Sound.ENTITY_BREEZE_WIND_BURST, 2f, 0.5f);
        FX.sound(c, Sound.ITEM_ELYTRA_FLYING, 1.5f, 1.2f);
        for (int i = 0; i < 40; i++) {
            final int k = i;
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                for (double h = 0; h < 8; h += 0.5) {
                    double r = 0.6 + h * 0.35;
                    double a = k * 0.6 + h * 1.2;
                    world.spawnParticle(Particle.CLOUD, c.clone().add(Math.cos(a) * r, h, Math.sin(a) * r), 1, 0, 0, 0, 0);
                    if (h % 2 == 0) world.spawnParticle(Particle.WHITE_ASH, c.clone().add(Math.cos(a + 3) * r, h, Math.sin(a + 3) * r), 2, 0, 0, 0, 0);
                }
                if (k % 4 != 0) return;
                for (Entity e : world.getNearbyEntities(c, 4, 6, 4)) {
                    if (!(e instanceof Player p)) continue;
                    Vector v = p.getLocation().toVector().subtract(c.toVector());
                    Vector swirl = new Vector(-v.getZ(), 0, v.getX()).normalize().multiply(0.5);
                    p.setVelocity(swirl.setY(0.55));
                }
                if (k == 36) for (Entity e : world.getNearbyEntities(c, 5, 10, 5))
                    if (e instanceof Player p) { p.setVelocity(p.getLocation().toVector().subtract(c.toVector()).normalize().multiply(1.8).setY(0.6)); p.damage(dmg(4), m); }
            }, i);
        }
    }

    // EARTH --------------------------------------------------------------------

    private void groundSlam(Mob m) {
        Location c = m.getLocation();
        m.setVelocity(new Vector(0, 0.8, 0));
        plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
            if (!m.isValid()) return;
            Location g = m.getLocation();
            FX.sound(g, Sound.ENTITY_GENERIC_EXPLODE, 2f, 0.5f);
            FX.sound(g, Sound.ITEM_MACE_SMASH_GROUND_HEAVY, 2f, 0.7f);
            Block under = g.clone().subtract(0, 1, 0).getBlock();
            var data = under.getType().isSolid() ? under.getBlockData() : Material.DIRT.createBlockData();
            for (int r = 1; r <= 8; r++) {
                final double rad = r;
                plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                    FX.ring(g, rad, Particle.BLOCK, (int) (rad * 10), data);
                    FX.ring(g, rad, Particle.CAMPFIRE_COSY_SMOKE, (int) rad * 2, null);
                    if (rad % 2 == 0) for (int i = 0; i < 4; i++) {
                        double a = random.nextDouble() * Math.PI * 2;
                        FX.debris(g.clone().add(Math.cos(a) * rad, 0.5, Math.sin(a) * rad), data, new Vector(0, 0.5, 0), true);
                    }
                    for (Entity e : world.getNearbyEntities(g, rad, 2, rad)) {
                        if (!(e instanceof Player p)) continue;
                        double d = p.getLocation().distance(g);
                        if (d > rad - 1 && d <= rad && p.isOnGround()) {
                            p.damage(dmg(7), m);
                            p.setVelocity(new Vector(0, 1.0, 0).add(p.getLocation().toVector().subtract(g.toVector()).normalize().multiply(0.6)));
                            FX.shake(p, 4);
                        }
                    }
                }, r * 2L);
            }
        }, 12L);
    }

    private void rockThrow(Mob m, Player t) {
        FX.sound(m.getLocation(), Sound.BLOCK_STONE_BREAK, 2f, 0.5f);
        Location start = eye(m).add(0, 1.2, 0);
        new Bolt(start, t.getLocation().add(0, 1, 0).toVector().subtract(start.toVector()), 1.0, 50, 1.4, m, l -> {
            world.spawnParticle(Particle.BLOCK, l, 8, 0.35, 0.35, 0.35, 0, Material.COBBLESTONE.createBlockData());
            world.spawnParticle(Particle.DUST, l, 3, 0.3, 0.3, 0.3, 0, FX.dust(100, 90, 80, 2.2f));
        }, (l, hit) -> {
            world.spawnParticle(Particle.BLOCK, l, 120, 1, 1, 1, 0, Material.COBBLESTONE.createBlockData());
            world.spawnParticle(Particle.EXPLOSION, l, 1, 0, 0, 0, 0);
            FX.sound(l, Sound.BLOCK_STONE_BREAK, 2f, 0.4f);
            FX.sound(l, Sound.ENTITY_GENERIC_EXPLODE, 1f, 0.8f);
            for (int i = 0; i < 6; i++)
                FX.debris(l.clone().add(0, 0.5, 0), Material.COBBLESTONE.createBlockData(), new Vector(rnd(-0.3, 0.3), rnd(0.3, 0.6), rnd(-0.3, 0.3)), true);
            for (Entity e : world.getNearbyEntities(l, 2.5, 2.5, 2.5)) {
                if (!(e instanceof Player p)) continue;
                p.damage(dmg(8), m);
                p.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS, 60, 2));
                FX.shake(p, 3);
            }
        }).launch(plugin);
    }

    // LIGHTNING ----------------------------------------------------------------

    private void chainLightning(Mob m, Player first) {
        FX.sound(m.getLocation(), Sound.ENTITY_EVOKER_CAST_SPELL, 1.5f, 1.4f);
        windup(m, Particle.ELECTRIC_SPARK, null);
        plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
            if (!m.isValid() || !first.isValid()) return;
            List<Player> hit = new ArrayList<>();
            Location from = eye(m);
            Player cur = first;
            int jumps = 1 + level / 2;
            for (int j = 0; j < jumps && cur != null; j++) {
                Location to = cur.getLocation().add(0, 1, 0);
                arc(from, to);
                world.strikeLightningEffect(cur.getLocation());
                cur.damage(dmg(6) * (1 - j * 0.2), m);
                cur.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS, 30, 3));
                FX.shake(cur, 3);
                hit.add(cur);
                from = to;
                Player nxt = null;
                for (Entity e : world.getNearbyEntities(to, 8, 5, 8))
                    if (e instanceof Player p && !hit.contains(p)) { nxt = p; break; }
                cur = nxt;
            }
        }, 10L);
    }

    /** Jagged electric arc between two points. */
    private void arc(Location a, Location b) {
        Vector d = b.toVector().subtract(a.toVector());
        double len = d.length();
        int segs = Math.max(4, (int) (len * 1.5));
        Location prev = a.clone();
        for (int i = 1; i <= segs; i++) {
            Location p = a.clone().add(d.clone().multiply(i / (double) segs));
            if (i < segs) p.add(rnd(-0.6, 0.6), rnd(-0.6, 0.6), rnd(-0.6, 0.6));
            Vector sd = p.toVector().subtract(prev.toVector());
            double sl = sd.length();
            for (double k = 0; k < sl; k += 0.15) {
                Location q = prev.clone().add(sd.clone().multiply(k / sl));
                world.spawnParticle(Particle.DUST, q, 1, 0, 0, 0, 0, FX.dust(200, 230, 255, 0.9f));
                if (random.nextInt(4) == 0) world.spawnParticle(Particle.ELECTRIC_SPARK, q, 1, 0.05, 0.05, 0.05, 0.1);
            }
            prev = p;
        }
        FX.sound(b, Sound.ENTITY_LIGHTNING_BOLT_IMPACT, 1.5f, 1.4f);
    }

    // ------------------------------------------------------------------ death

    public static void deathFx(Entity m, Element el) {
        if (el == null) return;
        Location l = m.getLocation().add(0, 1, 0);
        var w = l.getWorld();
        switch (el) {
            case FIRE -> { w.spawnParticle(Particle.FLAME, l, 60, 0.4, 0.6, 0.4, 0.1); w.spawnParticle(Particle.LAVA, l, 10, 0.3, 0.3, 0.3, 0); }
            case WATER -> w.spawnParticle(Particle.SPLASH, l, 100, 0.5, 0.8, 0.5, 0.3);
            case WIND -> w.spawnParticle(Particle.GUST_EMITTER_SMALL, l, 1, 0, 0, 0, 0);
            case EARTH -> w.spawnParticle(Particle.BLOCK, l, 80, 0.5, 0.8, 0.5, 0, Material.MOSSY_COBBLESTONE.createBlockData());
            case LIGHTNING -> { w.spawnParticle(Particle.ELECTRIC_SPARK, l, 80, 0.4, 0.8, 0.4, 0.3); w.strikeLightningEffect(l); }
            case WARLORD -> { w.spawnParticle(Particle.EXPLOSION_EMITTER, l, 2, 0.5, 0.5, 0.5, 0); w.spawnParticle(Particle.SOUL_FIRE_FLAME, l, 200, 1, 1.5, 1, 0.2); }
        }
        w.spawnParticle(Particle.SOUL, l, 10, 0.3, 0.5, 0.3, 0.05);
        w.playSound(l, Sound.ENTITY_ZOMBIE_DEATH, 1f, 0.6f);
    }
}
