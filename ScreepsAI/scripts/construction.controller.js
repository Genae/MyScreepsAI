var createController = function (controller, room) {

    //find path
    var spanws = room.find(FIND_MY_SPAWNS);
    var pathTo = PathFinder.search(spanws[0].pos, { pos: controller.pos, range: 2 });
    
    //save object
    return {
        resource: { id: controller.id, pos: controller.pos },
        pathTo: pathTo,
        improvedTo: 0
    };
}

module.exports = { createController: createController };