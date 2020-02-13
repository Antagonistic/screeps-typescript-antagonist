export class TerminalNetwork {

    public static readonly CREDIT_FLOAT = 10000;
    public static readonly ENERGY_FLOAT = 10000;

    public static readonly ENERGY_BUY_PRICE = 0.042;

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
                this.buyEnergy(term);
            }
        }
    }

    public buyEnergy(term: StructureTerminal) {
        const order = _.last(_.sortBy(Game.market.getAllOrders((o: Order) => o.resourceType === RESOURCE_ENERGY && o.type === ORDER_SELL && o.remainingAmount >= 2000), x => this.scoreEnergyCandidate(x, term)));
        if (order && order.price <= TerminalNetwork.ENERGY_BUY_PRICE) {
            const ret = Game.market.deal(order.id, 2000, term.room.name);
            console.log(`MARKET: Bought 2000 energy priced ${order.price} at ${term.room.print} ${ret}`);
            if (ret !== OK) {
                console.log(JSON.stringify(order));
            }
        }
    }

    public scoreEnergyCandidate(o: Order, term: StructureTerminal) {
        if (!o.roomName) { return 0; }
        const cost = Game.market.calcTransactionCost(2000, term.room.name, o.roomName);
        const score = (2000 / (2000 + cost)) * o.price;
        return score;
    }

    public capAmountToTransactionCost() {
        ;
    }

}
