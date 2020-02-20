/* tslint:disable:object-literal-sort-keys*/

export const RESOURCE_FLOAT: { [key in ResourceConstant]?: number } = {
    H: 1000,
    O: 1000,
    K: 1000,
    X: 1000,
    L: 1000,
    Z: 1000
}

export class TerminalNetwork {

    public static readonly CREDIT_FLOAT = 10000;
    public static readonly ENERGY_FLOAT = 10000;

    public static readonly ENERGY_BUY_PRICE = 0.06;

    constructor() {
        ;
    }
    public terms: StructureTerminal[] = [];

    public registerTerminal(term: StructureTerminal) {
        this.terms.push(term);
    }

    public runTerminal(term: StructureTerminal) {
        if (term.cooldown) { return; }
        const float = term.store.energy - TerminalNetwork.ENERGY_FLOAT;
        if (float > 1000) {
            // Too much energy, send to lower energy terminals
            for (const t of this.terms) {
                if (term === t) { continue; }
                if (t.store.energy < term.store.energy - 2000) {
                    term.send(RESOURCE_ENERGY, 1000, t.room.name, "Excess energy");
                    return;
                }
            }
            // Nowhere to send to, sell maybe?
        }
        else if (float < -1500) {
            // Too little energy, buy
            if (Game.market.credits > TerminalNetwork.CREDIT_FLOAT) {
                // console.log(`MARKET: ${term.room.print} needs to buy energy`);
                if (this.buyEnergy(term)) { return; }
            }
        }
        if (term.store.energy > 1000) {
            this.runMinerals(term);
        }
    }

    public runMinerals(term: StructureTerminal) {
        for (const _res in term.store) {
            const res = _res as ResourceConstant;
            const amount = term.store[res] || 0;
            if (amount > 5000) {
                const short = this.getShortage(term, res);
                // console.log(`MARKET: ${term.room.print} Deciding on ${amount} excess ${res} ${short}`);
                if (short < 0) {
                    // excess, send away
                    for (const t of this.terms) {
                        if (term === t) { continue; }
                        const destShortage = this.getShortage(t, res);
                        if (destShortage > 0) {
                            // send it!
                            console.log(`MARKET: ${t.room.print} has shortage ${destShortage} of ${res}`);
                            const sendAmount = Math.max(this.calcMaxAmount(term.store.energy, term.room.name, t.room.name), 2000);
                            if (sendAmount > 500) {
                                const ret = term.send(res, sendAmount, t.room.name, `Excess: ${res}`);
                                if (ret !== OK) {
                                    console.log(`MARKET: Error sending ${sendAmount} ${res} from ${term.room.print} to ${t.room.print}: ${ret}`);
                                }
                                else {
                                    console.log(`MARKET: Sent ${sendAmount} ${res} from ${term.room.print} to ${t.room.print}`);
                                }
                                return;
                            }
                        }
                    }
                }
            }
        }
    }

    public buyEnergy(term: StructureTerminal): boolean {
        const order = _.head(_.sortBy(Game.market.getAllOrders((o: Order) => o.resourceType === RESOURCE_ENERGY && o.type === ORDER_SELL && o.remainingAmount >= 1000 && o.price <= TerminalNetwork.ENERGY_BUY_PRICE), x => this.scoreEnergyCandidate(x, term)));
        const adjustedPrice = this.scoreEnergyCandidate(order, term)
        // console.log(`MARKET: ${order.price},${adjustedPrice} good?`);
        if (order && adjustedPrice <= TerminalNetwork.ENERGY_BUY_PRICE) {
            const amount = Math.min(this.calcMaxAmount(term.store.energy, term.room.name, order.roomName!) - 10, order.remainingAmount);
            const cost = Game.market.calcTransactionCost(amount, term.room.name, order.roomName!);
            const ret = Game.market.deal(order.id, amount, term.room.name);
            if (amount > 100) {
                console.log(`MARKET: Bought ${amount} energy priced ${order.price}/${adjustedPrice.toPrecision(2)} cost: ${cost}/${term.store.energy} at ${term.room.print} ${ret}`);
                if (ret !== OK) {
                    console.log(JSON.stringify(order));
                }
                return true;
            }
        }
        return false;
    }

    public scoreEnergyCandidate(o: Order, term: StructureTerminal) {
        if (!o.roomName) { return 0; }
        const cost = Game.market.calcTransactionCost(2000, term.room.name, o.roomName);
        const score = (2000 / (2000 - cost)) * o.price;
        return score;
    }

    public reportEnergyBuyCandidates(term: StructureTerminal) {
        const order = _.take(_.sortBy(Game.market.getAllOrders((o: Order) => o.resourceType === RESOURCE_ENERGY && o.type === ORDER_SELL && o.remainingAmount >= 2000), x => this.scoreEnergyCandidate(x, term)), 10);
        console.log(`roomName price score cost maxBuy`);
        for (const o of order) {
            const cost = Game.market.calcTransactionCost(2000, term.room.name, o.roomName!);
            const score = this.scoreEnergyCandidate(o, term).toPrecision(2);
            const maxBuy = this.calcMaxAmount(term.store.energy, term.room.name, o.roomName!);
            console.log(`${o.roomName} ${o.price} ${score} ${cost} ${maxBuy}`);
        }
    }

    public calcMaxAmount(energy: number, roomName1: string, roomName2: string): number {
        const dist = Game.map.getRoomLinearDistance(roomName1, roomName2);
        return Math.floor(energy * (1 - Math.exp(-dist / 30)));
    }

    public capAmountToTransactionCost() {
        ;
    }

    public getShortage(term: StructureTerminal, res: ResourceConstant): number {
        const amount = term.store[res];
        return (RESOURCE_FLOAT[res] || 0) - amount;
    }

}
