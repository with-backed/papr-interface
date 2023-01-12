import { useEffect, useRef } from 'react';
import styles from './AuctionGraph.module.css';

export function AuctionGraph() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas: HTMLCanvasElement = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);
  });

  return <canvas width="100%" height={400} ref={canvasRef}></canvas>;
}
