/**
 * πAI Lab 机构地球组件。
 * 视觉规则：以经纬投影和真实地理坐标呈现协作地点与访问足迹；地点随球面共同转动；大尺度地球承担真实空间感，不使用装饰性轨道动画。
 */
import { useEffect, useRef } from "react";

export type GlobePoint = {
  label: string;
  lat: number;
  lng: number;
  weight?: number;
  accent?: boolean;
};

type InstitutionalGlobeProps = {
  points: GlobePoint[];
  ariaLabel: string;
  tone?: "ink" | "paper";
};

export default function InstitutionalGlobe({ points, ariaLabel, tone = "ink" }: InstitutionalGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotation = useRef(0.55);
  const drag = useRef<{ x: number; rotation: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    let active = true;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = (lat: number, lng: number, radius: number, centerX: number, centerY: number) => {
      const latitude = (lat * Math.PI) / 180;
      const longitude = (lng * Math.PI) / 180 + rotation.current;
      const z = Math.cos(latitude) * Math.cos(longitude);
      return {
        x: centerX + radius * Math.cos(latitude) * Math.sin(longitude),
        y: centerY - radius * Math.sin(latitude),
        z,
      };
    };

    const drawLine = (coordinates: Array<{ x: number; y: number; z: number }>, stroke: string) => {
      context.beginPath();
      let activePath = false;
      for (const point of coordinates) {
        if (point.z > 0) {
          if (!activePath) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
          activePath = true;
        } else {
          activePath = false;
        }
      }
      context.strokeStyle = stroke;
      context.stroke();
    };

    const draw = () => {
      if (!active) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!drag.current) rotation.current += 0.0021;
      context.clearRect(0, 0, width, height);

      const paper = tone === "paper";
      const radius = Math.min(width, height) * (paper ? 0.46 : 0.44);
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const grid = paper ? "rgba(30,45,67,.16)" : "rgba(255,255,255,.18)";
      const rim = paper ? "rgba(30,45,67,.34)" : "rgba(255,255,255,.42)";

      const globeFill = context.createRadialGradient(centerX - radius * 0.32, centerY - radius * 0.37, radius * 0.08, centerX, centerY, radius);
      globeFill.addColorStop(0, paper ? "rgba(255,255,255,.96)" : "rgba(54,75,107,.72)");
      globeFill.addColorStop(0.68, paper ? "rgba(223,231,238,.84)" : "rgba(14,25,42,.84)");
      globeFill.addColorStop(1, paper ? "rgba(184,198,210,.96)" : "rgba(5,12,22,.96)");
      context.fillStyle = globeFill;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();

      context.lineWidth = 0.8;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.strokeStyle = rim;
      context.stroke();

      for (let lat = -60; lat <= 60; lat += 20) {
        const line = [];
        for (let lng = -180; lng <= 180; lng += 3) line.push(project(lat, lng, radius, centerX, centerY));
        drawLine(line, grid);
      }
      for (let lng = -160; lng <= 160; lng += 20) {
        const line = [];
        for (let lat = -88; lat <= 88; lat += 3) line.push(project(lat, lng, radius, centerX, centerY));
        drawLine(line, grid);
      }

      points.forEach((point) => {
        const location = project(point.lat, point.lng, radius, centerX, centerY);
        if (location.z <= 0) return;
        const size = Math.max(2.8, Math.min(6, 2.5 + Math.log2((point.weight ?? 1) + 1)));
        const alpha = 0.44 + location.z * 0.56;
        const color = point.accent ? "255,169,51" : paper ? "25,68,125" : "157,190,247";
        context.fillStyle = `rgba(${color},${alpha})`;
        context.beginPath();
        context.arc(location.x, location.y, size, 0, Math.PI * 2);
        context.fill();
        if (point.accent) {
          context.strokeStyle = paper ? "rgba(255,169,51,.42)" : "rgba(255,199,103,.54)";
          context.beginPath();
          context.arc(location.x, location.y, size + 7, 0, Math.PI * 2);
          context.stroke();
        }
        context.fillStyle = paper ? `rgba(20,32,49,${alpha})` : `rgba(255,255,255,${alpha})`;
        context.font = "600 12px 'Noto Sans SC', 'PingFang SC', sans-serif";
        context.fillText(point.label, location.x + size + 7, location.y - size - 3);
      });
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [points, tone]);

  return <canvas
    ref={canvasRef}
    className="institutional-globe"
    aria-label={ariaLabel}
    onPointerDown={(event) => {
      drag.current = { x: event.clientX, rotation: rotation.current };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={(event) => {
      if (drag.current) rotation.current = drag.current.rotation + (event.clientX - drag.current.x) * 0.006;
    }}
    onPointerUp={() => { drag.current = null; }}
    onPointerCancel={() => { drag.current = null; }}
  />;
}
