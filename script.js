const WIDTH = 1920;
const TILE = 32;
const HAY_HEIGHT = 7;
const WHEEL_SCALE = 100;
const TEXT_FRAMES = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,!?"\'-+=';
const SQUARE_FRAMES = ' ^<v>+-*/%!`?_|":\\$.,#0123456789@';
const KEEP_RUNNING = Infinity;
const start = new Date();
const fps = 10;

const INITIAL_PROGRAM = {"0":{"0":"^","1":">","2":":","3":"1","4":"-","5":":","6":"|","-5":"","-3":"o","-2":""},"1":{"0":" ","1":"","2":null,"3":null,"4":null,"5":null,"6":"$","-5":"","-2":"","-3":"t"},"2":{"0":"l","1":">","2":">","3":",","4":"*","5":">","6":"v","-1":"","-5":"","-2":"","-3":"c"},"3":{"0":null,"1":"*","2":null,"3":"","4":null,"5":null,"6":"\\","-1":"","-5":"","-3":"a","-2":""},"4":{"0":null,"1":"5","2":"","3":"","4":null,"5":"","6":":","-1":"","-5":"","-3":"f","-2":""},"5":{"0":"","1":"^","2":"2","3":".","4":":","5":"\\","6":"_","7":"$","8":".","9":"@","14":"f","15":"i","16":"b","17":"o","18":"n","19":"a","20":"c","21":"c","22":"i","-1":""},"6":{"18":"v","22":"s","23":"2","24":"-","25":"1","26":"<","-5":""},"7":{"14":"5","16":"1","17":"1","18":">","19":":","20":"2","21":"s","22":"+","23":"2","24":"s","25":":","26":"|"},"8":{"26":"$","-5":""},"9":{"26":"\\"},"10":{"26":"@"},"11":{"5":"s","7":"2"},"12":{"5":"t","7":"1"},"13":{"5":"i","7":"4"},"14":{"5":"g","7":"5"},"15":{"5":"i","6":">","7":"v"},"16":{"5":"d","7":"5"},"17":{"7":"2"},"18":{"7":"*"},"19":{"7":"*"},"20":{"7":"+","17":"","19":"","20":""},"21":{"7":"\\","19":""},"22":{"6":"\\","7":":","8":"","19":""},"23":{"6":"^","7":"_","8":"$","9":"@","19":""},"24":{"19":""},"25":{"19":""},"26":{"19":""},"27":{"11":"r","12":"e","13":"v","14":"e","15":"r","16":"s","17":"","19":""},"28":{"13":"","19":""},"29":{"13":"","19":""},"30":{"11":"1","12":"2","13":"3","14":"4","15":"5","16":"5","17":"","18":">","19":":","20":"0","21":"1","22":"P","23":"@"},"31":{"13":"","19":""},"32":{"19":""},"33":{"19":""},"-1":{"0":"5","1":"v","5":"","6":"<","21":"@","-5":"","-3":"r","-2":""},"-2":{"0":">","1":"v","3":"","21":".","-5":"","-2":"","-3":"i","-1":""},"-3":{"0":"","1":"","2":"","3":"","4":"","5":"","7":">","8":"7","9":"3","10":"*","11":"^","21":"$","22":"","-5":"","-1":"","-4":"","-3":"a","-2":""},"-4":{"0":"","1":"","7":"+","9":"","10":"","11":">","12":"","13":"","14":">","15":":","16":"2","17":"s","18":"\\","19":"%","20":":","21":"|","-5":"","-3":"l","-4":"","-2":""},"-9":{"4":"g","5":"c","6":"d","7":"v","11":">","12":"^","13":"\"","14":"h","15":"e","16":"l","17":"l","18":"o","19":" ","20":"w","21":"o","22":"r","23":"l","24":"d","25":"\"","26":"<","-5":""},"-10":{"11":",","12":":"},"-11":{"11":"v","12":"_","13":"$","14":"@","15":"","16":"","17":"","18":"","19":""},"-12":{"12":"","14":"\"","15":">","16":"^","17":"v","18":"\"","19":"@"},"-5":{"1":"","2":"","3":"","4":"","5":"","6":"","7":"2","8":"","9":" ","14":"v","18":"","21":"<","-5":""},"-6":{"7":"*","-5":""},"-7":{"7":"8","-5":""},"-8":{"7":"4","-5":""}};

