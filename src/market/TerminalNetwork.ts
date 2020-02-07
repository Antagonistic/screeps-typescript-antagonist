export class TerminalNetwork {

    public static readonly CREDIT_FLOAT = 10000;
    public static readonly ENERGY_FLOAT = 10000;

    constructor() {
        ;
    }
    public terms: StructureTerminal[] = [];

    public registerTerminal(term: StructureTerminal) {
        this.terms.push(term);
    }

    public runTerminal(term: StructureTerminal) {
        if (term.store.energy - TerminalNetwork.ENERGY_FLOAT > 1000) {
            ;
        }
        else if (TerminalNetwork.ENERGY_FLOAT - term.store.energy) {
            ;
        }
    }

}
