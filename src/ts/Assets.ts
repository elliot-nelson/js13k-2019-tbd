import { Canvas } from "./Canvas";
import { rgba} from "./Util";
import { Box, RAD, Point, NormalVector, Polygon, Circle } from "./Geometry";
import { PLAYER_WALK_SPEED } from "./Config";

/**
 * Sprites!
 *
 * For this game, a "sprite" is a little object that has an attached image, an anchor
 * point, a bounding box, and an optional hit box. This keeps pixel-level data about
 * the image all in one place (by passing a Sprite around, we know what image to draw,
 * what point in the image to rotate around, what areas of the image can get hit by
 * things, and what areas can hit other things).
 *
 * Whether the bounding box or hitbox do anything isn't up to the Sprite, it would be
 * up to the Frame that references it. (This is helpful because it's convenient for
 * a simple game like this to have only one hit frame, but the animation may call
 * for showing the sword swipe for 5-6 frames.)
 */
export class Sprite {
  img: CanvasImageSource;
  anchor: Point;
  bbox: Box;
  hbox?: Box;

  // Player
  static player_stand = {} as Sprite;
  static player_walk1 = {} as Sprite;
  static player_walk2 = {} as Sprite;
  static player_walk3 = {} as Sprite;
  static player_attack1 = {} as Sprite;
  static player_attack2 = {} as Sprite;

  // Demon1
  static demon1_walk1 = {} as Sprite;
  static demon1_walk2 = {} as Sprite;
  static demon1_walk3 = {} as Sprite;
  static demon1_attack1 = {} as Sprite;
  static demon1_attack2 = {} as Sprite;
  static demon1_stun = {} as Sprite;
  static demon1_chunk_a = {} as Sprite;
  static demon1_chunk_b = {} as Sprite;

  // Blood droplets
  static blood_droplet2 = {} as Sprite;
  static blood_droplet3 = {} as Sprite;

  static world1 = {} as Sprite;
  static world2 = {} as Sprite;
  static world3 = {} as Sprite;

  /**
   * A small helper that draws a sprite onto a canvas, respecting the anchor point of
   * the sprite. Note that the canvas should be PRE-TRANSLATED and PRE-ROTATED, if
   * that's appropriate!
   */
  static drawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number) {
    ctx.drawImage(sprite.img, x - sprite.anchor.x, y - sprite.anchor.y);
  }

  /**
   * Draw a sprite's bounding box, for debugging, using the same rules as drawSprite.
   */
  static drawBoundingBox(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number) {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.strokeRect(
      x - sprite.anchor.x + sprite.bbox[0].x,
      y - sprite.anchor.y + sprite.bbox[0].y,
      sprite.bbox[1].x - sprite.bbox[0].x,
      sprite.bbox[1].y - sprite.bbox[0].y
    );
  }

  /**
   * Draw a sprite's hit box, for debugging, using the same rules as drawSprite.
   */
  static drawHitBox(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number) {
    if (sprite.hbox) {
      console.log(sprite.hbox);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.strokeRect(
        x - sprite.anchor.x + sprite.hbox[0].x,
        y - sprite.anchor.y + sprite.hbox[0].y,
        sprite.hbox[1].x - sprite.hbox[0].x,
        sprite.hbox[1].y - sprite.hbox[0].y
      );
    }
  }

  static getBoundingCircle(sprite: Sprite, x: number, y: number): Circle {
    let dx = sprite.bbox[1].x - sprite.bbox[0].x;
    let dy = sprite.bbox[1].y - sprite.bbox[0].y;
    let r = (dx > dy ? dx : dy) / 2;
    return {
      x,
      y,
      r
    };
  }

  static getBoundingBoxPolygon(sprite: Sprite, x: number, y: number): Polygon {
    return this.getSpriteBoxPolygon(sprite.anchor, sprite.bbox, x, y);
  }

  static getHitBoxPolygon(sprite: Sprite, x: number, y: number) {
    return this.getSpriteBoxPolygon(sprite.anchor, sprite.hbox, x, y);
  }

  static getSpriteBoxPolygon(anchor: Point, box: Box, x: number, y: number): Polygon {
    return {
      x: x,
      y: y,
      p: [
        { x: box[0].x - anchor.x, y: box[0].y - anchor.y },
        { x: box[1].x - anchor.x, y: box[0].y - anchor.y },
        { x: box[1].x - anchor.x, y: box[1].y - anchor.y },
        { x: box[0].x - anchor.x, y: box[1].y - anchor.y }
      ]
    };
  }
}

/**
 * Behaviors!
 *
 * A behavior is kind of a global state of being for entities. The idea is that any given
 * entity may or may not have "some version" of these states; you attach the desired behavior
 * to each animation frame and it is intrepreted by that entity.
 */
