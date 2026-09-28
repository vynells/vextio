package com.vextio.disasters.disasters;

import com.vextio.disasters.NaturalDisasters;
import com.vextio.disasters.core.Disaster;
import com.vextio.disasters.core.DisasterType;
import com.vextio.disasters.util.FX;
import com.vextio.disasters.util.LongList;
import com.vextio.disasters.util.WaterEngine;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.boss.BarColor;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * A wall of water that rolls in from one side. No water is "spawned" at the player: the wave is
 * built row by row from the horizon, each row rising over time, so the water visibly creeps in
 * and climbs until the area is drowned. Higher level = taller, wider, faster, more destructive.
 */
public class Tsunami extends Disaster {

    private enum Phase { WARNING, TRAVEL, SURGE, HOLD, RECEDE }

    private static final double ROW_STEP = 0.7;

    private final WaterEngine water;
    private final Vector dir, perp;
    private final Location origin;
    private final int warningTicks;
    private final double width, travel, speed;
    private final int base, height, ramp, surgeLevels;
    private final int recedeAfter;

    private final List<LongList> rows = new ArrayList<>();   // packed (x, groundY, z)
    private final List<Integer> rowTop = new ArrayList<>();  // highest y queued in each row
    private final Set<Long> visited = new HashSet<>();

    private Phase phase = Phase.WARNING;
    private long phaseStart;
    private double front;      // distance travelled from origin
    private int surgeExtra;

    public Tsunami(NaturalDisasters plugin, Location center, int level) {
        super(plugin, DisasterType.TSUNAMI, center, level);
        water = new WaterEngine(world, plugin.getManager());
        double a = random.nextDouble() * Math.PI * 2;
        dir = new Vector(Math.cos(a), 0, Math.sin(a));
        perp = new Vector(-dir.getZ(), 0, dir.getX());
        double startDist = 60 + level * 15;
        origin = center.clone().subtract(dir.clone().multiply(startDist));
        travel = startDist + 30 + level * 12;
        width = 70 + level * 25;
        speed = 0.18 + level * 0.05;        // blocks per tick
        height = 3 + level * 4;             // 7 .. 23 blocks above base
        ramp = 6 + level * 2;               // rows for the water to climb to full height
        surgeLevels = level;
        int ground = FX.surfaceY(world, center.getBlockX(), center.getBlockZ());
        base = Math.max(world.getSeaLevel() - 1, ground - 2);
        warningTicks = Math.max(3, cfg("tsunami").getInt("warning-seconds", 12)) * 20;
        recedeAfter = cfg("tsunami").getInt("recede-after-seconds", 90);

        Set<Material> wash = EnumSet.noneOf(Material.class);
        for (Material m : Material.values()) {
            if (!m.isBlock() || m.isLegacy()) continue;
            String n = m.name();
            if (n.endsWith("LEAVES") || n.contains("GLASS")) wash.add(m);
            if (level >= 3 && (n.contains("FENCE") || n.endsWith("_DOOR") || n.contains("WOOL") || n.contains("CARPET")
                    || n.contains("TRAPDOOR") || n.equals("HAY_BLOCK") || n.contains("BAMBOO"))) wash.add(m);
            if (level >= 4 && (n.contains("PLANKS") || n.endsWith("_SLAB") || n.endsWith("_STAIRS") || n.equals("SAND")
                    || n.equals("GRAVEL") || n.equals("DIRT") || n.contains("MUD"))) wash.add(m);
            if (level >= 5 && (n.endsWith("_LOG") || n.contains("BRICKS") || n.equals("COBBLESTONE") || n.contains("TERRACOTTA"))) wash.add(m);
        }
        water.setWashAway(wash, 0.15 + level * 0.12);
    }

    @Override protected double radius() { return travel + 20; }
    @Override protected BarColor barColor() { return BarColor.BLUE; }

