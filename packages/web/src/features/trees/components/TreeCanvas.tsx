import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const LINE_STYLES: Record<string, { stroke: string; strokeDasharray: string }> = {
  parent_child: { stroke: '#2E7D32', strokeDasharray: '' },
  spouse: { stroke: '#F9A825', strokeDasharray: '' },
  step_parent_child: { stroke: '#6B7A6B', strokeDasharray: '8 4' },
  adoptive_parent_child: { stroke: '#6B7A6B', strokeDasharray: '4 4' },
  half_sibling: { stroke: '#2E7D32', strokeDasharray: '4 2' },
};

interface PersonNode {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  isAlive: boolean;
  photoKey: string | null;
}

interface RelationshipEdge {
  id: string;
  personId1: string;
  personId2: string;
  relationshipType: string;
}

type ViewMode = 'radial' | 'top-down' | 'left-right';

interface TreeCanvasProps {
  persons: PersonNode[];
  relationships: RelationshipEdge[];
  viewMode: ViewMode;
  selectedPersonId?: string | null;
  onPersonClick?: (id: string) => void;
}

export function TreeCanvas({ persons, relationships, viewMode, selectedPersonId, onPersonClick }: TreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current?.parentElement) {
        setDimensions({
          width: svgRef.current.parentElement.clientWidth,
          height: svgRef.current.parentElement.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || persons.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const { width, height } = dimensions;
    const g = svg.append('g');

    const parentChildRels = relationships.filter((r) => r.relationshipType === 'parent_child');
    const childIds = new Set(parentChildRels.map((r) => r.personId2));
    const roots = persons.filter((p) => !childIds.has(p.id));
    const rootId = roots.length > 0 ? roots[0].id : persons[0]?.id;

    const childrenMap = new Map<string, string[]>();
    parentChildRels.forEach((r) => {
      if (!childrenMap.has(r.personId1)) childrenMap.set(r.personId1, []);
      childrenMap.get(r.personId1)!.push(r.personId2);
    });

    const personMap = new Map(persons.map((p) => [p.id, p]));
    const visited = new Set<string>();

    function buildHierarchy(id: string): any {
      if (visited.has(id)) return null;
      visited.add(id);
      const person = personMap.get(id);
      if (!person) return null;
      const ch = (childrenMap.get(id) || []).map((cid) => buildHierarchy(cid)).filter(Boolean);
      return { ...person, children: ch.length > 0 ? ch : undefined };
    }

    let hierarchyData = buildHierarchy(rootId);
    if (!hierarchyData) hierarchyData = { ...persons[0], children: undefined };
    const unvisited = persons.filter((p) => !visited.has(p.id));
    if (unvisited.length > 0 && hierarchyData) {
      if (!hierarchyData.children) hierarchyData.children = [];
      unvisited.forEach((p) => hierarchyData.children.push({ ...p }));
    }

    const root = d3.hierarchy(hierarchyData);
    const nodePositions = new Map<string, { x: number; y: number }>();

    if (viewMode === 'radial') {
      const layout = d3.tree<any>().size([2 * Math.PI, Math.min(width, height) / 3]);
      layout(root);
      root.descendants().forEach((d: any) => {
        nodePositions.set(d.data.id, {
          x: width / 2 + d.y * Math.cos(d.x - Math.PI / 2),
          y: height / 2 + d.y * Math.sin(d.x - Math.PI / 2),
        });
      });
    } else if (viewMode === 'left-right') {
      const layout = d3.tree<any>().size([height - 100, width - 200]);
      layout(root);
      root.descendants().forEach((d: any) => {
        nodePositions.set(d.data.id, { x: d.y + 100, y: d.x + 50 });
      });
    } else {
      const layout = d3.tree<any>().size([width - 200, height - 100]);
      layout(root);
      root.descendants().forEach((d: any) => {
        nodePositions.set(d.data.id, { x: d.x + 100, y: d.y + 50 });
      });
    }

    const edgesG = g.append('g');
    relationships.forEach((rel) => {
      const p1 = nodePositions.get(rel.personId1);
      const p2 = nodePositions.get(rel.personId2);
      if (!p1 || !p2) return;
      const style = LINE_STYLES[rel.relationshipType] || LINE_STYLES.parent_child;
      edgesG.append('line').attr('x1', p1.x).attr('y1', p1.y).attr('x2', p2.x).attr('y2', p2.y)
        .attr('stroke', style.stroke).attr('stroke-width', 2)
        .attr('stroke-dasharray', style.strokeDasharray).attr('opacity', 0.7);
    });

    const nodesG = g.append('g');
    persons.forEach((person, i) => {
      const pos = nodePositions.get(person.id);
      if (!pos) return;
      const nodeG = nodesG.append('g').attr('transform', `translate(${pos.x},${pos.y})`)
        .attr('cursor', 'pointer')
        .attr('role', 'button')
        .attr('tabindex', '0')
        .attr('aria-label', `${person.firstName} ${person.lastName}`)
        .on('click', () => onPersonClick?.(person.id))
        .on('keydown', (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPersonClick?.(person.id);
          }
        });

      const isSelected = person.id === selectedPersonId;
      const fill = person.gender === 'male' ? '#DBEAFE' : person.gender === 'female' ? '#FCE7F3' : '#F3F4F6';
      nodeG.append('circle').attr('r', 22).attr('fill', fill)
        .attr('stroke', isSelected ? '#2E7D32' : '#E0E4DD')
        .attr('stroke-width', isSelected ? 3 : 1.5)
        .attr('opacity', person.isAlive ? 1 : 0.5);

      nodeG.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('font-size', '11px').attr('font-weight', '500').attr('fill', '#1B2118')
        .text(`${person.firstName[0]}${person.lastName[0]}`);

      nodeG.append('text').attr('text-anchor', 'middle').attr('dy', '38px')
        .attr('font-size', '10px').attr('fill', '#6B7A6B').text(person.firstName);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 4])
      .on('zoom', (event) => g.attr('transform', event.transform.toString()));
    svg.call(zoom);

    const bounds = g.node()?.getBBox();
    if (bounds) {
      const scale = Math.min(width / (bounds.width + 80), height / (bounds.height + 80), 1.5);
      const tx = width / 2 - (bounds.x + bounds.width / 2) * scale;
      const ty = height / 2 - (bounds.y + bounds.height / 2) * scale;
      svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
  }, [persons, relationships, viewMode, selectedPersonId, onPersonClick, dimensions]);

  return <svg ref={svgRef} width="100%" height="100%" className="bg-background" style={{ touchAction: 'none' }} role="tree" aria-label="Family tree visualization" />;
}
