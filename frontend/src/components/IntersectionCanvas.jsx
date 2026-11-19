/**
 * IntersectionCanvas.jsx
 * High-Resolution 680x680 HTML5 Canvas Four-Way Intersection Renderer
 * Features realistic asphalt textures, lane dividers, zebra crosswalks,
 * vehicle models with headlights/taillights/sirens, signal poles, and corner telemetry HUDs.
 */

import React, { useRef, useEffect } from 'react';

const W = 680, H = 680;
const CX = W / 2, CY = H / 2;
const ROAD = 160;       // Total road width (two wide lanes: 80 incoming, 80 outgoing)
const HALF_ROAD = ROAD / 2; // 80
const LANE_OFFSET = 40; // Centerline of each lane (distance from road center)

// Stop line positions along the road axis
const STOP_N = CY - HALF_ROAD; // 340 - 80 = 260
const STOP_S = CY + HALF_ROAD; // 340 + 80 = 420
const STOP_E = CX + HALF_ROAD; // 340 + 80 = 420
const STOP_W = CX - HALF_ROAD; // 340 - 80 = 260

// Color Palette
const COLORS = {
  bg: '#070d17',
  grass: '#0a1622',
  curb: '#33475b',
  sidewalk: '#101c2a',
  asphalt: '#182230',
  intersection: '#131c27',
  stopLine: '#f8fafc',
  crosswalk: '#e2e8f0',
  laneDash: '#fbbf24',
};

const V_SPECS = {
  CAR:        { color: '#38bdf8', w: 22, l: 38, label: 'CAR' },
  BUS:        { color: '#f59e0b', w: 26, l: 56, label: 'BUS' },
  TRUCK:      { color: '#94a3b8', w: 26, l: 50, label: 'TRUCK' },
  MOTORCYCLE: { color: '#c084fc', w: 14, l: 24, label: 'BIKE' },
  AMBULANCE:  { color: '#ef4444', w: 24, l: 42, label: 'AMB' },
};

function roundRect(ctx, x, y, w, h, r = 6) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Draw Roads, Curbs, Sidewalks & Markings
function drawRoadNetwork(ctx) {
  // Base background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  // Sidewalk / Corner Plaza blocks
  ctx.fillStyle = COLORS.sidewalk;
  ctx.fillRect(0, 0, STOP_W, STOP_N);
  ctx.fillRect(STOP_E, 0, W - STOP_E, STOP_N);
  ctx.fillRect(0, STOP_S, STOP_W, H - STOP_S);
  ctx.fillRect(STOP_E, STOP_S, W - STOP_E, H - STOP_S);

  // Curbs
  ctx.strokeStyle = COLORS.curb;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, STOP_W, STOP_N);
  ctx.strokeRect(STOP_E, 0, W - STOP_E, STOP_N);
  ctx.strokeRect(0, STOP_S, STOP_W, H - STOP_S);
  ctx.strokeRect(STOP_E, STOP_S, W - STOP_E, H - STOP_S);

  // Roads: EW band & NS band
  ctx.fillStyle = COLORS.asphalt;
  ctx.fillRect(0, STOP_N, W, ROAD);
  ctx.fillRect(STOP_W, 0, ROAD, H);

  // Intersection Central Box
  ctx.fillStyle = COLORS.intersection;
  ctx.fillRect(STOP_W, STOP_N, ROAD, ROAD);

  // Intersection Inner Border
  ctx.strokeStyle = '#243242';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(STOP_W, STOP_N, ROAD, ROAD);

  // Yellow Double Center Dividing Line
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;

  // NS North arm
  ctx.beginPath();
  ctx.moveTo(CX - 2, 0); ctx.lineTo(CX - 2, STOP_N - 24);
  ctx.moveTo(CX + 2, 0); ctx.lineTo(CX + 2, STOP_N - 24);
  ctx.stroke();

  // NS South arm
  ctx.beginPath();
  ctx.moveTo(CX - 2, STOP_S + 24); ctx.lineTo(CX - 2, H);
  ctx.moveTo(CX + 2, STOP_S + 24); ctx.lineTo(CX + 2, H);
  ctx.stroke();

  // EW West arm
  ctx.beginPath();
  ctx.moveTo(0, CY - 2); ctx.lineTo(STOP_W - 24, CY - 2);
  ctx.moveTo(0, CY + 2); ctx.lineTo(STOP_W - 24, CY + 2);
  ctx.stroke();

  // EW East arm
  ctx.beginPath();
  ctx.moveTo(STOP_E + 24, CY - 2); ctx.lineTo(W, CY - 2);
  ctx.moveTo(STOP_E + 24, CY + 2); ctx.lineTo(W, CY + 2);
  ctx.stroke();

  // Zebra Crossings (Crosswalks)
  const barW = 10, barH = 22, barGap = 6;
  ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';

  for (let x = STOP_W + 6; x < STOP_E - 6; x += barW + barGap) {
    ctx.fillRect(x, STOP_N - barH, barW, barH);
    ctx.fillRect(x, STOP_S, barW, barH);
  }
  for (let y = STOP_N + 6; y < STOP_S - 6; y += barW + barGap) {
    ctx.fillRect(STOP_W - barH, y, barH, barW);
    ctx.fillRect(STOP_E, y, barH, barW);
  }

  // Crisp Solid White Stop Lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  // North
  ctx.beginPath();
  ctx.moveTo(STOP_W, STOP_N - barH - 4);
  ctx.lineTo(CX, STOP_N - barH - 4);
  ctx.stroke();
  // South
  ctx.beginPath();
  ctx.moveTo(CX, STOP_S + barH + 4);
  ctx.lineTo(STOP_E, STOP_S + barH + 4);
  ctx.stroke();
  // West
  ctx.beginPath();
  ctx.moveTo(STOP_W - barH - 4, CY);
  ctx.lineTo(STOP_W - barH - 4, STOP_S);
  ctx.stroke();
  // East
  ctx.beginPath();
  ctx.moveTo(STOP_E + barH + 4, STOP_N);
  ctx.lineTo(STOP_E + barH + 4, CY);
  ctx.stroke();

  // Intersection Center Hardware Badge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  roundRect(ctx, CX - 56, CY - 20, 112, 40, 8);
  ctx.fill();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VIRTUAL CPU I/O', CX, CY - 4);
  ctx.fillStyle = '#7dd3fc';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('0xF010 - 0xF013', CX, CY + 11);

  // Directional Arrows
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('↓', CX - LANE_OFFSET, 60);
  ctx.fillText('↑', CX + LANE_OFFSET, H - 40);
  ctx.fillText('→', 60, CY + LANE_OFFSET);
  ctx.fillText('←', W - 60, CY - LANE_OFFSET);
}

