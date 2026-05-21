const G = (() => {
  const engine = {
    cols: 20,
    rows: 15,
    tileSize: 24,
    fps: 10,
    map: [],
    tiles: {},
    state: {},

    onKey: null,
    onUpdate: null,
    onDraw: null,

    _canvas: null,
    _ctx: null,
    _interval: null,
    _ac: null,

    init(config = {}) {
      Object.assign(this, config);
      const canvas = document.getElementById('game');
      this._canvas = canvas;
      this._ctx = canvas.getContext('2d');
      canvas.width = this.cols * this.tileSize;
      canvas.height = this.rows * this.tileSize;

      document.addEventListener('keydown', e => {
        const arrows = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '];
        if (arrows.includes(e.key)) e.preventDefault();
        if (this.onKey) this.onKey(e.key);
      });

      // Swipe support for mobile
      let tx = 0, ty = 0;
      canvas.addEventListener('touchstart', e => {
        tx = e.touches[0].clientX;
        ty = e.touches[0].clientY;
        e.preventDefault();
      }, { passive: false });
      canvas.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - tx;
        const dy = e.changedTouches[0].clientY - ty;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (this.onKey) this.onKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
        } else {
          if (this.onKey) this.onKey(dy > 0 ? 'ArrowDown' : 'ArrowUp');
        }
        e.preventDefault();
      }, { passive: false });
    },

    getCell(x, y) {
      if (!this.inBounds(x, y)) return null;
      return (this.map[y] || '')[x] ?? ' ';
    },

    setCell(x, y, ch) {
      if (!this.inBounds(x, y)) return;
      const row = this.map[y] || '';
      this.map[y] = row.slice(0, x) + ch + row.slice(x + 1);
    },

    inBounds(x, y) {
      return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
    },

    isPassable(x, y) {
      const ch = this.getCell(x, y);
      if (ch === null) return false;
      const tile = this.tiles[ch];
      return tile ? tile.passable !== false : ch === ' ';
    },

    // Draw a filled tile rectangle (tile coords)
    fillTile(tx, ty, color) {
      const s = this.tileSize;
      this._ctx.fillStyle = color;
      this._ctx.fillRect(tx * s, ty * s, s, s);
    },

    dirFromKey(key) {
      if (key === 'ArrowUp')    return {dx:  0, dy: -1};
      if (key === 'ArrowDown')  return {dx:  0, dy:  1};
      if (key === 'ArrowLeft')  return {dx: -1, dy:  0};
      if (key === 'ArrowRight') return {dx:  1, dy:  0};
      return null;
    },

    findCell(ch) {
      for (let y = 0; y < this.rows; y++) {
        const x = (this.map[y] || '').indexOf(ch);
        if (x !== -1) return {x, y};
      }
      return null;
    },

    countCell(ch) {
      return this.map.join('').split(ch).length - 1;
    },

    randomEmpty() {
      let x, y;
      do {
        x = Math.floor(Math.random() * this.cols);
        y = Math.floor(Math.random() * this.rows);
      } while (!this.isPassable(x, y));
      return {x, y};
    },

    borderedMap(cols, rows, wallCh = '#', floorCh = '.') {
      const wall = wallCh.repeat(cols);
      const mid = wallCh + floorCh.repeat(cols - 2) + wallCh;
      return Array.from({length: rows}, (_, i) => (i === 0 || i === rows - 1) ? wall : mid);
    },

    beep(freq = 440, dur = 0.1, type = 'square', vol = 0.3) {
      if (!this._ac) this._ac = new (window.AudioContext || window.webkitAudioContext)();
      const ac = this._ac;
      if (ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g);
      g.connect(ac.destination);
      o.type = type;
      o.frequency.setValueAtTime(freq, ac.currentTime);
      g.gain.setValueAtTime(vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      o.start(ac.currentTime);
      o.stop(ac.currentTime + dur);
    },

    // Draw text at pixel coordinates
    text(x, y, str, color = '#fff', size = 14) {
      this._ctx.fillStyle = color;
      this._ctx.font = `${size}px monospace`;
      this._ctx.textAlign = 'left';
      this._ctx.textBaseline = 'top';
      this._ctx.fillText(str, x, y);
    },

    _render() {
      const ctx = this._ctx;
      const s = this.tileSize;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          const ch = this.getCell(x, y);
          const tile = this.tiles[ch];
          if (!tile && ch === ' ') continue;

          const px = x * s, py = y * s;

          if (tile) {
            if (tile.bg) {
              ctx.fillStyle = tile.bg;
              ctx.fillRect(px, py, s, s);
            }
            const glyph = tile.ch !== undefined ? tile.ch : (tile.bg ? '' : ch);
            if (glyph && tile.fg) {
              ctx.fillStyle = tile.fg;
              ctx.font = `${Math.floor(s * 0.72)}px monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(glyph, px + s / 2, py + s / 2);
            }
          } else {
            // Unknown char: grey box with character
            ctx.fillStyle = '#333';
            ctx.fillRect(px, py, s, s);
            ctx.fillStyle = '#aaa';
            ctx.font = `${Math.floor(s * 0.72)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ch, px + s / 2, py + s / 2);
          }
        }
      }

      if (this.onDraw) this.onDraw(ctx);
    },

    start() {
      if (this._interval) clearInterval(this._interval);
      this._render();
      this._interval = setInterval(() => {
        if (this.onUpdate) this.onUpdate();
        this._render();
      }, 1000 / this.fps);
    },

    stop() {
      clearInterval(this._interval);
      this._interval = null;
    },
  };

  return engine;
})();

// URL encode/decode — LZ-string compression keeps QR codes small
const GCode = {
  encode: code => LZString.compressToEncodedURIComponent(code),
  decode: str  => LZString.decompressFromEncodedURIComponent(str),
};