let farm;
let [panx,pany] = [0,0];
let zoom = 0;
let scale = 1;
let click_mode = false;
let [dragx,dragy] = [0,0];
let [clickx,clicky] = [0,0];
let [clickpanx,clickpany] = [0,0];
let [pickx,picky] = [0,0];
let selection = [0,0];
let type_direction = 'se';
let tps;
let raw_speed = 4;
let dt = 0;
let ot = start;


const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', {alpha: false});
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

const go_button = document.getElementById('go');

function set_canvas_size() {
    const box = canvas.getBoundingClientRect();
    canvas.width = box.width;
    canvas.height = box.height;
    ctx.translate(canvas.width/2,canvas.height/2);
    set_zoom(1);
    ctx.save();
    redraw();
}
set_canvas_size();
(new ResizeObserver(set_canvas_size)).observe(canvas);


function debug(msg) {
    document.getElementById('debug').textContent = msg;
}

function save() {
    localStorage.setItem('tractor-befunge-program',JSON.stringify(farm.program));
}

function load() {
    const jprogram = localStorage.getItem('tractor-befunge-program');
    farm.program = jprogram ? JSON.parse(jprogram) : INITIAL_PROGRAM;
}

const ops = {
    '+': {
        name: 'Add',
        fn: (tractor) => {
            const a = tractor.pop();
            const b = tractor.pop();
            tractor.push(a+b);
        }
    },
    '-': {
        name: 'Subtract',
        fn: (tractor) => {
            const a = tractor.pop();
            const b = tractor.pop();
            tractor.push(b-a);
        }
    },
    '*': {
        name: 'Multiply',
        fn: (tractor) => {
            const a = tractor.pop();
            const b = tractor.pop();
            tractor.push(a*b);
        }
    },
    '/': {
        name: 'Divide',
        fn: (tractor) => {
            const a = tractor.pop();
            const b = tractor.pop();
            tractor.push(Math.floor(b/a));
        }
    },
    '%': {
        name: 'Modulo',
        fn: (tractor) => {
            const a = tractor.pop();
            const b = tractor.pop();
            tractor.push(b%a);
        }
    },
    '!': {
        name: 'Not',
        fn: (tractor) => {
            const a = tractor.pop();
            tractor.push(a==0 ? 1 : 0);
        }
    },
    '`': {
        name: 'Compare',
        fn: (tractor) => {
            const a = tractor.pop();
            const b = tractor.pop();
            tractor.push(b > a ? 1 : 0);
        }
    },
    'v': {
        name: 'Down',
        fn: (tractor) => { tractor.direction = 'sw'; },
    },
    '<': {
        name: 'Left',
        fn: (tractor) => { tractor.direction = 'nw'; },
    },
    '>': {
        name: 'Right',
        fn: (tractor) => { tractor.direction = 'se'; },
    },
    '^': {
        name: 'Up',
        fn: (tractor) => { tractor.direction = 'ne'; },
    },
    '?': {
        name: 'Random direction',
        fn: (tractor) => { tractor.direction = ['sw','se','nw','ne'][Math.floor(Math.random()*4)]; },
    },
    '_': {
        name: 'Horizontal if',
        fn: (tractor) => {
            const a = tractor.pop();
            tractor.direction = a==0 ? 'se' : 'nw';
        }
    },
    '|': {
        name: 'Vertical if',
        fn: (tractor) => {
            const a = tractor.pop();
            tractor.direction = a==0 ? 'sw' : 'ne';
        }
    },
    '"': {
        name: 'Toggle string mode',
        fn: (tractor) => {
            tractor.stringmode = !tractor.stringmode;
        }
    },
    ':': {
        name: 'Duplicate',
        fn: (tractor) => { 
            const a = tractor.pop();
            tractor.push(a);
            tractor.push(a);
        }
    },
    '\\': {
        name: 'Swap',
        fn: (tractor) => {
            const a = tractor.pop();
            const b = tractor.pop();
            tractor.push(a);
            tractor.push(b);
        }
    },
    '$': {
        name: 'Discard',
        fn: (tractor) => { tractor.pop(); },
    },
    '.': {
        name: 'Say a number',
        fn: (tractor) => { tractor.say(tractor.pop()+''); },
    },
    ',': {
        name: 'Say a character',
        fn: (tractor) => { tractor.say(String.fromCharCode(tractor.pop())); },
    },
    '#': {
        name: 'Jump',
        fn: (tractor) => { tractor.jumping = 2; },
    },
    '@': {
        name: 'Stop',
        fn: (tractor) => { tractor.going = false; },
    },
    'g': {
        name: 'Get',
        fn: (tractor) => {
            const y = tractor.pop();
            const x = tractor.pop();
            const c = tractor.farm.get_op(x,y).charCodeAt(0) || 0;
            tractor.push(c);
        }
    },
    'G': {
        name: 'Relative get',
        fn: (tractor) => {
            const y = tractor.pop();
            const x = tractor.pop();
            const c = tractor.farm.get_op(tractor.x+x,tractor.y+y).charCodeAt(0) || 0;
            tractor.push(c);
        }
    },
    'p': {
        name: 'Put',
        fn: (tractor) => {
            const y = tractor.pop();
            const x = tractor.pop();
            const c = tractor.pop()
            tractor.farm.set_op(x,y,String.fromCharCode(c));
        }
    },
    'P': {
        name: 'Relative put',
        fn: (tractor) => {
            const y = tractor.pop();
            const x = tractor.pop();
            const c = tractor.pop()
            tractor.farm.set_op(tractor.x+x,tractor.y+y,String.fromCharCode(c));
        }
    },
    'S': {
        name: 'Shove back',
        fn: (tractor) => {
            const n = tractor.pop();
            const a = tractor.pop();
            const m = [];
            for(let i=0;i<n;i++) {
                m.splice(0,0,tractor.pop());
            }
            tractor.push(a);
            for(let z of m) {
                tractor.push(z);
            }
        }
    },
    's': {
        name: 'Deep swap',
        fn: (tractor) => {
            const n = tractor.pop();
            const a = tractor.pop();
            const m = [];
            for(let i=0;i<n-1;i++) {
                m.splice(0,0,tractor.pop());
            }
            const b = tractor.pop();
            tractor.push(a);
            for(let z of m) {
                tractor.push(z);
            }
            tractor.push(b);
        }
    },
}
for(let i=0;i<10;i++) {
    ops[i] = {
        name: `Push ${i}`,
        fn: (tractor) => { tractor.push(i); }
    };
}