// Calculate vehicle pixel coordinates
function getVehicleTransform(dir, dist) {
  const upper = (dir || 'NORTH').toUpperCase();
  switch (upper) {
    case 'NORTH':
      return { x: CX - LANE_OFFSET, y: STOP_N - dist, angle: Math.PI / 2 };
    case 'SOUTH':
      return { x: CX + LANE_OFFSET, y: STOP_S + dist, angle: -Math.PI / 2 };
    case 'EAST':
      return { x: STOP_E + dist, y: CY - LANE_OFFSET, angle: Math.PI };
    case 'WEST':
      return { x: STOP_W - dist, y: CY + LANE_OFFSET, angle: 0 };
    default:
      return { x: CX, y: CY, angle: 0 };
  }
}

// Draw Vehicles
function drawAllVehicles(ctx, vehicles) {
  if (!vehicles || vehicles.length === 0) return;

  vehicles.forEach((v) => {
    if (v.distanceFromStopLine < -330) return;

    const spec = V_SPECS[v.type] || V_SPECS.CAR;
    const { x, y, angle } = getVehicleTransform(v.direction, v.distanceFromStopLine);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const length = spec.l;
    const width = spec.w;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    roundRect(ctx, -length / 2 + 2, -width / 2 + 2, length, width, 5);
    ctx.fill();

    // Body
    ctx.fillStyle = spec.color;
    roundRect(ctx, -length / 2, -width / 2, length, width, 5);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Windshield
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(length * 0.05, -width / 2 + 3, length * 0.22, width - 6);

    // Rear window
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-length * 0.4, -width / 2 + 3, length * 0.16, width - 6);

    // Roof
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(-length * 0.2, -width / 2 + 4, length * 0.25, width - 8);

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(length / 2 - 2, -width / 2 + 2, 2, 4);
    ctx.fillRect(length / 2 - 2, width / 2 - 6, 2, 4);

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-length / 2, -width / 2 + 2, 2, 4);
    ctx.fillRect(-length / 2, width / 2 - 6, 2, 4);

    // Siren if Ambulance
    if (v.isEmergency) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, -1, 8, 2);
      ctx.fillRect(-1, -4, 2, 8);

      const isFlash = Math.floor(Date.now() / 200) % 2 === 0;
      ctx.shadowColor = isFlash ? '#3b82f6' : '#ef4444';
      ctx.shadowBlur = 14;
      ctx.fillStyle = isFlash ? '#60a5fa' : '#f87171';
      ctx.beginPath();
      ctx.arc(length * 0.15, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  });
}

