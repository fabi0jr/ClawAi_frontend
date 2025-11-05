import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface ImageAnnotatorProps {
  imageUrl: string;
  onAnnotationsChange?: (annotations: BoundingBox[]) => void;
}

export default function ImageAnnotator({ imageUrl, onAnnotationsChange }: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<BoundingBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      setImageLoaded(true);
      redrawCanvas(ctx, img);
    };
  }, [imageUrl]);

  useEffect(() => {
    if (imageLoaded) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => redrawCanvas(ctx, img);
    }
  }, [annotations, currentBox, imageLoaded, imageUrl]);

  const redrawCanvas = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw existing annotations
    annotations.forEach((box) => {
      drawBox(ctx, box, '#3b82f6');
    });

    // Draw current box being drawn
    if (currentBox) {
      drawBox(ctx, currentBox, '#22c55e');
    }
  };

  const drawBox = (ctx: CanvasRenderingContext2D, box: BoundingBox, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw label background
    ctx.fillStyle = color;
    const labelText = box.label || 'Unlabeled';
    ctx.font = '14px Arial';
    const textWidth = ctx.measureText(labelText).width;
    ctx.fillRect(box.x, box.y - 20, textWidth + 10, 20);

    // Draw label text
    ctx.fillStyle = 'white';
    ctx.fillText(labelText, box.x + 5, box.y - 5);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = x - startPos.x;
    const height = y - startPos.y;

    setCurrentBox({
      id: Date.now().toString(),
      x: startPos.x,
      y: startPos.y,
      width,
      height,
      label: ''
    });
  };

  const handleMouseUp = () => {
    if (currentBox && Math.abs(currentBox.width) > 10 && Math.abs(currentBox.height) > 10) {
      const normalizedBox = {
        ...currentBox,
        x: currentBox.width < 0 ? currentBox.x + currentBox.width : currentBox.x,
        y: currentBox.height < 0 ? currentBox.y + currentBox.height : currentBox.y,
        width: Math.abs(currentBox.width),
        height: Math.abs(currentBox.height)
      };
      
      const newAnnotations = [...annotations, normalizedBox];
      setAnnotations(newAnnotations);
      onAnnotationsChange?.(newAnnotations);
    }

    setIsDrawing(false);
    setCurrentBox(null);
  };

  const updateLabel = (id: string, label: string) => {
    const newAnnotations = annotations.map((box) =>
      box.id === id ? { ...box, label } : box
    );
    setAnnotations(newAnnotations);
    onAnnotationsChange?.(newAnnotations);
  };

  const deleteAnnotation = (id: string) => {
    const newAnnotations = annotations.filter((box) => box.id !== id);
    setAnnotations(newAnnotations);
    onAnnotationsChange?.(newAnnotations);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="p-4 bg-gray-900 border-gray-800">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Image Canvas</h3>
            <p className="text-sm text-gray-400">Click and drag to draw bounding boxes around objects</p>
          </div>
          <div className="overflow-auto max-h-[600px] bg-gray-950 rounded-lg">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="cursor-crosshair"
            />
          </div>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="p-4 bg-gray-900 border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Annotations ({annotations.length})</h3>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {annotations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No annotations yet</p>
                <p className="text-sm mt-2">Draw boxes on the image to start</p>
              </div>
            ) : (
              annotations.map((box, index) => (
                <div key={box.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Box {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAnnotation(box.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-400">Label</Label>
                      <Input
                        value={box.label}
                        onChange={(e) => updateLabel(box.id, e.target.value)}
                        placeholder="Enter object label"
                        className="mt-1 bg-gray-950 border-gray-700 text-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>X: {Math.round(box.x)}px</div>
                      <div>Y: {Math.round(box.y)}px</div>
                      <div>W: {Math.round(box.width)}px</div>
                      <div>H: {Math.round(box.height)}px</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}