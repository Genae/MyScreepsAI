var roleHarvester = require('role.harvester');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleAttacker = require('role.attacker');
var roleDistributor = require('role.distributor');
var planningUnits = require('planning.units');
var planningInfrastructure = require('planning.infrastructure');

module.exports.loop = function () {

    removeDeadCreeps();

    roomPlanning();

    var pois = getAllRoomsPOI();
    

    var builders = [];
    //creepAI
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.roomName === undefined)
            creep.memory.roomName = creep.room.name;
        var homeRoom = Game.rooms[creep.memory.roomName];

        if (creep.memory.role === 'harvester') {
            roleHarvester.roleHarvester(creep);
        }
        if (creep.memory.role === 'builder') {
            builders.push(creep);
        }
        if (creep.memory.role === 'upgrader') {
            roleUpgrader.roleUpgrader(creep);
        }
        if (creep.memory.role === 'attacker') {
            roleAttacker.roleAttacker(creep);
        }
        if (creep.memory.role === 'distributor') {
            roleDistributor.roleDistributor(creep, homeRoom, pois[homeRoom.name].extensions, pois[homeRoom.name].droppedEnergy);
        }
    }
    for (var b = 0; b < builders.length; b++) {
        roleBuilder.roleBuilder(builders[b]);
    }
    //console.log("cpu: " + Game.cpu.getUsed());
}

var removeDeadCreeps = function() {
    for (var i in Memory.creeps) {
        if (!Game.creeps[i]) {
            if (Memory.creeps[i].rechargeSpot !== undefined) {
                var cr = Game.rooms[Memory.creeps[i].roomName];
                cr.memory.spawn.rechargeSpots[Memory.creeps[i].rechargeSpot].reserved = false;
            }
            delete Memory.creeps[i];
        }
    }
}

var roomPlanning = function() {
    for (var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        var spawn = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        })[0];
        if (spawn === undefined || spawn === null)
            continue;
        if (room.memory.energy === undefined) {
            room.memory.energy = {};
            room.memory.energy.canUpgrade = true;
            room.memory.energy.canBuild = true;
        }
        planningUnits.buildUnits(room);
        planningInfrastructure.planRoomConstruction(room);
        //reset jobs
        room.memory.lastJobs = room.memory.thisJobs;
        room.memory.thisJobs = [];

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
    if (room.find(FIND_HOSTILE_CREEPS).length > 0) {
        for (t = 0; t < towers.length; t++) {
            var closestHostile = towers[t].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile) {
                towers[t].attack(closestHostile);
            }
        }
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (room.name === creep.room.name) {
                if (creep.memory.role === 'fighter') {
                    //fight
                } else {
                    var targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6);
                    for (t = 0; t < targets.length; t++) {
                        if (creep.pos.getRangeTo(targets[t].pos) <= 4) {
                            console.log("save me!");
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
                    return structure.hits <= structure.hitsMax - 800;
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
        for (let i = 0; i < structures.length; i++) {
            var structure = structures[i];
            if (structure.structureType === STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity) {
                extensions.push(structure);
            }
            if (structure.structureType === STRUCTURE_TOWER && structure.energy < structure.energyCapacity && room.memory.energy.canBuild) {
                extensions.push(structure);
            }
        }
        var droppedEnergy = room.find(FIND_DROPPED_ENERGY, {
            filter: (energy) => {
                return (energy.amount > 50);
            }
        });
        pois[roomName] = ({ extensions: extensions, droppedEnergy: droppedEnergy });
    }
    return pois;
}