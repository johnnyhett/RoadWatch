'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AssociationRule } from '@/types';
import { Network, ZoomIn, ZoomOut, RotateCcw, Info, Search, Filter } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'antecedent_env' | 'antecedent_infra' | 'consequent_severity';
  connections: number;
  isDragging?: boolean;
}

interface Edge {
  source: Node;
  target: Node;
  confidence: number;
  lift: number;
  support: number;
  label: string;
}

interface AssociationGraphProps {
  rules?: AssociationRule[];
}

export default function AssociationGraph({ rules = [] }: AssociationGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<Edge | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const draggingNodeRef = useRef<Node | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth || 800;
    const height = canvas.offsetHeight || 450;
    canvas.width = width;
    canvas.height = height;

    const rawRules = rules.length > 0 ? rules : [
      { antecedent: ['Wet Surface', 'Midnight'], consequent: ['Fatal Severity'], support: 0.08, confidence: 0.86, lift: 3.42 },
      { antecedent: ['Speeding', 'Night'], consequent: ['Serious Injury'], support: 0.14, confidence: 0.78, lift: 2.85 },
      { antecedent: ['Raining', 'A_Road'], consequent: ['Multi-Vehicle Collision'], support: 0.18, confidence: 0.72, lift: 2.15 },
      { antecedent: ['Drink_Driving', 'Unlit Junction'], consequent: ['High Risk'], support: 0.09, confidence: 0.82, lift: 3.10 },
      { antecedent: ['Fog', 'Motorway'], consequent: ['Chain Reaction'], support: 0.06, confidence: 0.68, lift: 2.95 },
      { antecedent: ['Fatigue', 'Speed Limit 70'], consequent: ['Loss of Control'], support: 0.11, confidence: 0.74, lift: 2.40 },
    ];

    const nodeMap: Record<string, Node> = {};

    rawRules.forEach((rule) => {
      const antecedents = Array.isArray(rule.antecedent) ? rule.antecedent : [rule.antecedent];
      const consequents = Array.isArray(rule.consequent) ? rule.consequent : [rule.consequent];

      [...antecedents, ...consequents].forEach((name) => {
        if (!nodeMap[name]) {
          const isConsequent = consequents.includes(name);
          const isInfra = name.includes('Speed') || name.includes('Road') || name.includes('Motorway') || name.includes('Junction');
          nodeMap[name] = {
            id: name,
            label: name,
            x: width / 2 + (Math.random() - 0.5) * (width * 0.5),
            y: height / 2 + (Math.random() - 0.5) * (height * 0.5),
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            type: isConsequent ? 'consequent_severity' : isInfra ? 'antecedent_infra' : 'antecedent_env',
            connections: 1,
          };
        } else {
          nodeMap[name].connections++;
        }
      });
    });

    const nodes = Object.values(nodeMap);
    nodesRef.current = nodes;

    const edges: Edge[] = [];
    rawRules.forEach((rule) => {
      const antecedents = Array.isArray(rule.antecedent) ? rule.antecedent : [rule.antecedent];
      const consequents = Array.isArray(rule.consequent) ? rule.consequent : [rule.consequent];

      antecedents.forEach((a) => {
        consequents.forEach((c) => {
          if (nodeMap[a] && nodeMap[c]) {
            edges.push({
              source: nodeMap[a],
              target: nodeMap[c],
              confidence: rule.confidence || 0.7,
              lift: rule.lift || 2.0,
              support: rule.support || 0.1,
              label: `${a} → ${c}`,
            });
          }
        });
      });
    });
    edgesRef.current = edges;

    let animId: number;
    const simulate = () => {
      // Repulsion force
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 160) {
            const force = (160 - dist) / dist * 0.1;
            if (!n1.isDragging) { n1.vx -= dx * force; n1.vy -= dy * force; }
            if (!n2.isDragging) { n2.vx += dx * force; n2.vy += dy * force; }
          }
        }
      }

      // Edge spring attraction
      edges.forEach((edge) => {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 130) * 0.006;
        if (!edge.source.isDragging) { edge.source.vx += dx * force; edge.source.vy += dy * force; }
        if (!edge.target.isDragging) { edge.target.vx -= dx * force; edge.target.vy -= dy * force; }
      });

      // Update positions
      nodes.forEach((n) => {
        if (!n.isDragging) {
          n.vx *= 0.86;
          n.vy *= 0.86;
          n.x += n.vx;
          n.y += n.vy;

          const pad = 40;
          if (n.x < pad) { n.x = pad; n.vx *= -1; }
          if (n.x > width - pad) { n.x = width - pad; n.vx *= -1; }
          if (n.y < pad) { n.y = pad; n.vy *= -1; }
          if (n.y > height - pad) { n.y = height - pad; n.vy *= -1; }
        }
      });

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(scale, scale);

      // Draw Edges
      edges.forEach((e) => {
        const isMatched = !searchFilter || e.source.label.toLowerCase().includes(searchFilter.toLowerCase()) || e.target.label.toLowerCase().includes(searchFilter.toLowerCase());
        const opacity = isMatched ? Math.min(0.85, e.confidence * 0.9) : 0.15;

        ctx.beginPath();
        ctx.moveTo(e.source.x, e.source.y);
        ctx.lineTo(e.target.x, e.target.y);
        ctx.strokeStyle = isMatched ? `rgba(0, 212, 255, ${opacity})` : 'rgba(255,255,255,0.05)';
        ctx.lineWidth = isMatched ? Math.max(1.5, e.lift * 0.75) : 1;
        ctx.stroke();

        // Arrow mid-point marker
        const midX = (e.source.x + e.target.x) / 2;
        const midY = (e.source.y + e.target.y) / 2;
        ctx.beginPath();
        ctx.arc(midX, midY, 3, 0, Math.PI * 2);
        ctx.fillStyle = isMatched ? '#00d4ff' : 'rgba(255,255,255,0.2)';
        ctx.fill();
      });

      // Draw Nodes
      nodes.forEach((n) => {
        const isMatched = !searchFilter || n.label.toLowerCase().includes(searchFilter.toLowerCase());
        const radius = Math.min(18, 10 + n.connections * 2.5);

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);

        const color = n.type === 'consequent_severity' 
          ? '#ef4444' 
          : n.type === 'antecedent_infra' 
          ? '#f59e0b' 
          : '#00d4ff';

        ctx.fillStyle = isMatched ? color : 'rgba(255,255,255,0.2)';
        ctx.shadowColor = color;
        ctx.shadowBlur = isMatched ? 10 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Node Label
        ctx.fillStyle = isMatched ? '#ffffff' : 'rgba(255,255,255,0.3)';
        ctx.font = '11px font-sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + radius + 14);
      });

      ctx.restore();

      animId = requestAnimationFrame(simulate);
    };

    simulate();

    return () => cancelAnimationFrame(animId);
  }, [rules, scale, pan, searchFilter]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / scale;
    const y = (e.clientY - rect.top - pan.y) / scale;

    const clicked = nodesRef.current.find(
      (n) => Math.hypot(n.x - x, n.y - y) < 22
    );

    if (clicked) {
      clicked.isDragging = true;
      draggingNodeRef.current = clicked;
      setHoveredNode(clicked);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / scale;
    const y = (e.clientY - rect.top - pan.y) / scale;

    if (draggingNodeRef.current) {
      draggingNodeRef.current.x = x;
      draggingNodeRef.current.y = y;
    } else {
      const hover = nodesRef.current.find(
        (n) => Math.hypot(n.x - x, n.y - y) < 22
      );
      setHoveredNode(hover || null);
    }
  };

  const handleMouseUp = () => {
    if (draggingNodeRef.current) {
      draggingNodeRef.current.isDragging = false;
      draggingNodeRef.current = null;
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col bg-[#0a0a0f] rounded-xl border border-white/10">
      {/* Top Topology Controls */}
      <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between gap-3 z-10 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search factor node..."
            className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Legend Pills */}
        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Environment
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Infrastructure
          </div>
          <div className="flex items-center gap-1.5 text-red-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Severity Outcome
          </div>
        </div>

        {/* Canvas Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.min(2, s + 0.15))}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/80"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/80"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/80"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Hover Node Inspector Card */}
      {hoveredNode && (
        <div className="absolute bottom-3 left-3 bg-[#0d1117]/95 backdrop-blur-xl border border-white/15 p-3 rounded-xl z-20 text-xs shadow-2xl space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                hoveredNode.type === 'consequent_severity'
                  ? 'bg-red-500'
                  : hoveredNode.type === 'antecedent_infra'
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
            />
            <strong className="text-white text-sm">{hoveredNode.label}</strong>
          </div>
          <p className="text-white/60">
            Type: {hoveredNode.type === 'consequent_severity' ? 'Severity Outcome' : 'Antecedent Factor'}
          </p>
          <p className="text-white/60">Rule Connections: {hoveredNode.connections}</p>
        </div>
      )}
    </div>
  );
}
