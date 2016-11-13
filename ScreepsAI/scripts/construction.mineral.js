var createMineral = function (room) {

    var mineral = room.find(FIND_MINERALS)[0];
    
    //save object
    return {
        resource: { id: mineral.id, pos: mineral.pos },
        improvedTo: 0
    };
}

module.exports = { createMineral: createMineral };