    @Override
    protected void onStart() {
        bar.setTitle("§9§l🌊 TSUNAMI WARNING §7— Level " + level);
        String from = compass(dir.clone().multiply(-1));
        for (Player p : nearbyPlayers(radius() + 40)) {
            FX.title(p, "§9§l🌊 TSUNAMI WARNING 🌊", "§bA level " + level + " wave approaches from the §f§l" + from + "§b. Climb to high ground!", 10, 80, 20);
            FX.sound(p, Sound.ENTITY_ELDER_GUARDIAN_CURSE, 1f, 0.5f);
            p.sendMessage("§9§l[!] §bTsunami warning: wave height ~§f" + height + "m§b, approaching from the §f" + from + "§b. Evacuate to high ground!");
        }
    }

    @Override
    protected void onEnd() {
        if (bar != null) bar.removeAll();
    }

    @Override
    public void forceStop() {
        // On shutdown remove the water immediately so the world isn't left flooded mid-animation.
        if (recedeAfter >= 0) while (!water.drain(100000)) { /* drain fully */ }
        super.forceStop();
    }

    @Override
    protected void tick() {
        long t = ticks - phaseStart;
        switch (phase) {
            case WARNING -> warning(t);
            case TRAVEL -> travel(t);
            case SURGE -> surge(t);
            case HOLD -> hold(t);
            case RECEDE -> recede();
        }
        water.process(plugin.getManager().blockBudget());
    }

    private void next(Phase p) { phase = p; phaseStart = ticks; }

    // ------------------------------------------------------------------ phases

    private void warning(long t) {
        bar.setProgress(Math.max(0, 1 - t / (double) warningTicks));
        bar.setColor((t / 10) % 2 == 0 ? BarColor.BLUE : BarColor.WHITE);
        List<Player> players = nearbyPlayers(radius() + 40);
        if (t % 30 == 0) for (Player p : players) {
            FX.sound(p, Sound.BLOCK_BELL_USE, 1f, 0.6f);
            FX.sound(p, Sound.BLOCK_NOTE_BLOCK_BASS, 1f, 0.5f);
        }
        if (t % 20 == 0) {
            int secs = (int) Math.ceil((warningTicks - t) / 20.0);
            for (Player p : players) FX.actionBar(p, "§9§l🌊 §bWave arrival in §f§l" + secs + "s §9§l🌊 §7Get to high ground!");
        }
        // The sea draws back: mist & foam along the horizon line
        if (t % 4 == 0) crestFx(0, base + 1, 0.5);
        if (t % 50 == 0) for (Player p : players) FX.sound(p, Sound.AMBIENT_UNDERWATER_ENTER, 1f, 0.5f);
        if (t >= warningTicks) {
            bar.setTitle("§9§l🌊 TSUNAMI §7— Level " + level + " §8| §bWave height " + height + "m");
            bar.setColor(BarColor.BLUE);
            for (Player p : players) {
                FX.title(p, "§1§l🌊 TSUNAMI 🌊", "§bThe wave is here!", 0, 40, 20);
                FX.sound(p, Sound.ENTITY_GENERIC_SPLASH, 2f, 0.5f);
                FX.sound(p, Sound.ITEM_TRIDENT_THUNDER, 1f, 0.5f);
            }
            next(Phase.TRAVEL);
        }
    }

