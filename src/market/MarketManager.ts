import { isDate } from "util";

interface TermData {
    term: StructureTerminal;
    minedMineral: MineralConstant;
    storedEnergy: number;
}

interface FilteredOrder {
    price: number;
    amount: number;
    room: string;
    id: string;
    closestTerm: string;
    storedEnergy: number;
    cost: number;
    score: number;
}

const minEnergyPrice = 0.002;
const energyAmountSell = 50000;

export class MarketManager {
    public run(realRun: boolean = false) {
        const term = this.getTerminals();
        if (term.length === 0) { return "no terminals"; }
        // for (const t of term) {
        //     console.log(JSON.stringify(t));
        // }
        this.sellEnergy(term, realRun);
        return "success";
    }

    private sellEnergy(terms: TermData[], realRun: boolean = false) {
        let orders = Game.market.getAllOrders((o: Order) => o.resourceType === RESOURCE_ENERGY && o.type === ORDER_BUY && o.remainingAmount >= 10000);
        if (orders && orders.length > 0) {
            orders = _.take(_.sortBy(orders, "price").reverse(), 8);
            let _orders = [];
            // console.log(JSON.stringify(orders));
            for (const o of orders) {
                // console.log(JSON.stringify(o));
                if (!o.roomName) { continue; }
                const _t = _.min(terms, x => Game.map.getRoomLinearDistance(x.term.room.name, o.roomName!) && x.storedEnergy > 5000)
                if (_t) {
                    let amount = Math.min(o.remainingAmount, energyAmountSell, _t.storedEnergy);
                    let cost = Game.market.calcTransactionCost(amount, o.roomName, _t.term.room.name);
                    if (amount + cost > _t.storedEnergy) {
                        const overhead = (amount / (amount + cost));
                        amount = Math.max(_t.storedEnergy * overhead - 1000, 10);
                        cost = Game.market.calcTransactionCost(amount, o.roomName, _t.term.room.name);
                    }
                    amount = Math.min(amount)
                    const score = (amount / (amount + cost)) * o.price * 10000;
                    const _o: FilteredOrder = { price: o.price, amount, room: o.roomName, id: o.id, closestTerm: _t.term.room.name, storedEnergy: _t.storedEnergy, cost, score };
                    _orders.push(_o);
                    console.log(JSON.stringify(_o));
                }
            }

            const traded: string[] = [];
            _orders = _.sortBy(_orders, "score").reverse();
            for (const order of _orders) {
                if (_.any(traded, x => x === order.closestTerm)) { continue; }
                traded.push(order.closestTerm);

                if (realRun) {
                    const ret = Game.market.deal(order.id, order.amount, order.closestTerm);
                    console.log("Trading " + (order.amount) + " energy from " + order.closestTerm + " cost " + order.cost + " score " + order.score.toFixed(2) + ": " + ret);
                } else {
                    console.log("Trading " + (order.amount) + " energy from " + order.closestTerm + " cost " + order.cost + " score " + order.score.toFixed(2));
                }

            }
        } else {
            console.log("no valid orders");
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
