var roleHarvester = require('role.harvester');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleAttacker = require('role.attacker');
var roleDistributor = require('role.distributor');
var roleOutharvester = require('role.outharvester');
var roleClaimer = require('role.claimer');
var planningUnits = require('planning.units');
var planningInfrastructure = require('planning.infrastructure');

module.exports.loop = function () {
    var cpu = {};
    var lastCpu = 0;
    var errors = [];
    var e;
    try {
        lastCpu = snapshotCpu('deserializing', lastCpu, cpu);
        try {
            removeDeadCreeps();
        } catch (e) {
            console.log("Error while removing dead creeps: " + e);
            errors.push(e);
        }
        lastCpu = snapshotCpu('remove dead', lastCpu, cpu);
        
        try {
            roomPlanning();
        } catch (e) {
            console.log("Error while room planning: " + e);
            errors.push(e);
        }
        lastCpu = snapshotCpu('room planing', lastCpu, cpu);

        var pois;
        try {
            pois = getAllRoomsPOI();
        } catch (e) {
            console.log("Error while getting pois: " + e);
            errors.push(e);
        }
        lastCpu = snapshotCpu('pois', lastCpu, cpu);
        

        var builders = [];
        //creepAI
        for (var name in Game.creeps) {
            try {
                var creep = Game.creeps[name];
                if (creep.memory.roomName === undefined)
                    creep.memory.roomName = creep.room.name;
                let homeRoom = Game.rooms[creep.memory.roomName];

                if (creep.memory.role === 'harvester') {
                    roleHarvester.roleHarvester(creep);
                }
                if (creep.memory.role === 'outharvester') {
                    roleOutharvester.roleOutHarvester(creep);
                }
                if (creep.memory.role === 'builder') {
                    builders.push(creep);
                }
                if (creep.memory.role === 'upgrader') {
                    roleUpgrader.roleUpgrader(creep, pois[homeRoom.name].storage);
                }
                if (creep.memory.role === 'attacker') {
                    roleAttacker.roleAttacker(creep);
                }
                if (creep.memory.role === 'distributor') {
                    roleDistributor.roleDistributor(creep, homeRoom, pois[homeRoom.name].extensions, pois[homeRoom.name].droppedEnergy, pois[homeRoom.name].storage);
                }
                if (creep.memory.role === 'claimer') {
                    roleClaimer.roleClaimer(creep);
                }
                lastCpu = snapshotCpu(creep.memory.role, lastCpu, cpu);
            } catch (e) {
                console.log("creep " + name + " has error: " + e);
                errors.push(e);
            }

        }
        for (var b = 0; b < builders.length; b++) {
            let homeRoom = Game.rooms[builders[b].memory.roomName];
            try {
                roleBuilder.roleBuilder(builders[b], pois[homeRoom.name].storage, pois[homeRoom.name].droppedEnergy);
                lastCpu = snapshotCpu('builder', lastCpu, cpu);
            } catch (e) {
                console.log("error with builder: " + builders[b].name);
                errors.push(e);
            }
        }
    } catch (e) {
        errors.push(e);

    }
    
    //console.log("cpu: " + Game.cpu.getUsed());

    if (errors.length > 0) {
        console.log(errors.length + " errors");
        throw errors[0];
    }

    for (var cp in cpu) {
        //if (cpu[cp] > 1) console.log(cp + ": " + cpu[cp]);
    }
}

var snapshotCpu = function(name, last, obj) {
    var used = Game.cpu.getUsed();
    obj[name] = used - last;
    return used;
}

var removeDeadCreeps = function() {
    for (let i in Memory.creeps) {
        if (!Game.creeps[i]) {
            if (Memory.creeps[i].rechargeSpot !== undefined) {
                var cr = Game.rooms[Memory.creeps[i].roomName];
                cr.memory.spawn.rechargeSpots[Memory.creeps[i].rechargeSpot].reserved = false;
            }
            delete Memory.creeps[i];
        }
    }
    for (let name in Game.rooms) {
        var room = Game.rooms[name];
        if (room.memory.energy !== undefined) {
            if (room.memory.energy.reservedDrops === undefined) {
                room.memory.energy.reservedDrops = [];
            }

            var drops = [];
            for (let i = 0; i < room.memory.energy.reservedDrops.length; i++) {
                if (Game.getObjectById(room.memory.energy.reservedDrops[i]) !== null)
                    drops.push(room.memory.energy.reservedDrops[i]);
            }
            room.memory.energy.reservedDrops = drops;
        }
    }
}

var roomPlanning = function() {
    for (var roomName in Game.rooms) {
        var room = Game.rooms[roomName];

        try {
            runLinks(room);
        } catch (e) {
            console.log(e);
        }

        var enemys = room.find(FIND_HOSTILE_CREEPS, {
            filter: function (hc) { return hc.owner.username !== 'Hosmagix' }
        });
        var spawn = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        })[0];
        if (enemys.length > 0 && (Memory.rooms[roomName].masterRoom !== undefined || (spawn !== undefined && spawn !== null))) {
            room.memory.underAttack = true;
        } else {
            room.memory.underAttack = false;
            
        }
        if (spawn === undefined || spawn === null)
            continue;

        if (Memory.rooms[roomName].masterRoom !== undefined) {
            var index = Memory.rooms[Memory.rooms[roomName].masterRoom].slaveRooms.indexOf(roomName);
            if (index > -1) {
                Memory.rooms[Memory.rooms[roomName].masterRoom].slaveRooms.splice(index, 1);
            }
        }
        delete Memory.rooms[roomName].masterRoom;

        if (room.memory.energy === undefined) {
            room.memory.energy = {};
            room.memory.energy.canUpgrade = true;
            room.memory.energy.canBuild = true;
        }
        if (room.memory.wallHitpoints === undefined) {
            room.memory.wallHitpoints = 100000;
        }

        checkSlaveRooms(room, spawn);

        if(Game.time % 5 === 0)
            planningInfrastructure.planRoomConstruction(room);
        if ((Game.time + 1) % 5 === 0)
            planningUnits.buildUnits(room);
        //reset jobs
        room.memory.lastJobs = room.memory.thisJobs;
        room.memory.thisJobs = {};
        if (room.memory.lastJobs === undefined) {
            room.memory.lastJobs = {};
        }

        //DEFENCE
        defendRoom(room);
    }
}