const selector = document.getElementById('selector');
Array.from(SQUARE_FRAMES.slice(1)).forEach((key) => {
    const {name} = ops[key];
    const div = document.createElement('div');
    div.setAttribute('class','op');
    selector.appendChild(div);
    const i = SQUARE_FRAMES.indexOf(key);
    div.innerHTML = `
    <span class="square-icon" style="background-position: 0px ${-i*TILE*2}px;"></span>
    <span class="name">${name}</span>
    `;
    div.addEventListener('click', e => {
        type_key(key)
    });
});


const programs = [
    `v   0:+   1:-   2:*   3:/   
0
v                                                    <

> v >v   >v   >v
  >:|>1-:|>1-:|>1-:|>$ v
   0    1    2    3@  ?@ 
    2    1    2                 >v   >v   >v
    3    4                  > : |>1-:|>1-:|>   v
    0    1                    0+$  1-$  2*$  3/$
    >    >    >    >   >    ^   +    -    *    /
                                >    >    >    >  \\1+^`
];

const sprite_loader = document.createElement('div');
sprite_loader.style['display'] = 'none';
document.body.appendChild(sprite_loader);
class Sprite {
    constructor(name,width,height,cols, frames) {
        this.img = document.createElement('img');
        this.img.setAttribute('src',`${name}.png`);
        sprite_loader.appendChild(this.img);
        this.loaded = new Promise((resolve,reject) => {
            this.img.addEventListener('load', e => {
                resolve(this.img);
            });
        });
        this.width = width;
        this.height = height;
        this.cols = cols;
        this.frames = frames;
    }

