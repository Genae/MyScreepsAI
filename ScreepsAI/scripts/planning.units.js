
//Available Energy for Units
let roomLevels = [300, 550, 800, 1300, 1800, 2300];
let getLevel = function (room) {
    for(let i = 0; i < roomLevels.length; i++){
        if (room.energyCapacityAvailable <= roomLevels[i]){
            return i;
        }
    }
};

let getStoredEnergy = function (room) {
    return room.storage === undefined ? -1 : room.storage.store[RESOURCE_ENERGY];
};

let buildUnits = function (room) {
    if(room.energyAvailable < 75)
        room.memory.info.energy.canBuild = false; // block building if not enough energy

    let spawns = room.find(FIND_MY_STRUCTURES, {
        filter: {structureType: STRUCTURE_SPAWN}
    });
    if (spawns.length === 0) {
        room.memory.info.energy.canBuild = true;
        return;
    }
    let spawnReady;
    for (let spawn of spawns){
        if (spawn.spawnCreep([MOVE], 'test', {dryRun: true}) === 0)
        {
            spawnReady = spawn;
            break;
        }
    }
    if (spawnReady === undefined) {
        return; //can't do anything
    }

    if (room.energyCapacityAvailable <= room.energyAvailable) {
        room.memory.info.energy.fullSpawn++;
    } else {
        room.memory.info.energy.fullSpawn = 0;
    }
    let myTargets = getTargets(room, Memory.globalInfo.roomsUnderAttack.length);
    let myUnits = {};
    for (let name in Game.creeps) {
        if (Game.creeps[name].ticksToLive < 90 || room.name !== Game.creeps[name].memory.roomName)
            continue;
        let role = Game.creeps[name].memory.role;
        if (myUnits[role] === undefined) {
            myUnits[role] = 1;
        } else {
            myUnits[role]++;
        }
    }

    if (myTargets.length === 0){
        console.log("No targets.");
    }
    
    for (let t = 0; t < myTargets.length; t++) {
        if (myUnits[myTargets[t].role] === undefined)
            myUnits[myTargets[t].role] = 0;
        if (myUnits[myTargets[t].role] < myTargets[t].amount) {
            if (myTargets[t].role === 'builder' || myTargets[t].role === 'upgrader') {
                room.memory.info.energy.canBuild = true;
                if ((room.memory.info.energy.fullSpawn > 3 && getStoredEnergy(room) === -1) || getStoredEnergy(room) > myUnits[myTargets[t].role] * 50000 * Math.min(1, (room.controller.level - 4)) || (myUnits[myTargets[t].role] === 0 && myTargets[t].role === 'upgrader')) {
                    createCreep(myTargets[t].body, myTargets[t].role, spawnReady);
                    break;
                }
                else {
                    break;
                }
            }
            else {
                if (createCreep(myTargets[t].body, myTargets[t].role, spawnReady) === ERR_NOT_ENOUGH_ENERGY) {
                    console.log("Not enoug energy for creep, block building");
                    room.memory.info.energy.canBuild = false;
                    return;
                }
            }
            return;
        }
    }
    room.memory.info.energy.canBuild = true; // every unit built, build again.
};

