import React, { useState, useEffect } from 'react';
import { Sword, Zap, Droplets, Mountain, Wind, Clock, Move3D, Sparkles, Dice6 } from 'lucide-react';

const ElementalistSheet = () => {
  // Character stats
  const [level, setLevel] = useState(14);
  const [proficiencyBonus, setProficiencyBonus] = useState(5);
  const [wisdomMod, setWisdomMod] = useState(4);
  const [dexMod, setDexMod] = useState(4);
  const [spellAttackBonus, setSpellAttackBonus] = useState(12);
  const [spellSaveDC, setSpellSaveDC] = useState(20);
  
  // Attack results
  const [attackResult, setAttackResult] = useState(null);
  
  // Elemental Communion state
  const [activeElement, setActiveElement] = useState(null);
  const [communionDuration, setCommunionDuration] = useState(null);
  const [usedElements, setUsedElements] = useState([]);
  
  // Morphblade state
  const [installedOrbs, setInstalledOrbs] = useState(['fire', 'air', 'earth', 'water']);
  const [activeOrb, setActiveOrb] = useState('fire');
  const [weaponForm, setWeaponForm] = useState('sword');
  const [bladeSeparated, setBladeSeparated] = useState(false);
  const [hammerGrip, setHammerGrip] = useState('one-handed');
  
  // Pendant state
  const [pendantCharges, setPendantCharges] = useState(20);
  const [pendantState, setPendantState] = useState('exalted');
  
  // Modal state
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [showSpellModal, setShowSpellModal] = useState(false);

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
      affinity: 'Ventaja en chequeos de Fuerza y salvaciones contra empuje/derribo',
      embodiment: 'Tu CA aumenta en 1',
      minLevel: 3
    },
    aether: { 
      name: 'Aether', 
      icon: <Sparkles className="w-4 h-4" />, 
      color: 'text-purple-500',
      spells: {
        3: ['Sorcerous Burst', 'Chromatic Orb', "Dragon's Breath"],
        5: ['Protection from Energy'],
        7: ['Conjure Elemental Guardians'],
        9: ['Wrath of the Elements']
      },
      affinity: '+1 bonus a todas tus tiradas de salvación',
      embodiment: '+1d4 bonus a todas las pruebas d20',
      minLevel: 3
    },
    time: { 
      name: 'Tiempo', 
      icon: <Clock className="w-4 h-4" />, 
      color: 'text-indigo-500',
      spells: {
        3: ['Mind Sliver', 'Temporal Skip', "Fortune's Favor"],
        5: ['Slow'],
        7: ['Staggering Smite'],
        9: ['Temporal Shunt']
      },
      affinity: 'Tu velocidad de movimiento aumenta en 10 pies',
      embodiment: 'Cuando sacas 1 en una prueba d20, puedes volver a tirar (usar nuevo resultado)',
      minLevel: 10
    },
    space: { 
      name: 'Espacio', 
      icon: <Move3D className="w-4 h-4" />, 
      color: 'text-gray-500',
      spells: {
        3: ['Sapping Sting', 'Magnify Gravity', 'Immovable Object'],
        5: ['Pulse Wave'],
        7: ['Gravity Sinkhole'],
        9: ['Telekinesis']
      },
      affinity: 'Obtienes visión ciega hasta 10 pies',
      embodiment: 'Como acción bonus, empujar telequinéticamente una criatura a 30 pies',
      minLevel: 10
    }
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
    }
  };

  const morphbladeOrbs = {
    fire: {
      name: 'Orbe de Fuego - Gunblade',
      forms: {
        sword: { damage: '1d8 cortante', properties: 'Finesse', mastery: 'Vex' },
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
    return isOneHanded() ? baseAC + 2 : baseAC;
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
            'Chromatic Orb': '1-3 cargas',
            'Detect Magic': '1 carga',
            'Dispel Magic': '3 cargas'
          }
        };
      case 'awakened':
        return {
          maxCharges: 12,
          recoveryDice: '1d6+2',
          spellBonus: 2,
          spells: {
            'Chromatic Orb': '1-5 cargas',
            'Detect Magic': '1 carga',
            'Dispel Magic': '3 cargas',
            'Counterspell': '3 cargas',
            'Circle of Power': '5 cargas'
          }
        };
      case 'exalted':
        return {
          maxCharges: 20,
          recoveryDice: '1d6+4',
          spellBonus: 3,
          spells: {
            'Chromatic Orb': '1-8 cargas',
            'Detect Magic': '1 carga',
            'Dispel Magic': '3 cargas',
            'Counterspell': '3 cargas',
            'Circle of Power': '5 cargas',
            'Temporal Shunt': '5 cargas',
            'Antimagic Field': '8 cargas'
          }
        };
      default:
        return {
          maxCharges: 20,
          recoveryDice: '1d6+4',
          spellBonus: 3,
          spells: {
            'Chromatic Orb': '1-8 cargas',
            'Detect Magic': '1 carga',
            'Dispel Magic': '3 cargas',
            'Counterspell': '3 cargas',
            'Circle of Power': '5 cargas',
            'Temporal Shunt': '5 cargas',
            'Antimagic Field': '8 cargas'
          }
        };
    }
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

  const rollAttack = () => {
    const rollDie = (sides) => Math.floor(Math.random() * sides) + 1;
    const weaponBonus = getWeaponBonus();
    const attackBonus = proficiencyBonus + weaponBonus + dexMod;

    // Calculate Maelstrom Weapon damage first (applies to all attacks)
    let maelstromDamage = 0;
    let maelstromText = '';

    if (level >= 6) {
      let baseDice = 1;
      if (level >= 17) baseDice = 4;
      else if (level >= 11) baseDice = 3;
      else if (level >= 5) baseDice = 2;
      
      let totalDamage = 0;
      let diceRolled = [];
      
      for (let i = 0; i < baseDice; i++) {
        const roll = rollDie(8);
        diceRolled.push(roll);
        totalDamage += roll;
      }
      
      maelstromDamage = totalDamage;
      maelstromText = `Maelstrom Weapon: Sorcerous Burst ${baseDice}d8(${diceRolled.join('+')}) = ${maelstromDamage}`;
    }

    if (activeOrb === 'air' && bladeSeparated) {
      // DUAL ATTACK SYSTEM (mostrar el dado extra del crítico en el texto)
      const d20_1 = rollDie(20);
      const d20_2 = rollDie(20);
      const attack1Total = d20_1 + attackBonus;
      const attack2Total = d20_2 + attackBonus;

      const damage1_base = rollDie(6);
      const damage2_base = rollDie(6);

      let damage1 = damage1_base + dexMod + weaponBonus;
      let damage2 = damage2_base + weaponBonus;

      const attack1Crit = d20_1 === 20;
      const attack2Crit = d20_2 === 20;

      // Guardamos los dados de crítico para mostrarlos en el texto
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

      // Maelstrom: si cualquier ataque es crítico, añade sus dados extra y muéstralos
      let totalMaelstromDamage = maelstromDamage;
      if ((attack1Crit || attack2Crit) && level >= 6) {
        let baseDice = 1;
        if (level >= 17) baseDice = 4;
        else if (level >= 11) baseDice = 3;
        else if (level >= 5) baseDice = 2;

        let criticalDamage = 0;
        let criticalDiceRolled = [];
        for (let i = 0; i < baseDice; i++) {
          const roll = rollDie(8);
          criticalDiceRolled.push(roll);
          criticalDamage += roll;
        }
        totalMaelstromDamage += criticalDamage;
        maelstromText += ` + Crítico: ${baseDice}d8(${criticalDiceRolled.join('+')}) = +${criticalDamage}`;
      }

      if (maelstromText) {
        maelstromText += ` daño de rayo`;
      }

      const dmgLine1 =
        `Ataque 1: d20(${d20_1}) + ${attackBonus} = ${attack1Total} → ` +
        `1d6(${damage1_base})` +
        (critRoll1 !== null ? ` + 1d6 crítico(${critRoll1})` : ``) +
        ` + ${dexMod + weaponBonus} = ${damage1} rayo`;

      const dmgLine2 =
        `Ataque 2: d20(${d20_2}) + ${attackBonus} = ${attack2Total} → ` +
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
        totalDamage: damage1 + damage2 + totalMaelstromDamage,
        isCritical: attack1Crit || attack2Crit,
        criticalRange: '20'
      });
    } else {
      // SINGLE ATTACK SYSTEM
      const d20 = rollDie(20);
      const total = d20 + attackBonus;
      
      let damageType = '';
      let actualDamage = 0;
      let damageRoll = '';
      let form = '';
      let isCritical = false;

      if (activeOrb === 'fire') {
        form = weaponForm;
        damageType = weaponForm === 'sword' ? 'cortante' : 'fuego';
        const baseDamage = rollDie(8);
        actualDamage = baseDamage + dexMod + weaponBonus;
        damageRoll = `1d8(${baseDamage}) + ${dexMod + weaponBonus} = ${actualDamage}`;
        isCritical = (!isUsingElementalCommunion() && d20 >= 19) || d20 === 20;
        
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
        isCritical = d20 === 20;
        
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
        isCritical = d20 === 20;
        
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
        isCritical = d20 === 20;
        
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
        
        let criticalDamage = 0;
        let criticalDiceRolled = [];
        
        for (let i = 0; i < baseDice; i++) {
          const roll = rollDie(8);
          criticalDiceRolled.push(roll);
          criticalDamage += roll;
        }
        
        totalMaelstromDamage += criticalDamage;
        maelstromText += ` + Crítico: ${baseDice}d8(${criticalDiceRolled.join('+')}) = +${criticalDamage}`;
      }

      if (maelstromText) {
        maelstromText += ` daño de ${damageType}`;
      }

      setAttackResult({
        weaponName: isUsingElementalCommunion() ? 
          `Comunión: ${elements[activeElement].name}` : 
          morphbladeOrbs[activeOrb].name,
        form: form,
        d20Roll: d20,
        attackBonus: attackBonus,
        attackTotal: total,
        damageType: damageType,
        damageRoll: damageRoll,
        maelstromText: maelstromText,
        totalDamage: actualDamage + totalMaelstromDamage,
        isCritical: isCritical,
        criticalRange: (!isUsingElementalCommunion() && activeOrb === 'fire') ? '19-20' : '20'
      });
    }
  };

  const getAvailableSpells = () => {
    if (!activeElement) return [];
    
    const elementSpells = elements[activeElement]?.spells || {};
    const aetherSpells = elements.aether.spells;
    
    let spells = [];
    
    // Add element spells up to current level
    Object.keys(elementSpells).forEach(spellLevel => {
      if (level >= parseInt(spellLevel)) {
        spells = [...spells, ...elementSpells[spellLevel]];
      }
    });
    
    // Add Aether spells up to current level
    Object.keys(aetherSpells).forEach(spellLevel => {
      if (level >= parseInt(spellLevel)) {
        spells = [...spells, ...aetherSpells[spellLevel]];
      }
    });
    
    return [...new Set(spells)]; // Remove duplicates
  };

  // Block/unblock body scroll when modal opens/closes
  useEffect(() => {
    if (showSpellModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSpellModal]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center mb-6 text-purple-400">
        Circle of the Elementalists - Character Sheet
      </h1>
      
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
          <p className="text-xs text-gray-400 mt-1">Calculado por nivel</p>
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
          <p className="text-xs text-gray-400 mt-1">8 + Prof + Sab + Pendant</p>
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
          
          <button 
            onClick={() => setUsedElements([])}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Descanso Largo (Reset Elementos)
          </button>
          
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
          <button 
            onClick={rollAttack}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded font-bold text-lg flex items-center justify-center gap-2 mb-4"
          >
            <Dice6 className="w-5 h-5" />
            Rodar Ataque
            {level >= 6 && <span className="text-sm">(+ Maelstorm Weapon)</span>}
          </button>
          
          {/* Attack Results */}
          {attackResult && (
            <div className="p-4 bg-gray-700 rounded border-l-4 border-purple-500">
              <h3 className="font-bold text-purple-300 mb-2">🎲 Resultado del Ataque</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Arma:</strong> {attackResult.weaponName} ({attackResult.form})</p>
                <p><strong>Ataque:</strong> {typeof attackResult.d20Roll === 'string' ? attackResult.d20Roll : `d20(${attackResult.d20Roll}) + ${attackResult.attackBonus} = ${attackResult.attackTotal}`}</p>
                <div><strong>Daño {attackResult.damageType}:</strong> 
                  <div className="whitespace-pre-line ml-2">{attackResult.damageRoll}</div>
                </div>
                {attackResult.maelstromText && (
                  <div className="whitespace-pre-line"><strong>{attackResult.maelstromText}</strong></div>
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
        
        <div className="grid grid-cols-3 gap-4 mb-4">
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
          <div>
            <button 
              onClick={() => {
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
                alert(`Recuperadas ${recovered} cargas al amanecer (${pendantData.recoveryDice})`);
              }}
              className="h-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
            >
              Recuperar (Amanecer)
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-300">
          <p><strong>Bonificaciones:</strong> +{getPendantData().spellBonus} a ataques de hechizo y CD de salvación</p>
          <div className="mt-2">
            <p><strong>Hechizos disponibles:</strong></p>
            <div className="ml-4 mt-1">
              {Object.entries(getPendantData().spells).map(([spell, cost]) => (
                <p key={spell} className="text-xs">• {spell} ({cost})</p>
              ))}
            </div>
          </div>
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
              <button
                onClick={() => setShowSpellModal(false)}
                className="text-gray-400 hover:text-white text-3xl font-bold w-12 h-12 flex items-center justify-center rounded hover:bg-gray-700"
              >
                ×
              </button>
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
    </div>
  );
};

export default ElementalistSheet;