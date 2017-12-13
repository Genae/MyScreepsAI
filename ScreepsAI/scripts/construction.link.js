let createLink = function (link) {
    let minesInRange = link.pos.findInRange(FIND_SOURCES, 2);
    let controllerRange = link.pos.getRangeTo(link.room.controller);

    let type;
    if (minesInRange.length > 0 && controllerRange > 2) {
        type = 'empty';
    }
    else if (minesInRange.length === 0 && controllerRange <= 2) {
        type = 'fill';
    } else {
        type = 'store';
    }

    //save object
    return {
        obj: {id: link.id, pos: link.pos},
        type: type,
        improvedTo: 0
    };
};

module.exports = { createLink: createLink };