// Signal Pole with Glowing Lamps
function drawSignalPole(ctx, x, y, lightState) {
  const lampRadius = 7;
  const padding = 5;
  const boxW = lampRadius * 2 + padding * 2;
  const boxH = lampRadius * 6 + padding * 4;

  ctx.save();
  ctx.translate(x, y);

  // Housing
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();

  const lamps = [
    { color: 'RED', glow: '#ef4444', off: '#3f1015' },
    { color: 'YELLOW', glow: '#fbbf24', off: '#3b2505' },
    { color: 'GREEN', glow: '#10b981', off: '#052b1b' },
  ];

  lamps.forEach((lamp, idx) => {
    const ly = -boxH / 2 + padding + lampRadius + idx * (lampRadius * 2 + padding);
    const isOn = lightState === lamp.color;

    ctx.beginPath();
    ctx.arc(0, ly, lampRadius, 0, Math.PI * 2);

    if (isOn) {
      ctx.shadowColor = lamp.glow;
      ctx.shadowBlur = 18;
      ctx.fillStyle = lamp.glow;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = lamp.off;
      ctx.fill();
    }

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  ctx.restore();
}

// Corner HUD Cards (Off Road)
function drawCornerHUDs(ctx, lanes) {
  const nLight = lanes?.NORTH?.light || 'RED';
  const sLight = lanes?.SOUTH?.light || 'RED';
  const eLight = lanes?.EAST?.light || 'RED';
  const wLight = lanes?.WEST?.light || 'RED';

  const nQueue = lanes?.NORTH?.queueLength || 0;
  const sQueue = lanes?.SOUTH?.queueLength || 0;
  const eQueue = lanes?.EAST?.queueLength || 0;
  const wQueue = lanes?.WEST?.queueLength || 0;

  // Signal Poles
  drawSignalPole(ctx, STOP_W - 18, STOP_N - 28, nLight);
  drawSignalPole(ctx, STOP_E + 18, STOP_S + 28, sLight);
  drawSignalPole(ctx, STOP_E + 28, STOP_N - 18, eLight);
  drawSignalPole(ctx, STOP_W - 28, STOP_S + 18, wLight);

  const huds = [
    { dir: 'NORTH', queue: nQueue, light: nLight, portText: '0xF000', x: 20, y: 30 },
    { dir: 'EAST',  queue: eQueue, light: eLight, portText: '0xF002', x: STOP_E + 35, y: 30 },
    { dir: 'WEST',  queue: wQueue, light: wLight, portText: '0xF003', x: 20, y: STOP_S + 50 },
    { dir: 'SOUTH', queue: sQueue, light: sLight, portText: '0xF001', x: STOP_E + 35, y: STOP_S + 50 },
  ];

  huds.forEach((h) => {
    const isGreen = h.light === 'GREEN';
    const isYellow = h.light === 'YELLOW';
    const lightColor = isGreen ? '#10b981' : isYellow ? '#fbbf24' : '#ef4444';
    const bgBorder = isGreen ? '#059669' : isYellow ? '#d97706' : '#dc2626';

    ctx.save();
    ctx.translate(h.x, h.y);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    roundRect(ctx, 0, 0, 155, 62, 8);
    ctx.fill();
    ctx.strokeStyle = bgBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${h.dir} APPROACH`, 12, 20);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(h.portText, 142, 20);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Queue: ${h.queue} veh`, 12, 46);

    ctx.fillStyle = lightColor;
    ctx.shadowColor = lightColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(95, 42, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = lightColor;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(h.light, 106, 46);

    ctx.restore();
  });
}

// Bottom Phase Banner
function drawBottomPhaseBanner(ctx, phase) {
  const readable = (phase || 'ALL_RED_CLEARANCE').replace(/_/g, ' ');

  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  roundRect(ctx, CX - 180, H - 42, 360, 32, 8);
  ctx.fill();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`ACTIVE CPU PHASE: ${readable}`, CX, H - 22);
}

export const IntersectionCanvas = ({ trafficState }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const lanes = trafficState?.lanes || {
        NORTH: { light: 'RED', queueLength: 0 },
        SOUTH: { light: 'RED', queueLength: 0 },
        EAST:  { light: 'RED', queueLength: 0 },
        WEST:  { light: 'RED', queueLength: 0 },
      };
      const vehicles = trafficState?.vehicles || [];
      const phase = trafficState?.currentPhase || 'ALL_RED_CLEARANCE';

      drawRoadNetwork(ctx);
      drawAllVehicles(ctx, vehicles);
      drawCornerHUDs(ctx, lanes);
      drawBottomPhaseBanner(ctx, phase);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [trafficState]);

  return (
    <div className="w-full flex items-center justify-center p-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl shadow-inner max-w-full h-auto block select-none"
        style={{ aspectRatio: '1 / 1' }}
      />
    </div>
  );
};
