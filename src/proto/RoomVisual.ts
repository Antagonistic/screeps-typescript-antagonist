{
    const g = global as any;
    if (!g.RoomVisual) { g.RoomVisual = g.RoomVisual || { prototype: {} }; }
}

// Shamelessly stolen from Overmind

/* tslint:disable:object-literal-sort-keys*/

const colors = {
    dark: '#181818',
    energy: '#FFE87B',
    gray: '#555555',
    infoBoxBad: '#ff2600',
    infoBoxGood: '#09ff00',
    light: '#AAAAAA',
    outline: '#8FBB93',
    power: '#F53547',
    road: '#666', // >:D
    speechBackground: '#aebcc4',
    speechText: '#000000',
};

const speechSize = 0.5;
const speechFont = 'Times New Roman';

RoomVisual.prototype.multitext = function (textLines: string[], x: number, y: number, opts = {}): RoomVisual {
    _.defaults(opts, {
        color: colors.infoBoxGood,
        textstyle: false,
        textsize: speechSize,
        textfont: 'monospace',
        opacity: 0.7,
    });

    let fontstring = '';
    if (opts.textstyle) {
        fontstring = opts.textstyle + ' ';
    }
    fontstring += opts.textsize + ' ' + opts.textfont;

    // Draw text
    let dy = 0;
    for (const line of textLines) {
        this.text(line, x, y + dy, {
            color: opts.color,
            backgroundPadding: 0.1,
            opacity: opts.opacity,
            font: fontstring,
            align: 'left',
        });
        dy += opts.textsize;
    }

    return this;
};

RoomVisual.prototype.box = function (x: number, y: number, w: number, h: number, style?: LineStyle): RoomVisual {
    return this.line(x, y, x + w, y, style)
        .line(x + w, y, x + w, y + h, style)
        .line(x + w, y + h, x, y + h, style)
        .line(x, y + h, x, y, style);
};

function rotate(x: number, y: number, s: number, c: number, px: number, py: number): { x: number, y: number } {
    const xDelta = x * c - y * s;
    const yDelta = x * s + y * c;
    return { x: px + xDelta, y: py + yDelta };
}


function relPoly(x: number, y: number, poly: Array<[number, number]>): Array<[number, number]> {
    return poly.map(p => {
        p[0] += x;
        p[1] += y;
        return p;
    });
}

