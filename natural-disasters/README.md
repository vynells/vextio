# NaturalDisasters (Paper 1.21.8)

Realistic natural disasters with a full GUI: Earthquake, Meteor Shower, Blizzard, Drought, Tsunami, Flood.

## Build
Requires JDK 21 and Maven.
```
mvn clean package
```
Jar: `target/NaturalDisasters-1.0.0.jar` → drop into your Paper 1.21.8 `plugins/` folder.
(Requires **Paper** or a Paper fork like Purpur — not plain Spigot.)

## Commands (`/disaster`, aliases `/nd`, `/disasters`) — permission `disasters.admin` (op)
| Command | |
|---|---|
| `/disaster` or `/disaster gui` | Open the control panel |
| `/disaster start <type> [1-5] [player]` | Start a disaster |
| `/disaster stop [type]` | Stop all / one type |
| `/disaster random <on\|off\|now>` | Toggle / trigger random disasters |
| `/disaster list` | Active disasters |
| `/disaster reload` | Reload config |

Types: `earthquake, meteor_shower, blizzard, drought, tsunami, flood, zombie_apocalypse`.
`disasters.bypass` — player is never picked as a random target.

## Disasters
- **Earthquake** — dramatic on-screen countdown (flashing titles, siren, heartbeat, boss bar, foreshocks), then camera shake, ground heave, tearing fissures, shattering glass and collapsing man-made blocks. Level = magnitude.
- **Meteor Shower** — flaming meteors with fire/smoke/ember trails, craters of magma & blackstone, molten ejecta, shockwave rings, knockback, screen shake. L4+ ends with a giant meteor.
- **Blizzard** — sideways wind-driven snow, whiteout haze, freezing (vanilla freeze effect), wind push, snow piling up, lakes freezing. Stand near light (torches/fire) or indoors to stay warm.
- **Drought** — heat shimmer, dust devils, water evaporating, grass drying, crops dying, leaves falling, wildfires, hunger/heatstroke.
- **Tsunami** — no water spawns on you: a wave is built row by row from the horizon, water rises as it rolls in, followed by a surge. Level 1–5 changes height (7–23m + surge), width, speed, and what it destroys. Terrain higher than the wave stays dry.
- **Flood** — torrential rain, lightning, water table rising block by block in low areas, currents dragging entities.

Tsunami/Flood water recedes after `recede-after-seconds` (set `-1` to keep it forever). All placed water is tracked and removed cleanly. Tune lag with `block-budget-per-tick`.

## Zombie Apocalypse
Waves of elemental undead (waves = 2 + level). Each zombie has dyed armor, an element block on its head and an elemental aura:
- **Pyromancer** (fire): fireballs, flame nova ring. Always on fire.
- **Tidecaller** (water): water blast with huge knockback, drowning whirlpool.
- **Stormwalker** (wind): wind blades that launch you, cyclone that lifts and flings.
- **Stonebreaker** (earth): huge and tanky; ground slam shockwave, boulder throw.
- **Voltbringer** (lightning): chain lightning that jumps between players.
- **The Undying Warlord** (final wave boss): giant, glowing, casts every element, has a boss bar. Drops netherite + a totem.
