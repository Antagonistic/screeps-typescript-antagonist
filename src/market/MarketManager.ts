import { isDate } from "util";

interface TermData {
    term: StructureTerminal;
    minedMineral: MineralConstant;
    storedEnergy: number;
}

interface FilteredOrder {
    price: number;
    remainingAmount: number;
    room: string | undefined;
    id: string;
    closestTerm: string;
}

const minEnergyPrice = 0.002;

export class MarketManager {
    public run() {
        const term = this.getTerminals();
        if (term.length === 0) { return "no terminals"; }
        // for (const t of term) {
        //     console.log(JSON.stringify(t));
        // }
        this.sellEnergy(term);
        return "success";
    }

    private sellEnergy(terms: TermData[]) {
        let orders = Game.market.getAllOrders((o: Order) => o.resourceType === RESOURCE_ENERGY && o.type === ORDER_BUY && o.remainingAmount >= 10000);
        if (orders && orders.length > 0) {
            orders = _.take(_.sortBy(orders, "price").reverse(), 4);
            const _orders = [];
            // console.log(JSON.stringify(orders));
            for (const o of orders) {
                // console.log(JSON.stringify(o));
                if (!o.roomName) { continue; }
                const _t = _.min(terms, x => Game.map.getRoomLinearDistance(x.term.room.name, o.roomName!))
                const _o: FilteredOrder = { price: o.price, remainingAmount: o.remainingAmount, room: o.roomName, id: o.id, closestTerm: _t.term.room.name };
                console.log(JSON.stringify(_o));
            }
        }
    }

    private getTerminals(): TermData[] {
        const ret: TermData[] = [];
        for (const _sr in global.emp.spawnRooms) {
            const sr = global.emp.spawnRooms[_sr];
            if (sr.room.terminal) {
                const mineral = _.first(sr.room.find(FIND_MINERALS));
                const storedEnergy = sr.room.storage ? sr.room.storage.store.energy : 0;
                if (mineral) {
                    ret.push({ term: sr.room.terminal, minedMineral: mineral.mineralType, storedEnergy });
                }
            }
        }
        return ret;
    }
}
