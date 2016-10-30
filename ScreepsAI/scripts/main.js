var roleHarvester = require('role.harvester');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleDistributor = require('role.distributor');
var planningUnits = require('planning.units');
var planningInfrastructure = require('planning.infrastructure');

module.exports.loop = function () {
    //remove dead creeps
    for (var i in Memory.creeps) {
        if (!Game.creeps[i]) {
            if (Memory.creeps[i].rechargeSpot !== undefined) {
                var cr = Game.rooms[Memory.creeps[i].roomName];
                cr.memory.spawn.rechargeSpots[Memory.creeps[i].rechargeSpot].reserved = false;
            }
            delete Memory.creeps[i];
        }
    }


    //room planning
    for (var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
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

    //creepAI
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        creep.memory.roomName = creep.room.name;
        if (creep.memory.role === 'harvester') {
            roleHarvester.roleHarvester(creep);
        }
        if (creep.memory.role === 'builder') {
            roleBuilder.roleBuilder(creep);
        }
        if (creep.memory.role === 'upgrader') {
            roleUpgrader.roleUpgrader(creep);
        }
        if (creep.memory.role === 'distributor') {
            roleDistributor.roleDistributor(creep);
        }
    }
    //console.log("cpu: " + Game.cpu.getUsed());
}

var defendRoom = function(room) {
    if (room.find(FIND_HOSTILE_CREEPS).length > 0) {
        room.controller.activateSafeMode();
        console.log("attack!");
        var towers = room.find(FIND_MY_STRUCTURES, {
            filter: function (structure) {
                return structure.type == STRUCTURE_TOWER;
            }
        });
        for (var t = 0; t < towers.length; t++) {
            var closestHostile = towers[t].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile) {
                towers[t].attack(closestHostile);
            }
        }
    }
}