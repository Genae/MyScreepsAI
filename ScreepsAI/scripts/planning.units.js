
//Available Energy for Units
let roomLevels = [300, 550, 800, 1300, 1800, 2300];
let getLevel = function (room) {
    for(let i = 0; i < roomLevels.length; i++){
        if (room.energyCapacityAvailable <= roomLevels[i]){
            return i + 1;
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
    if(room.memory.structures.mines === undefined)
        return;
    if (spawns.length === 0) {
        room.memory.info.energy.canBuild = true;
        return;
    }

    if (room.energyCapacityAvailable <= room.energyAvailable) {
        room.memory.info.energy.fullSpawn++;
    } else {
        room.memory.info.energy.fullSpawn = 0;
    }

    if(room.memory.info.energy.fullSpawn > 3){
        room.memory.info.energy.canBuild = true;
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

    let myTargets = getTargets(room, Memory.globalInfo.roomsUnderAttack.length);
    let myUnits = {};
    let myStarterUnits = {};
    for (let name in Game.creeps) {
        if (Game.creeps[name].ticksToLive < 90 || room.name !== Game.creeps[name].memory.roomName)
            continue;
        let role = Game.creeps[name].memory.role;
        if (myUnits[role] === undefined) {
            myUnits[role] = 1;
        } else {
            myUnits[role]++;
        }
        if (Game.creeps[name].memory.isStarter) {
            if (myStarterUnits[role] === undefined) {
                myStarterUnits[role] = 1;
            } else {
                myStarterUnits[role]++;
            }
        }
    }

    if (myTargets.length === 0){
        console.log("No targets.");
    }

    for (let t = 0; t < myTargets.length; t++) {
        if (myUnits[myTargets[t].role] === undefined)
            myUnits[myTargets[t].role] = 0;
        if (myStarterUnits[myTargets[t].role] === undefined)
            myStarterUnits[myTargets[t].role] = 0;
        if (myUnits[myTargets[t].role] < myTargets[t].amount || (myTargets[t].isStarter !== true && myUnits[myTargets[t].role] - myStarterUnits[myTargets[t].role] < myTargets[t].amount)) {
            if (myTargets[t].role === 'builder' || myTargets[t].role === 'upgrader') {
                room.memory.info.energy.canBuild = true;
                if ((room.memory.info.energy.fullSpawn > 3 && getStoredEnergy(room) === -1) || getStoredEnergy(room) > myUnits[myTargets[t].role] * 50000 * Math.min(1, (room.controller.level - 4)) || (myUnits[myTargets[t].role] === 0 && myTargets[t].role === 'upgrader')) {
                    if (createCreep(myTargets[t].body, myTargets[t].role, spawnReady, myTargets[t].isStarter) === ERR_NOT_ENOUGH_ENERGY && (myUnits[myTargets[t].role] === 0 && myTargets[t].role === 'upgrader')) {
                        room.memory.info.energy.canBuild = false;
                        return;
                    }
                }
                break;
            }
            else {
                if (createCreep(myTargets[t].body, myTargets[t].role, spawnReady, myTargets[t].isStarter) === ERR_NOT_ENOUGH_ENERGY) {
                    room.memory.info.energy.canBuild = false;
                    return;
                }
            }
            return;
        }
    }
    room.memory.info.energy.canBuild = true; // every unit built, build again.
};

let createCreep  = function (body, role, spawn, isStarter) {
    let name = generateName("[" + capitalizeFirstLetter(role) + "]");
    let params = { memory: { role: role } };
    if (isStarter)
        params.memory.isStarter = true;
    return spawn.spawnCreep(getBodyFromConfig(body), name, params);
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
            miningJobs += Math.min(3, room.memory.structures.mines[i].workingPlaces.length + 1);
        else if (level < 4)
            miningJobs += Math.min(2, room.memory.structures.mines[i].workingPlaces.length + 1);
        else
            miningJobs++;
    }
    let attackFlags = [];
    let redattackFlags = [];
    let miningFlags = [];
    let reservingJobs = 0;
    let claimingJobs = 0;
    let slaverooms = {};
    for (let flag in Game.flags) {
        if (Game.flags[flag].color === COLOR_YELLOW && Game.flags[flag].pos.roomName === room.name) {
            attackFlags.push(Game.flags[flag]);
        }
        if (Game.flags[flag].color === COLOR_RED && Game.flags[flag].pos.roomName === room.name) {
            redattackFlags.push(Game.flags[flag]);
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

    let targets = [];
    targets.push({ role: 'harvester', amount: 2, isStarter: true, body: { type: 'worker', availableEnergy: 300, bigInventory: false, noRoads: false } });
    
    targets.push({ role: 'upgrader', amount: 1, isStarter: true, body: {type: 'worker', availableEnergy: 300, bigInventory: true, noRoads: false}});
    if (anyUnderAttack) {
        targets.push({ role: 'attacker', amount: 5, body: { type: 'warrior', availableEnergy: room.energyCapacityAvailable, noRoads: false, singleRanged: true } });
    }
    else {
        if (level > 1)
            targets.push({ role: 'distributor', amount: 1, body: {type: 'carrier', availableEnergy: Math.min(400, room.energyCapacityAvailable)} });
        targets.push({ role: 'harvester', amount: miningJobs, body: {type: 'worker', availableEnergy: room.energyCapacityAvailable, bigInventory: false, noRoads: false} });
        if (level > 3)
            targets.push({ role: 'upgrader', amount: 2, body: {type: 'worker', availableEnergy: room.energyCapacityAvailable, bigInventory: true, noRoads: false} });
        if (level <= 4){
            targets.push({ role: 'attacker', amount: attackFlags.length * 6 + redattackFlags, body: {type: 'warrior', availableEnergy: room.energyCapacityAvailable, noRoads: true, singleRanged: false} });
        }
        else {
            targets.push({role: 'healer', amount: attackFlags.length * 3, body: {type: 'healer', availableEnergy: room.energyCapacityAvailable, noRoads: true} });
            targets.push({role: 'attacker', amount: attackFlags.length * 3 + redattackFlags, body: {type: 'warrior', availableEnergy: room.energyCapacityAvailable, noRoads: true}});
        }
        targets.push({ role: 'builder', amount: 1, body: {type: 'worker', availableEnergy: room.energyCapacityAvailable, bigInventory: true, noRoads: false}});
        if (level > 5)
            targets.push({ role: 'miner', amount: 1, body: {type: 'worker', availableEnergy: room.energyCapacityAvailable, bigInventory: false, noRoads: false}});
        targets.push({ role: 'claimer', amount: claimingJobs, body: {type: 'claiming', availableEnergy: room.energyCapacityAvailable, maxClaiming: 1 } });
        targets.push({ role: 'reserver', amount: reservingJobs, body: {type: 'claiming', availableEnergy: room.energyCapacityAvailable, maxClaiming: 2 }});
        targets.push({ role: 'outharvester', amount: miningFlags.length * 2, body: {type: 'worker', availableEnergy: room.energyCapacityAvailable, bigInventory: true, noRoads: false} });
        targets.push({ role: 'builder', amount: Math.min(5, room.memory.structures.spawn.rechargeSpots.length - 2), body: {type: 'worker', availableEnergy: room.energyCapacityAvailable, bigInventory: true, noRoads: false}});
        targets.push({ role: 'upgrader', amount: 5, body: {type: 'worker', availableEnergy: room.energyCapacityAvailable, bigInventory: true, noRoads: false} });
    }
    return targets;
};

//Body Configuration
let getBodyFromConfig = function (bodyConfig) {
    switch(bodyConfig.type){
        case 'carrier':
            return getCarrierBody(bodyConfig.availableEnergy);
        case 'warrior':
            return getWarriorBody(bodyConfig.availableEnergy, bodyConfig.noRoads, bodyConfig.singleRanged);
        case 'claiming':
            return getClaimingBody(bodyConfig.availableEnergy, bodyConfig.maxClaiming);
        case 'healer':
            return getHealerBody(bodyConfig.availableEnergy, bodyConfig.noRoads);
        case 'worker':
            return getWorkerBody(bodyConfig.availableEnergy, bodyConfig.bigInventory, bodyConfig.noRoads);
    }
};

let getCarrierBody = function(availableEnergy) {
    return sort(getBody(availableEnergy, [CARRY, CARRY, MOVE]));
};
let getClaimingBody = function(availableEnergy, max) {
    return sort(getBody(Math.min(availableEnergy, getCost([MOVE, CLAIM])*max), [MOVE, CLAIM]));
};
let getWarriorBody = function(availableEnergy, noRoads, singleRanged){
    let rangedBuild = [];
    if (singleRanged && availableEnergy > 300) {
        rangedBuild = noRoads ? [RANGED_ATTACK, MOVE] : [RANGED_ATTACK, MOVE, TOUGH];
        availableEnergy -= getCost(rangedBuild);
    }
    if (noRoads)
        return sort(getBody(availableEnergy, [ATTACK, TOUGH, MOVE, MOVE]).concat(rangedBuild));
    return sort(getBody(availableEnergy, [ATTACK, TOUGH, MOVE]).concat(rangedBuild));
};
let getHealerBody = function(availableEnergy, noRoads) {
    return sort(getBody(availableEnergy, [HEAL, TOUGH, MOVE, MOVE]));
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
    return sort(body);
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

let sortOrder = {};
sortOrder[MOVE] = 5;
sortOrder[WORK] = 2;
sortOrder[CARRY] = 3;
sortOrder[ATTACK] = 4;
sortOrder[RANGED_ATTACK] = 6;
sortOrder[HEAL] = 7;
sortOrder[CLAIM] = 1;
sortOrder[TOUGH] = 0;

let getBody = function(availableEnergy, parts) {
    let body = [];
    let cost = getCost(parts);
    while(availableEnergy >= cost){
        body = body.concat(parts);
        availableEnergy -= cost;
    }
    return body;
};

let sort = function (body) {
    body.sort(function (a, b) {
        return sortOrder[a] - sortOrder[b];
    });
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