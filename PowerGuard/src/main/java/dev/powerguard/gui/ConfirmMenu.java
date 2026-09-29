package dev.powerguard.gui;

import dev.powerguard.PowerGuard;
import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;

/** A yes/no confirmation. */
public final class ConfirmMenu extends Menu {

    private final Runnable onConfirm;
    private final Runnable onCancel;

    public ConfirmMenu(PowerGuard plugin, Player viewer, Runnable onConfirm, Runnable onCancel) {
        super(plugin, viewer);
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
    }

    @Override
    protected int rows() {
        return 3;
    }

    @Override
    protected Component title() {
        return items().title("confirm");
    }

    @Override
    protected void draw() {
        set(11, items().item("confirm"), click -> {
            viewer.closeInventory();
            onConfirm.run();
        });
        set(15, items().item("cancel"), click -> onCancel.run());
    }
}