export const enum Behavior {
  DEFAULT = 1,
  NEUTRAL,
  HOVER,
  WINDUP,
  ATTACK,
  COOLDOWN,
  DODGE,
  DYING,
  DEAD
}

/**
 * Frames!
 *
 * For convenience, frames are more than just animation - an entity's current frame tells it
 * what to draw, what AI/update logic to use, and more.
 */
export interface Frame {
  hit?: boolean;
  behavior?: Behavior;
  sprite?: Sprite;
  invuln?: boolean;
  input?: boolean;
  move?: NormalVector;
  tag?: string;
  despawn?: boolean;
  m?: number;
}

/**
 * Animations!
 *
 * An animation is a sequence of frames that represents a particular action. This lets us
 * reuse frames rather than constantly instantiating new ones.
 */
export class Animation2 {
  frames: Frame[];

  static player_stand: Animation2 = { frames: [
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_stand }
  ] };
  static player_walk: Animation2 = { frames: [
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 }, // m: 4
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 }, // m: 4
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 }
  ] };
  static player_attack: Animation2 = { frames: [
    { behavior: Behavior.WINDUP, sprite: Sprite.player_attack1, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.WINDUP, sprite: Sprite.player_attack1, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack2, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack2, m: PLAYER_WALK_SPEED * 3 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack2, m: PLAYER_WALK_SPEED * 2, hit: true },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack2, m: PLAYER_WALK_SPEED * 2 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack2, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_walk3, m: PLAYER_WALK_SPEED / 3 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_walk3, m: PLAYER_WALK_SPEED / 3 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_walk3, m: PLAYER_WALK_SPEED / 3 }
  ] };
  static player_dodge: Animation2 = { frames: [
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 4 },
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 8, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 8, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 8, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 8, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 8, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 8, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 2 }
  ] };

  static demon1_death: Animation2 = { frames: [
    { behavior: Behavior.DYING, sprite: Sprite.demon1_walk1 },
    { behavior: Behavior.DYING, sprite: Sprite.demon1_walk1 },
    { behavior: Behavior.DYING, sprite: Sprite.demon1_walk1 },
    { behavior: Behavior.DYING, sprite: Sprite.demon1_walk1 },
    { behavior: Behavior.DEAD, sprite: Sprite.demon1_walk1 }
  ] };
}

/**
 * Assets
 *
 * The Assets module loads raw PNGs we'll use to draw the game, does any postprocessing stuff
 * we might need to do, and then saves references to them for later.
 */
export class Assets {
  static images: { [key: string]: HTMLImageElement } = {};

