let getStorageToWithdraw = function (creep, noSpawn) {
    let storagesInRoom = getStructuresInRoom(creep.room);
    let withdrawStorages = storagesInRoom.storage.concat(storagesInRoom.withdrawStorage).concat(storagesInRoom.drops);
    if (!noSpawn) {
        withdrawStorages = withdrawStorages.concat(storagesInRoom.spawns);
    }
    let closest = creep.pos.findClosestByRange(withdrawStorages);
    if (closest !== null && closest.resourceType !== undefined){
        closest.room.memory.info.energy.reservedDrops.push(closest);
    }
    return closest;
};

let getStorageToFill = function (creep) {
    let storagesInRoom = getStructuresInRoom(creep.room);
    let fillStorages = storagesInRoom.storage.concat(storagesInRoom.priorityStorage);
    return creep.pos.findClosestByRange(fillStorages);
};

let cache = {};

let cleanCache = function () {
    cache = {};    
};

let getStructuresInRoom = function(room, noLinks, noSpawn) {
    if (noLinks === undefined) noLinks = false;
    if (cache[room.name] === undefined){
        cache[room.name] = {
            priorityStorage: [],
            storage: [],
            spawns: [],
            withdrawStorage: [],
            drops: []
        };
        let structures = room.find(FIND_MY_STRUCTURES);
        for (let structure of structures){
            if (structure.structureType === STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity) {
                cache[room.name].priorityStorage.push(structure);
            }
            if (structure.structureType === STRUCTURE_TOWER && structure.energy < structure.energyCapacity) {
                cache[room.name].priorityStorage.push(structure);
            }
            if (!noSpawn && structure.structureType === STRUCTURE_SPAWN && structure.energy < structure.energyCapacity) {
                cache[room.name].priorityStorage.push(structure);
            }
            if (structure.structureType === STRUCTURE_CONTAINER) {
                cache[room.name].withdrawStorage.push(structure);
            }
        }
        if (room.storage)
            cache[room.name].storage.push(room.storage);
        cache[room.name].spawns = cache[room.name].storage.concat(room.find(FIND_MY_SPAWNS));
        if (!noLinks){
            for (let linkid in room.memory.structures.links){
                let link = room.memory.structures.links[linkid];
                let linkObj = Game.getObjectById(link.obj.id);
                if (link.type === 'empty' && linkObj.energy < linkObj.energyCapacity)
                    cache[room.name].storage.push(Game.getObjectById(link.obj.id));
                if (link.type === 'store')
                    cache[room.name].storage.push(Game.getObjectById(link.obj.id));
                if (link.type === 'fill' && linkObj.energy > 0)
                    cache[room.name].withdrawStorage.push(Game.getObjectById(link.obj.id));
            }
        }
        cache[room.name].drops = room.find(FIND_DROPPED_RESOURCES, {
            filter: (energy) => {
                return (energy.amount > 50) && room.memory.info.energy.reservedDrops.indexOf(energy.id) === -1;
            }
        });
    }
    return cache[room.name];
};
module.exports = {getStorageToWithdraw: getStorageToWithdraw, getStorageToFill: getStorageToFill, getStructuresInRoom:getStructuresInRoom, cleanCache: cleanCache};