    private void travel(long t) {
        if (water.pending() < plugin.getManager().blockBudget() * 6) front += speed;
        bar.setProgress(Math.max(0, 1 - front / travel));

        int target = (int) (front / ROW_STEP);
        while (rows.size() <= target) buildRow(rows.size());
        // Raise each row towards full height depending on how far behind the front it is
        int firstRow = Math.max(0, target - ramp);
        for (int i = firstRow; i <= target; i++) {
            double k = Math.min(1.0, (target - i + 1) / (double) ramp);
            int top = base + (int) Math.round(height * (0.25 + 0.75 * k));
            raiseRow(i, top);
        }

        int crestTop = base + height;
        if (t % 2 == 0) crestFx(front, crestTop, 1.0);
        pushEntities(front);
        if (t % 20 == 0) {
            for (Player p : nearbyPlayers(radius() + 40)) {
                double d = distanceToFront(p.getLocation(), front);
                float vol = (float) Math.max(0.2, 2.5 - Math.abs(d) / 25);
                FX.sound(p, Sound.WEATHER_RAIN_ABOVE, vol, 0.5f);
                FX.sound(p, Sound.ENTITY_PLAYER_SPLASH_HIGH_SPEED, vol, 0.5f);
                if (t % 60 == 0) FX.sound(p, Sound.AMBIENT_UNDERWATER_LOOP_ADDITIONS_ULTRA_RARE, vol, 0.6f);
            }
        }
        if (front >= travel) {
            // Make sure every row reaches full height
            for (int i = 0; i < rows.size(); i++) raiseRow(i, base + height);
            next(Phase.SURGE);
        }
    }

    private void surge(long t) {
        bar.setTitle("§9§l🌊 TSUNAMI §8| §bSurge — water still rising");
        if (t % 50 == 0 && surgeExtra < surgeLevels && water.pending() < plugin.getManager().blockBudget() * 4) {
            surgeExtra++;
            for (int i = 0; i < rows.size(); i++) raiseRow(i, base + height + surgeExtra);
            for (Player p : nearbyPlayers(radius())) FX.sound(p, Sound.BLOCK_WATER_AMBIENT, 1.5f, 0.5f);
        }
        currents();
        if (surgeExtra >= surgeLevels && water.pending() == 0) next(Phase.HOLD);
    }

    private void hold(long t) {
        if (recedeAfter < 0) {
            for (Player p : nearbyPlayers(radius())) FX.actionBar(p, "§9The tsunami has settled. The land is gone.");
            finish();
            return;
        }
        currents();
        bar.setTitle("§9§l🌊 TSUNAMI §8| §7Waters receding in " + Math.max(0, (recedeAfter * 20 - t) / 20) + "s");
        bar.setProgress(Math.max(0, 1 - t / (double) (recedeAfter * 20 + 1)));
        if (t >= recedeAfter * 20L) {
            water.clearQueue();
            bar.setTitle("§9§l🌊 TSUNAMI §8| §7Waters receding...");
            next(Phase.RECEDE);
        }
    }

    private void recede() {
        if (water.drain(plugin.getManager().blockBudget())) finish();
    }

    // ------------------------------------------------------------------ building

    private void buildRow(int index) {
        LongList row = new LongList();
        double along = index * ROW_STEP;
        for (double o = -width / 2; o <= width / 2; o += ROW_STEP) {
            int x = (int) Math.floor(origin.getX() + dir.getX() * along + perp.getX() * o);
            int z = (int) Math.floor(origin.getZ() + dir.getZ() * along + perp.getZ() * o);
            if (!visited.add(FX.column(x, z))) continue;
            if (!world.isChunkLoaded(x >> 4, z >> 4)) continue;
            int ground = FX.surfaceY(world, x, z);
            row.add(FX.pack(x, ground, z));
        }
        rows.add(row);
        rowTop.add(base - 64);
    }

    private void raiseRow(int i, int top) {
        int prev = rowTop.get(i);
        if (top <= prev) return;
        rowTop.set(i, top);
        LongList row = rows.get(i);
        for (int c = 0; c < row.size(); c++) {
            long p = row.get(c);
            int x = FX.unpackX(p), g = FX.unpackY(p), z = FX.unpackZ(p);
            int from = Math.max(g + 1, prev + 1);
            // Walls of terrain higher than the wave stop it (realistic run-up)
            for (int y = from; y <= top; y++) water.queue(x, y, z);
        }
    }

    // ------------------------------------------------------------------ effects

    private double distanceToFront(Location l, double f) {
        Vector v = l.toVector().subtract(origin.toVector());
        return v.dot(dir) - f;
    }

