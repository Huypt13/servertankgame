module.exports = class Vector2 {
  constructor(X = 0, Y = 0) {
    this.x = X;
    this.y = Y;
  }

  // kc vs 0
  Magitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  Normalized() {
    return new Vector2(this.x / this.Magitude(), this.y / this.Magitude());
  }

  // khoan cach 2 vi tri
  Distance(OtherVect) {
    const x = OtherVect.x - this.x;
    const y = OtherVect.y - this.y;
    return Math.sqrt(x * x + y * y);
  }
};