    draw(ctx, frame, dx, dy) {
        frame = frame || 0;
        frame = frame % this.frames;
        const { width, height, cols } = this;
        const x = frame % cols;
        const y = (frame-x)/cols;
        ctx.drawImage(this.img, x*width, y*height, width, height, dx-width/2, dy-height/2, width, height);
    }
}

function draw_text(ctx,s,x,y,centre) {
    const w = s.length*5-1;
    if(ctx.textAlign == 'center') {
        x -= w/2;
    }
    for(let i=0;i<s.length;i++) {
        const f = TEXT_FRAMES.indexOf(s[i]);
        if(f==-1) {
            continue;
        }
        sprites.digits.draw(ctx,f,x+i*5,y);
    }
}

const compass = {
    'se': [1,0],
    'sw': [0,1],
    'nw': [-1,0],
    'ne': [0,-1]
};

// convert world coords to screen coords
function project(x,y) {
    return [(x-y)*TILE, (x+y)*TILE];
}

// convert screen coords to world coords
function unproject(u,v) {
    u += panx;
    v += pany;
    return [Math.floor((u+v)/TILE/2+0.5), Math.floor((v-u)/TILE/2+0.5)];
}

class Tractor {
    going = false;
    jumping = 0;
    stringmode = false;
    progress = 0;
    output = '';
    keep_running = KEEP_RUNNING;

    constructor(farm, x, y, direction) {
        this.farm = farm;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.stack = [];
        go_button.addEventListener('click', e => this.toggle_go() );
    }

    draw_pos() {
        const {x,y} = this;
        const [dx,dy] = compass[this.direction];
        const jump = this.jumping == 2 ? Math.max(0,this.progress-TILE/2) : this.jumping==1 ? Math.max(0,TILE/2 - this.progress) : 0;
        const [px,py] = project(x+this.progress*dx/TILE, y+this.progress*dy/TILE);
        return [px,py-jump];
    }

    draw(ctx, frame) {
        const offset = {
            'nw': 0,
            'se': 4,
            'sw': 8,
            'ne': 12
        }
        frame = (frame % 4) + offset[this.direction];
        const [sx,sy] = this.draw_pos();
        sprites.tractor.draw(ctx, frame, sx, sy);
        const hayframe = ['nw','ne','se','sw'].indexOf(this.direction);
        const [stx,sty] = {
            'se': [-16,-12],
            'sw': [18, -12],
            'nw': [16,  10],
            'ne': [-14, 10]
        }[this.direction];
        this.stack.forEach((n,i) => {
            sprites.hay.draw(ctx,hayframe,sx,sy+((frame+i)%3==1)-HAY_HEIGHT*i);
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.font = 'bold 6px monospace';
            draw_text(ctx, n+'',sx+stx,sy+sty + ((frame+i)%3==1) - HAY_HEIGHT*i);
        });
        if(this.output) {
            ctx.fillStyle = 'white';
            sprites.speech.draw(ctx,0,sx,sy-20+6.5);
            ctx.fillRect(sx+3,sy-20, this.output.length*5-2, 11);
            sprites.speech.draw(ctx,1,sx+this.output.length*5,sy-20+6.5);
            ctx.fillStyle = 'black';
            ctx.textAlign = 'start';
            ctx.textBaseline = 'center';
            ctx.font = 'bold 8px monospace';
            draw_text(ctx, this.output, sx+2,sy-20+6);
        }
    }

