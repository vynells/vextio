package com.vextio.disasters;

import com.vextio.disasters.core.DisasterCommand;
import com.vextio.disasters.core.DisasterListener;
import com.vextio.disasters.core.DisasterManager;
import com.vextio.disasters.gui.DisasterGUI;
import org.bukkit.command.PluginCommand;
import org.bukkit.plugin.java.JavaPlugin;

public final class NaturalDisasters extends JavaPlugin {

    private static NaturalDisasters instance;
    private DisasterManager manager;
    private DisasterGUI gui;

    @Override
    public void onEnable() {
        instance = this;
        saveDefaultConfig();
        com.vextio.disasters.util.FX.shakeScale = getConfig().getDouble("screen-shake", 0.35);
        manager = new DisasterManager(this);
        gui = new DisasterGUI(this);

        getServer().getPluginManager().registerEvents(new DisasterListener(this), this);
        getServer().getPluginManager().registerEvents(gui, this);

        PluginCommand cmd = getCommand("disaster");
        if (cmd != null) {
            DisasterCommand executor = new DisasterCommand(this);
            cmd.setExecutor(executor);
            cmd.setTabCompleter(executor);
        }
        manager.startRandomScheduler();
        getLogger().info("NaturalDisasters enabled. Brace yourselves.");
    }

    @Override
    public void onDisable() {
        if (manager != null) manager.stopAll(true);
    }

    public static NaturalDisasters get() { return instance; }
    public DisasterManager getManager() { return manager; }
    public DisasterGUI getGui() { return gui; }
}
