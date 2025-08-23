import React, { useState, useEffect } from 'react';
import { Sword, Zap, Droplets, Mountain, Wind, Orbit, Sparkles, Dice6 } from 'lucide-react';

const ElementalistSheet = () => {

  // Hook auxiliar para sincronizar un estado con localStorage
  const LS_PREFIX = "elementalist.";

  const usePersistedState = (key, defaultValue) => {
    const fullKey = LS_PREFIX + key;

    const [state, setState] = React.useState(() => {
      try {
        const saved = localStorage.getItem(fullKey);
        return saved !== null ? JSON.parse(saved) : defaultValue;
      } catch {
        return defaultValue;
      }
    });

    React.useEffect(() => {
      try {
        localStorage.setItem(fullKey, JSON.stringify(state));
      } catch {
        /* no-op */
      }
    }, [fullKey, state]);

    return [state, setState];
  };

  // Character stats
  const [level, setLevel] = usePersistedState("level", 8);
  const [proficiencyBonus, setProficiencyBonus] = usePersistedState("proficiencyBonus", 3);
  const [wisdomMod, setWisdomMod] = usePersistedState("wisdomMod", 4);
  const [dexMod, setDexMod] = usePersistedState("dexMod", 4);
  const [spellAttackBonus, setSpellAttackBonus] = usePersistedState("spellAttackBonus", 12);
  const [spellSaveDC, setSpellSaveDC] = usePersistedState("spellSaveDC", 20);
  
  // Attack results
  const [attackResult, setAttackResult] = useState(null);
  
  // Elemental Communion state
  const [activeElement, setActiveElement] = usePersistedState("activeElement", null);
  const [communionDuration, setCommunionDuration] = usePersistedState("communionDuration", null);
  const [usedElements, setUsedElements] = usePersistedState("usedElements", []);
  
  // Morphblade state
  const [installedOrbs, setInstalledOrbs] = usePersistedState("installedOrbs", ["air","earth"]);
  const [activeOrb, setActiveOrb] = usePersistedState("activeOrb", "air");
  const [weaponForm, setWeaponForm] = usePersistedState("weaponForm", "sword");
  const [bladeSeparated, setBladeSeparated] = usePersistedState("bladeSeparated", false);
  const [hammerGrip, setHammerGrip] = usePersistedState("hammerGrip", "one-handed");
  
  // Pendant state
  const [pendantCharges, setPendantCharges] = usePersistedState("pendantCharges", 8);
  const [pendantState, setPendantState] = usePersistedState("pendantState", "dormant");
  
  // Wild Shape state
  const maxWildShapeUses = level >= 17 ? 4 : level >= 6 ? 3 : 2;
  const [wildShapeUses, setWildShapeUses] = usePersistedState("wildShapeUses", maxWildShapeUses);
  const [wildResurgenceUsed, setWildResurgenceUsed] = usePersistedState("wildResurgenceUsed", false);
  
  // Spell slots state
  const [spellSlots, setSpellSlots] = usePersistedState("spellSlots", {
    1: { max: 0, current: 0 },
    2: { max: 0, current: 0 },
    3: { max: 0, current: 0 },
    4: { max: 0, current: 0 },
    5: { max: 0, current: 0 },
    6: { max: 0, current: 0 },
    7: { max: 0, current: 0 },
    8: { max: 0, current: 0 },
    9: { max: 0, current: 0 }
  });
  
  // Modal state
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [showCastModal, setShowCastModal] = useState(false);
  const [spellToCast, setSpellToCast] = useState(null);

  const requestCast = (spellName) => {
    if (isPendantSpell(spellName)) {
      const { min, max } = getPendantChargeRange(spellName);

      // ¿Tiene definición de coste por cargas?
      if (min > 0 && max >= min) {
        // ¿Hay cargas mínimas?
        if (pendantCharges < min) {
          // Fallback: abrir modal de slots
          setSpellToCast(spellName);
          setShowCastModal(true);
          return;
        }

        // Elegir nº de cargas (si hay rango)
        let chosen = min;
        if (min !== max) {
          const resp = window.prompt(
            `${spellName} (${min}-${max} cargas).\n` +
            `Tienes ${pendantCharges} cargas.\n` +
            `¿Cuántas cargas quieres gastar?`,
            String(min)
          );
          if (resp === null) return; // cancelado
          chosen = parseInt(resp, 10);
          if (!Number.isFinite(chosen)) {
            alert('Entrada no válida.');
            return;
          }
        }

        // Validaciones
        if (chosen < min || chosen > max) {
          alert(`Debes gastar entre ${min} y ${max} cargas para ${spellName}.`);
          return;
        }
        if (pendantCharges < chosen) {
          alert(`No tienes suficientes cargas: necesitas ${chosen}, tienes ${pendantCharges}.`);
          return;
        }

        // Lanzar por cargas: pasa nivel base como slotLevel (no se gasta) y chosen como 3er parámetro
        const baseLevel = getSpellLevel(spellName) || 1; // 0 si es cantrip
        castSpell(spellName, baseLevel, chosen);
        return; // NO abrimos modal
      }
      // Si no hay coste definido, fluye a slots
    }

    // Flujo normal (slots): abre el modal
    setSpellToCast(spellName);
    setShowCastModal(true);
  };

  const elements = {
    fire: { 
      name: 'Fuego', 
      icon: <Zap className="w-4 h-4" />, 
      color: 'text-red-500',
      spells: {
        3: ['Control Flames', 'Searing Smite', 'Scorching Ray'],
        5: ['Fireball'],
        7: ['Wall of Fire'],
        9: ['Immolation']
      },
      affinity: 'Luz brillante en 10 pies y tenue en 10 pies adicionales',
      embodiment: 'Ventaja en ataques contra criaturas en el radio de luz brillante',
      minLevel: 3
    },
    air: { 
      name: 'Aire', 
      icon: <Wind className="w-4 h-4" />, 
      color: 'text-blue-400',
      spells: {
        3: ['Gust', 'Thunderous Smite', 'Warding Wind'],
        5: ['Lightning Bolt'],
        7: ['Storm Sphere'],
        9: ['Control Winds']
      },
      affinity: 'Resistencia a daño por caída y reduces caída por 5 × nivel druida',
      embodiment: 'Velocidad de vuelo igual a tu velocidad de movimiento y puedes flotar',
      minLevel: 3
    },
    water: { 
      name: 'Agua', 
      icon: <Droplets className="w-4 h-4" />, 
      color: 'text-blue-600',
      spells: {
        3: ['Shape Water', "Spring's Touch", "Rime's Binding Ice"],
        5: ['Riptides'],
        7: ['Control Water'],
        9: ['Maelstrom']
      },
      affinity: 'Velocidad de nado igual a tu velocidad y respiras bajo el agua',
      embodiment: 'Curación adicional igual a 2 + nivel del slot de hechizo',
      minLevel: 3
    },
    earth: { 
      name: 'Tierra', 
      icon: <Mountain className="w-4 h-4" />, 
      color: 'text-yellow-600',
      spells: {
        3: ['Mold Earth', 'Earth Shield', 'Earthen Grasp'],
        5: ['Erupting Earth'],
        7: ['Stoneskin'],
        9: ['Wall of Stone']
      },
      affinity: 'Puedes moverte por terrenos difíciles, ya sea de tierra o de piedra, sin gastar movimiento extra.',
      embodiment: 'Tu CA aumenta en 2',
      minLevel: 3
    },
    aether: { 
      name: 'Prismatic', 
      icon: <Sparkles className="w-4 h-4" />, 
      color: 'text-purple-500',
      spells: {
        3: ['Sorcerous Burst', 'Absorb Elements', "Dragon's Breath"],
        5: ['Protection from Energy', 'Aether Catalyst'],
        7: ['Conjure Elemental Guardians'],
        9: ['Wrath of the Elements']
      },
      affinity: 'Al comienzo de cada turno, elige Fuego, Aire, Agua o Tierra. Obtienes el beneficio de Elemental Affinity de ese elemento hasta el comienzo de tu siguiente turno.',
      embodiment: 'Al comienzo de cada turno, elige Fuego, Aire, Agua o Tierra. Obtienes el beneficio de Elemental Embodiment de ese elemento hasta el comienzo de tu siguiente turno.',
      minLevel: 3
    },
    time: { 
      name: 'Aether', 
      icon: <Orbit className="w-4 h-4" />,  
      color: 'text-indigo-500',
      spells: {
        3: ['Mind Sliver', 'Aether Overflow', "Ethereal Immolation"],
        5: ['Counterspell'],
        7: ['Spelltrap'],
        9: ['Circle of Power']
      },
      affinity: 'Al impactar a una criatura con un ataque cuerpo a cuerpo, esta tiene desventaja en las pruebas de concentración hasta el comienzo de tu siguiente turno (incluida la prueba provocada por este ataque).',
      embodiment: 'Tienes ventaja en las tiradas de salvación contra hechizos y otros efectos mágicos. Además, cuando realizas una tirada de salvación contra un hechizo o efecto mágico que inflige la mitad del daño si la superas, no recibes daño si la superas.',
      minLevel: 10
    },
  };

  const spellDatabase = {
    "Control Flames": {
      level: "Cantrip",
      school: "Transmutation",
      castingTime: "Action",
      range: "60 feet",
      components: "S",
      duration: "Instantaneous or 1 hour",
      description: "You choose nonmagical flame that you can see within range and that fits within a 5-foot cube. You affect it in one of the following ways:\n\n• You instantaneously expand the flame 5 feet in one direction, provided that wood or other fuel is present in the new location.\n• You instantaneously extinguish the flames within the cube.\n• You double or halve the area of bright light and dim light cast by the flame, change its color, or both. The change lasts for 1 hour.\n• You cause simple shapes—such as the vague form of a creature, an inanimate object, or a location—to appear within the flames and animate as you like. The shapes last for 1 hour.\n\nIf you cast this spell multiple times, you can have up to three non-instantaneous effects created by it active at a time, and you can dismiss such an effect as an action."
    },
    "Searing Smite": {
      level: "1st",
      school: "Evocation",
      castingTime: "Bonus action, which you take immediately after hitting a target with a Melee weapon or an Unarmed Strike",
      range: "Self",
      components: "V",
      duration: "1 minute",
      description: "As you hit the target, it takes an extra 1d6 Fire damage from the attack. At the start of each of its turns until the spell ends, the target takes 1d6 Fire damage and then makes a Constitution saving throw. On a failed save, the spell continues. On a successful save, the spell ends.\n\nUsing a Higher-Level Spell Slot. All the damage increases by 1d6 for each spell slot level above 1."
    },
    "Speak with Animals": {
      level: "1st",
      school: "Divination",
      castingTime: "Action or Ritual",
      range: "Self",
      components: "V, S",
      duration: "10 minutes",
      description: "For the duration, you can comprehend and verbally communicate with Beasts, and you can use any of the Influence action's skill options with them.\n\nMost Beasts have little to say about topics that don't pertain to survival or companionship, but at minimum, a Beast can give you information about nearby locations and monsters, including whatever it has perceived within the past day."
    },
    "Scorching Ray": {
      level: "2nd",
      school: "Evocation",
      castingTime: "Action",
      range: "120 feet",
      components: "V, S",
      duration: "Instantaneous",
      description: "You hurl three fiery rays. You can hurl them at one target within range or at several. Make a ranged spell attack for each ray. On a hit, the target takes 2d6 Fire damage.\n\nUsing a Higher-Level Spell Slot. You create one additional ray for each spell slot level above 2."
    },
    "Fireball": {
      level: "3rd",
      school: "Evocation", 
      castingTime: "Action",
      range: "150 feet",
      components: "V, S, M (a ball of bat guano and sulfur)",
      duration: "Instantaneous",
      description: "A bright streak flashes from you to a point you choose within range and then blossoms with a low roar into a fiery explosion. Each creature in a 20-foot-radius Sphere centered on that point makes a Dexterity saving throw, taking 8d6 Fire damage on a failed save or half as much damage on a successful one.\n\nFlammable objects in the area that aren't being worn or carried start burning.\n\nUsing a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 3."
    },
    "Gust": {
      level: "Cantrip",
      school: "Transmutation",
      castingTime: "Action",
      range: "30 feet",
      components: "V, S",
      duration: "Instantaneous",
      description: "You seize the air and compel it to create one of the following effects at a point you can see within range:\n\n• One Medium or smaller creature that you choose must succeed on a Strength saving throw or be pushed up to 5 feet away from you.\n• You create a small blast of air capable of moving one object that is neither held nor carried and that weighs no more than 5 pounds. The object is pushed up to 10 feet away from you. It isn't pushed with enough force to cause damage.\n• You create a harmless sensory effect using air, such as causing leaves to rustle, wind to slam shutters closed, or your clothing to ripple in a breeze."
    },
    "Shape Water": {
      level: "Cantrip",
      school: "Transmutation",
      castingTime: "Action",
      range: "30 feet",
      components: "S",
      duration: "Instantaneous or 1 hour",
      description: "You choose an area of water that you can see within range and that fits within a 5-foot cube. You manipulate it in one of the following ways:\n\n• You instantaneously move or otherwise change the flow of the water as you direct, up to 5 feet in any direction. This movement doesn't have enough force to cause damage.\n• You cause the water to form into simple shapes and animate at your direction. This change lasts for 1 hour.\n• You change the water's color or opacity. The water must be changed in the same way throughout. This change lasts for 1 hour.\n• You freeze the water, provided that there are no creatures in it. The water unfreezes in 1 hour.\n\nIf you cast this spell multiple times, you can have no more than two of its non-instantaneous effects active at a time, and you can dismiss such an effect as an action."
    },
    "Mold Earth": {
      level: "Cantrip",
      school: "Transmutation",
      castingTime: "Action",
      range: "30 feet",
      components: "S",
      duration: "Instantaneous or 1 hour",
      description: "You choose a portion of dirt or stone that you can see within range and that fits within a 5-foot cube. You manipulate it in one of the following ways:\n\n• If you target an area of loose earth, you can instantaneously excavate it, move it along the ground, and deposit it up to 5 feet away. This movement doesn't involve enough force to cause damage.\n• You cause shapes, colors, or both to appear on the dirt or stone, spelling out words, creating images, or shaping patterns. The changes last for 1 hour.\n• If the dirt or stone you target is on the ground, you cause it to become difficult terrain. Alternatively, you can cause the ground to become normal terrain if it is already difficult terrain. This change lasts for 1 hour.\n\nIf you cast this spell multiple times, you can have no more than two of its non-instantaneous effects active at a time, and you can dismiss such an effect as an action."
    },
    "Sorcerous Burst": {
      level: "Cantrip",
      school: "Evocation",
      castingTime: "Action",
      range: "120 feet",
      components: "V, S", 
      duration: "Instantaneous",
      description: "You cast sorcerous energy at one creature or object within range. Make a ranged attack roll against the target. On a hit, the target takes 1d8 damage of a type you choose: Acid, Cold, Fire, Lightning, Poison, Psychic, or Thunder.\n\nIf you roll an 8 on a d8 for this spell, you can roll another d8, and add it to the damage. When you cast this spell, the maximum number of these d8s you can add to the spell's damage equals your spellcasting ability modifier.\n\nCantrip Upgrade. The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8)."
    },
    "Lightning Bolt": {
      level: "3rd",
      school: "Evocation",
      castingTime: "Action",
      range: "Self",
      components: "V, S, M (a bit of fur and a crystal rod)",
      duration: "Instantaneous",
      description: "A stroke of lightning forming a 100-foot-long, 5-foot-wide Line blasts out from you in a direction you choose. Each creature in the Line makes a Dexterity saving throw, taking 8d6 Lightning damage on a failed save or half as much damage on a successful one.\n\nUsing a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 3."
    },
    "Slow": {
      level: "3rd",
      school: "Transmutation",
      castingTime: "Action",
      range: "120 feet",
      components: "V, S, M (a drop of molasses)",
      duration: "Concentration, up to 1 minute",
      description: "You alter time around up to six creatures of your choice in a 40-foot Cube within range. Each target must succeed on a Wisdom saving throw or be affected by this spell for the duration.\n\nAn affected target's Speed is halved, it takes a -2 penalty to AC and Dexterity saving throws, and it can't take Reactions. On its turns, it can take either an action or a Bonus Action, not both, and it can make only one attack if it takes the Attack action. If it casts a spell with a Somatic component, there is a 25 percent chance the spell fails as a result of the target making the spell's gestures too slowly.\n\nAn affected target repeats the save at the end of each of its turns, ending the spell on itself on a success."
    },
    "Telekinesis": {
      level: "5th",
      school: "Transmutation",
      castingTime: "Action",
      range: "60 feet",
      components: "V, S",
      duration: "Concentration, up to 10 minutes",
      description: "You gain the ability to move or manipulate creatures or objects by thought. When you cast the spell, and as your action each round for the duration, you can exert your will on one creature or object that you can see within range, causing the appropriate effect below. You can affect the same target round after round, or choose a new one at any time. If you switch targets, the prior target is no longer affected by the spell.\n\nCreature. You can try to move a Huge or smaller creature. Make an ability check with your spellcasting ability contested by the creature's Strength check. If you win the contest, you move the creature up to 30 feet in any direction, including upward but not beyond the range of this spell. Until the end of your next turn, the creature is restrained in your telekinetic grip.\n\nObject. You can try to move an object that weighs up to 1,000 pounds. If the object isn't being worn or carried, you automatically move it up to 30 feet in any direction, but not beyond the range of this spell. You can exert fine control on objects with your telekinetic grip, such as manipulating a simple tool, opening a door or a container, stowing or retrieving an item from an open container, or pouring the contents from a vial."
    },
    "Wall of Fire": {
      level: "4th",
      school: "Evocation",
      castingTime: "Action",
      range: "120 feet",
      components: "V, S, M (a piece of charcoal)",
      duration: "Concentration, up to 1 minute",
      description: "You create a wall of fire on a solid surface within range. You can make the wall up to 60 feet long, 20 feet high, and 1 foot thick, or a ringed wall up to 20 feet in diameter, 20 feet high, and 1 foot thick. The wall is opaque and lasts for the duration.\n\nWhen the wall appears, each creature in its area makes a Dexterity saving throw, taking 5d8 Fire damage on a failed save or half as much damage on a successful one.\n\nOne side of the wall, selected by you when you cast this spell, deals 5d8 Fire damage to each creature that ends its turn within 10 feet of that side or inside the wall. A creature takes the same damage when it enters the wall for the first time on a turn or ends its turn there. The other side of the wall deals no damage.\n\nUsing a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 4."
    },
    "Immolation": {
      level: "5th",
      school: "Evocation",
      castingTime: "Action",
      range: "90 feet",
      components: "V",
      duration: "Concentration, up to 1 minute",
      description: "Flames wreathe one creature you can see within range. The target must make a Dexterity saving throw. It takes 8d6 fire damage on a failed save, or half as much damage on a successful one.\n\nOn a failed save, the target also burns for the spell's duration. The burning target sheds bright light in a 30-foot radius and dim light for an additional 30 feet. At the end of each of its turns, the target repeats the saving throw. It takes 4d6 fire damage on a failed save, and the spell ends on a successful one.\n\nThese magical flames can't be extinguished by nonmagical means. If damage from this spell kills a target, the target is turned to ash."
    },
    "Thunderous Smite": {
      level: "1st",
      school: "Evocation",
      castingTime: "Bonus Action, which you take immediately after hitting a target with a Melee weapon or an Unarmed Strike",
      range: "Self",
      components: "V",
      duration: "Instantaneous",
      description: "Your strike rings with thunder that is audible within 300 feet of you, and the target takes an extra 2d6 Thunder damage from the attack. Additionally, if the target is a creature, it must succeed on a Strength saving throw or be pushed 10 feet away from you and have the Prone condition.\n\nUsing a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 1."
    },
    "Warding Wind": {
      level: "2nd",
      school: "Evocation",
      castingTime: "Action",
      range: "Self",
      components: "V",
      duration: "Concentration, up to 10 minutes",
      description: "A strong wind (20 miles per hour) blows around you in a 10-foot radius and moves with you, remaining centered on you. The wind lasts for the spell's duration.\n\n• It deafens you and other creatures in its area.\n• It extinguishes unprotected flames in its area that are torch-sized or smaller.\n• It hedges out vapor, gas, and fog that can be dispersed by strong wind.\n• The area is difficult terrain for creatures other than you.\n• The attack rolls of ranged weapon attacks have disadvantage if they pass in or out of the wind."
    },
    "Storm Sphere": {
      level: "4th",
      school: "Evocation",
      castingTime: "Action",
      range: "150 feet",
      components: "V, S",
      duration: "Concentration, up to 1 minute",
      description: "A 20-foot-radius sphere of whirling air springs into existence centered on a point you choose within range. The sphere remains for the spell's duration. Each creature in the sphere when it appears or that ends its turn there must succeed on a Strength saving throw or take 2d6 bludgeoning damage. The sphere's space is difficult terrain.\n\nUntil the spell ends, you can use a bonus action on each of your turns to cause a bolt of lightning to leap from the center of the sphere toward one creature you choose within 60 feet of the center. Make a ranged spell attack. You have advantage on the attack roll if the target is in the sphere. On a hit, the target takes 4d6 lightning damage.\n\nCreatures within 30 feet of the sphere have disadvantage on Wisdom (Perception) checks made to listen.\n\nAt Higher Levels. When you cast this spell using a spell slot of 5th level or higher, the damage increases for each of its effects by 1d6 for each slot level above 4th."
    },
    "Elemental Manifestation": {
      level: "4th",
      school: "Conjuration",
      castingTime: "Action",
      range: "60 feet",
      components: "V, S",
      duration: "Concentration, up to 10 minutes",
      description: "You summon an elemental of flame, frost, or storm (chosen when you cast the spell). It manifests in an unoccupied space you can see within range and uses the Elemental Manifestation stat block. The form you choose determines certain details in its stat block. The creature disappears when it drops to 0 Hit Points or when the spell ends.\n\nThe creature is an ally to you and your allies. In combat, the creature shares your Initiative count, but it takes its turn immediately after yours. It obeys your verbal commands (no action required by you). If you don't issue any, it takes the Dodge action and uses its movement to avoid danger.\n\nAt Higher Levels. Use the spell slot's level for the spell's level in the stat block.\n\nELEMENTAL MANIFESTATION\nLarge Elemental, Unaligned\n\nAC: 11 + the spell's level\nHP: 30 + 10 for each spell level above 4\nSpeed: 40 ft., Climb 40 ft., Fly 40 ft. (Storm only)\nInitiative: +1\n\nStr 17 (+3), Dex 13 (+1), Con 15 (+2), Int 4 (-3), Wis 14 (+2), Cha 3 (-4)\n\nSenses: Darkvision 60 ft., Passive Perception 12\nLanguages: Understands the languages you know\nCR: None (PB equals your Proficiency Bonus)\n\nTraits:\n• Elemental Grip: The elemental can climb difficult surfaces, including along ceilings, without needing to make an ability check.\n\nActions:\n• Multiattack: The elemental makes a number of attacks equal to half this spell's level (round down).\n• Elemental Strike: Melee Attack Roll: Bonus equals your spell attack modifier, reach 10 ft. Hit: 1d6 + 3 + the spell's level cold (Frost only), Fire (Flame only), or Lightning (Storm only) damage plus 1d4 damage of the same type.\n• Frost Bolt (Frost Only): Ranged Attack Roll: Bonus equals your spell attack modifier, range 60 ft. Hit: 1d10 + 3 + the spell's level cold damage, and the target's Speed is reduced to 0 until the start of the elemental's next turn.\n\nBonus Actions:\n• Overheat (Flame Only): Constitution Saving Throw: Your spell save DC, one creature the elemental can see within 10 feet. Failure: The target has the Poisoned condition until the start of the elemental's next turn."
    },
    "Molten Earth Tendril": {
      level: "4th",
      school: "Conjuration",
      castingTime: "Bonus action",
      range: "60 feet",
      components: "V, S",
      duration: "Concentration, up to 1 minute",
      description: "You conjure a tendril of molten earth that erupts from a surface in an unoccupied space that you can see within range. The tendril lasts for the duration.\n\nMake a melee spell attack against a creature within 30 feet of the tendril. On a hit, the target takes 4d8 Fire damage and is pulled up to 30 feet toward the tendril; if the target is Huge or smaller, it has the Grappled condition (escape DC equal to your spell save DC). The tendril can grapple only one creature at a time, and you can cause the tendril to release a Grappled creature (no action required).\n\nAs a Bonus Action on your later turns, you can repeat the attack against a creature within 30 feet of the tendril.\n\nAt Higher Levels. The number of creatures the tendril can grapple increases by one for each spell slot level above 4."
    },
    "Control Winds": {
      level: "5th",
      school: "Transmutation",
      castingTime: "Action",
      range: "300 feet",
      components: "V, S",
      duration: "Concentration, up to 1 hour",
      description: "You take control of the air in a 100-foot cube that you can see within range. Choose one of the following effects when you cast the spell. The effect lasts for the spell's duration, unless you use your action on a later turn to switch to a different effect. You can also use your action to temporarily halt the effect or to restart one you've halted.\n\n• Gusts. A wind picks up within the cube, continually blowing in a horizontal direction that you choose. You choose the intensity of the wind: calm, moderate, or strong. If the wind is moderate or strong, ranged weapon attacks that pass through it or that are made against targets within the cube have disadvantage on their attack rolls. If the wind is strong, any creature moving against the wind must spend 1 extra foot of movement for each foot moved.\n\n• Downdraft. You cause a sustained blast of strong wind to blow downward from the top of the cube. Ranged weapon attacks that pass through the cube or that are made against targets within it have disadvantage on their attack rolls. A creature must make a Strength saving throw if it flies into the cube for the first time on a turn or starts its turn there flying. On a failed save, the creature is knocked prone.\n\n• Updraft. You cause a sustained updraft within the cube, rising upward from the cube's bottom edge. Creatures that end a fall within the cube take only half damage from the fall. When a creature in the cube makes a vertical jump, the creature can jump up to 10 feet higher than normal."
    },
    "Spring's Touch": {
      level: "1st",
      school: "Abjuration",
      castingTime: "Action",
      range: "30 feet",
      components: "V, S, M (a drop of pure spring water)",
      duration: "Instantaneous",
      description: "You channel the purifying essence of a sacred spring toward a creature within range. The target regains 2d6 + your spellcasting ability modifier hit points.\n\nAt Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 2d6 for each slot level above 1st."
    },
    "Rime's Binding Ice": {
      level: "2nd",
      school: "Evocation",
      castingTime: "Action",
      range: "Self (30-foot cone)",
      components: "S, M (a vial of meltwater)",
      duration: "Instantaneous",
      description: "A burst of cold energy emanates from you in a 30-foot cone. Each creature in that area must make a Constitution saving throw. On a failed save, a creature takes 3d8 cold damage and is hindered by ice formations for 1 minute, or until it or another creature within reach of it uses an action to break away the ice. A creature hindered by ice has its speed reduced to 0. On a successful save, a creature takes half as much damage and isn't hindered by ice.\n\nAt Higher Levels. When you cast this spell using a spell slot of 3rd level or higher, increase the cold damage by 1d8 for each slot level above 2nd."
    },
    "Riptides": {
      level: "3rd",
      school: "Conjuration",
      castingTime: "Action",
      range: "Self (30-foot cone)",
      components: "V, S, M (a conch shell)",
      duration: "Instantaneous",
      description: "You summon waves of water that flow outward in a 30-foot emanation. Choose up to 6 creatures within the emanation, each creature regains 2d6 + your spellcasting ability modifier hit points and is moved up to 15 feet in a direction of your choice (this movement doesn't provoke opportunity attacks).\n\nAt Higher Levels. When you cast this spell using a spell slot of 4th level or higher, the healing increases by 1d6 for each slot level above 3rd."
    },
    "Control Water": {
      level: "4th",
      school: "Transmutation",
      castingTime: "Action",
      range: "300 feet",
      components: "V, S, M (a drop of water and a pinch of dust)",
      duration: "Concentration, up to 10 minutes",
      description: "Until the spell ends, you control any water inside an area you choose that is a Cube up to 100 feet on a side, using one of the following effects. As a Magic action on your later turns, you can repeat the same effect or choose a different one.\n\n• Flood. You cause the water level of all standing water in the area to rise by as much as 20 feet. If you choose an area in a large body of water, you instead create a 20-foot tall wave that travels from one side of the area to the other and then crashes. Any Huge or smaller vehicles in the wave's path are carried with it to the other side. Any Huge or smaller vehicles struck by the wave have a 25 percent chance of capsizing. The water level remains elevated until the spell ends or you choose a different effect. If this effect produced a wave, the wave repeats on the start of your next turn while the flood effect lasts.\n\n• Part Water. You part water in the area and create a trench. The trench extends across the spell's area, and the separated water forms a wall to either side. The trench remains until the spell ends or you choose a different effect. The water then slowly fills in the trench over the course of the next round until the normal water level is restored.\n\n• Redirect Flow. You cause flowing water in the area to move in a direction you choose, even if the water has to flow over obstacles, up walls, or in other unlikely directions. The water in the area moves as you direct it, but once it moves beyond the spell's area, it resumes its flow based on the terrain. The water continues to move in the direction you chose until the spell ends or you choose a different effect.\n\n• Whirlpool. You cause a whirlpool to form in the center of the area, which must be at least 50 feet square and 25 feet deep. The whirlpool lasts until you choose a different effect or the spell ends. The whirlpool is 5 feet wide at the base, up to 50 feet wide at the top, and 25 feet tall. Any creature in the water and within 25 feet of the whirlpool is pulled 10 feet toward it. When a creature enters the whirlpool for the first time on a turn or ends its turn there, it makes a Strength saving throw. On a failed save, the creature takes 2d8 Bludgeoning damage. On a successful save, the creature takes half as much damage. A creature can swim away from the whirlpool only if it first takes an action to pull away and succeeds on a Strength (Athletics) check against your spell save DC."
    },
    "Maelstrom": {
      level: "5th",
      school: "Evocation",
      castingTime: "Action",
      range: "120 feet",
      components: "V, S, M (paper or leaf in the shape of a funnel)",
      duration: "Concentration, up to 1 minute",
      description: "A mass of 5-foot-deep water appears and swirls in a 30-foot radius centered on a point you can see within range. The point must be on ground or in a body of water. Until the spell ends, that area is difficult terrain, and any creature that starts its turn there must succeed on a Strength saving throw or take 6d6 bludgeoning damage and be pulled 10 feet toward the center."
    },
    "Earth Shield": {
      level: "1st",
      school: "Conjuration",
      castingTime: "Reaction, which you take when you are hit by an attack or targeted by the magic missile spell",
      range: "Self",
      components: "V, S",
      duration: "1 round",
      description: "You conjure an earthen shield which forms around your arm. For the duration, you gain 15 temporary hit points, including against the triggering attack.\n\nAt Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, you gain an additional 10 temporary hit points for each slot level above 1st."
    },
    "Earthen Grasp": {
      level: "2nd",
      school: "Transmutation",
      castingTime: "Action",
      range: "30 feet",
      components: "V, S, M (a miniature hand sculpted from clay)",
      duration: "Concentration, up to 1 minute",
      description: "You choose a 5-foot-square unoccupied space on the ground that you can see within range. A Medium hand made from compacted soil rises there and reaches for one creature you can see within 5 feet of it. The target must make a Strength saving throw. On a failed save, the target takes 2d6 bludgeoning damage and is restrained for the spell's duration.\n\nAs an action, you can cause the hand to crush the restrained target, who must make a Strength saving throw. It takes 2d6 bludgeoning damage on a failed save, or half as much damage on a successful one.\n\nTo break out, the restrained target can use its action to make a Strength check against your spell save DC. On a success, the target escapes and is no longer restrained by the hand.\n\nAs an action, you can cause the hand to reach for a different creature or to move to a different unoccupied space within range. The hand releases a restrained target if you do either."
    },
    "Erupting Earth": {
      level: "3rd",
      school: "Transmutation",
      castingTime: "Action",
      range: "120 feet",
      components: "V, S, M (a piece of obsidian)",
      duration: "Instantaneous",
      description: "Choose a point you can see on the ground within range. A fountain of churned earth and stone erupts in a 20-foot cube centered on that point. Each creature in that area must make a Dexterity saving throw. A creature takes 3d12 bludgeoning damage on a failed save, or half as much damage on a successful one. Additionally, the ground in that area becomes difficult terrain until cleared away. Each 5-foot-square portion of the area requires at least 1 minute to clear by hand.\n\nAt Higher Levels. When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d12 for each slot level above 3rd."
    },
    "Stoneskin": {
      level: "4th",
      school: "Transmutation",
      castingTime: "Action",
      range: "Touch",
      components: "V, S, M (diamond dust worth 100+ GP, which the spell consumes)",
      duration: "Concentration, up to 1 hour",
      description: "Until the spell ends, one willing creature you touch has Resistance to Bludgeoning, Piercing, and Slashing damage."
    },
    "Wall of Stone": {
      level: "5th",
      school: "Evocation",
      castingTime: "Action",
      range: "120 feet",
      components: "V, S, M (a cube of granite)",
      duration: "Concentration, up to 10 minutes",
      description: "A nonmagical wall of solid stone springs into existence at a point you choose within range. The wall is 6 inches thick and is composed of ten 10-foot-by-10-foot panels. Each panel must be contiguous with another panel. Alternatively, you can create 10-foot-by-20-foot panels that are only 3 inches thick.\n\nIf the wall cuts through a creature's space when it appears, the creature is pushed to one side of the wall (you choose which side). If a creature would be surrounded on all sides by the wall (or the wall and another solid surface), that creature can make a Dexterity saving throw. On a success, it can use its Reaction to move up to its Speed so that it is no longer enclosed by the wall.\n\nThe wall can have any shape you desire, though it can't occupy the same space as a creature or object. The wall doesn't need to be vertical or rest on a firm foundation. It must, however, merge with and be solidly supported by existing stone. Thus, you can use this spell to bridge a chasm or create a ramp.\n\nIf you create a span greater than 20 feet in length, you must halve the size of each panel to create supports. You can crudely shape the wall to create battlements and the like.\n\nThe wall is an object made of stone that can be damaged and thus breached. Each panel has AC 15 and 30 Hit Points per inch of thickness, and it has Immunity to Poison and Psychic damage. Reducing a panel to 0 Hit Points destroys it and might cause connected panels to collapse at the DM's discretion.\n\nIf you maintain your Concentration on this spell for its full duration, the wall becomes permanent and can't be dispelled. Otherwise, the wall disappears when the spell ends."
    },
    "Chromatic Orb": {
      level: "1st",
      school: "Evocation",
      castingTime: "Action",
      range: "90 feet",
      components: "V, S, M (a diamond worth 50+ GP)",
      duration: "Instantaneous",
      description: "You hurl an orb of energy at a target within range. Choose Acid, Cold, Fire, Lightning, Poison, or Thunder for the type of orb you create, and then make a ranged spell attack against the target. On a hit, the target takes 3d8 damage of the chosen type.\n\nIf you roll the same number on two or more of the d8s, the orb leaps to a different target of your choice within 30 feet of the target. Make an attack roll against the new target, and make a new damage roll. The orb can't leap again unless you cast the spell with a level 2+ spell slot.\n\nUsing a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 1. The orb can leap a maximum number of times equal to the level of the slot expended, and a creature can be targeted only once by each casting of this spell."
    },
    "Dragon's Breath": {
      level: "2nd",
      school: "Transmutation",
      castingTime: "Bonus Action",
      range: "Touch",
      components: "V, S, M (a hot pepper)",
      duration: "Concentration, up to 1 minute",
      description: "You touch one willing creature and imbue it with the power to spew magical energy from its mouth, provided it has one. Choose acid, cold, fire, lightning, or poison. Until the spell ends, the creature can use an action to exhale energy of the chosen type in a 15-foot cone. Each creature in that area must make a Dexterity saving throw, taking 3d6 damage of the chosen type on a failed save, or half as much damage on a successful one.\n\nAt Higher Levels. When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot level above 2nd."
    },
    "Protection from Energy": {
      level: "3rd",
      school: "Abjuration",
      castingTime: "Action",
      range: "Touch",
      components: "V, S",
      duration: "Concentration, up to 1 hour",
      description: "For the duration, the willing creature you touch has resistance to one damage type of your choice: acid, cold, fire, lightning, or thunder."
    },
    "Protection from Evil and Good": {
      level: "1st",
      school: "Abjuration",
      castingTime: "Action",
      range: "Touch",
      components: "V, S, M (a flask of Holy Water worth 25+ GP, which the spell consumes)",
      duration: "Concentration, up to 10 minutes",
      description: "Until the spell ends, one willing creature you touch is protected against creatures that are Aberrations, Celestials, Elementals, Fey, Fiends, or Undead. The protection grants several benefits. Creatures of those types have Disadvantage on attack rolls against the target. The target also can't be possessed by or gain the Charmed or Frightened conditions from them. If the target is already possessed, Charmed, or Frightened by such a creature, the target has Advantage on any new saving throw against the relevant effect."
    },
    "Conjure Elemental Guardians": {
      level: "4th",
      school: "Conjuration",
      castingTime: "Action",
      range: "Self",
      components: "V, S",
      duration: "Concentration, up to 10 minutes",
      description: "You conjure elemental spirits that swirl around you in a 10-foot Emanation for the duration. Whenever the Emanation enters the space of a creature you can see and whenever a creature you can see enters the Emanation or ends its turn there, you can force that creature to make a Wisdom saving throw. The creature takes 5d8 Fire, Cold, Lightning, or Thunder damage (your choice when you cast the spell) on a failed save or half as much damage on a successful one. A creature makes this save only once per turn.\n\nIn addition, you can take the Disengage action as a Bonus Action for the spell's duration.\n\nUsing a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 4."
    },
    "Wrath of the Elements": {
      level: "5th",
      school: "Evocation",
      castingTime: "Action",
      range: "150 feet",
      components: "V, S",
      duration: "1 minute",
      description: "You choose a point within range and unleash a storm of elemental fury. Elemental energy erupts in a 20-foot radius sphere centered on that point. Choose fire, cold, lightning, or thunder for the type of energy released. Each creature in the area must make a Dexterity Saving throw. A creature takes 6d6 damage of the chosen type on a failed save, or half as much on a successful one.\n\nThe eruption leaves behind a lingering after effect tied to the chosen element, which lasts for the duration:\n\n• Fire. When a creature enters the area for the first time on a turn or ends its turn there, it must make a Constitution saving throw, taking 2d6 fire damage on a failed save, or half as much on a success.\n\n• Cold. The area freezes over, becoming difficult terrain. When a creature enters the area for the first time on a turn or ends its turn there, the creature makes a Dexterity saving throw or falls Prone.\n\n• Lightning. The area crackles with unstable energy. Creatures inside the area can't take reactions.\n\n• Thunder. The area reverberates with disorienting sonic waves. After a failed save, a target has muddled thoughts for 1 minute. During that time, it rolls a d6 and subtracts the number rolled from all its attack rolls and ability checks, as well as its Constitution saving throws to maintain concentration. The target can make an Intelligence saving throw at the end of each of its turns, ending the effect on itself on a success.\n\nAt Higher Levels. When you cast this spell using a spell slot of 6th level or higher, the initial damage increases by 1d6 for each slot level above 5th."
    },
    "Mind Sliver": {
      level: "Cantrip",
      school: "Enchantment",
      castingTime: "Action",
      range: "60 feet",
      components: "V",
      duration: "1 round",
      description: "You drive a disorienting spike of psychic energy into the mind of one creature you can see within range. The target must succeed on an Intelligence saving throw or take 1d6 psychic damage and subtract 1d4 from the next saving throw it makes before the end of your next turn.\n\nThis spell's damage increases by 1d6 when you reach certain levels: 5th level (2d6), 11th level (3d6), and 17th level (4d6)."
    },
    "Temporal Skip": {
      level: "1st",
      school: "Transmutation",
      castingTime: "Action",
      range: "60 feet",
      components: "V, S",
      duration: "Instantaneous",
      description: "You speak a word of power that causes time to briefly skip around a creature you can see within range. The target must make a Wisdom saving throw. On a failed save, the target becomes temporally displaced until the end of its next turn. While temporally displaced, the target skips its next turn, and melee attacks against it have advantage.\n\nAt Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st. The creatures must be within 30 feet of each other when you target them."
    },
    "Fortune's Favor": {
      level: "2nd",
      school: "Divination",
      castingTime: "1 minute",
      range: "60 feet",
      components: "V, S, M (a white pearl worth at least 100 gp, which the spell consumes)",
      duration: "1 hour",
      description: "You impart latent luck to yourself or one willing creature you can see within range. When the chosen creature makes an attack roll, an ability check, or a saving throw before the spell ends, it can dismiss this spell on itself to roll an additional d20 and choose which of the d20s to use. Alternatively, when an attack roll is made against the chosen creature, it can dismiss this spell on itself to roll a d20 and choose which of the d20s to use, the one it rolled or the one the attacker rolled.\n\nIf the original d20 roll has advantage or disadvantage, the creature rolls the additional d20 after advantage or disadvantage has been applied to the original roll.\n\nAt Higher Levels. When you cast this spell using a spell slot of 3rd level or higher, you can target one additional creature for each slot level above 2nd."
    },
    "Staggering Smite": {
      level: "4th",
      school: "Enchantment",
      castingTime: "Bonus Action, which you take immediately after hitting a creature with a Melee weapon or an Unarmed Strike",
      range: "Self",
      components: "V",
      duration: "Instantaneous",
      description: "The target takes an extra 4d6 Psychic damage from the attack, and the target must succeed on a Wisdom saving throw or have the Stunned condition until the end of your next turn.\n\nUsing a Higher-Level Spell Slot. The extra damage increases by 1d6 for each spell slot level above 4."
    },
    "Temporal Shunt": {
      level: "5th",
      school: "Transmutation",
      castingTime: "Reaction, taken when a creature you see makes an attack roll or starts to cast a spell",
      range: "120 feet",
      components: "V, S",
      duration: "1 round",
      description: "You target the triggering creature, which must succeed on a Wisdom saving throw or vanish, being thrown to another point in time and causing the attack to miss or the spell to be wasted. At the start of its next turn, the target reappears where it was or in the closest unoccupied space. The target doesn't remember you casting the spell or being affected by it.\n\nAt Higher Levels. When you cast this spell using a spell slot of 6th level or higher, you can target one additional creature for each slot level above 5th. All targets must be within 30 feet of each other."
    },
    "Sapping Sting": {
      level: "Cantrip",
      school: "Necromancy",
      castingTime: "Action",
      range: "30 feet",
      components: "V, S",
      duration: "Instantaneous",
      description: "You sap the vitality of one creature you can see in range. The target must succeed on a Constitution saving throw or take 1d4 necrotic damage and fall prone.\n\nThis spell's damage increases by 1d4 when you reach 5th level (2d4), 11th level (3d4), and 17th level (4d4)."
    },
    "Magnify Gravity": {
      level: "1st",
      school: "Transmutation",
      castingTime: "Action",
      range: "60 feet",
      components: "V, S",
      duration: "1 round",
      description: "The gravity in a 10-foot-radius sphere centered on a point you can see within range increases for a moment. Each creature in the sphere on the turn when you cast the spell must make a Constitution saving throw. On a failed save, a creature takes 2d8 force damage, and its speed is halved until the end of its next turn. On a successful save, a creature takes half as much damage and suffers no reduction to its speed.\n\nUntil the start of your next turn, any object that isn't being worn or carried in the sphere requires a successful Strength check against your spell save DC to pick up or move.\n\nAt Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st."
    },
    "Immovable Object": {
      level: "2nd",
      school: "Transmutation",
      castingTime: "Action",
      range: "Touch",
      components: "V, S, M (gold dust worth at least 25 gp, which the spell consumes)",
      duration: "1 hour",
      description: "You touch an object that weighs no more than 10 pounds and cause it to become magically fixed in place. You and the creatures you designate when you cast this spell can move the object normally. You can also set a password that, when spoken within 5 feet of the object, suppresses this spell for 1 minute.\n\nIf the object is fixed in the air, it can hold up to 4,000 pounds of weight. More weight causes the object to fall. Otherwise, a creature can use an action to make a Strength check against your spell save DC. On a success, the creature can move the object up to 10 feet.\n\nAt Higher Levels. If you cast this spell using a spell slot of 4th or 5th level, the DC to move the object increases by 5, it can carry up to 8,000 pounds of weight, and the duration increases to 24 hours. If you cast this spell using a spell slot of 6th level or higher, the DC to move the object increases by 10, it can carry up to 20,000 pounds of weight, and the effect is permanent until dispelled."
    },
    "Pulse Wave": {
      level: "3rd",
      school: "Evocation",
      castingTime: "Action",
      range: "Self (30-foot cone)",
      components: "V, S",
      duration: "Instantaneous",
      description: "You create intense pressure, unleash it in a 30-foot cone, and decide whether the pressure pulls or pushes creatures and objects. Each creature in that cone must make a Constitution saving throw. A creature takes 6d6 force damage on a failed save, or half as much damage on a successful one. And every creature that fails the save is either pulled 15 feet toward you or pushed 15 feet away from you, depending on the choice you made for the spell.\n\nIn addition, unsecured objects that are completely within the cone are likewise pulled or pushed 15 feet.\n\nAt Higher Levels. When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 and the distance pulled or pushed increases by 5 feet for each slot level above 3rd."
    },
    "Gravity Sinkhole": {
      level: "4th",
      school: "Evocation",
      castingTime: "Action",
      range: "120 feet",
      components: "V, S, M (a black marble)",
      duration: "Instantaneous",
      description: "A 20-foot-radius sphere of crushing force forms at a point you can see within range and tugs at the creatures there. Each creature in the sphere must make a Constitution saving throw. On a failed save, the creature takes 5d10 force damage, and is pulled in a straight line toward the center of the sphere, ending in an unoccupied space as close to the center as possible (even if that space is in the air). On a successful save, the creature takes half as much damage and isn't pulled.\n\nAt Higher Levels. When you cast this spell using a spell slot of 5th level or higher, the damage increases by 1d10 for each slot level above 4th."
    },
    "Guidance": { 
      level: "Cantrip", 
      school: "Divination", 
      castingTime: "Action", 
      range: "Touch", 
      components: "V, S", 
      duration: "Concentration, up to 1 minute", 
      description: "You touch a willing creature and choose a skill. Until the spell ends, the creature adds 1d4 to any ability check using the chosen skill."
    },
    "Druidcraft": { 
      level: "Cantrip", 
      school: "Transmutation", 
      castingTime: "Action", 
      range: "30 feet", 
      components: "V, S", 
      duration: "Instantaneous", 
      description: "Whispering to the spirits of nature, you create one of the following effects within range.\n\nWeather Sensor. You create a Tiny, harmless sensory effect that predicts what the weather will be at your location for the next 24 hours. The effect might manifest as a golden orb for clear skies, a cloud for rain, falling snowflakes for snow, and so on. This effect persists for 1 round.\n\nBloom. You instantly make a flower blossom, a seed pod open, or a leaf bud bloom.\n\nSensory Effect. You create a harmless sensory effect, such as falling leaves, spectral dancing fairies, a gentle breeze, the sound of an animal, or the faint odor of skunk. The effect must fit in a 5-foot Cube.\n\nFire Play. You light or snuff out a candle, a torch, or a campfire."
    },
    "Resistance": { 
      level: "Cantrip", 
      school: "Abjuration", 
      castingTime: "Action", 
      range: "Touch", 
      components: "V, S", 
      duration: "Concentration, up to 1 minute", 
      description: "You touch a willing creature and choose a damage type: Acid, Bludgeoning, Cold, Fire, Lightning, Necrotic, Piercing, Poison, Radiant, Slashing, or Thunder. When the creature takes damage of the chosen type before the spell ends, the creature reduces the total damage taken by 1d4. A creature can benefit from this spell only once per turn."
    },
    "Message": { 
      level: "Cantrip", 
      school: "Transmutation", 
      castingTime: "Action", 
      range: "120 feet", 
      components: "S, M (a copper wire)", 
      duration: "1 round", 
      description: "You point toward a creature within range and whisper a message. The target (and only the target) hears the message and can reply in a whisper that only you can hear.\n\nYou can cast this spell through solid objects if you are familiar with the target and know it is beyond the barrier. Magical silence; 1 foot of stone, metal, or wood; or a thin sheet of lead blocks the spell."
    },
    "Create Bonfire": { 
      level: "Cantrip", 
      school: "Conjuration", 
      castingTime: "Action", 
      range: "60 feet", 
      components: "V, S", 
      duration: "Concentration, up to 1 minute", 
      description: "You create a bonfire on ground that you can see within range. Until the spell ends, the magic bonfire fills a 5-foot cube. Any creature in the bonfire's space when you cast the spell must succeed on a Dexterity saving throw or take 1d8 fire damage. A creature must also make the saving throw when it moves into the bonfire's space for the first time on a turn or ends its turn there.\n\nThe bonfire ignites flammable objects in its area that aren't being worn or carried.\n\nThe spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8)."
    },
    "Detect Magic": { 
      level: "1st", 
      school: "Divination", 
      castingTime: "Action or Ritual", 
      range: "Self", 
      components: "V, S", 
      duration: "Concentration, up to 10 minutes", 
      description: "For the duration, you sense the presence of magical effects within 30 feet of yourself. If you sense such effects, you can take the Magic action to see a faint aura around any visible creature or object in the area that bears the magic, and if an effect was created by a spell, you learn the spell's school of magic.\n\nThe spell is blocked by 1 foot of stone, dirt, or wood; 1 inch of metal; or a thin sheet of lead."
    },
    "Cure Wounds": { 
      level: "1st", 
      school: "Abjuration", 
      castingTime: "Action", 
      range: "Touch", 
      components: "V, S", 
      duration: "Instantaneous", 
      description: "A creature you touch regains a number of Hit Points equal to 2d8 plus your spellcasting ability modifier.\n\nUsing a Higher-Level Spell Slot. The healing increases by 2d8 for each spell slot level above 1."
    },
    "Faerie Fire": { 
      level: "1st", 
      school: "Evocation", 
      castingTime: "Action", 
      range: "60 feet", 
      components: "V", 
      duration: "Concentration, up to 1 minute", 
      description: "Objects in a 20-foot Cube within range are outlined in blue, green, or violet light (your choice). Each creature in the Cube is also outlined if it fails a Dexterity saving throw. For the duration, objects and affected creatures shed Dim Light in a 10-foot radius and can't benefit from the Invisible condition.\n\nAttack rolls against an affected creature or object have Advantage if the attacker can see it."
    },
    "Healing Word": { 
      level: "1st", 
      school: "Abjuration", 
      castingTime: "Bonus action", 
      range: "60 feet", 
      components: "V", 
      duration: "Instantaneous", 
      description: "A creature of your choice that you can see within range regains Hit Points equal to 2d4 plus your spellcasting ability modifier.\n\nUsing a Higher-Level Spell Slot. The healing increases by 2d4 for each spell slot level above 1."
    },
    "Continual Flame": { 
      level: "2nd", 
      school: "Evocation", 
      castingTime: "Action", 
      range: "Touch", 
      components: "V, S, M (ruby dust worth 50+ GP, which the spell consumes)", 
      duration: "Until dispelled", 
      description: "A flame springs from an object that you touch. The effect casts Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. It looks like a regular flame, but it creates no heat and consumes no fuel. The flame can be covered or hidden but not smothered or quenched."
    },
    "Earthbind": { 
      level: "2nd", 
      school: "Transmutation", 
      castingTime: "Action", 
      range: "300 feet", 
      components: "V", 
      duration: "Concentration, up to 1 minute", 
      description: "Choose one creature you can see within range. Yellow strips of magical energy loop around the creature. The target must succeed on a Strength saving throw, or its flying speed (if any) is reduced to 0 feet for the spell's duration. An airborne creature affected by this spell safely descends at 60 feet per round until it reaches the ground or the spell ends."
    },
    "Enhance Ability": { 
      level: "2nd", 
      school: "Transmutation", 
      castingTime: "Action", 
      range: "Touch", 
      components: "V, S, M (fur or a feather)", 
      duration: "Concentration, up to 1 hour", 
      description: "You touch a creature and choose Strength, Dexterity, Intelligence, Wisdom, or Charisma. For the duration, the target has Advantage on ability checks using the chosen ability.\n\nUsing a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 2. You can choose a different ability for each target."
    },
    "Pass without Trace": { 
      level: "2nd", 
      school: "Abjuration", 
      castingTime: "Action", 
      range: "Self", 
      components: "V, S, M (ashes from burned mistletoe)", 
      duration: "Concentration, up to 1 hour", 
      description: "You radiate a concealing aura in a 30-foot Emanation for the duration. While in the aura, you and each creature you choose have a +10 bonus to Dexterity (Stealth) checks and leave no tracks."
    },
    "Revivify": { 
      level: "3rd", 
      school: "Necromancy", 
      castingTime: "Action", 
      range: "Touch", 
      components: "V, S, M (a diamond worth 300+ GP, which the spell consumes)", 
      duration: "Instantaneous", 
      description: "You touch a creature that has died within the last minute. That creature revives with 1 Hit Point. This spell can't revive a creature that has died of old age, nor does it restore any missing body parts."
    },
    "Sleet Storm": { 
      level: "3rd", 
      school: "Conjuration", 
      castingTime: "Action", 
      range: "150 feet", 
      components: "V, S, M (a miniature umbrella)", 
      duration: "Concentration, up to 1 minute", 
      description: "Until the spell ends, sleet falls in a 40-foot-tall, 20-foot-radius Cylinder centered on a point you choose within range. The area is Heavily Obscured, and exposed flames in the area are doused.\n\nGround in the Cylinder is Difficult Terrain. When a creature enters the Cylinder for the first time on a turn or starts its turn there, it must succeed on a Dexterity saving throw or have the Prone condition and lose Concentration."
    },
    "Tidal Wave": { 
      level: "3rd", 
      school: "Conjuration", 
      castingTime: "Action", 
      range: "120 feet", 
      components: "V, S, M (a drop of water)", 
      duration: "Instantaneous", 
      description: "You conjure up a wave of water that crashes down on an area within range. The area can be up to 30 feet long, up to 10 feet wide, and up to 10 feet tall. Each creature in that area must make a Dexterity saving throw. On a failed save, a creature takes 4d8 bludgeoning damage and is knocked prone. On a successful save, a creature takes half as much damage and isn't knocked prone. The water then spreads out across the ground in all directions, extinguishing unprotected flames in its area and within 30 feet of it, and then it vanishes."
    },
    "Fire Shield": { 
      level: "4th", 
      school: "Evocation", 
      castingTime: "Action", 
      range: "Self", 
      components: "V, S, M (a bit of phosphorus or a firefly)", 
      duration: "10 minutes", 
      description: "Wispy flames wreathe your body for the duration, shedding Bright Light in a 10-foot radius and Dim Light for an additional 10 feet.\n\nThe flames provide you with a warm shield or a chill shield, as you choose. The warm shield grants you Resistance to Cold damage, and the chill shield grants you Resistance to Fire damage.\n\nIn addition, whenever a creature within 5 feet of you hits you with a melee attack roll, the shield erupts with flame. The attacker takes 2d8 Fire damage from a warm shield or 2d8 Cold damage from a chill shield."
    },
    "Dispel Magic": { 
      level: "3rd", 
      school: "Abjuration", 
      castingTime: "Action", 
      range: "120 feet", 
      components: "V, S", 
      duration: "Instantaneous", 
      description: "Choose one creature, object, or magical effect within range. Any ongoing spell of level 3 or lower on the target ends. For each ongoing spell of level 4 or higher on the target, make an ability check using your spellcasting ability (DC 10 plus that spell's level). On a successful check, the spell ends.\n\nUsing a Higher-Level Spell Slot. You automatically end a spell on the target if the spell's level is equal to or less than the level of the spell slot you use."
    },
    "Absorb Elements": { 
      level: "1st", 
      school: "Abjuration", 
      castingTime: "Reaction, which you take when you take acid, cold, fire, lightning, or thunder damage", 
      range: "Self", 
      components: "S", 
      duration: "1 round", 
      description: "The spell captures some of the incoming energy, lessening its effect on you and storing it for your next melee attack. You have resistance to the triggering damage type until the start of your next turn. Also, the first time you hit with a melee attack on your next turn, the target takes an extra 1d6 damage of the triggering type, and the spell ends.\n\nAt Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the extra damage increases by 1d6 for each slot level above 1st."
    },
    "Goodberry": {
      level: "1st", 
      school: "Conjuration", 
      castingTime: "Actione", 
      range: "Touch", 
      components: "V, S, M (a sprig of mistletoe)", 
      duration: "24 hours", 
      description: "Ten berries appear in your hand and are infused with magic for the duration. A creature can take a Bonus Action to eat one berry. Eating a berry restores 1 Hit Point, and the berry provides enough nourishment to sustain a creature for one day.\n\nUneaten berries disappear when the spell ends."
    },
    "Entangle": {
      level: "1st",
      school: "Conjuration",
      castingTime: "Action",
      range: "90 feet",
      components: "V, S",
      duration: "Concentration, up to 1 minute",
      description: "Grasping plants sprout from the ground in a 20-foot square within range. For the duration, these plants turn the ground in the area into Difficult Terrain. They disappear when the spell ends.\n\nEach creature (other than you) in the area when you cast the spell must succeed on a Strength saving throw or have the Restrained condition until the spell ends. A Restrained creature can take an action to make a Strength (Athletics) check against your spell save DC. On a success, it frees itself from the grasping plants and is no longer Restrained by them."
    },
    "Spike Growth": {
      level: "2nd",
      school: "Transmutation",
      castingTime: "Action",
      range: "150 feet",
      components: "V, S, M (seven thorns)",
      duration: "Concentration, up to 10 minutes",
      description: "The ground in a 20-foot-radius Sphere centered on a point within range sprouts hard spikes and thorns. The area becomes Difficult Terrain for the duration. When a creature moves into or within the area, it takes 2d4 Piercing damage for every 5 feet it travels.\n\nThe transformation of the ground is camouflaged to look natural. Any creature that can't see the area when the spell is cast must take a Search action and succeed on a Wisdom (Perception or Survival) check against your spell save DC to recognize the terrain as hazardous before entering it."
    },
    "Thorn Whip": {
      level: "Cantrip",
      school: "Transmutation",
      castingTime: "Action",
      range: "30 feet",
      components: "V, S, M (the stem of a plant with thorns)",
      duration: "Instantaneous",
      description: "You create a vine-like whip covered in thorns that lashes out at your command toward a creature in range. Make a melee spell attack against the target. On a hit, the target takes 1d6 Piercing damage, and if it is Large or smaller, you can pull it up to 10 feet closer to you.\n\nCantrip Upgrade. The damage increases by 1d6 when you reach levels 5 (2d6), 11 (3d6), and 17 (4d6)."
    },
    "Aether Overflow": {
      level: "1st",
      school: "Abjuration",
      castingTime: "Action",
      range: "60 feet",
      components: "V, S",
      duration: "Instantaneous",
      description: "You unleash a surge of raw aether that overwhelms a creature's magical essence. The target must make a Wisdom saving throw. On a failed save, the target becomes magically overloaded until the end of its next turn. While magically overloaded, the target's speed becomes 0, it can't take actions or reactions, and melee attacks against it have advantage.\n\nAt Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, you can affect one additional creature for each slot level above 1st."
    },
    "Ethereal Immolation": {
      level: "2nd",
      school: "Evocation",
      castingTime: "Action",
      range: "120 feet",
      components: "V, S", 
      duration: "Concentration, up to 1 minute",
      description: "You shroud a target in visible ethereal power that reacts violently to the presence of magic. For the duration of the spell, if the target casts a spell, it takes 1d12 force damage. This damage is increased by 1d12 for each spell level of the spell cast (no additional damage for cantrips).\n\nAdditionally, if the target ends their turn while concentrating on a spell, they take 1d12 force damage."
    },
    "Power Torrent": {
      level: "6th", 
      school: "Evocation",
      castingTime: "Action",
      range: "Self (60-foot line)",
      components: "V, S",
      duration: "Instantaneous",
      description: "You unleash a massive torrent of raw arcane energy, blasting a line 60 feet long and 15 feet wide with overwhelmingly raw power. This spell passes through all obstacles, walls, and all other non-magical barriers. All creatures in the area take 4d12 + 4 force damage.\n\nAll spells of 1st level or lower on creatures that take this damage are dispelled, and Constitution saving throws to maintain concentration on spells triggered by this damage are made with disadvantage.\n\nAt Higher Levels. When you cast this spell using a spell slot of 7th level or higher, the damage increases by 1d12 + 1 and the level of spells dispelled increases by 1 for each slot level above 6th."
    },
    "Spelltrap": {
      level: "4th",
      school: "Abjuration",
      castingTime: "1 minute",
      range: "Self",
      components: "V, S",
      duration: "8 hours", 
      description: "You create a spelltrap, marking it on yourself, typically as a small glowing mark on your skin. The first time you are targeted by a spell of 3rd level or lower or have to make a saving throw against such a spell, the spell is absorbed by the spell trap and none of the effects of the spell take place.\n\nOn your next turn, you can cast the absorbed spell without expending a spell slot, using your spell attack bonus and spell save DC. If you do not cast the spell during your next turn, the spell trap fades and the trapped spell is lost.\n\nUsing a Higher-Level Spell Slot. When you cast this spell using a spell slot of 5th level or higher, the level of the spell it can absorb increases by 1 for each slot level above 4th."
    },
    "Aether Catalyst": {
      level: "2nd",
      school: "Evocation",
      castingTime: "1 reaction, which you take when you see a creature within 60 feet of yourself casting a spell with Verbal, Somatic, or Material components that requires creatures to make a saving throw to avoid its effects",
      range: "60 feet",
      components: "S",
      duration: "Instantaneous",
      description: "When you see a creature within range casting a spell, you can use your reaction to weave disruptive magical energy around the spell's target area. Choose one of the following effects:\n\n- Destabilize: Choose up to 3 creatures that must make a saving throw against the triggering spell. Those creatures have disadvantage on their first saving throw against that spell.\n- Fortify: Choose up to 3 creatures that must make a saving throw against the triggering spell. Those creatures have advantage on their first saving throw against that spell.\n\nAt Higher Levels. When you cast this spell using a spell slot of 3rd level or higher, you can affect one additional creature for each slot level above 2nd."
    },
    "Aether Lance": {
      level: "3rd",
      school: "Evocation",
      castingTime: "Action",
      range: "Self (30-foot line)",
      components: "V, S",
      duration: "Instantaneous",
      description: "You gather raw aether in your hand and expel it in a lance of power forming a line 30 foot long and 5 foot wide. Each creature in a line takes 8d4 force damage.\n\nAt Higher Levels. When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d4 for each slot level above 3rd."
    },
    "Lesser Restoration": {
      level: "2nd",
      school: "Abjuration",
      castingTime: "Bonus action",
      range: "Touch",
      components: "V, S",
      duration: "Instantaneous",
      description: "You touch a creature and end one condition on it: Blinded, Deafened, Paralyzed, or Poisoned."
    },
    "Cone of Cold": {
      level: "5th",
      school: "Evocation",
      castingTime: "Action",
      range: "Self",
      components: "V, S, M (a small crystal or glass cone)",
      duration: "Instantaneous",
      description: "You unleash a blast of cold air. Each creature in a 60-foot Cone originating from you makes a Constitution saving throw, taking 8d8 Cold damage on a failed save or half as much damage on a successful one. A creature killed by this spell becomes a frozen statue until it thaws.\n\nUsing a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 5."
    },
    "Contagion": {
      level: "5th",
      school: "Necromancy",
      castingTime: "Action",
      range: "Touch",
      components: "V, S",
      duration: "7 days",
      description: "Your touch inflicts a magical contagion. The target must succeed on a Constitution saving throw or take 11d8 Necrotic damage and have the Poisoned condition. Also, choose one ability when you cast the spell. While Poisoned, the target has Disadvantage on saving throws made with the chosen ability.\n\nThe target must repeat the saving throw at the end of each of its turns until it gets three successes or failures. If the target succeeds on three of these saves, the spell ends on the target. If the target fails three of the saves, the spell lasts for 7 days on it.\n\nWhenever the Poisoned target receives an effect that would end the Poisoned condition, the target must succeed on a Constitution saving throw, or the Poisoned condition doesn't end on it."
    },
    "Greater Restoration": {
      level: "5th",
      school: "Abjuration",
      castingTime: "Action",
      range: "Touch",
      components: "V, S, M (diamond dust worth 100+ GP, which the spell consumes)",
      duration: "Instantaneous",
      description: "You touch a creature and magically remove one of the following effects from it:\n\n- 1 Exhaustion level\n- The Charmed or Petrified condition\n- A curse, including the target's Attunement to a cursed magic item\n- Any reduction to one of the target's ability scores\n- Any reduction to the target's Hit Point maximum"
    },
    "Mass Cure Wounds": {
      level: "5th",
      school: "Abjuration",
      castingTime: "Action",
      range: "60 feet",
      components: "V, S",
      duration: "Instantaneous",
      description: "A wave of healing energy washes out from a point you can see within range. Choose up to six creatures in a 30-foot-radius Sphere centered on that point. Each target regains Hit Points equal to 5d8 plus your spellcasting ability modifier.\n\nUsing a Higher-Level Spell Slot. The healing increases by 1d8 for each spell slot level above 5."
    },
    "Transmute Rock": {
      level: "5th",
      school: "Transmutation",
      castingTime: "Action",
      range: "120 feet",
      components: "V, S, M (clay and water)",
      duration: "Until dispelled",
      description: "You choose an area of stone or mud that you can see that fits within a 40-foot cube and is within range, and choose one of the following effects.\n\nTransmute Rock to Mud. Nonmagical rock of any sort in the area becomes an equal volume of thick, flowing mud that remains for the spell's duration.\n\nThe ground in the spell's area becomes muddy enough that creatures can sink into it. Each foot that a creature moves through the mud costs 4 feet of movement, and any creature on the ground when you cast the spell must make a Strength saving throw. A creature must also make the saving throw when it moves into the area for the first time on a turn or ends its turn there. On a failed save, a creature sinks into the mud and is restrained, though it can use an action to end the restrained condition on itself by pulling itself free of the mud.\n\nIf you cast the spell on a ceiling, the mud falls. Any creature under the mud when it falls must make a Dexterity saving throw. A creature takes 4d8 bludgeoning damage on a failed save, or half as much damage on a successful one.\n\nTransmute Mud to Rock. Nonmagical mud or quicksand in the area no more than 10 feet deep transforms into soft stone for the spell's duration. Any creature in the mud when it transforms must make a Dexterity saving throw. On a successful save, a creature is shunted safely to the surface in an unoccupied space. On a failed save, a creature becomes restrained by the rock. A restrained creature, or another creature within reach, can use an action to try to break the rock by succeeding on a DC 20 Strength check or by dealing damage to it. The rock has AC 15 and 25 hit points, and it is immune to poison and psychic damage."
    },
    "Tree Stride": {
      level: "5th",
      school: "Conjuration",
      castingTime: "Action",
      range: "Self",
      components: "V, S",
      duration: "Concentration, up to 1 minute",
      description: "You gain the ability to enter a tree and move from inside it to inside another tree of the same kind within 500 feet. Both trees must be living and at least the same size as you. You must use 5 feet of movement to enter a tree. You instantly know the location of all other trees of the same kind within 500 feet and, as part of the move used to enter the tree, can either pass into one of those trees or step out of the tree you're in. You appear in a spot of your choice within 5 feet of the destination tree, using another 5 feet of movement. If you have no movement left, you appear within 5 feet of the tree you entered.\n\nYou can use this transportation ability only once on each of your turns. You must end each turn outside a tree."
    },
    "Planar Binding": {
      level: "5th",
      school: "Abjuration",
      castingTime: "1 hour",
      range: "60 feet",
      components: "V, S, M (a jewel worth 1,000+ GP, which the spell consumes)",
      duration: "24 hours",
      description: "You attempt to bind a Celestial, an Elemental, a Fey, or a Fiend to your service. The creature must be within range for the entire casting of the spell. (Typically, the creature is first summoned into the center of the inverted version of the Magic Circle spell to trap it while this spell is cast.) At the completion of the casting, the target must succeed on a Charisma saving throw or be bound to serve you for the duration. If the creature was summoned or created by another spell, that spell's duration is extended to match the duration of this spell.\n\nA bound creature must follow your commands to the best of its ability. You might command the creature to accompany you on an adventure, to guard a location, or to deliver a message. If the creature is Hostile, it strives to twist your commands to achieve its own objectives. If the creature carries out your commands completely before the spell ends, it travels to you to report this fact if you are on the same plane of existence. If you are on a different plane, it returns to the place where you bound it and remains there until the spell ends.\n\nUsing a Higher-Level Spell Slot. The duration increases with a spell slot of level 6 (10 days), 7 (30 days), 8 (180 days), and 9 (366 days)."
    },
    "Aura of Vitality": {
      level: "3rd",
      school: "Abjuration",
      castingTime: "Action",
      range: "Self",
      components: "V",
      duration: "Concentration, up to 1 minute",
      description: "An aura radiates from you in a 30-foot Emanation for the duration. When you create the aura and at the start of each of your turns while it persists, you can restore 2d6 Hit Points to one creature in it."
    }
  };

  // Spell slots calculation
  const getSpellSlotsForLevel = (level) => {
    const spellSlotTable = {
      1: { 1: 2 },
      2: { 1: 3 },
      3: { 1: 4, 2: 2 },
      4: { 1: 4, 2: 3 },
      5: { 1: 4, 2: 3, 3: 2 },
      6: { 1: 4, 2: 3, 3: 3 },
      7: { 1: 4, 2: 3, 3: 3, 4: 1 },
      8: { 1: 4, 2: 3, 3: 3, 4: 2 },
      9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
      11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      17: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
      18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 1, 8: 1, 9: 1 },
      20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 1, 9: 1 }
    };
    
    return spellSlotTable[level] || {};
  };

  // Update spell slots when level changes
  useEffect(() => {
    const newMaxSlots = getSpellSlotsForLevel(level);
    setSpellSlots(prev => {
      const updated = { ...prev };
      for (let slotLevel = 1; slotLevel <= 9; slotLevel++) {
        const maxSlots = newMaxSlots[slotLevel] || 0;
        updated[slotLevel] = {
          max: maxSlots,
          current: Math.min(prev[slotLevel].current, maxSlots)
        };
      }
      return updated;
    });
  }, [level]);

  // Prepared spells (hardcoded as requested)
  const preparedSpells = [
    'Resistance', 'Thorn Whip', 'Create Bonfire', 'Druidcraft', //Cantrips
    'Speak with Animals', //Siempre preparado
    'Goodberry', 'Cure Wounds', 'Faerie Fire', 'Healing Word', 'Protection from Evil and Good', //1st
    'Enhance Ability', 'Pass without Trace', //2nd
    'Revivify', 'Sleet Storm', 'Aura of Vitality', //3rd
    'Molten Earth Tendril', 'Elemental Manifestation', //4th
    'Greater Restoration', 'Mass Cure Wounds' //5th
  ];

  // Get all prepared spells including communion spells
  const getAllPreparedSpells = () => {
    let allSpells = [...preparedSpells];
    const pendantSpells = getPendantSpellNames();
    allSpells = [...allSpells, ...pendantSpells];

    // Add communion spells if active
    if (activeElement) {
      const elementSpells = elements[activeElement]?.spells || {};
      const aetherSpells = elements.aether.spells;
      
      // Add element spells up to current level
      Object.keys(elementSpells).forEach(spellLevel => {
        if (level >= parseInt(spellLevel)) {
          allSpells = [...allSpells, ...elementSpells[spellLevel]];
        }
      });
      
      // Add Aether spells up to current level
      Object.keys(aetherSpells).forEach(spellLevel => {
        if (level >= parseInt(spellLevel)) {
          allSpells = [...allSpells, ...aetherSpells[spellLevel]];
        }
      });
    }
    
    // Remove duplicates and return
    return [...new Set(allSpells)];
  };

  const longRest = () => {
    // Reset spell slots
    const maxSlots = getSpellSlotsForLevel(level);
    setSpellSlots(prev => {
      const updated = { ...prev };
      for (let slotLevel = 1; slotLevel <= 9; slotLevel++) {
        updated[slotLevel] = {
          max: maxSlots[slotLevel] || 0,
          current: maxSlots[slotLevel] || 0
        };
      }
      return updated;
    });

    endCommunion();
    
    // Reset used elements
    setUsedElements([]);
    
    // Reset wild shape uses
    setWildShapeUses(maxWildShapeUses);
    
    // Reset Wild Resurgence daily ability
    setWildResurgenceUsed(false);
    
    // Recover pendant charges
    const pendantData = getPendantData();
    let recovered = 0;
    
    if (pendantState === 'dormant') {
      recovered = Math.floor(Math.random() * 4) + 1 + 2;
    } else if (pendantState === 'awakened') {
      recovered = Math.floor(Math.random() * 6) + 1 + 2;
    } else {
      recovered = Math.floor(Math.random() * 6) + 1 + 4;
    }
    
    setPendantCharges(Math.min(pendantData.maxCharges, pendantCharges + recovered));
    
    alert(`Descanso largo completado!\n• Espacios de conjuro restaurados\n• Elementos de comunión reiniciados\n• Wild Shape: ${maxWildShapeUses} usos\n• Pendant: +${recovered} cargas`);
  };

  const shortRest = () => {
    // Recover 1 use of Wild Shape
    setWildShapeUses(prev => Math.min(maxWildShapeUses, prev + 1));

    endCommunion();
    
    alert('Descanso corto completado!\n• Wild Shape: +1 uso recuperado');
  };

  const wildResurgenceSpellToWild = () => {
    // Check if any spell slots are available
    const availableSlots = Object.entries(spellSlots).filter(([_, slots]) => slots.current > 0);
    
    if (availableSlots.length === 0) {
      alert('No tienes espacios de conjuro disponibles');
      return;
    }
    
    if (wildShapeUses >= maxWildShapeUses) {
      alert('Ya tienes el máximo de usos de Wild Shape');
      return;
    }
    
    // Find the lowest level spell slot available
    const lowestSlot = availableSlots.reduce((lowest, current) => {
      return parseInt(current[0]) < parseInt(lowest[0]) ? current : lowest;
    });
    
    const slotLevel = parseInt(lowestSlot[0]);
    
    // Consume the spell slot and gain Wild Shape
    setSpellSlots(prev => ({
      ...prev,
      [slotLevel]: {
        ...prev[slotLevel],
        current: prev[slotLevel].current - 1
      }
    }));
    
    setWildShapeUses(prev => Math.min(maxWildShapeUses, prev + 1));
    
    alert(`Has gastado 1 espacio de nivel ${slotLevel} para recuperar 1 uso de Wild Shape`);
  };

  const wildResurgenceWildToSpell = () => {
    if (wildShapeUses <= 0) {
      alert('No tienes usos de Wild Shape disponibles');
      return;
    }
    
    if (wildResurgenceUsed) {
      alert('Ya has usado esta habilidad hoy. Se reinicia en descanso largo.');
      return;
    }
    
    if (spellSlots[1].current >= spellSlots[1].max) {
      alert('Ya tienes el máximo de espacios de nivel 1');
      return;
    }
    
    // Consume Wild Shape and gain level 1 spell slot
    setWildShapeUses(prev => prev - 1);
    setSpellSlots(prev => ({
      ...prev,
      1: {
        ...prev[1],
        current: Math.min(prev[1].max, prev[1].current + 1)
      }
    }));
    
    setWildResurgenceUsed(true);
    
    alert('Has gastado 1 uso de Wild Shape para recuperar 1 espacio de nivel 1');
  };
  const getSpellLevel = (spellName) => {
    // Check in spell database first - this is the authoritative source
    if (spellDatabase[spellName]) {
      const level = spellDatabase[spellName].level;
      if (level === "Cantrip") return 0;
      return parseInt(level.replace(/\D/g, '')) || 1;
    }
    
    // If not found, return 1 as fallback (most spells are 1st level)
    return 1;
  };

  const castSpell = (spellName, slotLevel, pendantChargesToUse = null) => {
    const minimumLevel = getSpellLevel(spellName);

    // RUTA PENDIENTE (si me pasas nº de cargas)
    if (isPendantSpell(spellName)) {
      const { min, max } = getPendantChargeRange(spellName);
      if (min === 0 && max === 0 || pendantChargesToUse == null) {
        // caerá a slots
      } else {
        const chosen = pendantChargesToUse;
        if (chosen < min || chosen > max) { alert(`Debes gastar entre ${min} y ${max} cargas para ${spellName}.`); return; }
        if (pendantCharges < chosen)     { alert(`No tienes suficientes cargas: necesitas ${chosen}, tienes ${pendantCharges}.`); return; }
        setPendantCharges(prev => prev - chosen);
        alert(`Has lanzado ${spellName} usando ${chosen} carga(s) del pendiente.`);
        return; // NO gasta slot
      }
    }

    // RUTA SLOTS
    if (minimumLevel > 0 && slotLevel < minimumLevel) {
      alert(`${spellName} es un hechizo de nivel ${minimumLevel}. No puede lanzarse con un espacio de nivel ${slotLevel}.`);
      return;
    }
    if (spellSlots[slotLevel].current <= 0) {
      alert('No tienes espacios de conjuro de ese nivel disponibles');
      return;
    }
    setSpellSlots(prev => ({ ...prev, [slotLevel]: { ...prev[slotLevel], current: prev[slotLevel].current - 1 }}));
    const levelText = minimumLevel === 0 ? 'Cantrip' : slotLevel > minimumLevel ? `nivel ${slotLevel} (upcast desde ${minimumLevel})` : `nivel ${slotLevel}`;
    alert(`Has lanzado ${spellName} (${levelText})`);
    setShowCastModal(false);
    setSpellToCast(null);
  };

  const morphbladeOrbs = {
    fire: {
      name: 'Orbe de Fuego - Gunblade',
      forms: {
        sword: { damage: '1d8 fuego', properties: 'Finesse', mastery: 'Vex' },
        gun: { damage: '1d8 fuego', properties: 'Finesse, Loading, Close Quarters', mastery: 'Push (≤5ft) / Slow (>5ft)', range: '30/90' }
      },
      gemInfused: 'Crítico en 19-20'
    },
    air: {
      name: 'Orbe de Aire - Twin Blades',
      forms: {
        combined: { damage: '1d8 rayo', properties: 'Finesse', mastery: 'Sap' },
        separated: { damage: '1d6 rayo c/u', properties: 'Light, Finesse', mastery: 'Vex (Hoja 1), Nick (Hoja 2)' }
      },
      gemInfused: 'No provocas ataques de oportunidad del objetivo atacado'
    },
    earth: {
      name: 'Orbe de Tierra - Warhammer',
      forms: {
        'one-handed': { damage: '1d8 trueno', properties: 'Finesse', mastery: 'Topple' },
        'two-handed': { damage: '2d6 trueno', properties: 'Finesse', mastery: 'Cleave' }
      },
      gemInfused: 'Reduce daño físico por tu bonif. de competencia'
    },
    water: {
      name: 'Orbe de Agua - Trident',
      forms: {
        default: { damage: '1d8 frío', properties: 'Finesse, Thrown (20/60)', mastery: 'Graze' }
      },
      gemInfused: 'Curación adicional igual a tu bonif. de competencia'
    }
  };

  const getWeaponBonus = () => {
    const orbCount = installedOrbs.length;
    if (orbCount >= 4) return 3;
    if (orbCount >= 3) return 2;
    if (orbCount >= 2) return 1;
    return 0;
  };

  const isOneHanded = () => {
    if (activeOrb === 'fire') return true;
    if (activeOrb === 'air') return !bladeSeparated;
    if (activeOrb === 'earth') return hammerGrip === 'one-handed';
    if (activeOrb === 'water') return true;
    return true;
  };

  const getArmorClass = () => {
    const baseAC = 10 + dexMod + wisdomMod;
    let totalAC = isOneHanded() ? baseAC + 2 : baseAC;
    
    // Earth Embodiment bonus (+2 AC at level 14+)
    if (level >= 14 && activeElement === 'earth') {
      totalAC += 2;
    }
    
    return totalAC;
  };

  const isUsingElementalCommunion = () => {
    return activeElement && activeOrb === activeElement && !installedOrbs.includes(activeElement);
  };

  const getPendantData = () => {
    switch(pendantState) {
            case 'dormant':
        return {
          maxCharges: 8,
          recoveryDice: '1d4+2',
          spellBonus: 1,
          spells: {
            'Chromatic Orb': { min: 1, max: 3 },
            'Detect Magic': { min: 1, max: 1 },
            'Dispel Magic': { min: 3, max: 3 }
          }
        };
      case 'awakened':
        return {
          maxCharges: 12,
          recoveryDice: '1d6+2',
          spellBonus: 2,
          spells: {
            'Chromatic Orb': { min: 1, max: 5 },
            'Detect Magic': { min: 1, max: 1 },
            'Dispel Magic': { min: 3, max: 5 },
            'Aether Lance': { min: 3, max: 5 },
            'Aether Storm': { min: 5, max: 5 }
          }
        };
      case 'exalted':
        return {
          maxCharges: 20,
          recoveryDice: '1d6+4',
          spellBonus: 3,
          spells: {
            'Chromatic Orb': { min: 1, max: 8 },
            'Detect Magic': { min: 1, max: 1 },
            'Dispel Magic': { min: 3, max: 5 },
            'Aether Lance': { min: 3, max: 8 },
            'Aether Storm': { min: 5, max: 8 },
            'Antimagic Field': { min: 8, max: 8 }
          }
        };
      default:
        return {
          maxCharges: 20,
          recoveryDice: '1d6+4',
          spellBonus: 3,
          spells: {
            'Chromatic Orb': { min: 1, max: 3 },
            'Detect Magic': { min: 1, max: 1 },
            'Dispel Magic': { min: 3, max: 3 }
          }
        };
    }
  };
  const getPendantSpellNames = () => Object.keys(getPendantData().spells || {});

  const isPendantSpell = (spellName) => !!getPendantData().spells?.[spellName];

  const getPendantChargeRange = (spellName) => {
    const entry = getPendantData().spells?.[spellName];
    if (!entry) return { min: 0, max: 0 };
    const min = Number.isFinite(entry.min) ? entry.min : 0;
    const max = Number.isFinite(entry.max) ? entry.max : min;
    return { min, max };
  };

  const formatPendantCost = (spellName) => {
    const { min, max } = getPendantChargeRange(spellName);
    if (min === 0 && max === 0) return '';
    if (min === max) return `${min} carga${min === 1 ? '' : 's'}`;
    return `${min}-${max} cargas`;
  };

  const getCalculatedSpellSaveDC = () => {
    const pendantData = getPendantData();
    return 8 + proficiencyBonus + wisdomMod + pendantData.spellBonus;
  };

  const getProficiencyBonus = () => {
    return Math.ceil(level / 4) + 1;
  };

  useEffect(() => {
    setProficiencyBonus(getProficiencyBonus());
  }, [level]);

  const startCommunion = (element) => {
    if (elements[element].minLevel > level) {
      alert(`${elements[element].name} no está disponible hasta el nivel ${elements[element].minLevel}`);
      return;
    }
    
    if (element !== 'aether' && usedElements.includes(element)) {
      alert('Ya has usado este elemento en este descanso largo');
      return;
    }
    
    if (wildShapeUses <= 0) {
      alert('No tienes usos de Wild Shape disponibles para iniciar la comunión elemental');
      return;
    }
    
    // Consume 1 uso de Wild Shape
    setWildShapeUses(prev => prev - 1);
    
    setActiveElement(element);
    setCommunionDuration(level >= 10 ? 60 : 10);
    if (element !== 'aether') {
      setUsedElements([...usedElements, element]);
    }
  };

  const endCommunion = () => {
    setActiveElement(null);
    setCommunionDuration(null);
  };

  const rollAttack = (advantage = 'normal') => {
    const rollDie = (sides) => Math.floor(Math.random() * sides) + 1;
    const weaponBonus = getWeaponBonus();
    const attackBonus = proficiencyBonus + weaponBonus + dexMod;

    // Roll d20 with advantage/disadvantage
    const rollD20 = () => {
      if (advantage === 'advantage') {
        const roll1 = rollDie(20);
        const roll2 = rollDie(20);
        const higher = Math.max(roll1, roll2);
        return { result: higher, text: `d20(${roll1}, ${roll2}) toma ${higher}` };
      } else if (advantage === 'disadvantage') {
        const roll1 = rollDie(20);
        const roll2 = rollDie(20);
        const lower = Math.min(roll1, roll2);
        return { result: lower, text: `d20(${roll1}, ${roll2}) toma ${lower}` };
      } else {
        const roll = rollDie(20);
        return { result: roll, text: `d20(${roll})` };
      }
    };

    // Calculate Maelstrom Weapon damage first (applies to all attacks)
    let maelstromDamage = 0;
    let maelstromText = '';
    let primalDamage = 0;
    let primalText = '';

    if (level >= 6) {
      let baseDice = 1;
      if (level >= 17) baseDice = 4;
      else if (level >= 11) baseDice = 3;
      else if (level >= 5) baseDice = 2;
      
      // Sorcerous Burst with exploding 8s mechanics
      let totalDamage = 0;
      let allRolls = [];
      
      for (let i = 0; i < baseDice; i++) {
        let diceRolls = [];
        let currentRoll = rollDie(8);
        diceRolls.push(currentRoll);
        totalDamage += currentRoll;
        
        // If rolled an 8, keep rolling up to wisdom modifier times
        let explosions = 0;
        while (currentRoll === 8 && explosions < wisdomMod) {
          currentRoll = rollDie(8);
          diceRolls.push(currentRoll);
          totalDamage += currentRoll;
          explosions++;
        }
        
        allRolls.push(diceRolls);
      }
      
      maelstromDamage = totalDamage;
      
      // Format the roll text to show explosions
      const rollText = allRolls.map((rolls, i) => {
        if (rolls.length > 1) {
          return `d8(${rolls.join('→')})`;
        } else {
          return `d8(${rolls[0]})`;
        }
      }).join(' + ');
      
      maelstromText = `${rollText} = ${maelstromDamage}`;

      if (level >= 7) {
        const primalDice = (level >= 15) ? 2 : 1;
        const rolls = Array.from({ length: primalDice }, () => rollDie(8));
        primalDamage = rolls.reduce((a, b) => a + b, 0);
        primalText = `${primalDice}d8(${rolls.join('+')}) = +${primalDamage}`;
      }
    }

    if (activeOrb === 'air' && bladeSeparated) {
      // DUAL ATTACK SYSTEM
      const d20Roll1 = rollD20();
      const d20Roll2 = rollD20();
      const attack1Total = d20Roll1.result + attackBonus;
      const attack2Total = d20Roll2.result + attackBonus;

      const damage1_base = rollDie(6);
      const damage2_base = rollDie(6);

      let damage1 = damage1_base + dexMod + weaponBonus;
      let damage2 = damage2_base + weaponBonus;

      const attack1Crit = d20Roll1.result === 20;
      const attack2Crit = d20Roll2.result === 20;

      let critRoll1 = null;
      let critRoll2 = null;

      if (attack1Crit) {
        critRoll1 = rollDie(6);
        damage1 += critRoll1;
      }
      if (attack2Crit) {
        critRoll2 = rollDie(6);
        damage2 += critRoll2;
      }

      let totalMaelstromDamage = maelstromDamage;
      if ((attack1Crit || attack2Crit) && level >= 6) {
        let baseDice = 1;
        if (level >= 17) baseDice = 4;
        else if (level >= 11) baseDice = 3;
        else if (level >= 5) baseDice = 2;

        // Critical Sorcerous Burst with exploding 8s
        let criticalDamage = 0;
        let critAllRolls = [];
        
        for (let i = 0; i < baseDice; i++) {
          let diceRolls = [];
          let currentRoll = rollDie(8);
          diceRolls.push(currentRoll);
          criticalDamage += currentRoll;
          
          // If rolled an 8, keep rolling up to wisdom modifier times
          let explosions = 0;
          while (currentRoll === 8 && explosions < wisdomMod) {
            currentRoll = rollDie(8);
            diceRolls.push(currentRoll);
            criticalDamage += currentRoll;
            explosions++;
          }
          
          critAllRolls.push(diceRolls);
        }
        
        totalMaelstromDamage += criticalDamage;
        
        const critRollText = critAllRolls.map((rolls) => {
          if (rolls.length > 1) {
            return `d8(${rolls.join('→')})`;
          } else {
            return `d8(${rolls[0]})`;
          }
        }).join(' + ');
        
        maelstromText += ` + Crítico: ${critRollText} = +${criticalDamage}`;
      }

      // Sumar PRIMAL STRIKE (y su crítico) al total en ataque dual
      let totalPrimalDamage = primalDamage;

      if ((attack1Crit || attack2Crit) && level >= 7 && primalDamage > 0) {
        const primalDice = (level >= 15) ? 2 : 1;
        const critRolls = Array.from({ length: primalDice }, () => rollDie(8));
        const critSum = critRolls.reduce((a, b) => a + b, 0);
        totalPrimalDamage += critSum;
        primalText += ` + Crítico: ${primalDice}d8(${critRolls.join('+')}) = +${critSum}`;
      }

      if (primalText) {
        primalText += ` daño de rayo`;
      }

      if (maelstromText) {
        maelstromText += ` daño de rayo`;
      }

      const dmgLine1 =
        `Ataque 1: ${d20Roll1.text} + ${attackBonus} = ${attack1Total} → ` +
        `1d6(${damage1_base})` +
        (critRoll1 !== null ? ` + 1d6 crítico(${critRoll1})` : ``) +
        ` + ${dexMod + weaponBonus} = ${damage1} rayo`;

      const dmgLine2 =
        `Ataque 2: ${d20Roll2.text} + ${attackBonus} = ${attack2Total} → ` +
        `1d6(${damage2_base})` +
        (critRoll2 !== null ? ` + 1d6 crítico(${critRoll2})` : ``) +
        ` + ${weaponBonus} = ${damage2} rayo`;

      let damageRoll = `${dmgLine1}\n${dmgLine2}`;
      if (attack1Crit) damageRoll += `\nAtaque 1 CRÍTICO!`;
      if (attack2Crit) damageRoll += `\nAtaque 2 CRÍTICO!`;

      setAttackResult({
        weaponName: morphbladeOrbs[activeOrb].name,
        form: 'separadas (2 ataques)',
        d20Roll: 'Ver ataques individuales',
        attackBonus: attackBonus,
        attackTotal: 'Ver ataques individuales',
        damageType: 'rayo',
        damageRoll: damageRoll,
        maelstromText: maelstromText,
        primalText: primalText, 
        totalDamage: damage1 + damage2 + totalMaelstromDamage + totalPrimalDamage,
        isCritical: attack1Crit || attack2Crit,
        criticalRange: '20',
        advantageText: advantage === 'normal' ? '' : ` (${advantage === 'advantage' ? 'Ventaja' : 'Desventaja'})`
      });
    } else {
      // SINGLE ATTACK SYSTEM
      const d20Roll = rollD20();
      const total = d20Roll.result + attackBonus;
      
      let damageType = '';
      let actualDamage = 0;
      let damageRoll = '';
      let form = '';
      let isCritical = false;

      if (activeOrb === 'fire') {
        form = weaponForm;
        damageType = weaponForm === 'sword' ? 'fuego' : 'fuego';
        const baseDamage = rollDie(8);
        actualDamage = baseDamage + dexMod + weaponBonus;
        damageRoll = `1d8(${baseDamage}) + ${dexMod + weaponBonus} = ${actualDamage}`;
        isCritical = (!isUsingElementalCommunion() && d20Roll.result >= 19) || d20Roll.result === 20;
        
        if (isCritical) {
          const critRoll = rollDie(8);
          actualDamage += critRoll;
          damageRoll = `1d8(${baseDamage}) + 1d8 crítico(${critRoll}) + ${dexMod + weaponBonus} = ${actualDamage}`;
        }
      } else if (activeOrb === 'air') {
        damageType = 'rayo';
        const baseDamage = rollDie(8);
        actualDamage = baseDamage + dexMod + weaponBonus;
        damageRoll = `1d8(${baseDamage}) + ${dexMod + weaponBonus} = ${actualDamage}`;
        form = 'combinadas';
        isCritical = d20Roll.result === 20;
        
        if (isCritical) {
          const critRoll = rollDie(8);
          actualDamage += critRoll;
          damageRoll = `1d8(${baseDamage}) + 1d8 crítico(${critRoll}) + ${dexMod + weaponBonus} = ${actualDamage}`;
        }
      } else if (activeOrb === 'earth') {
        damageType = 'trueno';
        if (hammerGrip === 'two-handed') {
          const d1 = rollDie(6);
          const d2 = rollDie(6);
          actualDamage = d1 + d2 + dexMod + weaponBonus;
          damageRoll = `2d6(${d1}+${d2}) + ${dexMod + weaponBonus} = ${actualDamage}`;
          form = 'a dos manos';
        } else {
          const baseDamage = rollDie(8);
          actualDamage = baseDamage + dexMod + weaponBonus;
          damageRoll = `1d8(${baseDamage}) + ${dexMod + weaponBonus} = ${actualDamage}`;
          form = 'a una mano';
        }
        isCritical = d20Roll.result === 20;
        
        if (isCritical) {
          if (hammerGrip === 'two-handed') {
            const critRoll1 = rollDie(6);
            const critRoll2 = rollDie(6);
            actualDamage += critRoll1 + critRoll2;
            damageRoll = `2d6(${d1}+${d2}) + 2d6 crítico(${critRoll1}+${critRoll2}) + ${dexMod + weaponBonus} = ${actualDamage}`;
          } else {
            const critRoll = rollDie(8);
            actualDamage += critRoll;
            damageRoll = `1d8(${baseDamage}) + 1d8 crítico(${critRoll}) + ${dexMod + weaponBonus} = ${actualDamage}`;
          }
        }
      } else if (activeOrb === 'water') {
        damageType = 'frío';
        const baseDamage = rollDie(8);
        actualDamage = baseDamage + dexMod + weaponBonus;
        damageRoll = `1d8(${baseDamage}) + ${dexMod + weaponBonus} = ${actualDamage}`;
        form = 'tridente';
        isCritical = d20Roll.result === 20;
        
        if (isCritical) {
          const critRoll = rollDie(8);
          actualDamage += critRoll;
          damageRoll = `1d8(${baseDamage}) + 1d8 crítico(${critRoll}) + ${dexMod + weaponBonus} = ${actualDamage}`;
        }
      }

      // Add critical maelstrom damage if single attack crits
      let totalMaelstromDamage = maelstromDamage;
      if (isCritical && level >= 6) {
        let baseDice = 1;
        if (level >= 17) baseDice = 4;
        else if (level >= 11) baseDice = 3;
        else if (level >= 5) baseDice = 2;
        
        // Critical Sorcerous Burst with exploding 8s
        let criticalDamage = 0;
        let critAllRolls = [];
        
        for (let i = 0; i < baseDice; i++) {
          let diceRolls = [];
          let currentRoll = rollDie(8);
          diceRolls.push(currentRoll);
          criticalDamage += currentRoll;
          
          // If rolled an 8, keep rolling up to wisdom modifier times
          let explosions = 0;
          while (currentRoll === 8 && explosions < wisdomMod) {
            currentRoll = rollDie(8);
            diceRolls.push(currentRoll);
            criticalDamage += currentRoll;
            explosions++;
          }
          
          critAllRolls.push(diceRolls);
        }
        
        totalMaelstromDamage += criticalDamage;
        
        const critRollText = critAllRolls.map((rolls) => {
          if (rolls.length > 1) {
            return `d8(${rolls.join('→')})`;
          } else {
            return `d8(${rolls[0]})`;
          }
        }).join(' + ');
        
        maelstromText += ` + Crítico: ${critRollText} = +${criticalDamage}`;
      }

      if (maelstromText) {
        maelstromText += ` daño de ${damageType}`;
      }

      let totalPrimalDamage = primalDamage;

      if (isCritical && level >= 7 && primalDamage > 0) {
        const primalDice = (level >= 15) ? 2 : 1;
        const critRolls = Array.from({ length: primalDice }, () => rollDie(8));
        const critSum = critRolls.reduce((a, b) => a + b, 0);
        totalPrimalDamage += critSum;
        primalText += ` + Crítico: ${primalDice}d8(${critRolls.join('+')}) = +${critSum}`;
      }

      if (primalText) {
        primalText += ` daño de ${damageType}`;
      }

      setAttackResult({
        weaponName: isUsingElementalCommunion() ? 
          `Comunión: ${elements[activeElement].name}` : 
          morphbladeOrbs[activeOrb].name,
        form: form,
        d20Roll: d20Roll.result,
        d20Text: d20Roll.text,
        attackBonus: attackBonus,
        attackTotal: total,
        damageType: damageType,
        damageRoll: damageRoll,
        maelstromText: maelstromText,
        primalText: primalText,
        totalDamage: actualDamage + totalMaelstromDamage + totalPrimalDamage,
        isCritical: isCritical,
        criticalRange: (!isUsingElementalCommunion() && activeOrb === 'fire') ? '19-20' : '20',
        advantageText: advantage === 'normal' ? '' : ` (${advantage === 'advantage' ? 'Ventaja' : 'Desventaja'})`
      });
    }
  };

  // Block/unblock body scroll when modal opens/closes
  useEffect(() => {
    if (showSpellModal || showCastModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSpellModal, showCastModal]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center mb-6 text-purple-400">
        Circle of the Elementalists - Character Sheet
      </h1>
      
      {/* Rest Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          onClick={longRest}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
        >
          🛏️ Descanso Largo
        </button>
        <button 
          onClick={shortRest}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
        >
          ⏰ Descanso Corto
        </button>
      </div>
      
      {/* Character Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Nivel</label>
          <input 
            type="number" 
            value={level} 
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="w-full p-2 bg-gray-700 rounded border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bonif. Competencia</label>
          <p className="w-full p-2 bg-gray-700 rounded border text-center font-medium text-green-400">
            +{proficiencyBonus}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mod. Sabiduría</label>
          <input 
            type="number" 
            value={wisdomMod} 
            onChange={(e) => setWisdomMod(parseInt(e.target.value))}
            className="w-full p-2 bg-gray-700 rounded border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mod. Destreza</label>
          <input 
            type="number" 
            value={dexMod} 
            onChange={(e) => setDexMod(parseInt(e.target.value))}
            className="w-full p-2 bg-gray-700 rounded border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">CD Hechizos</label>
          <p className="w-full p-2 bg-gray-700 rounded border text-center font-medium text-green-400">
            {getCalculatedSpellSaveDC()}
          </p>
        </div>
      </div>

      {/* Wild Shape Counter */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold mb-2 text-orange-400">Wild Shape</h2>
        <div className="flex items-center gap-4 mb-3">
          <div className="text-lg font-bold">
            <span className={wildShapeUses > 0 ? 'text-green-400' : 'text-red-400'}>
              {wildShapeUses}
            </span>
            <span className="text-gray-400">/{maxWildShapeUses} usos</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: maxWildShapeUses }, (_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${
                  i < wildShapeUses ? 'bg-orange-400' : 'bg-gray-500'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setWildShapeUses(Math.max(0, wildShapeUses - 1))}
            disabled={wildShapeUses <= 0}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm"
          >
            Usar (-1)
          </button>
        </div>
        
        {level >= 5 && (
          <div className="border-t border-gray-600 pt-3">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">Wild Resurgence (Nivel 5+)</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={wildResurgenceSpellToWild}
                disabled={wildShapeUses >= maxWildShapeUses}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm"
              >
                📜→🐻 Espacio → Wild Shape
              </button>
              <button
                onClick={wildResurgenceWildToSpell}
                disabled={wildShapeUses <= 0 || wildResurgenceUsed}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm"
              >
                🐻→📜 Wild Shape → Nivel 1
                {wildResurgenceUsed && ' (Usado)'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              • Cualquier espacio → Wild Shape (ilimitado)<br/>
              • Wild Shape → Espacio nivel 1 (1 vez por descanso largo)
            </p>
          </div>
        )}
      </div>

      {/* Spell Slots */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-green-400">Espacios de Conjuro</h2>
        
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(spellSlots).map(([slotLevel, slots]) => {
            if (slots.max === 0) return null;
            
            return (
              <div key={slotLevel} className="bg-gray-700 p-3 rounded text-center">
                <div className="text-sm font-medium text-blue-300 mb-1">Nivel {slotLevel}</div>
                <div className="text-lg font-bold">
                  <span className={slots.current > 0 ? 'text-green-400' : 'text-red-400'}>
                    {slots.current}
                  </span>
                  <span className="text-gray-400">/{slots.max}</span>
                </div>
                <div className="flex gap-1 mt-2 justify-center flex-wrap">
                  {Array.from({ length: slots.max }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < slots.current ? 'bg-blue-400' : 'bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Elemental Communion */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-blue-400">Comunión Elemental</h2>
          
          {activeElement ? (
            <div className="mb-4 p-3 bg-gray-700 rounded border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {elements[activeElement].icon}
                  <span className="font-bold">{elements[activeElement].name} Activo</span>
                </div>
                <button 
                  onClick={endCommunion}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Terminar
                </button>
              </div>
              <p className="text-sm mt-2">Duración: {communionDuration} minutos</p>
              
              {level >= 6 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-blue-300">Elemental Affinity (Nv.6):</p>
                  <p className="text-sm">{elements[activeElement].affinity}</p>
                </div>
              )}
              
              {level >= 14 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-purple-300">Elemental Embodiment (Nv.14):</p>
                  <p className="text-sm">{elements[activeElement].embodiment}</p>
                </div>
              )}
              
              <p className="text-sm mt-2">CA: {getArmorClass()} {isOneHanded() ? '(con mano libre)' : '(sin mano libre)'}</p>
            </div>
          ) : (
            <p className="text-gray-400 mb-4">No hay comunión activa</p>
          )}
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            {Object.entries(elements).map(([key, element]) => {
              const isAvailable = level >= element.minLevel;
              const isUsed = key !== 'aether' && usedElements.includes(key);
              
              return (
                <button
                  key={key}
                  onClick={() => startCommunion(key)}
                  disabled={!isAvailable || isUsed}
                  className={`p-2 rounded border text-sm flex items-center gap-2 transition-colors
                    ${activeElement === key ? 'bg-green-600 border-green-500' : 
                      !isAvailable ? 'bg-gray-600 border-gray-500 opacity-30 cursor-not-allowed' :
                      isUsed ? 'bg-gray-600 border-gray-500 opacity-50 cursor-not-allowed' :
                      'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                >
                  {element.icon}
                  <span className={`${element.color} ${!isAvailable ? 'opacity-50' : ''}`}>
                    {element.name}
                    {!isAvailable && ` (Nv.${element.minLevel})`}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Available Spells */}
          {activeElement && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Hechizos Preparados:</h3>
              <div className="bg-gray-700 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-600">
                      <th className="text-left p-2 font-medium">Nivel Druida</th>
                      <th className="text-left p-2 font-medium">Circle Spells</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const elementSpells = elements[activeElement]?.spells || {};
                      const aetherSpells = elements.aether.spells;
                      const allSpellLevels = new Set([
                        ...Object.keys(elementSpells).map(l => parseInt(l)),
                        ...Object.keys(aetherSpells).map(l => parseInt(l))
                      ]);
                      
                      return Array.from(allSpellLevels).sort((a, b) => a - b).map(spellLevel => {
                        if (level < spellLevel) return null;
                        
                        const elementSpellsForLevel = elementSpells[spellLevel] || [];
                        const aetherSpellsForLevel = aetherSpells[spellLevel] || [];
                        const allSpellsForLevel = [...elementSpellsForLevel, ...aetherSpellsForLevel];
                        const uniqueSpells = [...new Set(allSpellsForLevel)];
                        
                        return (
                          <tr key={spellLevel} className="border-b border-gray-600 last:border-b-0">
                            <td className="p-2 font-medium text-blue-300">{spellLevel}</td>
                            <td className="p-2">
                              {uniqueSpells.map((spell, idx) => (
                                <span key={spell}>
                                  <button
                                    onClick={() => {
                                      setSelectedSpell(spell);
                                      setShowSpellModal(true);
                                    }}
                                    className="text-blue-200 hover:text-blue-100 hover:underline cursor-pointer"
                                  >
                                    {spell}
                                  </button>
                                  {idx < uniqueSpells.length - 1 && ', '}
                                </span>
                              ))}
                            </td>
                          </tr>
                        );
                      }).filter(Boolean);
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Morphblade */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-red-400">Elemental Morphblade</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-300">
              Bonus de Arma: +{getWeaponBonus()} ({installedOrbs.length}/4 orbes instalados)
            </p>
          </div>
          
          {/* Orb Management */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Orbes Instalados:</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {['fire', 'air', 'water', 'earth'].map(orb => (
                <button
                  key={orb}
                  onClick={() => {
                    if (installedOrbs.includes(orb)) {
                      const newOrbs = installedOrbs.filter(o => o !== orb);
                      setInstalledOrbs(newOrbs);
                      if (activeOrb === orb && newOrbs.length > 0) {
                        setActiveOrb(newOrbs[0]);
                      }
                    } else if (installedOrbs.length < 4) {
                      setInstalledOrbs([...installedOrbs, orb]);
                    }
                  }}
                  className={`p-2 rounded text-sm border transition-colors
                    ${installedOrbs.includes(orb) 
                      ? 'bg-green-600 border-green-500' 
                      : installedOrbs.length >= 4 
                        ? 'bg-gray-600 border-gray-500 opacity-50 cursor-not-allowed'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                  disabled={!installedOrbs.includes(orb) && installedOrbs.length >= 4}
                >
                  {orb === 'fire' && '🔥'} 
                  {orb === 'air' && '💨'} 
                  {orb === 'water' && '💧'} 
                  {orb === 'earth' && '🗿'}
                  {' '}
                  {orb === 'fire' && 'Fuego'}
                  {orb === 'air' && 'Aire'}
                  {orb === 'water' && 'Agua'}
                  {orb === 'earth' && 'Tierra'}
                  {installedOrbs.includes(orb) && ' ✓'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Active Orb Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Orbe/Elemento Activo:</label>
            <select 
              value={activeOrb} 
              onChange={(e) => setActiveOrb(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border"
            >
              {installedOrbs.map(orb => (
                <option key={orb} value={orb}>
                  🔮 {morphbladeOrbs[orb].name}
                </option>
              ))}
              {activeElement && !installedOrbs.includes(activeElement) && ['fire', 'air', 'earth', 'water'].includes(activeElement) && (
                <option value={activeElement}>
                  ⚡ Comunión Elemental - {elements[activeElement].name}
                </option>
              )}
            </select>
          </div>
          
          {/* Weapon Form Controls */}
          {activeOrb === 'fire' && (
            <div className="mb-4">
              <button
                onClick={() => setWeaponForm(weaponForm === 'sword' ? 'gun' : 'sword')}
                className={`px-4 py-2 rounded ${weaponForm === 'sword' ? 'bg-red-600' : 'bg-red-500'}`}
              >
                {weaponForm === 'sword' ? 'Cambiar a Pistola' : 'Cambiar a Espada'}
              </button>
            </div>
          )}
          
          {activeOrb === 'air' && (
            <div className="mb-4">
              <button
                onClick={() => setBladeSeparated(!bladeSeparated)}
                className={`px-4 py-2 rounded ${bladeSeparated ? 'bg-blue-600' : 'bg-blue-500'}`}
              >
                {bladeSeparated ? 'Combinar Hojas' : 'Separar Hojas'}
              </button>
            </div>
          )}
          
          {activeOrb === 'earth' && (
            <div className="mb-4">
              <button
                onClick={() => setHammerGrip(hammerGrip === 'one-handed' ? 'two-handed' : 'one-handed')}
                className={`px-4 py-2 rounded ${hammerGrip === 'two-handed' ? 'bg-yellow-600' : 'bg-yellow-500'}`}
              >
                {hammerGrip === 'one-handed' ? 'Usar a Dos Manos' : 'Usar a Una Mano'}
              </button>
            </div>
          )}
          
          {/* Weapon Stats Display */}
          <div className="mb-4 p-3 bg-gray-700 rounded">
            <h3 className="font-bold mb-2">
              {isUsingElementalCommunion() ? 
                `Comunión: ${elements[activeElement].name}` : 
                morphbladeOrbs[activeOrb].name
              }
            </h3>
            {Object.entries(morphbladeOrbs[activeOrb].forms).map(([formName, stats]) => {
              let shouldShow = true;
              if (activeOrb === 'fire') shouldShow = formName === weaponForm;
              if (activeOrb === 'air') shouldShow = (bladeSeparated && formName === 'separated') || (!bladeSeparated && formName === 'combined');
              if (activeOrb === 'earth') shouldShow = formName === hammerGrip;
              if (activeOrb === 'water') shouldShow = formName === 'default';
              
              if (shouldShow) {
                return (
                  <div key={formName} className="text-sm">
                    <p><strong>Daño:</strong> {stats.damage}</p>
                    <p><strong>Propiedades:</strong> {stats.properties}</p>
                    <p><strong>Mastery:</strong> {stats.mastery}</p>
                    {stats.range && <p><strong>Alcance:</strong> {stats.range}</p>}
                  </div>
                );
              }
              return null;
            })}
            {!isUsingElementalCommunion() && (
              <p className="text-xs text-blue-300 mt-2">
                <strong>Gema Infundida:</strong> {morphbladeOrbs[activeOrb].gemInfused}
              </p>
            )}
          </div>
          
          {/* Attack Roll Button */}
          <div className="w-full mb-4">
            <div className="flex rounded font-bold text-lg overflow-hidden">
              {/* Disadvantage */}
              <button 
                onClick={() => rollAttack('disadvantage')}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 flex items-center justify-center gap-1 border-r border-red-500"
              >
                <span className="text-sm">📉</span>
                <span className="hidden sm:inline">Desv.</span>
              </button>
              
              {/* Normal */}
              <button 
                onClick={() => rollAttack('normal')}
                className="flex-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2 border-r border-purple-500"
              >
                <Dice6 className="w-5 h-5" />
                <span>Atacar</span>
              </button>
              
              {/* Advantage */}
              <button 
                onClick={() => rollAttack('advantage')}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-1 border-l border-green-500"
              >
                <span className="text-sm">📈</span>
                <span className="hidden sm:inline">Vent.</span>
              </button>
            </div>
          </div>
          
          {/* Attack Results */}
          {attackResult && (
            <div className="p-4 bg-gray-700 rounded border-l-4 border-purple-500">
              <h3 className="font-bold text-purple-300 mb-2">🎲 Resultado del Ataque</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Arma:</strong> {attackResult.weaponName} ({attackResult.form}){attackResult.advantageText}</p>
                <p><strong>Ataque:</strong> {typeof attackResult.d20Roll === 'string' ? attackResult.d20Roll : 
                  attackResult.d20Text ? `${attackResult.d20Text} + ${attackResult.attackBonus} = ${attackResult.attackTotal}` :
                  `d20(${attackResult.d20Roll}) + ${attackResult.attackBonus} = ${attackResult.attackTotal}`}</p>
                <div><strong>Daño de arma:</strong> {attackResult.damageRoll} de {attackResult.damageType}
                </div>
                {attackResult.maelstromText && (
                  <p><strong>Maelstrom Weapon (Sorcerous Burst): </strong> {attackResult.maelstromText}</p>
                )}
                {attackResult.primalText && (
                  <p>
                    <strong>Elemental Fury (Primal Strike): </strong>{attackResult.primalText}
                  </p>
                )}
                {attackResult.isCritical && (
                  <p className="text-yellow-400"><strong>🎯 ¡CRÍTICO!</strong></p>
                )}
                <p className="text-red-400"><strong>💀 DAÑO TOTAL: {attackResult.totalDamage}</strong></p>
                <p className="text-xs text-gray-400">Crítico en: {attackResult.criticalRange}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Aether Pendant */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Aether Pendant</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Estado del Pendant:</label>
          <select 
            value={pendantState} 
            onChange={(e) => {
              setPendantState(e.target.value);
              const newData = getPendantData();
              setPendantCharges(Math.min(pendantCharges, newData.maxCharges));
            }}
            className="w-full p-2 bg-gray-700 rounded border text-white"
          >
            <option value="dormant">Dormant</option>
            <option value="awakened">Awakened</option>
            <option value="exalted">Exalted</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cargas Actuales</label>
            <input 
              type="number" 
              value={pendantCharges} 
              onChange={(e) => {
                const pendantData = getPendantData();
                setPendantCharges(Math.max(0, Math.min(pendantData.maxCharges, parseInt(e.target.value) || 0)));
              }}
              className="w-full p-2 bg-gray-700 rounded border text-white"
              min="0" 
              max={getPendantData().maxCharges}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cargas Máximas</label>
            <p className="p-2 bg-gray-700 rounded border text-center">{getPendantData().maxCharges}</p>
          </div>
        </div>
        
        <div className="text-sm text-gray-300">
          <p><strong>Bonificaciones:</strong> +{getPendantData().spellBonus} a ataques de hechizo y CD de salvación</p>
          <div className="mt-2">
            <p><strong>Hechizos disponibles:</strong></p>
            <div className="ml-4 mt-1">
              {Object.entries(getPendantData().spells).map(([spell, _cost]) => (
                <p key={spell} className="text-xs">• {spell} ({formatPendantCost(spell)})</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prepared Spells */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">Mis Hechizos Preparados</h2>
        
        <div className="space-y-3">
          {(() => {
            const allPreparedSpells = getAllPreparedSpells();
            const spellsByLevel = {};
            
            // Group spells by level
            allPreparedSpells.forEach(spell => {
              const spellLevel = getSpellLevel(spell);
              if (!spellsByLevel[spellLevel]) {
                spellsByLevel[spellLevel] = [];
              }
              spellsByLevel[spellLevel].push(spell);
            });
            
            // Sort levels and render
            return Object.keys(spellsByLevel).sort((a, b) => parseInt(a) - parseInt(b)).map(spellLevel => {
              const levelNum = parseInt(spellLevel);
              const levelName = levelNum === 0 ? 'Cantrips (Ilimitados)' : `Nivel ${levelNum}`;
              const spells = spellsByLevel[spellLevel];
              
              return (
                <div key={spellLevel}>
                  <h3 className="font-semibold text-blue-300 mb-2">{levelName}</h3>
                  <div className="flex flex-wrap gap-2">
                    {spells.map(spell => {
                      const isFromCommunion = !preparedSpells.includes(spell);
                      const fromPendant = isPendantSpell(spell);
                      return (
                        <div key={spell} className="flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedSpell(spell);
                              setShowSpellModal(true);
                            }}
                            title={fromPendant ? `Del pendiente • ${formatPendantCost(spell)}` : (isFromCommunion ? 'Comunión elemental' : '')}
                            className={`px-3 py-1 rounded text-sm ${
                              levelNum === 0 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : fromPendant
                                  ? 'bg-yellow-600 hover:bg-yellow-700'
                                  : isFromCommunion
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                            >
                              {spell}
                              {fromPendant && <span className="ml-1">{'📿'}</span>}
                              {!fromPendant && isFromCommunion && ' ✨'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
      
      {/* Spell Modal */}
      {showSpellModal && selectedSpell && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowSpellModal(false)}
        >
          <div 
            className="bg-gray-800 rounded-lg max-w-2xl w-full my-4 border border-gray-600"
            onClick={(e) => e.stopPropagation()}
            style={{minHeight: 'auto', maxHeight: 'none'}}
          >
            <div className="bg-gray-800 p-4 border-b border-gray-600 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-bold text-purple-400">{selectedSpell}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    requestCast(selectedSpell);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold text-sm flex items-center gap-1"
                >
                  ⚡ Lanzar
                </button>
                <button
                  onClick={() => setShowSpellModal(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded hover:bg-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              {spellDatabase[selectedSpell] ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><strong>Nivel:</strong> {spellDatabase[selectedSpell].level}</div>
                    <div><strong>Escuela:</strong> {spellDatabase[selectedSpell].school}</div>
                    <div><strong>Tiempo de Lanzamiento:</strong> {spellDatabase[selectedSpell].castingTime}</div>
                    <div><strong>Alcance:</strong> {spellDatabase[selectedSpell].range}</div>
                    <div><strong>Componentes:</strong> {spellDatabase[selectedSpell].components}</div>
                    <div><strong>Duración:</strong> {spellDatabase[selectedSpell].duration}</div>
                  </div>
                  <hr className="border-gray-600" />
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {spellDatabase[selectedSpell].description}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>Descripción no disponible para este hechizo.</p>
                  <p className="text-sm mt-2">Hechizo: <strong>{selectedSpell}</strong></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cast Spell Modal */}
      {showCastModal && spellToCast && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowCastModal(false);
            setSpellToCast(null);
          }}
        >
          <div 
            className="bg-gray-800 rounded-lg max-w-md w-full border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-800 p-4 border-b border-gray-600 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-bold text-green-400">Lanzar {spellToCast}</h2>
              <button
                onClick={() => {
                  setShowCastModal(false);
                  setSpellToCast(null);
                }}
                className="text-gray-400 hover:text-white text-3xl font-bold w-12 h-12 flex items-center justify-center rounded hover:bg-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {/* Cantrips don't need spell slots */}
              {getSpellLevel(spellToCast) === 0 ? (
                <div className="text-center">
                  <p className="text-blue-300 mb-4">Los cantrips se pueden lanzar ilimitadamente</p>
                  <button
                    onClick={() => {
                      alert(`Has lanzado ${spellToCast} (Cantrip)`);
                      setShowCastModal(false);
                      setSpellToCast(null);
                    }}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-bold"
                  >
                    ⚡ Lanzar Cantrip
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-2 bg-gray-700 rounded">
                    <p className="text-sm text-gray-300">
                      <strong>{spellToCast}</strong> es un hechizo de <strong>nivel {getSpellLevel(spellToCast)}</strong>
                    </p>
                  </div>
                  <p className="text-gray-300 mb-4">Selecciona el nivel del espacio de conjuro:</p>
                  <div className="space-y-2">
                    {Object.entries(spellSlots).map(([slotLevel, slots]) => {
                      if (slots.max === 0) return null;
                      const slotNum = parseInt(slotLevel);
                      const minLevel = getSpellLevel(spellToCast);
                      const canUse = slotNum >= minLevel && slots.current > 0;
                      const isUpcast = slotNum > minLevel;
                      
                      return (
                        <button
                          key={slotLevel}
                          onClick={() => castSpell(spellToCast, slotNum)}
                          disabled={!canUse}
                          className={`w-full p-3 rounded text-left flex justify-between items-center ${
                            canUse
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span>
                            Nivel {slotLevel}
                            {isUpcast && <span className="text-yellow-300"> (Upcast)</span>}
                            {slotNum < minLevel && <span className="text-red-300"> (Muy bajo)</span>}
                          </span>
                          <span className="text-sm">
                            {slots.current > 0 ? `${slots.current} disponibles` : 'Agotado'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementalistSheet;