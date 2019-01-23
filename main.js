phina.globalize();

bulletml.dsl();
var pattern = new bulletml.Root({
  top0: action([
    repeat(999, [

      fire(direction(0), speed(8), bullet()),
      repeat(30, [
        fire(direction(90, "sequence"), speed(8), bullet()),
        fire(direction(90, "sequence"), speed(8), bullet()),
        fire(direction(90, "sequence"), speed(8), bullet()),
        wait(1),
        fire(direction(95, "sequence"), speed(8), bullet()),
      ]),

      wait(5),

      fire(direction(0), speed(8), bullet()),
      repeat(30, [
        fire(direction(-90, "sequence"), speed(8), bullet()),
        fire(direction(-90, "sequence"), speed(8), bullet()),
        fire(direction(-90, "sequence"), speed(8), bullet()),
        wait(1),
        fire(direction(-95, "sequence"), speed(8), bullet()),
      ]),

      wait(30),
    ]),
  ]),
  top1: action([
    repeat(999, [
      repeat(3, [

        fire(direction(-5), speed(10), bullet()),
        repeat(7, [
          fire(direction(0, "sequence"), speed(0.2, "sequence"), bullet()),
        ]),

        fire(direction(0), speed(10), bullet()),
        repeat(7, [
          fire(direction(0, "sequence"), speed(0.2, "sequence"), bullet()),
        ]),

        fire(direction(5), speed(10), bullet()),
        repeat(7, [
          fire(direction(0, "sequence"), speed(0.2, "sequence"), bullet()),
        ]),

        wait(10),
      ]),

      wait(40),
    ]),
  ]),
});

const tempVec = Vector2();

phina.define("MainScene", {
  superClass: "DisplayScene",

  shotHeat: 0,
  bombCharge: 0,

  init: function () {
    this.superInit();

    this.enemy = RectangleShape({
      fill: "hsl(0, 80%, 60%)",
      stroke: null,
    })
      .setPosition(320, 100)
      .addChildTo(this);
    this.enemy.a = 0;
    this.enemy.tweener
      .set({ a: 0 })
      .to({ a: Math.PI * 2 }, 5000)
      .setLoop(true);
    this.enemy.on("enterframe", (e) => {
      this.enemy.x = 320 + Math.cos(this.enemy.a) * 150;
      this.enemy.y = 100 + Math.sin(this.enemy.a) * 40;
    });

    this.myship = TriangleShape({
      fill: "hsl(220, 80%, 60%)",
      stroke: null,
    })
      .setPosition(320, 600)
      .addChildTo(this);

    this.bombGauge = Shape({
      width: 100,
      height: 100,
      padding: 0,
      backgroundColor: "transparent",
      stroke: null,
      fill: "hsla(220, 80%, 60%, 0.2)",

    }).addChildTo(this.myship);
    this.bombGauge.prerender = (canvas) => {
      canvas.beginPath();
      canvas.pie(0, 0, 40, (-90).toRadian(), (-90 + 360 * this.bombCharge / 100).toRadian(), false);
      canvas.closePath();
    };

    const config = {
      target: this.myship,
      createNewBullet: (runner) => {
        Bullet(runner).addChildTo(this);
      },
    };
    const rootRunner = pattern.createRunner(config);
    this.enemy.on("enterframe", () => {
      rootRunner.x = this.enemy.x;
      rootRunner.y = this.enemy.y;
      rootRunner.update();
    });
  },
  update: function (app) {
    this.bombGauge._dirtyDraw = true;

    const p = app.pointer;
    if (p.getPointing()) {
      tempVec.set(p.dx, p.dy).mul(2);
      this.myship.position.add(tempVec);
      this.bombCharge += 1;
      if (this.shotHeat <= 0) {
        Shot()
          .setPosition(this.myship.x, this.myship.y)
          .addChildTo(this);
        this.shotHeat = 3;
      }
    } else if (p.getPointingEnd()) {
      Bomb(Math.min(this.bombCharge, 100))
        .setPosition(this.myship.x, this.myship.y - 50)
        .addChildTo(this);
      this.bombCharge = 0;
    } else {
      this.bombCharge = 0;
    }

    this.shotHeat -= 1;
  },
});

phina.define("Shot", {
  superClass: "RectangleShape",
  init: function () {
    this.superInit({
      width: 5,
      height: 20,
      padding: 0,
      fill: "hsl(120, 80%, 60%)",
      stroke: null,
    });
  },
  update: function () {
    this.y -= 30;
    if (this.y < -10) {
      this.remove();
    }
  },
});

phina.define("Bomb", {
  superClass: "CircleShape",
  init: function (power) {
    this.superInit({
      radius: Math.pow(power * 0.12, 2),
      fill: "hsl(120, 80%, 60%)",
      stroke: null,
    });
    this.alpha = 0.8;
    this.tweener
      .to({ scaleX: 1.2, scaleY: 1.2 }, 80)
      .to({ scaleX: 1.0, scaleY: 1.0 }, 80)
      .setLoop(true);
    Tweener().attachTo(this)
      .wait(1000)
      .to({ alpha: 0 }, 300)
      .call(() => this.remove());
  },
});

phina.define("Bullet", {
  superClass: "CircleShape",
  init: function (runner) {
    this.superInit({
      radius: 10,
      fill: "hsl(20, 80%, 60%)",
      stroke: null,
    });
    this.x = runner.x;
    this.y = runner.y;

    this.on("enterframe", () => {
      runner.update();
      this.x = runner.x;
      this.y = runner.y;
      if (this.x < 0 || 640 < this.x || this.y < 0 || 940 < this.y) {
        this.remove();
      }
    });
  },
});

phina.main(() => {
  const app = GameApp({
    startLabel: "main",
  });
  app.run();
});