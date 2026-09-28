package com.vextio.disasters.util;

import com.vextio.disasters.core.DisasterManager;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.block.data.BlockData;

import java.util.EnumSet;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Places water block by block with a per-tick budget, remembers every block it placed
 * so the water can recede cleanly later. Water is placed without physics so it never
 * spreads beyond what the disaster intends.
 */
public final class WaterEngine {

    private final World world;
    private final DisasterManager manager;
    private final LongList queue = new LongList();
    private int queueHead;
    private final LongList placed = new LongList();
    /** Materials that get destroyed ("washed away") in addition to air/plants. */
    private final Set<Material> washAway = EnumSet.noneOf(Material.class);
    private double washChance;

    public WaterEngine(World world, DisasterManager manager) {
        this.world = world;
        this.manager = manager;
    }

    public void setWashAway(Set<Material> mats, double chance) {
        washAway.clear();
        washAway.addAll(mats);
        washChance = chance;
    }

    public void queue(int x, int y, int z) { queue.add(FX.pack(x, y, z)); }

    public int pending() { return queue.size() - queueHead; }
    public int placedCount() { return placed.size(); }

    /** Processes queued placements. Returns blocks placed. */
    public int process(int budget) {
        int done = 0, checked = 0;
        ThreadLocalRandom r = ThreadLocalRandom.current();
        while (queueHead < queue.size() && done < budget && checked < budget * 4) {
            long p = queue.get(queueHead++);
            checked++;
            int x = FX.unpackX(p), y = FX.unpackY(p), z = FX.unpackZ(p);
            if (y < world.getMinHeight() || y >= world.getMaxHeight()) continue;
            if (!world.isChunkLoaded(x >> 4, z >> 4)) continue;
            Block b = world.getBlockAt(x, y, z);
            Material m = b.getType();
            boolean ok = m.isAir()
                    || (!m.isSolid() && m != Material.WATER && m != Material.LAVA && !manager.isProtected(b))
                    || (washAway.contains(m) && r.nextDouble() < washChance && !manager.isProtected(b));
            if (!ok) continue;
            if (!m.isAir() && r.nextInt(6) == 0) {
                BlockData bd = b.getBlockData();
                world.spawnParticle(Particle.BLOCK, b.getLocation().add(0.5, 0.5, 0.5), 8, 0.3, 0.3, 0.3, 0, bd);
            }
            b.setType(Material.WATER, false);
            placed.add(p);
            done++;
        }
        if (queueHead >= queue.size()) { queue.clear(); queueHead = 0; }
        return done;
    }

    /** Removes placed water, newest (highest) first. Returns true once fully drained. */
    public boolean drain(int budget) {
        int done = 0;
        while (!placed.isEmpty() && done < budget) {
            long p = placed.removeLast();
            int x = FX.unpackX(p), y = FX.unpackY(p), z = FX.unpackZ(p);
            if (!world.isChunkLoaded(x >> 4, z >> 4)) continue;
            Block b = world.getBlockAt(x, y, z);
            if (b.getType() == Material.WATER) {
                b.setType(Material.AIR, false);
                done++;
            }
        }
        return placed.isEmpty();
    }

    public void clearQueue() { queue.clear(); queueHead = 0; }
}
