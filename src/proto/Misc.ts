{
    const g = global as any;
    if (!g.Source) { g.Source = g.Source ?? { prototype: {} }; }
}

/* tslint:disable:object-literal-sort-keys*/
Object.defineProperty(Source.prototype, 'energyPerTick', {
    get() {
        return Math.max(this.energyCapacity, SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME;
    },
    configurable: true,
});
