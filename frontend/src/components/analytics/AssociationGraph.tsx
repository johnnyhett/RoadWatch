'use client';

import { useEffect, useRef, useState } from 'react';
import { AssociationRule } from '@/types';
import { getAssociationRules } from '@/lib/api';
import { ZoomIn, ZoomOut, RefreshCw, Search, Info } from 'lucide-react';

interface AssociationGraphProps {
  rules?: AssociationRule[];
}

interface Node {
  id: string;
  type: 'environment' | 'infrastructure' | 'outcome';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number;
}

interface Link {
  source: string;
  target: string;
  confidence: number;
  lift: number;
}

export default function AssociationGraph({ rules: propRules }: AssociationGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [rules, setRules] = useState<AssociationRule[]>(propRules || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);

  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  const animationRef = useRef<number | null>(null);

  // Fetch rules if not passed as prop
  useEffect(() => {
    if (propRules && propRules.length > 0) {
      setRules(propRules);
    } else {
      getAssociationRules().then((r) => setRules(r));
    }
  }, [propRules]);

  // Initialize nodes and links bounded nicely inside canvas
  useEffect(() => {
    if (!rules || rules.length === 0) return;

    const nodesMap = new Map<string, Node>();
    const links: Link[] = [];

    const getCategory = (factor: string): 'environment' | 'infrastructure' | 'outcome' => {
      if (['Fatal Severity', 'Serious Injury', 'Multi-Vehicle Collision', 'High Risk', 'Chain Reaction', 'Loss of Control'].includes(factor)) {
        return 'outcome';
      }
      if (['Speeding', 'Wet Surface', 'Raining', 'Drink_Driving', 'Night', 'Darkness', 'Midnight', 'Fatigue'].includes(factor)) {
        return 'environment';
      }
      return 'infrastructure';
    };

    const width = containerRef.current?.clientWidth || 700;
    const height = containerRef.current?.clientHeight || 450;
    const cx = width / 2;
    const cy = height / 2;

    rules.forEach((rule) => {
      rule.antecedent.forEach((ant) => {
        if (!nodesMap.has(ant)) {
          nodesMap.set(ant, {
            id: ant,
            type: getCategory(ant),
            x: cx + (Math.random() - 0.5) * 220,
            y: cy + (Math.random() - 0.5) * 180,
            vx: 0,
            vy: 0,
            radius: 14,
            connections: 0,
          });
        }
        const node = nodesMap.get(ant)!;
        node.connections += 1;
      });

      rule.consequent.forEach((cons) => {
        if (!nodesMap.has(cons)) {
          nodesMap.set(cons, {
            id: cons,
            type: getCategory(cons),
            x: cx + (Math.random() - 0.5) * 220,
            y: cy + (Math.random() - 0.5) * 180,
            vx: 0,
            vy: 0,
            radius: 18,
            connections: 0,
          });
        }
        const node = nodesMap.get(cons)!;
        node.connections += 2;
      });

      rule.antecedent.forEach((ant) => {
        rule.consequent.forEach((cons) => {
          links.push({
            source: ant,
            target: cons,
            confidence: rule.confidence,
            lift: rule.lift,
          });
        });
      });
    });

    const nodes = Array.from(nodesMap.values());
    nodes.forEach((n) => {
      n.radius = Math.min(26, Math.max(12, 10 + n.connections * 2.5));
    });

    nodesRef.current = nodes;
    linksRef.current = links;
  }, [rules]);

  // Spring physics simulation loop with strict canvas boundary collision
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const runPhysicsAndRender = () => {
      const width = canvas.width;
      const height = canvas.height;
      const nodes = nodesRef.current;
      const links = linksRef.current;

      const cx = width / 2;
      const cy = height / 2;

      // 1. Apply Center Gravity Pull
      nodes.forEach((node) => {
        const dx = cx - node.x;
        const dy = cy - node.y;
        node.vx += dx * 0.008;
        node.vy += dy * 0.008;
      });

      // 2. Node Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          let dx = n2.x - n1.x;
          let dy = n2.y - n1.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = n1.radius + n2.radius + 60;

          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.12;
            const fx = dx * force;
            const fy = dy * force;

            if (n1 !== draggedNode) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (n2 !== draggedNode) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }
      }

      // 3. Link Attraction
      links.forEach((link) => {
        const source = nodes.find((n) => n.id === link.source);
        const target = nodes.find((n) => n.id === link.target);

        if (source && target) {
          let dx = target.x - source.x;
          let dy = target.y - source.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const idealDist = 120;
          const force = (dist - idealDist) * 0.005;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (source !== draggedNode) {
            source.vx += fx;
            source.vy += fy;
          }
          if (target !== draggedNode) {
            target.vx -= fx;
            target.vy -= fy;
          }
        }
      });

      // 4. Update Position with Velocity Damping & STRICT CANVAS BOUNDARIES
      const pad = 45;
      nodes.forEach((node) => {
        if (node === draggedNode) return;

        node.vx *= 0.85;
        node.vy *= 0.85;

        node.x += node.vx;
        node.y += node.vy;

        // Strict canvas bounding box (never shoot off-screen)
        node.x = Math.max(pad, Math.min(width - pad, node.x));
        node.y = Math.max(pad, Math.min(height - pad, node.y));
      });

      // 5. RENDER CANVAS
      ctx.clearRect(0, 0, width, height);

      // Draw Links
      links.forEach((link) => {
        const source = nodes.find((n) => n.id === link.source);
        const target = nodes.find((n) => n.id === link.target);

        if (source && target) {
          const isHighlighted =
            selectedNode && (selectedNode.id === source.id || selectedNode.id === target.id);

          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = isHighlighted ? '#00d4ff' : 'rgba(0, 212, 255, 0.25)';
          ctx.lineWidth = isHighlighted ? 3 : Math.max(1.2, link.confidence * 3);
          ctx.stroke();
        }
      });

      // Draw Nodes
      nodes.forEach((node) => {
        const isMatched = searchTerm && node.id.toLowerCase().includes(searchTerm.toLowerCase());
        const isSelected = selectedNode?.id === node.id;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * (isSelected ? 1.25 : 1), 0, Math.PI * 2);

        let fillColor = '#00d4ff';
        if (node.type === 'environment') fillColor = '#38bdf8';
        if (node.type === 'infrastructure') fillColor = '#f59e0b';
        if (node.type === 'outcome') fillColor = '#ef4444';

        ctx.fillStyle = fillColor;
        ctx.shadowColor = fillColor;
        ctx.shadowBlur = isSelected || isMatched ? 16 : 8;
        ctx.fill();

        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Label
        ctx.font = `${isSelected ? 'bold 12px' : '11px'} "Inter", sans-serif`;
        ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
        ctx.textAlign = 'center';
        ctx.fillText(node.id, node.x, node.y + node.radius + 14);
      });

      animationRef.current = requestAnimationFrame(runPhysicsAndRender);
    };

    animationRef.current = requestAnimationFrame(runPhysicsAndRender);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draggedNode, selectedNode, searchTerm]);

  // Click & Drag interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clicked = nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 5;
    });

    if (clicked) {
      setDraggedNode(clicked);
      setSelectedNode(clicked);
    } else {
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedNode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    draggedNode.x = e.clientX - rect.left;
    draggedNode.y = e.clientY - rect.top;
    draggedNode.vx = 0;
    draggedNode.vy = 0;
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-[450px] bg-[#090d14] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Top Header Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search factor node..."
            className="bg-transparent text-xs text-white focus:outline-none w-36 font-mono placeholder:text-white/40"
          />
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-white/80 pointer-events-auto">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8]" /> Environment
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Infrastructure
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Severity Outcome
          </span>
        </div>
      </div>

      {/* Interactive Physics Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Selected Node Inspector Card */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 bg-[#0d1117]/95 backdrop-blur-xl border border-cyan-500/30 p-3 rounded-xl z-10 max-w-xs shadow-2xl space-y-1">
          <div className="flex items-center justify-between">
            <strong className="text-xs text-cyan-300 font-bold font-heading">{selectedNode.id}</strong>
            <span className="text-[10px] text-white/50 font-mono">
              {selectedNode.type.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-white/70">
            Connected in <strong>{selectedNode.connections}</strong> frequent co-occurrence safety rules.
          </p>
        </div>
      )}
    </div>
  );
}
