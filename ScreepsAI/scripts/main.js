let roleHarvester = require('role.harvester');
let roleBuilder = require('role.builder');
let roleUpgrader = require('role.upgrader');
let roleWarrior = require('role.warrior');
let roleDistributor = require('role.distributor');
let roleOutharvester = require('role.outharvester');
let roleReserver = require('role.reserver');
let roleMiner = require('role.miner');
let roleClaimer = require('role.claimer');
let systemLinks = require('system.links');
let systemTowers = require('system.towers');
let planningUnits = require('planning.units');
let planningRoom = require('planning.room');

////////////
//INIT
////////////
module.exports.loop = function () {
    let errors = [];
    try {
        mainLoop(errors);
    }
    catch (e) {
        errors.push(e);
        console.log("Uncaught error in Main Loop: " + e);
    }

    if (errors.length > 0) {
        console.log(errors.length + " errors");
        throw errors[0];
    }
};
////////////
//Main Loop
////////////
let mainLoop = function (errors) {
    let e;
    //Load Settings
    const settings = loadGlobalSettings();
    if (!settings.runScripts)
        return;

    //Global Planning
    let globalInfo;
    try {
        globalInfo = loadGlobalInfo();
        if (globalInfo.needsGlobalPlanning) {
            //TODO global planning
        }
        globalInfo.needsGlobalPlanning = false;
    } catch (e) {
        console.log("Error while global Planning: " + e);
        errors.push(e);
    }
    
    //Load Room Infos
    const roomInfo = [];
    try {
        for (let name in Game.rooms) {
            roomInfo[name] = loadRoomInfo(name);
        }
        //TODO other rooms for mining/expanding/attacking
        for (let roomName in Game.rooms){
            let room = Game.rooms[roomName];
            if (room.memory.info.underAttack) {
                globalInfo.roomsUnderAttack.push(room.controller.pos);
                break;
            }
        }
    } catch (e) {
        console.log("Error while getting room info: " + e);
        errors.push(e);
    }
    try {
        tickDownControllers();
    } catch (e) {
        console.log("Error while ticking down controllers: " + e);
        errors.push(e);
    }
    try {
        checkSlaveRooms();
    } catch (e) {
        console.log("Error while checking for new slave rooms: " + e);
        errors.push(e);
    }

    //Cleanup Memory
    try {
        removeDeadCreeps();
    } catch (e) {
        console.log("Error while removing dead creeps: " + e);
        errors.push(e);
    }

    try {
        removeMissingDrops();
    } catch (e) {
        console.log("Error while removing missing drops: " + e);
        errors.push(e);
    }

    //Run Systems
    try {
        for (let roomName in Game.rooms) {
            systemTowers.controlTowers(Game.rooms[roomName]);
        }
    } catch (e) {
        console.log("Error while controlling towers: " + e);
        errors.push(e);
    }
        
    //Run Units
    let builders = [];
    for (let creepName in Game.creeps) {
        let creep = Game.creeps[creepName];
        try {
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
                roleUpgrader.roleUpgrader(creep);
            }
            if (creep.memory.role === 'attacker') {
                roleWarrior.roleWarrior(creep);
            }
            if (creep.memory.role === 'healer') {
                roleWarrior.roleWarrior(creep);
            }
            if (creep.memory.role === 'reserver') {
                roleReserver.roleReserver(creep);
            }
            if (creep.memory.role === 'miner') {
                roleMiner.roleMiner(creep);
            }
            if (creep.memory.role === 'distributor') {
                roleDistributor.roleDistributor(creep, homeRoom);
            }
            if (creep.memory.role === 'claimer') {
                roleClaimer.roleClaimer(creep);
            }
        } catch (e) {
            console.log("error with " + creep.memory.role + " " + creep.name + ": " + e);
            errors.push(e);
        }

    }
    for (let b = 0; b < builders.length; b++) {
        let homeRoom = Game.rooms[builders[b].memory.roomName];
        try {
            roleBuilder.roleBuilder(builders[b]);
        } catch (e) {
            console.log("error with builder " + builders[b].name + ": " + e);
            errors.push(e);
        }
    }
    
    //Plan Room Development
    try {
        let i = 0;
        for (const roomName in Game.rooms){
            if (roomInfo[roomName].rescan){
                planningRoom.scanRoom(Game.rooms[roomName]);
                roomInfo[roomName].rescan = false;
            }
            if (((Game.time + i) % 2) === 0)
                planningRoom.planRoomConstruction(Game.rooms[roomName]);
            if (((Game.time + i + 1) % 2) === 0)
                planningUnits.buildUnits(Game.rooms[roomName]);
            i+=2;
        }
    } catch (e) {
        console.log("Error while planning rooms: " + e);
        errors.push(e);
    }

    try {
        for (const roomName in Game.rooms)
            systemLinks.controlLinks(Game.rooms[roomName]);
    } catch (e) {
        console.log("Error while controlling links: " + e);
        errors.push(e);
    }

};

////////////
// Functions
////////////

//Load GlobalSettings
let loadGlobalSettings = function() {
    if (Memory.globalSettings === undefined) {
        Memory.globalSettings = {
            runScripts: false,
            autoMineExternal: false,
            autoExpand: false,
            autoAttack: false,
            allies: ['Hosmagix']
        };
    }
    return Memory.globalSettings;
};