RoomVisual.prototype.structure = function (x: number, y: number, type: string, opts: { opacity?: number } = {}): RoomVisual {
    _.defaults(opts, { opacity: 0.5 });
    switch (type) {
        case STRUCTURE_EXTENSION:
            this.circle(x, y, {
                radius: 0.5,
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity
            });
            this.circle(x, y, {
                radius: 0.35,
                fill: colors.gray,
                opacity: opts.opacity
            });
            break;
        case STRUCTURE_SPAWN:
            this.circle(x, y, {
                radius: 0.65,
                fill: colors.dark,
                stroke: '#CCCCCC',
                strokeWidth: 0.10,
                opacity: opts.opacity
            });
            this.circle(x, y, {
                radius: 0.40,
                fill: colors.energy,
                opacity: opts.opacity
            });

            break;
        case STRUCTURE_POWER_SPAWN:
            this.circle(x, y, {
                radius: 0.65,
                fill: colors.dark,
                stroke: colors.power,
                strokeWidth: 0.10,
                opacity: opts.opacity
            });
            this.circle(x, y, {
                radius: 0.40,
                fill: colors.energy,
                opacity: opts.opacity
            });
            break;
        case STRUCTURE_LINK: {
            // let osize = 0.3;
            // let isize = 0.2;
            let outer: Array<[number, number]> = [
                [0.0, -0.5],
                [0.4, 0.0],
                [0.0, 0.5],
                [-0.4, 0.0]
            ];
            let inner: Array<[number, number]> = [
                [0.0, -0.3],
                [0.25, 0.0],
                [0.0, 0.3],
                [-0.25, 0.0]
            ];
            outer = relPoly(x, y, outer);
            inner = relPoly(x, y, inner);
            outer.push(outer[0]);
            inner.push(inner[0]);
            this.poly(outer, {
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity
            });
            this.poly(inner, {
                fill: colors.gray,
                stroke: undefined,
                opacity: opts.opacity
            });
            break;
        }
        case STRUCTURE_TERMINAL: {
            let outer: Array<[number, number]> = [
                [0.0, -0.8],
                [0.55, -0.55],
                [0.8, 0.0],
                [0.55, 0.55],
                [0.0, 0.8],
                [-0.55, 0.55],
                [-0.8, 0.0],
                [-0.55, -0.55],
            ];
            let inner: Array<[number, number]> = [
                [0.0, -0.65],
                [0.45, -0.45],
                [0.65, 0.0],
                [0.45, 0.45],
                [0.0, 0.65],
                [-0.45, 0.45],
                [-0.65, 0.0],
                [-0.45, -0.45],
            ];
            outer = relPoly(x, y, outer);
            inner = relPoly(x, y, inner);
            outer.push(outer[0]);
            inner.push(inner[0]);
            this.poly(outer, {
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity
            });
            this.poly(inner, {
                fill: colors.light,
                stroke: undefined,
                opacity: opts.opacity
            });
            this.rect(x - 0.45, y - 0.45, 0.9, 0.9, {
                fill: colors.gray,
                stroke: colors.dark,
                strokeWidth: 0.1,
                opacity: opts.opacity
            });
            break;
        }
        case STRUCTURE_LAB:
            this.circle(x, y - 0.025, {
                radius: 0.55,
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity
            });
            this.circle(x, y - 0.025, {
                radius: 0.40,
                fill: colors.gray,
                opacity: opts.opacity
            });
            this.rect(x - 0.45, y + 0.3, 0.9, 0.25, {
                fill: colors.dark,
                stroke: undefined,
                opacity: opts.opacity
            });
            {
                let box: Array<[number, number]> = [
                    [-0.45, 0.3],
                    [-0.45, 0.55],
                    [0.45, 0.55],
                    [0.45, 0.3],
                ];
                box = relPoly(x, y, box);
                this.poly(box, {
                    stroke: colors.outline,
                    strokeWidth: 0.05,
                    opacity: opts.opacity
                });
            }
            break;
        case STRUCTURE_TOWER:
            this.circle(x, y, {
                radius: 0.6,
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity
            });
            this.rect(x - 0.4, y - 0.3, 0.8, 0.6, {
                fill: colors.gray,
                opacity: opts.opacity
            });
            this.rect(x - 0.2, y - 0.9, 0.4, 0.5, {
                fill: colors.light,
                stroke: colors.dark,
                strokeWidth: 0.07,
                opacity: opts.opacity
            });
            break;
        case STRUCTURE_ROAD:
            this.circle(x, y, {
                radius: 0.175,
                fill: colors.road,
                stroke: undefined,
                opacity: opts.opacity
            });
            if (!this.roads) { this.roads = []; }
            this.roads.push([x, y]);
            break;
        case STRUCTURE_RAMPART:
            this.circle(x, y, {
                radius: 0.65,
                fill: '#434C43',
                stroke: '#5D735F',
                strokeWidth: 0.10,
                opacity: opts.opacity
            });
            break;
        case STRUCTURE_WALL:
            this.circle(x, y, {
                radius: 0.40,
                fill: colors.dark,
                stroke: colors.light,
                strokeWidth: 0.05,
                opacity: opts.opacity
            });
            break;
        case STRUCTURE_STORAGE:
            const storageOutline = relPoly(x, y, [
                [-0.45, -0.55],
                [0, -0.65],
                [0.45, -0.55],
                [0.55, 0],
                [0.45, 0.55],
                [0, 0.65],
                [-0.45, 0.55],
                [-0.55, 0],
                [-0.45, -0.55],
            ]);
            this.poly(storageOutline, {
                stroke: colors.outline,
                strokeWidth: 0.05,
                fill: colors.dark,
                opacity: opts.opacity
            });
            this.rect(x - 0.35, y - 0.45, 0.7, 0.9, {
                fill: colors.energy,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_OBSERVER:
            this.circle(x, y, {
                fill: colors.dark,
                radius: 0.45,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity
            });
            this.circle(x + 0.225, y, {
                fill: colors.outline,
                radius: 0.20,
                opacity: opts.opacity
            });
            break;
        case STRUCTURE_NUKER:
            let outline: Array<[number, number]> = [
                [0, -1],
                [-0.47, 0.2],
                [-0.5, 0.5],
                [0.5, 0.5],
                [0.47, 0.2],
                [0, -1],
            ];
            outline = relPoly(x, y, outline);
            this.poly(outline, {
                stroke: colors.outline,
                strokeWidth: 0.05,
                fill: colors.dark,
                opacity: opts.opacity
            });
            let inline: Array<[number, number]> = [
                [0, -.80],
                [-0.40, 0.2],
                [0.40, 0.2],
                [0, -.80],
            ];
            inline = relPoly(x, y, inline);
            this.poly(inline, {
                stroke: colors.outline,
                strokeWidth: 0.01,
                fill: colors.gray,
                opacity: opts.opacity
            });
            break;
        case STRUCTURE_CONTAINER:
            this.rect(x - 0.225, y - 0.3, 0.45, 0.6, {
                fill: 'yellow',
                opacity: opts.opacity,
                stroke: colors.dark,
                strokeWidth: 0.10,
            });
            break;
        default:
            this.circle(x, y, {
                fill: colors.light,
                radius: 0.35,
                stroke: colors.dark,
                strokeWidth: 0.20,
                opacity: opts.opacity
            });
            break;
    }

    return this;
};

const dirs = [
    [],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1]
];

RoomVisual.prototype.connectRoads = function (opts = {}): RoomVisual | void {
    _.defaults(opts, { opacity: 0.5 });
    const color = colors.road || 'white';
    if (!this.roads) { return; }
    // this.text(this.roads.map(r=>r.join(',')).join(' '),25,23)
    this.roads.forEach((r: number[]) => {
        // this.text(`${r[0]},${r[1]}`,r[0],r[1],{ size: 0.2 })
        for (let i = 1; i <= 4; i++) {
            const d = dirs[i];
            const c = [r[0] + d[0], r[1] + d[1]];
            const rd = _.some(this.roads!, (_r: [number, number]) => _r[0] === c[0] && _r[1] === c[1]);
            // this.text(`${c[0]},${c[1]}`,c[0],c[1],{ size: 0.2, color: rd?'green':'red' })
            if (rd) {
                this.line(r[0], r[1], c[0], c[1], {
                    color,
                    width: 0.35,
                    opacity: opts.opacity
                });
            }
        }
    });

    return this;
};
