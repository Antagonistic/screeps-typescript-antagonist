function amountResources(resource: ResourceConstant) {
    let amount = 0
    let allStr: AnyStoreStructure[] = []

    for (const i in Game.rooms) {
        const room = Game.rooms[i];

        const storeStr = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return ('store' in structure);
            }
        }) as AnyStoreStructure[];

        allStr = allStr.concat(storeStr);
    }

    for (const i in allStr) {
        if (allStr[i].store[resource] > 0) { amount += allStr[i].store[resource]; }
    }

    return amount;
};

function resourceImg(resourceType: ResourceConstant) {
    return '<a target="_blank" href="https://screeps.com/a/#!/market/all/' + Game.shard.name + '/' + resourceType + '"><img src ="https://s3.amazonaws.com/static.screeps.com/upload/mineral-icons/' + resourceType + '.png" /></a>';
};

export function myResources(hide: boolean = false) {
    const result: string[] = [];
    result.push("<table border=\"1\">");
    result.push('<caption> RESOURCE\n</caption>');
    result.push("<tr>");
    result.push("<th></th>");
    result.push("<th> AMOUNT </th>");
    result.push("</tr>");

    for (const i in RESOURCES_ALL) {

        const resource = RESOURCES_ALL[i]

        if (!hide) {
            result.push("<tr>");
            result.push("<td> " + resourceImg(resource) + " </td>");
            result.push("<td> " + amountResources(resource) + " </td>");
            result.push("</tr>");
        } else {
            if (amountResources(resource) > 0) {
                result.push("<tr>");
                result.push("<td> " + resourceImg(resource) + " </td>");
                result.push("<td> " + amountResources(resource) + " </td>");
                result.push("</tr>");
            }
        }
    }

    return result.join("");
}
