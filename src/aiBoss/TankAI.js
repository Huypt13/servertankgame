const AIBase = require("./AIBase");
const Vector2 = require("../vector2");

module.exports = class TankAI extends AIBase {
  constructor() {
    super();
    this.username = "AI_Tank";
    this.target;
    this.hasTarget = false;

    //Tank Stats
    this.rotation = 0;

    //Shooting
    this.canShoot = false;
    this.currentTime = 0;
    this.reloadTime = 3;
  }

  onUpdate(onUpdateAI, onFireBullet) {
    const ai = this;
    if (!ai.hasTarget) {
      return false;
    }
    const targetConnection = ai.target;
    const targetPosition = targetConnection.player.position;

    //Get normalized direction between tank and target
    let direction = new Vector2();
    direction.x = targetPosition.x - ai.position.x;
    direction.y = targetPosition.y - ai.position.y;
    direction = direction.Normalized();

    // distance between ai and target
    const distance = targetPosition.Distance(ai.position);

    /* 
        tank
          
                                .
                              y ....ai
                                  x  

    */
    //Calculate barrel rotation
    let rotation = Math.atan2(direction.y, direction.x) * ai.radiansToDegrees(); // alpha -> degrees
    if (isNaN(rotation)) {
      return;
    }

    // movement
    // goc quay tank
    let angleAmount = ai.getAngleDifference(ai.rotation, rotation);
    ai.rotation += angleAmount * ai.rotationSpeed;
    let forwardDirection = ai.getForwardDirection();
    // moving forward direction
    if (Math.abs(angleAmount) < 10) {
      if (distance > 3.5) {
        ai.position.y += forwardDirection.y * ai.speed;
        ai.position.x += forwardDirection.x * ai.speed;
      }
    }
    //Shooting
    if (ai.canShoot && !ai.isDead) {
      onFireBullet({
        activator: ai.id,
        position: { x: ai.position.x, y: ai.position.y },
        direction: { x: direction.x, y: direction.y },
      });
      ai.canShoot = false;
      ai.currentTime = Number(0);
    } else {
      ai.currentTime = Number(ai.currentTime) + Number(0.1);
      if (ai.currentTime >= ai.reloadTime) {
        ai.canShoot = true;
      }
    }

    onUpdateAI({
      id: ai.id,
      tankRotation: ai.rotation,
      barrelRotation: rotation,
      position: {
        x: ai.position.x,
        y: ai.position.y,
      },
    });
  }
  onObtainTarget(connections) {
    const ai = this;

    let minConnection = { position: new Vector2(1e5, 1e5) };
    let target = null;
    for (const connection of connections) {
      const player = connection.player;
      if (
        ai.position.Distance(player.position) <
          minConnection.position.Distance(ai.position) &&
        !player.isDead
      ) {
        target = connection;
        minConnection.position = player.position;
      }
    }
    if (minConnection.position.Distance(ai.position) > 10) {
      ai.hasTarget = false;
      return;
    }
    ai.hasTarget = true;
    ai.target = target;
  }
  getForwardDirection() {
    let ai = this;

    let radiansRotation = (ai.rotation + 90) * ai.degreesToRadians(); //We need the 90 degree art offset to get the correct vector
    let sin = Math.sin(radiansRotation);
    let cos = Math.cos(radiansRotation);

    let worldUpVector = ai.worldUpVector();
    let tx = worldUpVector.x;
    let ty = worldUpVector.y;

    return new Vector2(cos * tx - sin * ty, sin * tx + cos * ty);
  }
};
