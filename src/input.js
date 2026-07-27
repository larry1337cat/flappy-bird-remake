export class Input {
  constructor(canvas) {
    this.flapQueued = false;
    this.pointer = null;

    const flap = () => {
      this.flapQueued = true;
    };

    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.pointer = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
      flap();
    });

    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "Enter") {
        e.preventDefault();
        this.pointer = null;
        flap();
      }
    });

    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );
  }

  consumeFlap() {
    if (!this.flapQueued) return false;
    this.flapQueued = false;
    return true;
  }
}
