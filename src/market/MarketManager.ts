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
                const _t = _.min(terms, x => Game.map.getRoomLinearDistance(x.term.room.name, o.roomName!) && x.storedEnergy > 10000)
                if (_t) {
                    let amount = Math.min(o.remainingAmount, energyAmountSell, _t.storedEnergy);
                    let cost = Game.market.calcTransactionCost(amount, o.roomName, _t.term.room.name);
                    if (amount + cost > _t.storedEnergy) {
                        const overhead = (amount / (amount + cost));
                        amount = Math.max(_t.storedEnergy * overhead - 1000, 10);
                        cost = Game.market.calcTransactionCost(amount, o.roomName, _t.term.room.name);
                    }

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
                    console.log("Trading " + (order.amount) + " energy from " + order.closestTerm + " cost " + order.cost + " score " + order.score.toFixed(3) + ": " + ret);
                } else {
                    console.log("Trading " + (order.amount) + " energy from " + order.closestTerm + " cost " + order.cost + " score " + order.score.toFixed(3));
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
                const mineral: Mineral = _.first(sr.room.find(FIND_MINERALS));
                const storedEnergy = sr.room.terminal ? sr.room.terminal.store.energy : 0;
                if (mineral) {
                    const item: TermData = { term: sr.room.terminal, minedMineral: mineral.mineralType, storedEnergy };
                    ret.push(item);
                }
            }
        }
        // console.log(JSON.stringify(ret));
        return ret;
    }

    public getOrders(term?: StructureTerminal): Order[] {
        if (term) {
            const orders = _.where(Object.values(Game.market.orders), (x: Order) => x.active === true && x.roomName === term.room.name);
            return orders;
        } else {
            const orders = _.where(Object.values(Game.market.orders), (x: Order) => x.active === true);
            return orders;
        }
    }

    public fireSale(realRun: boolean = false, roomName?: string) {
        const terms = this.getTerminals();
        for (const t of terms) {
            if (roomName && t.term.room.name !== roomName) { continue; }
            const myorders = this.getOrders(t.term);
            for (const rT in t.term.store) {
                if (rT === RESOURCE_ENERGY) { continue; }
                let choice = "none";
                let price = 0.0;
                let mineralAmount = t.term.store[rT as ResourceConstant];
                if (!mineralAmount) { continue; }
                const myO = _.findLast(myorders, x => x.resourceType === rT);
                if (myO) {
                    mineralAmount = mineralAmount - myO.amount;
                }
                price = this.calcPrice(rT as ResourceConstant);
                // const resorders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: rT as ResourceConstant });
                const resorders = Game.market.getAllOrders(x => x.type === ORDER_BUY && x.resourceType === rT && x.remainingAmount > 0);
                let orderID = "";
                if (resorders && resorders.length > 0) {
                    const _rO = _.max(resorders, x => x.price);
                    if (_rO.price > price * 0.8) { choice = "deal"; orderID = _rO.id } else { choice = "order"; }
                    // console.log(rT + " " + _rO.id + " " + _rO.price);
                }
                let response = (rT.padEnd(6) + " " + (mineralAmount + "").padStart(8) + "   " + (price.toFixed(3) + "").padStart(4) + "  " + choice.padEnd(7));
                if (realRun && mineralAmount > 0) {
                    let ret: ScreepsReturnCode = 0;
                    if (choice === "deal") {
                        ret = Game.market.deal(orderID, mineralAmount, t.term.room.name);
                    }
                    if (choice === "order") {
                        ret = Game.market.createOrder(ORDER_SELL, rT as ResourceConstant, price * 0.9, mineralAmount, t.term.room.name);
                    }
                    response = response + ": " + ret;
                }
                console.log(response);
            }
        }
    }

    public calcPrice(res: ResourceConstant): number {
        const hist = Game.market.getHistory(res);
        if (!hist || hist.length === 0) { return minEnergyPrice; }
        const num = hist.length;
        if (num === undefined) { return minEnergyPrice; }
        const sum = _.sum(hist, "avgPrice");

        return Math.max((sum / num), minEnergyPrice);
    }
}
