# PowerGuard

A teams system and a combat-tag system in one plugin, for **Paper 26.3** (also runs on 1.21.11).

- Built against `io.papermc.paper:paper-api:1.21.11-R0.1-SNAPSHOT`, `api-version: '1.21'`, Java 21 bytecode. It runs on Java 25.
- The 26.x Paper API does exist (`ver/26.1.2`, `ver/26.2` and `main` on PaperMC's GitHub), but it's compiled for Java 25, and your JDK 21 can't compile against it. Paper 26.3 loads `api-version: '1.21'` plugins normally.
- It has no dependencies. Citizens NPCs are recognised through the standard `NPC` metadata, so Citizens doesn't need to be present.

---

## Install

1. Stop the server.
2. Copy `PowerGuard.jar` into `plugins/`.
3. Start the server. PowerGuard creates `plugins/PowerGuard/config.yml`.
4. Edit `config.yml` if you want, then run `/pg reload`. You don't need to restart.

### Build it yourself

```
cd PowerGuard
mvn clean package
```

The jar is written to `target/PowerGuard.jar`. It needs JDK 21+ and Maven 3.9. Maven fetches the API from `https://repo.papermc.io/repository/maven-public/`.

### Files

| File | Contents |
|---|---|
| `plugins/PowerGuard/config.yml` | All settings, messages and GUI items |
| `plugins/PowerGuard/teams/<team-id>.yml` | One file per team: name, colour, members and ranks, friendly fire, home, warps, ender-chest items |
| `plugins/PowerGuard/exempt.yml` | Players exempted from combat tagging |

Teams are saved every time they change: member changes, settings, homes, warps, and every click in the team ender chest. They're also saved on shutdown. Writes go through a temp file followed by an atomic rename, so a crash can't leave a half-written team file.

---

## Commands

### Player: `/team` (alias `/t`)

Every subcommand and argument is tab-completed. None of them work while you are in combat.

| Command | What it does | Who can use it (default) |
|---|---|---|
| `/team` | Opens the team menu. Players without a team get the Create / Invites menu. | everyone |
| `/team help` | Lists the commands | everyone |
| `/team create <name>` | Creates a team | anyone not in a team |
| `/team disband` then `/team disband confirm` | Deletes the team. You must confirm within 15s. Ender chest items go to the owner's inventory, and anything that doesn't fit drops at their feet. | Owner |
| `/team leave` | Leaves the team. The owner has to transfer or disband first. | Member+ |
| `/team invite <player>` | Invites an online player who has no team. The invite expires after `invite-expire-seconds`. | `invite` rank |
| `/team accept [team]` / `/team deny [team]` | Answers an invite. The team name is only needed when you have more than one invite. | invited player |
| `/team kick <player>` | Removes a member ranked below you | `kick` rank |
| `/team promote <player>` | Member → Officer | Owner |
| `/team demote <player>` | Officer → Member | Owner |
| `/team transfer <player>` | Makes that member the owner. The old owner becomes an Officer. | Owner |
| `/team sethome` / `/team home` | Sets the team home / teleports there after the warm-up | `sethome` / `home` rank |
| `/team setwarp <name>` | Sets or moves a warp. Max `max-warps` per team (default 4). | `setwarp` rank |
| `/team warp <name>` | Teleports to a warp after the warm-up | `warp` rank |
| `/team delwarp <name>` | Deletes a warp | `delwarp` rank |
| `/team warps` | Lists the warps | Member+ |
| `/team echest` | Opens the shared team ender chest | `echest` rank |
| `/team info [team]` | Shows info for your team or any other team | everyone |
| `/team list` | Lists all teams | everyone (also works from the console) |
| `/team chat` | Toggles team-only chat | `powerguard.team.chat` |
| `@t <msg>` or `!<msg>` | Sends one message to team chat. The prefixes are configurable. | `powerguard.team.chat` |
| `/team rename <name>` | Renames the team | `rename` rank |
| `/team friendlyfire <on\|off>` | Toggles friendly fire (off by default) | `friendlyfire` rank |
| `/team color <colour>` | Sets the team colour | `color` rank |

Short aliases: `accept`/`join`, `deny`/`decline`, `echest`/`ec`/`enderchest`, `chat`/`c`, `friendlyfire`/`ff`, `color`/`colour`.

### Admin: `/powerguard` (alias `/pg`)

| Command | What it does |
|---|---|
| `/pg reload` | Reloads `config.yml` and applies it immediately: messages, GUI, cooldowns, blocked commands, boss bar style, name tags, chest size and the admin list |
| `/pg combat <player>` | Shows combat status: seconds left, opponents, exempt or not |
| `/pg untag <player>` | Removes a player's combat tag |
| `/pg exempt <player>` | Toggles exemption from combat tagging. The setting is saved. |
| `/pg team <name> info` | Shows team info |
| `/pg team <name> disband` | Disbands a team. If you run it in-game, the ender chest items go to you. |
| `/pg team <name> kick <player>` | Removes a member (not the owner) |

---

## Permissions

| Permission | Default | Meaning |
|---|---|---|
| `powerguard.team` | everyone | Use `/team` and the menu |
| `powerguard.team.create` | everyone | Create teams |
| `powerguard.team.chat` | everyone | Use team chat |
| `powerguard.admin` | op | All `/pg` commands, `/pg` works in combat, and you can see team chat (spy). Includes the three permissions above. |
| `powerguard.bypass.commands` | nobody | Use blocked commands while in combat. (Team commands stay blocked in combat for everyone.) |
| `powerguard.bypass.cooldowns` | nobody | Ignore the pearl, trident and lunge cooldowns |
| `powerguard.bypass.warmup` | nobody | `/team home` and `/team warp` are instant |

**Haidak:** everyone listed under `admins:` in `config.yml` gets `powerguard.admin` when they join, even without op. `Haidak` is in that list by default. The match is on the player's name, which is only trustworthy on an online-mode server or behind a proxy that authenticates players.

In-team rights (invite, kick, home and so on) come from **rank**, not permissions. See `teams.rank-permissions` below.

---

## How combat works

- **Tagging.** You're tagged when you damage a player or a player damages you. PowerGuard takes the responsible player from the damage source. This covers:
  - melee, including spears
  - arrows, tridents, snowballs and eggs, splash and lingering potions, fireworks, wind charges
  - TNT lit by a player (the TNT's source) and end crystals (vanilla credits the player who broke the crystal)
  - respawn anchors and beds: vanilla credits these explosions to nobody, so PowerGuard remembers who right-clicked the block and credits the explosion to them for `explosion-attribution-seconds`
  - **Powers abilities:** any damage where a player is the causing entity
  - Citizens NPCs never tag anyone and are never tagged.
- **Friendly fire.** When it's off, teammates can't hurt each other at all. Their melee, projectile, explosion and Powers damage is cancelled before tagging happens, so they don't tag each other either. Harmful splash and lingering potions skip teammates too.
- **Duration.** 20s by default. Every hit resets it. The countdown shows in the action bar and/or a boss bar.
- **While tagged:**
  - Every team command and team menu is blocked. An open team menu or team ender chest closes the moment you're tagged, and a pending home/warp teleport is cancelled.
  - The blocked commands (or everything outside the whitelist) are refused. See **Command blocking** below.
  - The cooldowns apply, plus Elytra and Chorus Fruit blocking if you turned those on.
- **Tag ends** when the timer runs out or on death. When a player dies, their tag clears. Each opponent they were fighting is untagged too, unless that opponent is still fighting someone else.
- **Combat logging.** If you disconnect while tagged, you're killed. Items and XP drop at the logout spot through a normal death, so keepInventory and grave plugins work as usual. Then the broadcast is sent. You are **not** killed when:
  - you were kicked (by an admin, FairPlay or anything else)
  - the server is stopping or restarting
  - you timed out and `punish-timeouts` is `false`

### Command blocking

- Commands are matched by the typed label, the label without its namespace (`minecraft:tp` → `tp`, `essentials:home` → `home`), and the real command's name and every alias. So `/etp`, `/essentials:tpa` and similar are caught too.
- Two modes:
  - `BLACKLIST`: block what's listed in `blocked`.
  - `WHITELIST`: allow only what's listed in `allowed`.
- `/team` is always blocked in combat. `/pg` always works for admins.

---

## Config reference (`config.yml`)

Colour codes use `&` (for example `&a`, `&l`). Hex colours are written `&#RRGGBB`. Change anything, then run `/pg reload`.

### General

| Key | Default | Meaning |
|---|---|---|
| `admins` | `[Haidak]` | Player names that always get `powerguard.admin` |

### Teams: `teams.*`

| Key | Default | Meaning |
|---|---|---|
| `name-min-length` / `name-max-length` | 3 / 16 | Allowed team-name length |
| `name-pattern` | `^[A-Za-z0-9_]+$` | Regex a team name must match |
| `max-members` | 10 | Maximum members per team |
| `max-warps` | 4 | Maximum warps per team |
| `invite-expire-seconds` | 120 | Invite lifetime |
| `default-color` | `aqua` | Colour of new teams (any of the 16 chat colours) |
| `friendly-fire-default` | `false` | Friendly fire setting for new teams |
| `echest-rows` | 3 | Team ender chest size, 1–6 rows. Shrinking it never deletes items: they stay in the save file and come back if you grow it again. |
| `teleport.warmup-seconds` | 3 | Warm-up for `/team home` and `/team warp`. 0 = instant. |
| `teleport.cancel-on-move` | `true` | Moving to another block cancels the warm-up |
| `teleport.cancel-on-damage` | `true` | Taking damage cancels the warm-up |
| `teleport.countdown-display` | `TITLE` | `TITLE`, `ACTIONBAR` or `BOTH` |
| `chat.prefixes` | `['@t ', '!']` | Prefixes that send one message to team chat |
| `chat.format` | see file | Team chat format. Placeholders: `{color} {team} {rank_symbol} {player} {message}` |
| `chat.spy-permission` | `powerguard.admin` | People with this permission also see team chat. Empty = off. |
| `nametags.chat` | `true` | Show `[TAG]` before names in chat |
| `nametags.tablist` | `true` | Show `[TAG]` before names in the tab list |
| `nametags.format` | `{color}[{team}] ` | Tag format |
| `rank-permissions.<action>` | see file | Minimum rank (`OWNER`, `OFFICER`, `MEMBER`) for `invite, kick, sethome, home, setwarp, delwarp, warp, echest, rename, friendlyfire, color` |
| `rank-symbols.<RANK>` | `** / * / ''` | Symbol shown before names in team chat |

### Combat: `combat.*`

| Key | Default | Meaning |
|---|---|---|
| `duration-seconds` | 20 | Combat tag length. It resets on every hit. |
| `display.actionbar` | `true` | Countdown in the action bar |
| `display.bossbar` | `true` | Countdown boss bar |
| `display.bossbar-color` | `RED` | `PINK, BLUE, RED, GREEN, YELLOW, PURPLE, WHITE` |
| `display.bossbar-style` | `PROGRESS` | `PROGRESS, NOTCHED_6, NOTCHED_10, NOTCHED_12, NOTCHED_20` |
| `tag-sources.melee` / `projectiles` / `explosions` / `other` | all `true` | Which kinds of damage tag. `other` covers plugin damage such as Powers. |
| `explosion-attribution-seconds` | 3 | How long an anchor or bed click is remembered |
| `disabled-worlds` | `[]` | Worlds with no combat tagging |
| `commands.mode` | `BLACKLIST` | `BLACKLIST` or `WHITELIST` |
| `commands.blocked` | tp, teleport, tpa, tpaccept, tpahere, home, homes, spawn, warp, back, rtp, wild… | Blocked in blacklist mode |
| `commands.allowed` | msg, tell, r, me, list, pg… | Allowed in whitelist mode |
| `logout.kill` | `true` | Kill players who log out in combat |
| `logout.punish-timeouts` | `true` | Also kill players who time out |
| `logout.broadcast` | `true` | Broadcast `combat-logout-broadcast` |
| `cooldowns.only-in-combat` | `true` | `false` = the cooldowns also apply outside combat |
| `cooldowns.ender-pearl` | 4 | Seconds (decimals allowed). 0 = off. |
| `cooldowns.trident` | 5 | Covers both throwing and riptide |
| `cooldowns.lunge` | 4 | Spear Lunge dash |
| `restrictions.block-elytra` | `false` | No gliding or firework boosting in combat |
| `restrictions.block-chorus-fruit` | `false` | No Chorus Fruit in combat |

### Messages: `messages.*`

Every message the plugin sends is here. `prefix` is added in front of single-line messages automatically. Set a message to `''` to silence it. Multi-line messages are lists: `team-help`, `team-info` and `admin-help`.

The placeholders are listed next to each message in the file. The common ones are:

- `{player}`, `{team}`, `{color}` (the team's colour code), `{seconds}`, `{warp}`, `{rank}`, `{max}`, `{state}`
- `combat-logout-broadcast` uses `{player}`
- `team-info` uses `{owner} {online} {size} {officers} {members} {ff} {home} {warps}`

### GUI: `gui.*`

| Key | Meaning |
|---|---|
| `click-sound`, `error-sound`, `success-sound` | Namespaced sound keys, for example `minecraft:ui.button.click`. Empty = silent. |
| `filler`, `border` | Glass pane materials for the background and the border |
| `titles.<menu>` | Titles for `main, no-team, warps, members, member, invites, invite-player, received-invites, settings, color, confirm` |
| `items.<item>.material` / `name` / `lore` | Each button. Item names are never italic. Heads (members, invites) and colour icons use a fixed material, so only their name and lore are read. |

---

## Detection notes

### Trident throw and riptide

- **Throw:** Paper's `PlayerLaunchProjectileEvent` fires when a trident is launched. PowerGuard then puts `TRIDENT` on the vanilla item cooldown, so you see the normal cooldown overlay.
- **Riptide:** detected with Bukkit's `PlayerRiptideEvent`, and the same cooldown is applied.
- **Enforcement:** vanilla itself refuses to start using an item that's on cooldown, on both the client and the server. So during the cooldown you can't charge a throw or a riptide at all. As a backstop, a riptide that still reaches the server during the cooldown is cancelled.

### Ender pearl

Vanilla gives pearls a 1-second cooldown. PowerGuard uses Paper's `PlayerItemCooldownEvent` to stretch that cooldown to the configured length, so the overlay and the enforcement are vanilla's own.

### Lunge

Lunge has no Bukkit or Paper event. From Paper 1.21.11's server source:

- A spear jab runs the item's piercing attack.
- Lunge is an enchantment effect that runs after that attack and pushes the player forward.
- The push reaches the client as a velocity update, and Paper fires `PlayerVelocityEvent` for it.

PowerGuard treats it as a Lunge when both of these happen:

1. `PlayerArmSwingEvent` fires with the main hand while the main-hand item has the `minecraft:lunge` enchantment. The enchantment is looked up in the enchantment registry, so any spear with Lunge counts.
2. Within 2 ticks, a `PlayerVelocityEvent` pushes the player mainly in the direction they're looking.

When that happens:

- If the spear isn't on cooldown, it gets the configured vanilla item cooldown (overlay included).
- If a Lunge is attempted while the spear is on cooldown, the forward push is removed and the dash doesn't happen.

Side effects:

- The cooldown sits on the spear item, so the spear's hold-to-charge attack is also unavailable until it ends.
- If the client ignores item cooldowns for jabs, a blocked Lunge still spends the jab and its small hunger cost. Only the dash is removed.
- A Powers dash that happens in the same 2 ticks as a jab with a Lunge spear, in the direction you're looking, would be read as a Lunge. This is unlikely, but possible.

---

## What isn't configurable

- **Owner-only actions:** promote, demote, transfer and disband are always owner-only, and only the owner can make Officers. You asked for this.
- **Menu layout:** which slot each button sits in, and the 16 available team colours. Button materials, names, lore, titles and sounds are configurable.
- **Fixed values:**
  - the disband confirmation window (15 seconds)
  - warp names must be 1–16 letters, digits or `_`
  - the Lunge detection window (2 ticks)
  - how far from the explosion an anchor or bed click counts (2 blocks)
- **Combat features that can't be turned off:**
  - team commands are always blocked in combat
  - kicks are never punished as combat logging
  - players are never killed while the server is shutting down
