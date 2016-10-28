var roleHarvester = require('role.harvester');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var planningUnits = require('planning.units');
var planningInfrastructure = require('planning.infrastructure');

module.exports.loop = function () {

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
    }
    //creepAI
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role === 'harvester') {
            roleHarvester.run(creep);
        }
        if (creep.memory.role === 'builder') {
            roleBuilder.run(creep);
        }
        if (creep.memory.role === 'upgrader') {
            roleUpgrader.run(creep);
        }
    }
    //console.log("cpu: " + Game.cpu.getUsed());
}