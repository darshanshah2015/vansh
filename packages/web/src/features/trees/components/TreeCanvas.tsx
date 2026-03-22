import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import * as d3 from 'd3';
import { buildFamilyHierarchy, buildLineageHierarchy, type PersonNode, type RelationshipEdge, type CoupleNode } from '../utils/treeLayout';
import {
  renderCoupleNode,
  drawParentChildLinksVertical,
  drawParentChildLinksHorizontal,
  drawRadialLink,
  CARD_W,
  CARD_H,
  COUPLE_GAP,
} from '../utils/treeRenderer';

type ViewMode = 'radial' | 'top-down' | 'left-right';

interface TreeCanvasProps {
  persons: PersonNode[];
  relationships: RelationshipEdge[];
  viewMode: ViewMode;
  selectedPersonId?: string | null;
  focusPersonId?: string | null;
  onPersonClick?: (id: string) => void;
  onNavigateToFamily?: (personId: string) => void;
}

export interface TreeCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

export const TreeCanvas = forwardRef<TreeCanvasHandle, TreeCanvasProps>(
  function TreeCanvas({ persons, relationships, viewMode, selectedPersonId, focusPersonId, onPersonClick, onNavigateToFamily }, ref) {
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const initialTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useImperativeHandle(ref, () => ({
      zoomIn() {
        if (!svgRef.current || !zoomRef.current) return;
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.4);
      },
      zoomOut() {
        if (!svgRef.current || !zoomRef.current) return;
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
      },
      resetView() {
        if (!svgRef.current || !zoomRef.current) return;
        d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, initialTransformRef.current);
      },
    }));

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

    const render = useCallback(() => {
      if (!svgRef.current || persons.length === 0) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      const { width, height } = dimensions;
      const g = svg.append('g');

      // Auto-select focus: claimed person or person with most descendants
      let effectiveFocus = focusPersonId;
      if (!effectiveFocus) {
        const claimed = persons.find((p) => p.claimedByUserId);
        effectiveFocus = claimed?.id ?? null;
      }

      // Build couple-node hierarchy — always lineage-focused
      const familyRoot = effectiveFocus
        ? buildLineageHierarchy(persons, relationships, effectiveFocus)
        : buildFamilyHierarchy(persons, relationships);
      const root = d3.hierarchy(familyRoot, (d) => d.children ?? undefined);

      // Couple node width for separation
      const coupleWidth = (d: d3.HierarchyNode<CoupleNode>) =>
        d.data.spouse ? CARD_W * 2 + COUPLE_GAP : CARD_W;

      // Node positions
      const nodePositions = new Map<string, { x: number; y: number }>();

      if (viewMode === 'radial') {
        const radius = Math.max(120, root.descendants().length * 50);
        const layout = d3.tree<CoupleNode>().size([2 * Math.PI, radius])
          .separation((a, b) => {
            const wa = a.data.spouse ? 1.8 : 1;
            const wb = b.data.spouse ? 1.8 : 1;
            return (wa + wb) / 2 / (a.parent === b.parent ? 1 : 1.5);
          });
        layout(root);
        root.descendants().forEach((d) => {
          nodePositions.set(d.data.id, {
            x: d.y * Math.cos(d.x - Math.PI / 2),
            y: d.y * Math.sin(d.x - Math.PI / 2),
          });
        });
      } else if (viewMode === 'left-right') {
        const layout = d3.tree<CoupleNode>().nodeSize([CARD_H + 40, 280])
          .separation((a, b) => {
            const wa = a.data.spouse ? 1.4 : 1;
            const wb = b.data.spouse ? 1.4 : 1;
            return (wa + wb) / 2;
          });
        layout(root);
        root.descendants().forEach((d) => {
          nodePositions.set(d.data.id, { x: d.y, y: d.x });
        });
      } else {
        // top-down
        const layout = d3.tree<CoupleNode>().nodeSize([CARD_W * 2 + 40, CARD_H + 60])
          .separation((a, b) => {
            const wa = a.data.spouse ? 1.4 : 1;
            const wb = b.data.spouse ? 1.4 : 1;
            return (wa + wb) / 2;
          });
        layout(root);
        root.descendants().forEach((d) => {
          nodePositions.set(d.data.id, { x: d.x, y: d.y });
        });
      }

      const isVirtual = (id: string) => id === 'virtual-root';

      // Build person ID → couple center (for parent source) and individual card position (for child target)
      const personCoupleCenter = new Map<string, { x: number; y: number }>();
      const personCardCenter = new Map<string, { x: number; y: number }>();
      const cardOffset = (CARD_W + COUPLE_GAP) / 2;
      root.descendants().forEach((d) => {
        if (isVirtual(d.data.id)) return;
        const pos = nodePositions.get(d.data.id);
        if (!pos) return;
        personCoupleCenter.set(d.data.primary.id, pos);
        if (d.data.spouse) {
          personCoupleCenter.set(d.data.spouse.id, pos);
          personCardCenter.set(d.data.primary.id, { x: pos.x - cardOffset, y: pos.y });
          personCardCenter.set(d.data.spouse.id, { x: pos.x + cardOffset, y: pos.y });
        } else {
          personCardCenter.set(d.data.primary.id, pos);
        }
      });

      // Draw ALL parent→child links from raw relationship data
      // Group by parent couple center → child individual card positions
      const linksG = g.append('g');
      const parentChildRels = relationships.filter((r) => r.relationshipType === 'parent_child');

      // Group: "parentCoupleKey" → Set of child card positions
      const parentToChildren = new Map<string, Set<string>>();
      const posKey = (p: { x: number; y: number }) => `${p.x},${p.y}`;

      parentChildRels.forEach((rel) => {
        const parentPos = personCoupleCenter.get(rel.personId1);
        const childPos = personCardCenter.get(rel.personId2);
        if (!parentPos || !childPos) return;
        const pk = posKey(parentPos);
        const ck = posKey(childPos);
        if (pk === ck) return; // Same couple node, skip
        if (!parentToChildren.has(pk)) parentToChildren.set(pk, new Set());
        parentToChildren.get(pk)!.add(ck);
      });

      // Draw T-junction for each parent → children group
      parentToChildren.forEach((childKeys, parentKey) => {
        const [px, py] = parentKey.split(',').map(Number);
        const childPositions = [...childKeys].map((ck) => {
          const [cx, cy] = ck.split(',').map(Number);
          return { x: cx, y: cy };
        });

        if (viewMode === 'radial') {
          childPositions.forEach((cp) => {
            drawRadialLink(linksG as any, px, py, cp.x, cp.y);
          });
        } else if (viewMode === 'left-right') {
          drawParentChildLinksHorizontal(linksG as any, { x: px, y: py }, childPositions, CARD_W);
        } else {
          drawParentChildLinksVertical(linksG as any, { x: px, y: py }, childPositions);
        }
      });

      // Draw nodes (skip virtual root)
      const nodesG = g.append('g');
      root.descendants().forEach((d) => {
        if (isVirtual(d.data.id)) return;
        const pos = nodePositions.get(d.data.id);
        if (!pos) return;
        renderCoupleNode(nodesG as any, d.data, pos.x, pos.y, selectedPersonId, onPersonClick, onNavigateToFamily, focusPersonId);
      });

      // Zoom
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 5])
        .on('zoom', (event) => g.attr('transform', event.transform.toString()));
      zoomRef.current = zoom;
      svg.call(zoom);

      // Auto-fit
      const bounds = g.node()?.getBBox();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        const padding = 60;
        const scale = Math.min(
          width / (bounds.width + padding * 2),
          height / (bounds.height + padding * 2),
          1.5
        );
        const tx = width / 2 - (bounds.x + bounds.width / 2) * scale;
        const ty = height / 2 - (bounds.y + bounds.height / 2) * scale;
        const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
        initialTransformRef.current = transform;
        svg.call(zoom.transform, transform);
      }
    }, [persons, relationships, viewMode, selectedPersonId, focusPersonId, onPersonClick, onNavigateToFamily, dimensions]);

    useEffect(() => {
      render();
    }, [render]);

    return (
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="bg-background"
        style={{ touchAction: 'none' }}
        role="tree"
        aria-label="Family tree visualization"
      />
    );
  }
);
