package dev.powerguard.team;

/** Team ranks, highest first. */
public enum TeamRank {
    OWNER("Owner", "&6"),
    OFFICER("Officer", "&e"),
    MEMBER("Member", "&f");

    private final String displayName;
    private final String colorCode;

    TeamRank(String displayName, String colorCode) {
        this.displayName = displayName;
        this.colorCode = colorCode;
    }

    public String displayName() {
        return displayName;
    }

    public String colorCode() {
        return colorCode;
    }

    public boolean isAtLeast(TeamRank other) {
        return ordinal() <= other.ordinal();
    }

    public boolean isAbove(TeamRank other) {
        return ordinal() < other.ordinal();
    }

    public static TeamRank parse(String name, TeamRank fallback) {
        try {
            return valueOf(name.toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException e) {
            return fallback;
        }
    }
}