let createCreep  = function (body, role, spawn) {
    let name = generateName("[" + capitalizeFirstLetter(role) + "]");
    return spawn.spawnCreep(body, name, {memory:{role:role}});
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

let firstName = ["Serewine","Oraha","Macmuel","Pherbri","Sora","Betjohn","Ke-ald","Brasge","Ricchris","Georo","Bethmond","Donsan","Thywald","Edcas","Eli","Leycuth","Andkim","Carbar","Eabeth","Nijeff","Minald","Songard","Lafcan","Renchell","Uwine","Pesara","Cuth","Ridsha","Nangard","Nielliam","Lesdon","Wynceo","Pher","Anea","Sanbert","Ronever","Meri","Jalett","Vin","Ly'wise","Bertmit","Dinona","Bertisen","Cas","Edferth","Rolwyn","Ingret","Aneverjo","Tompa","Branddra","Ridmuel","Ronegel","Meritol","Nasmac","Vinceol","Ferdisen","Gardmescrow","Fortinnan","Chetealpe","Vidbert"];
let secondName = ["Rageblue","Manday","Force","Maw","Shinesummer","Fire-dwarf","Walkerram","Wavegate","Dragonhell","Helmeye","Batsummer","Orecat","Hair","Sheeplock","Breakpaladin","Wyrmgray","Swordblue","Mightautumn","Tall","Staffbow","Wallpower","Thunderduskfire","Mawmight","Bluehair","Hillhound","Bushsand","Shieldsun","Lipsdagger","Darkhunter","Warblur","Bush","Breezeblue","Bearhelm","Capelander","Bullspear","Axeland","Blackbolt","Hameear","Steelwargblue","Moose-maze","Wallstar","Goldbane","Shorthalf","Batwind","Arrowwarrior","Arrowrain","Walksun","Pickerstorm","Glazesummer","Lipsforce","Longsword","Gliderglaze","Shortblood","Swordwhite","Breaktree","Whitequiver","Fullcyan","Daggerbird","Screamblur","Houndhunt"];
let generateName = function (prefix) {
    let name, isNameTaken, tries = 0;
    do {
        let fname = firstName[Math.floor(Math.random() * firstName.length)];
        let sname = secondName[Math.floor(Math.random() * secondName.length)];
        if (tries > 3){
            fname += "-" + fname[Math.floor(Math.random() * fname.length)];
        }
        name = prefix + " " + fname + " " + sname;
        tries++;
        isNameTaken = Game.creeps[name] !== undefined;
    } while (isNameTaken);

    return name;
};

//Target Units
let getTargets = function (room, anyUnderAttack) {
    let level = getLevel(room);
    if (level < 0) {
        return [];
    }
    let miningJobs = 0;
    for (let i = 0; i < room.memory.structures.mines.length; i++) {
        if (level < 3)
            miningJobs += Math.min(4, room.memory.structures.mines[i].workingPlaces.length + 1);
        else
            miningJobs += Math.min(3, room.memory.structures.mines[i].workingPlaces.length + 1);
    }
    let attackFlags = [];
    let miningFlags = [];
    let reservingJobs = 0;
    let claimingJobs = 0;
    let slaverooms = {};
    for (let flag in Game.flags) {
        if (Game.flags[flag].color === COLOR_YELLOW && Game.flags[flag].pos.roomName === room.name) {
            attackFlags.push(Game.flags[flag]);
        }
        if (Game.flags[flag].color === COLOR_BLUE && Memory.rooms[Game.flags[flag].pos.roomName].info.masterRoom === room.name) {
            claimingJobs++;
        }
        if (Game.flags[flag].color === COLOR_BROWN && Memory.rooms[Game.flags[flag].pos.roomName].info.masterRoom === room.name) {
            miningFlags.push(Game.flags[flag]);
            if (slaverooms[Game.flags[flag].pos.roomName] === undefined) {
                slaverooms[Game.flags[flag].pos.roomName] = 0;
            }
            slaverooms[Game.flags[flag].pos.roomName]++;
            if (slaverooms[Game.flags[flag].pos.roomName] >= 2 && (Memory.rooms[Game.flags[flag].pos.roomName].controllerTicks === undefined || Memory.rooms[Game.flags[flag].pos.roomName].controllerTicks <= 4000)) {
                reservingJobs++;
            }
        }
    }
    
    let targets = [
        { role: 'harvester', amount: 2, body: getWorkerBody(300, false, false) },
        { role: 'upgrader', amount: 1, body: getWorkerBody(Math.min(400, room.energyCapacityAvailable), true, false) }
    ];
    if (anyUnderAttack) {
        targets.push({ role: 'attacker', amount: 5, body: getWarriorBody(room.energyCapacityAvailable, false, true) })
    }
    else {
        if (level > 1)
            targets.push({ role: 'distributor', amount: 1, body: getCarrierBody(200) });
        targets.push({ role: 'harvester', amount: 4, body: getWorkerBody(Math.min(550, room.energyCapacityAvailable), false, false) });
        if (level > 2)
            targets.push({ role: 'upgrader', amount: 2, body: getWorkerBody(room.energyCapacityAvailable, true, false) });
        targets.push({ role: 'harvester', amount: miningJobs, body: getWorkerBody(room.energyCapacityAvailable, false, false) });
        if (level < 5){
            targets.push({ role: 'attacker', amount: attackFlags.length * 6, body: getWarriorBody(room.energyCapacityAvailable, true) });
        }
        else {
            targets.push({role: 'healer', amount: attackFlags.length * 3, body: getHealerBody(room.energyCapacityAvailable, true)});
            targets.push({role: 'attacker', amount: attackFlags.length * 3, body: getWarriorBody(room.energyCapacityAvailable, true)});
        }
        targets.push({ role: 'builder', amount: room.memory.structures.spawn.rechargeSpots.length - 2, body: getWorkerBody(room.energyCapacityAvailable, true, false)});
        targets.push({ role: 'upgrader', amount: 5, body: getWorkerBody(room.energyCapacityAvailable, true, false) });
        if (level >= 5)
            targets.push({ role: 'miner', amount: 1, body: getWorkerBody(room.energyCapacityAvailable, false, false)});
        targets.push({ role: 'claimer', amount: claimingJobs, body: getClaimingBody(room.energyCapacityAvailable, true, false) });            
        targets.push({ role: 'reserver', amount: reservingJobs, body: getClaimingBody(room.energyCapacityAvailable, true, false) });
        targets.push({ role: 'outharvester', amount: miningFlags.length * 2, body: getWorkerBody(room.energyCapacityAvailable, true, false) });
    }
    return targets;
};

//Body Configuration
let getCarrierBody = function(availableEnergy) {
    return getBody(availableEnergy, [CARRY, CARRY, MOVE]);
};
let getClaimingBody = function(availableEnergy) {
    return getBody(availableEnergy, [MOVE, CLAIM]);
};
let getWarriorBody = function(availableEnergy, noRoads, singleRanged){
    let rangedBuild = [];
    if (singleRanged && availableEnergy > 300) {
        rangedBuild = noRoads ? [RANGED_ATTACK, MOVE] : [RANGED_ATTACK, MOVE, TOUGH];
        availableEnergy -= getCost(rangedBuild);
    }
    if (noRoads)
        return getBody(availableEnergy, [ATTACK, TOUGH, MOVE, MOVE]).concat(rangedBuild);
    return getBody(availableEnergy, [ATTACK, TOUGH, MOVE]).concat(rangedBuild);
};
let getHealerBody = function(availableEnergy, noRoads) {
    return getBody(availableEnergy, [HEAL, TOUGH, MOVE, MOVE]);
};
let getWorkerBody = function(availableEnergy, bigInventory, noRoads) {
    let body = [];
    if (noRoads){
        if (bigInventory){
            body = getBody(Math.min(availableEnergy, 700), [WORK, CARRY, CARRY, MOVE, MOVE, MOVE]);
            availableEnergy -= getCost(body);
        }
        body = body.concat(getBody(availableEnergy, [WORK, CARRY, MOVE, MOVE]));
    }
    else {
        if (bigInventory){
            body = getBody(Math.min(availableEnergy, 700), [WORK, CARRY, CARRY, CARRY, MOVE, MOVE]);
            availableEnergy -= getCost(body);
        }
        body = body.concat(getBody(availableEnergy, [WORK, CARRY, MOVE]));
    }
    body.sort();
    return body;
};

//Body Builder
let costs = {};
costs[MOVE] = 50;
costs[WORK] = 100;
costs[CARRY] = 50;
costs[ATTACK] = 80;
costs[RANGED_ATTACK] = 150;
costs[HEAL] = 250;
costs[CLAIM] = 600;
costs[TOUGH] = 10;

let getBody = function(availableEnergy, parts) {
    let body = [];
    let cost = getCost(parts);
    while(availableEnergy >= cost){
        body = body.concat(parts);     
        availableEnergy -= cost;
    }
    body.sort();
    return body;
};

let getCost = function(parts){
    let cost = 0;
    for (let part of parts){
        cost += costs[part];
    }
    return cost;
};

module.exports = { buildUnits: buildUnits };