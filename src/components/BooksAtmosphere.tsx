import { useEffect, useRef } from "react";

interface AnimatedBook {
  x: number;
  y: number;
  size: number;
  opacity: number;
  fadeSpeed: number;
  rotation: number;
  rotationSpeed: number;
  pageOpenProgress: number; // 0 (closed) to 1 (fully open)
  openSpeed: number;
  color: string;
}

export function BooksAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const books: AnimatedBook[] = [];
    const bookCount = 12;
    const colors = ["#8b5cf6", "#6366f1", "#06b6d4", "#ec4899", "#3b82f6", "#10b981"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createBook = (): AnimatedBook => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 40 + 30,
      opacity: 0,
      fadeSpeed: Math.random() * 0.004 + 0.001,
      rotation: (Math.random() - 0.5) * 0.8,
      rotationSpeed: (Math.random() - 0.5) * 0.002,
      pageOpenProgress: Math.random(), // start at varied opening stage
      openSpeed: Math.random() * 0.015 + 0.005,
      color: colors[Math.floor(Math.random() * colors.length)],
    });

    for (let i = 0; i < bookCount; i++) {
      books.push(createBook());
    }

    const drawBook = (book: AnimatedBook) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(book.x, book.y);
      ctx.rotate(book.rotation);
      ctx.globalAlpha = book.opacity * 0.5;

      const s = book.size;
      const p = book.pageOpenProgress; // 0 to 1

      ctx.strokeStyle = book.color;
      ctx.fillStyle = book.color;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 12;
      ctx.shadowColor = book.color;

      // Spine position
      const spineWidth = 6;

      // Left cover / page spread
      ctx.beginPath();
      // As open progress increases, the pages curve outwards and open up
      const spreadWidth = s * (0.4 + p * 0.6);
      const curveHeight = s * 0.25 * (1 - p * 0.3);

      // Left page curve
      ctx.moveTo(-spineWidth / 2, s / 2);
      ctx.bezierCurveTo(
        -spineWidth / 2 - spreadWidth * 0.5,
        s / 2 - curveHeight,
        -spineWidth / 2 - spreadWidth,
        -s / 4,
        -spineWidth / 2 - spreadWidth * 0.8,
        -s / 2,
      );
      ctx.lineTo(-spineWidth / 2, -s / 2.2);
      ctx.closePath();
      ctx.stroke();

      // Right page curve (mirrored with page turning effect)
      ctx.beginPath();
      ctx.moveTo(spineWidth / 2, s / 2);
      ctx.bezierCurveTo(
        spineWidth / 2 + spreadWidth * 0.5,
        s / 2 - curveHeight,
        spineWidth / 2 + spreadWidth,
        -s / 4,
        spineWidth / 2 + spreadWidth * 0.8,
        -s / 2,
      );
      ctx.lineTo(spineWidth / 2, -s / 2.2);
      ctx.closePath();
      ctx.stroke();

      // Center spine
      ctx.fillRect(-spineWidth / 2, -s / 2.2, spineWidth, s);

      // Subtle floating magical lines representing lines of text
      if (p > 0.3) {
        ctx.lineWidth = 1;
        ctx.globalAlpha = book.opacity * 0.3 * p;

        // Left text lines
        ctx.beginPath();
        ctx.moveTo(-spineWidth / 2 - spreadWidth * 0.2, -s * 0.2);
        ctx.lineTo(-spineWidth / 2 - spreadWidth * 0.6, -s * 0.15);
        ctx.moveTo(-spineWidth / 2 - spreadWidth * 0.2, 0);
        ctx.lineTo(-spineWidth / 2 - spreadWidth * 0.65, 0.05);
        ctx.moveTo(-spineWidth / 2 - spreadWidth * 0.2, s * 0.2);
        ctx.lineTo(-spineWidth / 2 - spreadWidth * 0.5, s * 0.25);
        ctx.stroke();

        // Right text lines
        ctx.beginPath();
        ctx.moveTo(spineWidth / 2 + spreadWidth * 0.2, -s * 0.2);
        ctx.lineTo(spineWidth / 2 + spreadWidth * 0.6, -s * 0.15);
        ctx.moveTo(spineWidth / 2 + spreadWidth * 0.2, 0);
        ctx.lineTo(spineWidth / 2 + spreadWidth * 0.65, 0.05);
        ctx.moveTo(spineWidth / 2 + spreadWidth * 0.2, s * 0.2);
        ctx.lineTo(spineWidth / 2 + spreadWidth * 0.5, s * 0.25);
        ctx.stroke();
      }

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      books.forEach((book, index) => {
        book.opacity += book.fadeSpeed;
        book.rotation += book.rotationSpeed;

        // Animate page opening and closing smoothly in a breathing loop
        book.pageOpenProgress += book.openSpeed;
        if (book.pageOpenProgress >= 1 || book.pageOpenProgress <= 0) {
          book.openSpeed = -book.openSpeed;
        }

        if (book.opacity >= 1) {
          book.fadeSpeed = -Math.abs(book.fadeSpeed);
        }

        if (book.opacity <= 0 && book.fadeSpeed < 0) {
          books[index] = createBook();
        }

        drawBook(book);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-50 select-none"
    />
  );
}