//Load GlobalInfo
let loadGlobalInfo = function () {
    if (Memory.globalInfo === undefined) {
        Memory.globalInfo = {
            needsGlobalPlanning: false,
            roomsUnderAttack: []
        };
    }
    Memory.globalInfo.roomsUnderAttack = [];
    return Memory.globalInfo;
};

//Load RoomInfo
let loadRoomInfo = function(roomName){
    const room = Game.rooms[roomName];
    if (room.memory === undefined)
        room.memory = {};
    if (room.memory.info === undefined) {
        room.memory.thisJobs = {};
        room.memory.info = {
            lastSeen: Game.time,
            isMaster: room.controller !== null && room.controller.my,
            masterRoom: undefined,
            slaveRooms: [],
            controllerLevel: room.controller !== null ? room.controller.level : -1,
            needsPlanning: true, 
            rescan: true,
            underAttack: false,
            energy: {
                reservedDrops: [],
                canBuild: true,
                fullSpawn: 0
            }
        };
    }
    room.memory.info.lastSeen = Game.time;
    //check attackers
    let enemys = room.find(FIND_HOSTILE_CREEPS, {
        filter: function (hc) { return Memory.globalSettings.allies.indexOf(hc.owner.username) === -1 }
    });
    let spawnCount = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN } }).length;
    room.memory.underAttack = enemys.length > 0 && (Memory.rooms[roomName].info.masterRoom !== undefined || spawnCount > 0);
    //check new Base
    if (spawnCount > 0 && room.memory.info.masterRoom !== undefined) {
        let index = Memory.rooms[room.memory.info.masterRoom].info.slaveRooms.indexOf(roomName);
        if (index > -1) {
            Memory.rooms[Memory.rooms[roomName].info.masterRoom].slaveRooms.splice(index, 1);
        }
        room.memory.info.masterRoom = undefined
    }
    //check contoller upgraded
    if (room.memory.info.isMaster){
        if (room.memory.info.controllerLevel !== room.controller.level){
            room.memory.info.controllerLevel = room.controller.level;
            room.memory.info.needsPlanning = true;
        }
    }
        
    //reset jobs
    room.memory.lastJobs = room.memory.thisJobs;
    room.memory.thisJobs = {};
    
    return room.memory.info;
};

//check slave rooms
let checkSlaveRooms = function () {
    for (let flagName in Game.flags) {
        let flag = Game.flags[flagName];
        if (flag.color === COLOR_BROWN) {
            if (Memory.rooms[flag.pos.roomName] === undefined) {
                Memory.rooms[flag.pos.roomName] = {
                    info: {
                        lastSeen: Game.time,
                        isMaster: false,
                        masterRoom: undefined,
                        slaveRooms: [],
                        controllerLevel: -1,
                        needsPlanning: true,
                        rescan: true,
                        underAttack: false,
                        energy: {
                            reservedDrops: [],
                            canBuild: true,
                            fullSpawn: 0
                        }
                    }
                };
            }
            let master;
            if (Memory.rooms[flag.pos.roomName].info.masterRoom === undefined) {
                master = findClosestRoom(flag.pos);
                Memory.rooms[flag.pos.roomName].info.masterRoom = master;
                Game.rooms[master].memory.info.slaveRooms.push(flag.pos.roomName);
            } else {
                if (Game.rooms[flag.pos.roomName] !== undefined && flag.room.controller.level > 0) {
                    flag.remove();
                    Memory.rooms[flag.pos.roomName].info.underAttack = false;
                    master = Memory.rooms[flag.pos.roomName].info.masterRoom;
                    Memory.rooms[flag.pos.roomName].info.masterRoom = undefined;
                    let index = Game.rooms[master].memory.slaveRooms.indexOf(flag.pos.roomName);
                    if (index > -1) {
                        Game.rooms[master].memory.slaveRooms.splice(index, 1);
                    }
                }
            }
        }
    }
};

let findClosestRoom = function (start) {
    let goals = [];
    for (let spawn in Game.spawns) {
        goals.push({ pos: Game.spawns[spawn].pos, range: 1 });
    }
    let res = PathFinder.search(start, goals);
    return res.path[res.path.length - 1].roomName;
};

//Remove Dead Creeps
let removeDeadCreeps = function () {
    for (let i in Memory.creeps) {
        if (!Game.creeps[i]) {
            if (Memory.creeps[i].rechargeSpot !== undefined) {
                const cr = Game.rooms[Memory.creeps[i].roomName];
                cr.memory.spawn.rechargeSpots[Memory.creeps[i].rechargeSpot].reserved = false;
            }
            delete Memory.creeps[i];
        }
    }
};

//Remove Missing Drops
let removeMissingDrops = function () {
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];
        const drops = [];
        let energy = room.memory.info.energy;
        for (let i = 0; i < energy.reservedDrops.length; i++) {
            if (Game.getObjectById(energy.reservedDrops[i]) !== null)
                drops.push(energy.reservedDrops[i]);
        }
        energy.reservedDrops = drops;
    }
};

//tick down Controller Reservations
let tickDownControllers = function () {
    for (let rn in Memory.rooms) {
        let room = Memory.rooms[rn];
        if (room.controllerTicks !== undefined)
            room.controllerTicks--;
    }
};