    toggle_go() {
        this.going ? this.stop() : this.start();
    }

    start() {
        this.going = true;
        this.keep_running = KEEP_RUNNING;
        go_button.textContent = 'Stop';
    }
    stop() {
        this.going = false;
        go_button.textContent = 'Go';
    }

    tick() {
        if(!this.going) {
            return;
        }
        if(click_mode != 'move_tractor') {
            this.progress += 1;
        }
        if(this.progress==TILE) {
            this.progress = 0;
            const [dx,dy] = compass[this.direction];
            this.x += dx;
            this.y += dy;

            const c = this.farm.get_op(this.x,this.y);
            if(c.trim()) {
                this.keep_running = KEEP_RUNNING;
            } else {
                this.keep_running -= 1;
                if(this.keep_running == 0) {
                    this.stop();
                }
            }
            this.jumping -= 1;
            if(this.jumping>0) {
            } else if(this.stringmode) {
                if(c=='"') {
                    this.stringmode = false;
                } else {
                    this.push(c.charCodeAt(0));
                }
            } else {
                this.do_op(c);
            }
        }

    }

    do_op(c) {
        if(ops[c]) {
            ops[c].fn(this);
        }
    }

    pop() {
        return this.stack.pop() || 0;
    }
    push(a) {
        this.stack.push(a);
    }

    say(s) {
        if(s=='\n') {
            this.output = '';
        } else {
            this.output += s;
        }
    }

    turn_left() {
        this.direction = turn_left(this.direction);
    }
    turn_right() {
        this.direction = turn_left(this.direction,3);
    }
}

function turn_left(direction,n=1) {
    const directions = ['nw','sw','se','ne'];
    const i = directions.indexOf(direction);
    return directions[(i+n) % directions.length];
}
function turn_right(direction,n=1) {
    return turn_left(direction,n*3);
}

const sprites = {
    tractor: new Sprite('tractor', 2*TILE, 2*TILE, 4, 16),
    square: new Sprite('square', 2*TILE, 2*TILE, 1, 33),
    hay: new Sprite('hay', 2*TILE, 2*TILE, 2, 4),
    speech: new Sprite('speech', 6, 13, 2, 2),
    digits: new Sprite('digits', 4, 6, 9, 71),
    arrow: new Sprite('arrow', 2*TILE, 2*TILE, 1, 4),
}
window.sprites = sprites;
const sprites_loaded = Promise.all(Object.values(sprites).map(s=>s.loaded));

class Farm {
    constructor() {
        this.program = {};
    }

    reset() {
        this.tractor = new Tractor(this, -1, 0, 'se');
        redraw();
    }

    draw_frame() {
        const t = new Date();

        dt += (t-ot)/1000 * tps;
        ot = t;
        while(dt>1) {
            dt -= 1;
            this.do_update();
        }
        if(tps>0) {
            const [mx,my] = compass[this.tractor.direction];
        }

        ctx.restore();
        ctx.save();
        ctx.scale(scale,scale);
        ctx.translate(-panx,-pany);
        const frame = Math.floor((t - start)/1000 * fps);

        this.draw_program(this.tractor.x,this.tractor.y,2);

        this.draw_program(pickx,picky,2);

        if(selection) {
            this.draw_program(selection[0],selection[1],2);
        }

        ctx.fillStyle = 'white';
        const [px,py] = project(pickx,picky);
        ctx.fillRect(px,py, 2,2);

        this.tractor.draw(ctx, frame);
        if(selection) {
            const [sx,sy] = project(...selection);
            sprites.arrow.draw(ctx,['se','sw','nw','ne'].indexOf(type_direction),sx,sy);
        }


        requestAnimationFrame(e => this.draw_frame());
    }

    set_op(x,y,c) {
        this.program[y] = this.program[y] || {};
        this.program[y][x] = c;
        save();
    }

