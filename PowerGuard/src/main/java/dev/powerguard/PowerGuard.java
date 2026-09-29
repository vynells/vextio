package dev.powerguard;

import dev.powerguard.combat.CombatCommandBlocker;
import dev.powerguard.combat.CombatCooldowns;
import dev.powerguard.combat.CombatListener;
import dev.powerguard.combat.CombatManager;
import dev.powerguard.combat.CombatRestrictions;
import dev.powerguard.combat.DamageAttribution;
import dev.powerguard.command.AdminCommand;
import dev.powerguard.command.TeamCommand;
import dev.powerguard.gui.ChatPrompt;
import dev.powerguard.gui.MenuItems;
import dev.powerguard.gui.MenuListener;
import dev.powerguard.gui.MenuSounds;
import dev.powerguard.team.FriendlyFireListener;
import dev.powerguard.team.InviteManager;
import dev.powerguard.team.NameTagManager;
import dev.powerguard.team.TeamActions;
import dev.powerguard.team.TeamChat;
import dev.powerguard.team.TeamChestManager;
import dev.powerguard.team.TeamManager;
import dev.powerguard.team.TeamStorage;
import dev.powerguard.team.TeleportWarmup;
import org.bukkit.command.PluginCommand;
import org.bukkit.command.TabExecutor;
import org.bukkit.event.Listener;
import org.bukkit.plugin.java.JavaPlugin;

/** PowerGuard: teams and combat tagging. */
public final class PowerGuard extends JavaPlugin {

    private Messages messages;
    private TeamStorage storage;
    private TeamManager teams;
    private TeamActions teamActions;
    private InviteManager invites;
    private TeamChestManager teamChests;
    private TeamChat teamChat;
    private NameTagManager nameTags;
    private TeleportWarmup warmup;
    private CombatManager combat;
    private DamageAttribution attribution;
    private MenuListener menus;
    private MenuItems menuItems;
    private MenuSounds menuSounds;
    private ChatPrompt chatPrompt;
    private AdminAccess adminAccess;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        messages = new Messages(this);
        storage = new TeamStorage(this);
        teams = new TeamManager(this, storage);
        teamActions = new TeamActions(this);
        invites = new InviteManager(this);
        teamChests = new TeamChestManager(this);
        teamChat = new TeamChat(this);
        nameTags = new NameTagManager(this);
        warmup = new TeleportWarmup(this);
        combat = new CombatManager(this);
        attribution = new DamageAttribution(this);
        menus = new MenuListener(this);
        menuItems = new MenuItems(this);
        menuSounds = new MenuSounds(this);
        chatPrompt = new ChatPrompt(this);
        adminAccess = new AdminAccess(this);

        teams.load();
        invites.start();
        combat.start();

        register(adminAccess, nameTags, teamChests, teamChat, warmup, new FriendlyFireListener(this), attribution,
                new CombatListener(this), new CombatCommandBlocker(this), new CombatCooldowns(this),
                new CombatRestrictions(this), menus, chatPrompt);
        command("team", new TeamCommand(this));
        command("powerguard", new AdminCommand(this));

        adminAccess.applyAll();
        nameTags.applyAll();
    }

    @Override
    public void onDisable() {
        if (teams == null) {
            return;
        }
        menus.closeAll();
        teamChests.closeAll();
        warmup.cancelAll();
        combat.clearAll();
        teams.saveAll();
        storage.shutdown();
    }

    /** /pg reload: re-reads config.yml and re-applies everything that depends on it. */
    public void reload() {
        reloadConfig();
        menus.closeAll();
        teamChests.closeAll(); // chest size may have changed
        combat.reload();
        adminAccess.applyAll();
        nameTags.applyAll();
    }

    private void register(Listener... listeners) {
        for (Listener listener : listeners) {
            getServer().getPluginManager().registerEvents(listener, this);
        }
    }

    private void command(String name, TabExecutor executor) {
        PluginCommand command = getCommand(name);
        if (command != null) {
            command.setExecutor(executor);
            command.setTabCompleter(executor);
        }
    }

    public Messages messages() {
        return messages;
    }

    public TeamManager teams() {
        return teams;
    }

    public TeamActions teamActions() {
        return teamActions;
    }

    public InviteManager invites() {
        return invites;
    }

    public TeamChestManager teamChests() {
        return teamChests;
    }

    public TeamChat teamChat() {
        return teamChat;
    }

    public NameTagManager nameTags() {
        return nameTags;
    }

    public TeleportWarmup warmup() {
        return warmup;
    }

    public CombatManager combat() {
        return combat;
    }

    public DamageAttribution attribution() {
        return attribution;
    }

    public MenuListener menus() {
        return menus;
    }

    public MenuItems menuItems() {
        return menuItems;
    }

    public MenuSounds menuSounds() {
        return menuSounds;
    }

    public ChatPrompt chatPrompt() {
        return chatPrompt;
    }
}
