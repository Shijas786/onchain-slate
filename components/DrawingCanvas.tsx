'use client';

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface DrawingCanvasProps {
  color: string;
  brushSize: number;
}

export interface DrawingCanvasRef {
  getImage: () => string | null;
  clear: () => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ color, brushSize }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

    // Initialize canvas context
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setContext(ctx);

      // Handle resize
      const handleResize = () => {
        const parent = canvas.parentElement;
        if (parent) {
          // Save current content
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          tempCtx?.drawImage(canvas, 0, 0);

          // Resize
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight; // Adjust as needed or fixed aspect ratio

          // Restore content and context settings
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear with white
          ctx.drawImage(tempCanvas, 0, 0); // Draw back old content (might be cropped/stretched if not careful, for now simple restore)
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize(); // Initial size

      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Update context properties when props change
    useEffect(() => {
      if (context) {
        context.strokeStyle = color;
        context.lineWidth = brushSize;
      }
    }, [context, color, brushSize]);

    useImperativeHandle(ref, () => ({
      getImage: () => {
        if (canvasRef.current) {
          return canvasRef.current.toDataURL('image/png');
        }
        return null;
      },
      clear: () => {
        if (canvasRef.current && context) {
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      },
    }));

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      if (!context) return;
      setIsDrawing(true);
      const { x, y } = getCoordinates(e);
      context.beginPath();
      context.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !context) return;
      const { x, y } = getCoordinates(e);
      context.lineTo(x, y);
      context.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing || !context) return;
      context.closePath();
      setIsDrawing(false);
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    return (
      <div className="w-full h-full relative bg-white shadow-sm overflow-hidden rounded-lg touch-none">
        <canvas
          ref={canvasRef}
          className="touch-none block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;