    get_op(x,y) {
        return (this.program[y] || '')[x] || '';
    }

    draw_program(cx,cy,radius) {
/*        debug(`Type: ${type_direction}
Zoom: ${scale}
Click: ${click_mode}`);*/
        for(let x=-radius;x<=radius;x++) {
            for(let y=-radius;y<=radius;y++) {
                const [px,py] = [cx+x, cy+y];
                const c = this.get_op(px,py);
                const frame = SQUARE_FRAMES.indexOf(c);
                const [dx,dy] = [(px-py)*TILE, (px+py)*TILE];
                if(frame==-1) {
                    sprites.square.draw(ctx,0, dx,dy);
                    ctx.fillStyle = 'black';
                    ctx.font = 'bold 20px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(c,dx,dy);
                } else {
                    sprites.square.draw(ctx,frame, dx, dy);
                }
            }
        }
    }

    do_update() {
        this.tractor.tick();
    }
}

const program_input = document.getElementById('program');

const speed_input = document.getElementById('speed');
function set_speed(speed) {
    raw_speed = Math.max(0,speed);
    tps = Math.pow(2,raw_speed)-1;
    if(speed_input.value != raw_speed) {
        speed_input.value = raw_speed;
    }
}
speed_input.addEventListener('input', e => set_speed(parseFloat(speed_input.value)));
set_speed();

canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
});
canvas.addEventListener('mousedown', e => {
    const [dx,dy] = farm.tractor.progress > TILE/2 ? compass[farm.tractor.direction] : [0,0];
    const on_tractor = pickx == farm.tractor.x + dx && picky == farm.tractor.y + dy;
    switch(e.button) {
        case 0:
            click_mode = 'selecting';
            if(on_tractor) {
                click_mode = 'move_tractor';
            }
            break;
        case 2:
            click_mode = 'panning';
            if(on_tractor) {
                click_mode = 'panning_tractor';
            }
            break;
    }
    [clickpanx, clickpany] = [panx, pany];
    [clickx, clicky] = [dragx, dragy];
});
canvas.addEventListener('mouseup', e => {
    const [dx,dy] = [dragx-clickx, dragy-clicky];
    const d = dx*dx + dy*dy;
    const clicked = d<1;
    switch(click_mode) {
        case 'selecting':
            if(clicked) {
                const [sx,sy] = selection;
                if(pickx==sx && picky==sy) {
                    type_direction = turn_left(type_direction);
                } else {
                    farm.draw_program(sx,sy,1);
                    selection = [pickx,picky];
                }
            }
            break;
        case 'move_tractor':
            if(clicked) {
                farm.tractor.turn_left();
            }
            break;
        case 'panning_tractor':
            if(clicked) {
                farm.tractor.pop();
                farm.tractor.output = '';
            }
            break;
    }

    click_mode = false;
});

canvas.addEventListener('mousemove', e => {
    const x = e.clientX;
    const y = e.clientY;
    const box = canvas.getBoundingClientRect();
    const [u, v] = [(x-box.left)/box.width - 0.5, (y-box.top)/box.height - 0.5];
    [dragx, dragy] = [u*canvas.width/scale, v*canvas.height/scale];
    [pickx,picky] = unproject(dragx,dragy);
    switch(click_mode) {
        case 'panning_tractor':
        case 'panning':
            [panx,pany] = [clickx+clickpanx-dragx,clicky+clickpany-dragy];
            redraw();
            break;
        case 'move_tractor':
            farm.tractor.x = pickx;
            farm.tractor.y = picky;
            farm.tractor.progress = 0;
            farm.tractor.stop();
            break;
            
    }
});