    private void crestFx(double f, int y, double density) {
        Location c = origin.clone().add(dir.clone().multiply(f));
        for (double o = -width / 2; o <= width / 2; o += 1.6 / density) {
            Location l = c.clone().add(perp.clone().multiply(o));
            l.setY(y + 0.8);
            if (random.nextDouble() > 0.7) continue;
            world.spawnParticle(Particle.CLOUD, l, 1, 0.4, 0.3, 0.4, 0.02);
            world.spawnParticle(Particle.SPLASH, l, 6, 0.6, 0.4, 0.6, 0.2);
            world.spawnParticle(Particle.FALLING_WATER, l.clone().add(dir.clone().multiply(1.2)), 3, 0.4, 1.2, 0.4, 0);
            world.spawnParticle(Particle.DUST, l, 2, 0.5, 0.3, 0.5, 0, FX.dust(220, 240, 255, 2.2f));
            if (random.nextDouble() < 0.2)
                world.spawnParticle(Particle.BUBBLE_POP, l.clone().add(dir), 4, 0.5, 0.5, 0.5, 0.05);
            // Spray thrown ahead of the wall
            if (f > 0 && random.nextDouble() < 0.25) {
                Location s = l.clone().add(dir.clone().multiply(1.5));
                world.spawnParticle(Particle.CLOUD, s, 0, dir.getX() * 0.35, 0.15, dir.getZ() * 0.35, 1);
            }
        }
    }

    private void pushEntities(double f) {
        Location c = origin.clone().add(dir.clone().multiply(f));
        double rad = width / 2 + 5;
        double force = 0.5 + level * 0.18;
        for (Entity e : world.getNearbyEntities(c, rad, height + 20, rad)) {
            if (e instanceof Player p && (p.isFlying() || p.getGameMode().name().equals("SPECTATOR"))) continue;
            double d = distanceToFront(e.getLocation(), f);
            if (d > 3 || d < -6) continue;
            double across = e.getLocation().toVector().subtract(origin.toVector()).dot(perp);
            if (Math.abs(across) > width / 2) continue;
            Vector v = dir.clone().multiply(force).setY(0.25 + level * 0.05);
            e.setVelocity(v);
            if (e instanceof LivingEntity le && ticks % 20 == 0) le.damage(1 + level * 1.5);
            if (e instanceof Player p && ticks % 10 == 0) {
                FX.shake(p, 1.5 + level * 0.5);
                FX.sound(p, Sound.ENTITY_PLAYER_SPLASH_HIGH_SPEED, 1.5f, 0.7f);
            }
        }
    }

    /** Strong current drags anything in the water inland. */
    private void currents() {
        if (ticks % 4 != 0) return;
        for (Entity e : world.getNearbyEntities(center, radius(), height + 20, radius())) {
            if (!e.isInWater()) continue;
            if (e instanceof Player p && p.isFlying()) continue;
            e.setVelocity(e.getVelocity().add(dir.clone().multiply(0.04 + level * 0.015)));
        }
        if (ticks % 8 == 0) for (Player p : nearbyPlayers(radius())) {
            if (!p.isInWater()) continue;
            world.spawnParticle(Particle.BUBBLE, p.getLocation().add(0, 1, 0), 15, 3, 2, 3, 0.1);
            world.spawnParticle(Particle.CURRENT_DOWN, p.getLocation().add(0, 1, 0), 5, 3, 2, 3, 0.05);
        }
    }

    private static String compass(Vector v) {
        double deg = Math.toDegrees(Math.atan2(-v.getX(), v.getZ()));   // MC yaw convention
        deg = (deg + 360) % 360;
        String[] names = {"SOUTH", "SOUTH-WEST", "WEST", "NORTH-WEST", "NORTH", "NORTH-EAST", "EAST", "SOUTH-EAST"};
        return names[(int) Math.round(deg / 45) % 8];
    }
}