var defendRoom = function (room) {
    var towers = room.find(FIND_MY_STRUCTURES, {
        filter: function (structure) {
            return structure.structureType === STRUCTURE_TOWER;
        }
    });
    var t;
    if (room.find(FIND_HOSTILE_CREEPS, {
        filter: function (hc) { return hc.owner.username !== 'Hosmagix' }
    }).length > 0) {
        for (t = 0; t < towers.length; t++) {
            var closestHostile = towers[t].pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: function (hc) { return hc.owner.username !== 'Hosmagix' }
            });
            if (closestHostile) {
                towers[t].attack(closestHostile);
            }
        }
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (room.name === creep.room.name) {
                if (creep.memory.role === 'attacker') {
                    //fight
                } else if (creep.memory.role === 'builder' || creep.memory.role === 'outharvester') {
                    //dont care
                } else {
                    var targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, {
                        filter: function (hc) { return hc.owner.username !== 'Hosmagix' }
                    });
                    for (t = 0; t < targets.length; t++) {
                        if (creep.pos.getRangeTo(targets[t].pos) <= 4) {
                            //console.log("save me!");
                            room.controller.activateSafeMode();
                        }
                    }
                    if (targets.length > 0) {
                        //flee
                    }
                }
            }
        }
    } else {
        for (t = 0; t < towers.length; t++) {
            if (towers[t].energy <= 500)
                continue;
            var repairs = towers[t].pos.findInRange(FIND_STRUCTURES, 5, {
                filter: function (structure) {
                    return (structure.hits <= structure.hitsMax - 2000 && structure.structureType !== STRUCTURE_RAMPART && structure.structureType !== STRUCTURE_WALL) ||
                           (structure.hits <= room.memory.wallHitpoints - 2000 && (structure.structureType === STRUCTURE_RAMPART || structure.structureType === STRUCTURE_WALL));
                }
            });
            if (repairs.length > 0) {
                towers[t].repair(repairs[0]);
            }
        }
    }
}

var getAllRoomsPOI = function () {
    var pois = {};
    
    for (var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        var structures = room.find(FIND_MY_STRUCTURES);
        var extensions = [];
        var storage = [];
        for (let i = 0; i < structures.length; i++) {
            var structure = structures[i];
            if (structure.structureType === STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity) {
                extensions.push(structure);
            }
            if (structure.structureType === STRUCTURE_TOWER && structure.energy < structure.energyCapacity) {
                extensions.push(structure);
            }
            if (structure.structureType === STRUCTURE_STORAGE) {
                storage.push(structure);
            }
        }
        var droppedEnergy;
        if (room.memory.energy !== undefined) {
            droppedEnergy = room.find(FIND_DROPPED_ENERGY, {
                filter: (energy) => {
                    return (energy.amount > 50) && energy.room.memory.energy.reservedDrops.indexOf(energy.id) === -1;
                }
            });
        }

        pois[roomName] = ({ extensions: extensions, droppedEnergy: droppedEnergy, storage: storage });
    }
    return pois;
}

var checkSlaveRooms = function (room, spawn) {
    for (let name in Game.flags) {
        var flag = Game.flags[name];
        if (flag.color === COLOR_BROWN) {
            if (Memory.rooms[flag.pos.roomName] === undefined) {
                Memory.rooms[flag.pos.roomName] = {};
            }
            if (Memory.rooms[flag.pos.roomName].masterRoom === undefined) {
                if (false) {
                    //TODO
                } else {
                    Memory.rooms[flag.pos.roomName].masterRoom = spawn.pos.roomName;
                    if (Game.rooms[spawn.pos.roomName].memory.slaveRooms === undefined) {
                        Game.rooms[spawn.pos.roomName].memory.slaveRooms = [];
                    }
                    Game.rooms[spawn.pos.roomName].memory.slaveRooms.push(flag.pos.roomName);
                }
            }
        }
    }
}

var runLinks = function(room) {
    var links = {
        store: [],
        empty: [],
        fill: []
    }
    if (room.memory.links === undefined)
        return;

    for (let i = 0; i < room.memory.links.length; i++) {
        links[room.memory.links[i].type].push(room.memory.links[i]);
    }

    for (let i = 0; i < room.memory.links.length; i++) {
        var link = Game.getObjectById(room.memory.links[i].link.id);
        if (link.cooldown > 0)
            continue;
        if (room.memory.links[i].type === 'empty' || room.memory.links[i].type === 'store') {
            for (let j = 0; j < links.fill.length; j++) {
                let link2 = Game.getObjectById(links.fill[j].link.id);
                if (link2.energy < 700) {
                    link.transferEnergy(link2);
                    break;
                }
            }
            if (room.memory.links[i].type === 'empty') {
                for (let j = 0; j < links.store.length; j++) {
                    let link2 = Game.getObjectById(links.fill[j].link.id);
                    if (link2.energy < 700) {
                        link.transferEnergy(link2);
                        break;
                    }
                }
            }
        }
    }
}