canvas.addEventListener('wheel', e => {
    set_zoom(- Math.round(e.deltaY /WHEEL_SCALE)*0.1);
});
function set_zoom(dz) {
    zoom += dz;
    zoom = Math.min(Math.max(0,zoom),2);
    scale = Math.pow(2,zoom);
    redraw();
}
function shift_view(dx,dy) {
    const [px,py] = project(dx,dy);
    [panx,pany] = [panx+px,pany+py];
    redraw();
}
function centre_view(x,y) {
    [panx,pany] = project(x,y);
    redraw();
}
function redraw() {
    [panx,pany] = [panx,pany].map(p=>Math.round(p/scale)*scale);
    if(!farm) {
        return;
    }
    ctx.restore();
    ctx.save();
    ctx.scale(scale,scale);
    ctx.translate(-panx,-pany);
    ctx.clearRect(-canvas.width/2,-canvas.height/2,canvas.width,canvas.height);
    const [cx,cy] = unproject(0,0).map(Math.floor);
    const radius = Math.ceil(Math.max(canvas.width,canvas.height)/TILE/scale*Math.sqrt(2));
    farm.draw_program(cx,cy,radius);
}
function set_type_direction() {
    const [sx,sy] = selection || [0,0];
    const op = farm.get_op(sx,sy);
    type_direction = {
        'v': 'sw',
        '<': 'nw',
        '>': 'se',
        '^': 'ne',
    }[op] || type_direction;
}
document.body.addEventListener('keydown', e => e.preventDefault());
document.body.addEventListener('keyup', handle_keypress);

function type_key(key) {
    const [sx,sy] = selection;
    farm.set_op(sx,sy,key);
    centre_view(sx,sy);

    set_type_direction();

    const [tx,ty] = compass[type_direction];
    selection = [sx+tx,sy+ty];
}

const key_ops = {
    'arrow': (e) => {
        const [sx,sy] = selection;
        const direction = {
            'ArrowLeft': 'nw',
            'ArrowUp': 'ne',
            'ArrowRight': 'se',
            'ArrowDown': 'sw'
        }[e.key];
        const [dx,dy] = compass[direction];
        if(e.ctrlKey) {
            set_zoom(-dy*0.1)
        } else if(e.shiftKey) {
            shift_view(dx,dy);
        } else {
            selection = [sx+dx, sy+dy];
            type_direction = direction;
        }
    },

    'delete': (e) => {
        const [sx,sy] = selection;
        farm.set_op(sx,sy,'');
    },

    'backspace': (e) => {
        const [sx,sy] = selection;
        set_type_direction();
        farm.set_op(sx,sy,'');
        const [tx,ty] = compass[type_direction];
        selection = [sx-tx,sy-ty];
    },

    'centre': (e) => {
        const [sx,sy] = selection;
        centre_view(sx,sy);
    },

    'type': (e) => {
        if(e.ctrlKey) {
            if(keymapCtrl[e.key]) {
                key_ops[keymapCtrl[e.key]](e);
            }
        } else if(e.key.length==1) {
            if(selection) {
                type_key(e.key);
            }
        }
    },

    'space': (e) => {
        farm.tractor.toggle_go();
    },

    'plus': (e) => {
        set_speed(raw_speed+1/4);
    },

    'minus': (e) => {
        set_speed(raw_speed-1/4);
    },
}

const keymap = {
    'ArrowUp': 'arrow',
    'ArrowDown': 'arrow',
    'ArrowLeft': 'arrow',
    'ArrowRight': 'arrow',
    'Delete': 'delete',
    'Backspace': 'backspace',
    'Enter': 'enter',
    ' ': 'space',
    '+': 'plus',
    '-': 'minus',
}

const keymapCtrl = {
    ' ': 'space',
    '+': 'plus',
    '-': 'minus',
}

function handle_keypress(e) {
    e.preventDefault();
    e.stopPropagation();
    const op = keymap[e.key] || 'type';
    key_ops[op](e);
}

sprites_loaded.then(() => {
    set_speed(4);
    farm = new Farm('');
    load();

    function reset() {
        farm.reset();
        redraw();
    }
    reset();

    requestAnimationFrame(e => farm.draw_frame());
});