  static async init() {
    await this.initSprite(Sprite.player_stand,     'player.png', 0, 0, 64, 64, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });
    await this.initSprite(Sprite.player_walk1,     'player.png', 64, 0, 64, 64, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });
    await this.initSprite(Sprite.player_walk2,     'player.png', 128, 0, 64, 64, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });
    await this.initSprite(Sprite.player_attack1,   'player.png', 192, 0, 64, 64, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });
    await this.initSprite(Sprite.player_attack2,   'player.png', 256, 0, 64, 64, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }],
      hbox: [{ x: 16, y: 9 }, { x: 48, y: 33 }]
    });
    await this.initSprite(Sprite.player_walk3,     'player.png', 320, 0, 64, 64, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });

    await this.initSprite(Sprite.demon1_walk1,     'demon1.png', 0, 0, 16, 22);
    await this.initSprite(Sprite.demon1_walk2,     'demon1.png', 16, 0, 16, 22);
    await this.initSprite(Sprite.demon1_walk3,     'demon1.png', 32, 0, 16, 22);
    await this.initSprite(Sprite.demon1_attack1,   'demon1.png', 48, 0, 16, 22);
    await this.initSprite(Sprite.demon1_attack2,   'demon1.png', 64, 0, 16, 22, {
      hbox: [{ x: 0, y: 0 }, { x: 16, y: 10 }]
    });

    await this.initDynamicSprite(Sprite.demon1_stun, this.tint(Sprite.demon1_walk1.img, 255, 255, 255, 0.6));

    let chunks = this.cutIntoChunks(Sprite.demon1_walk2.img, RAD[24]);
    await this.initDynamicSprite(Sprite.demon1_chunk_a, chunks[0]);
    await this.initDynamicSprite(Sprite.demon1_chunk_b, chunks[1]);

    await this.initDynamicSprite(Sprite.blood_droplet2, this.createBloodDroplet(2));
    await this.initDynamicSprite(Sprite.blood_droplet3, this.createBloodDroplet(3));

    await this.initSprite(Sprite.world1, 'worldheartbeat2.png', 0, 0, 23, 23);
    await this.initSprite(Sprite.world2, 'worldheartbeat2.png', 23, 0, 23, 23);
    await this.initSprite(Sprite.world3, 'worldheartbeat2.png', 46, 0, 23, 23);
  };

  /**
   * Initialize a sprite by loading it from a particular slice of the given image. Provides
   * "sensible" defaults for bounding box and anchor point if not provided.
   */
  static async initSprite(sprite: Sprite, uri: string, x: number, y: number, w: number, h: number, opts?: Partial<Sprite>) {
    await this.initDynamicSprite(sprite, await this.loadSlice(uri, x, y, w, h), opts);
  }

  /**
   * Initialize a sprite by passing it a pre-defined image source (probably generated dynamically).
   * Provides "sensible" defaults for bounding box and anchor point if not provided.
   */
  static async initDynamicSprite(sprite: Sprite, source: CanvasImageSource, opts?: Partial<Sprite>) {
    let w = source.width as number;
    let h = source.height as number;

    sprite.img = source;
    sprite.anchor = (opts && opts.anchor) || { x: Math.floor(w / 2), y: Math.floor(h / 2) };
    sprite.bbox = (opts && opts.bbox) || [{ x: 0, y: 0 }, { x: w, y: h }];
    sprite.hbox = opts && opts.hbox;
  }

  /**
   * This helper method retrieves a cached image, cuts the specified slice out of it, and returns it.
   */
  static async loadSlice(uri: string, x: number, y: number, w: number, h: number): Promise<CanvasImageSource> {
    const source = await this.loadImage(uri);
    const sliceCanvas = new Canvas(w, h);
    sliceCanvas.ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
    return sliceCanvas.canvas;
  }

  /**
   * This helper method loads the specified image, caching it for future use.
   */
  static async loadImage(uri: string): Promise<HTMLImageElement> {
    console.log(["loadImage", uri, this.images[uri]]);
    if (this.images[uri]) return this.images[uri];

    return await new Promise((resolve, reject) => {
      let image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = uri;
      this.images[uri] = image;
    });
  }

  /**
   * Take an existing image and add an RGBA tint to it.
   */
  static tint(source: CanvasImageSource, r: number, g: number, b: number, a: number): CanvasImageSource {
    const canvas = new Canvas(source.width as number, source.height as number);
    const ctx = canvas.ctx;

    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = a;
    ctx.fillStyle = rgba(r, g, b, 1);
    ctx.fillRect(0, 0, source.width as number, source.height as number);

    return canvas.canvas;
  }

  /**
   * Create a blood droplet.
   */
  static createBloodDroplet(size: number) {
    const canvas = new Canvas(size, size);
    const ctx = canvas.ctx;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.fillRect(0, 0, size, size);

    return canvas.canvas;
  }

  /**
   * Take an existing image, draw a line through it based on the provided angle, and
   * then return two "chunks" (one from each side of the line).
   */
  static cutIntoChunks(source: CanvasImageSource, angle: number): CanvasImageSource[] {
    let width = source.width as number, height = source.height as number;
    const canvas = [
      new Canvas(width, height),
      new Canvas(width, height)
    ];
    const ctx = [canvas[0].ctx, canvas[1].ctx];
    angle = angle % RAD[180];

    let cutLength = width + height;
    let cut = [
      { x: width / 2 + Math.cos(angle) * cutLength, y: height / 2 - Math.sin(angle) * cutLength },
      { x: width / 2 - Math.cos(angle) * cutLength, y: height / 2 + Math.sin(angle) * cutLength }
    ];

    ctx[0].drawImage(source, 0, 0);
    ctx[0].globalCompositeOperation = 'destination-in';
    ctx[0].moveTo(cut[0].x, cut[0].y);
    ctx[0].lineTo(cut[1].x, cut[1].y);
    ctx[0].lineTo(width, height);
    ctx[0].lineTo(width, 0);
    ctx[0].closePath();
    ctx[0].fill();

    ctx[1].drawImage(source, 0, 0);
    ctx[1].globalCompositeOperation = 'destination-out';
    ctx[1].moveTo(cut[0].x, cut[0].y);
    ctx[1].lineTo(cut[1].x, cut[1].y);
    ctx[1].lineTo(width, height);
    ctx[1].lineTo(width, 0);
    ctx[1].closePath();
    ctx[1].fill();

    return [canvas[0].canvas, canvas[1].canvas];
  }
}

export function drawPoly(ctx: CanvasRenderingContext2D, poly: Polygon) {
    ctx.beginPath();
    for (let i = 0; i < poly.p.length; i++) {
      let [ a, b ] = [ poly.p[i], poly.p[(i+1)%poly.p.length] ];
      ctx.moveTo(poly.x + a.x, poly.y + a.y);
      ctx.lineTo(poly.x + b.x, poly.y + b.y);
    }
    ctx.stroke();
}
