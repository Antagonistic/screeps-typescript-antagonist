export class TerminalNetwork {

    public static readonly CREDIT_FLOAT = 10000;
    public static readonly ENERGY_FLOAT = 10000;

    public static readonly ENERGY_BUY_PRICE = 0.08;

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
                this.buyEnergy(term);
            }
        }
    }

    public buyEnergy(term: StructureTerminal) {
        const order = _.head(_.sortBy(Game.market.getAllOrders((o: Order) => o.resourceType === RESOURCE_ENERGY && o.type === ORDER_SELL && o.remainingAmount >= 1000 && o.price <= TerminalNetwork.ENERGY_BUY_PRICE), x => this.scoreEnergyCandidate(x, term)));
        const adjustedPrice = this.scoreEnergyCandidate(order, term)
        // console.log(`MARKET: ${order.price},${adjustedPrice} good?`);
        if (order && adjustedPrice <= TerminalNetwork.ENERGY_BUY_PRICE) {
            const ret = Game.market.deal(order.id, 2000, term.room.name);
            const amount = Math.min(this.calcMaxAmount(term.store.energy, term.room.name, order.roomName!) - 10, order.remainingAmount);
            if (amount > 100) {
                console.log(`MARKET: Bought ${amount} energy priced ${order.price}/${adjustedPrice} at ${term.room.print} ${ret}`);
                if (ret !== OK) {
                    console.log(JSON.stringify(order));
                }
            }
        }
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

    public calcMaxAmount(amount: number, roomName1: string, roomName2: string): number {
        const dist = Game.map.getRoomLinearDistance(roomName1, roomName2);
        return Math.floor(amount * (1 - Math.exp(-dist / 30)));
    }

    public capAmountToTransactionCost() {
        ;
    }

}
