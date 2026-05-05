import * as d3 from 'd3';
import type { PersonNode, CoupleNode } from './treeLayout';

// Card dimensions
export const CARD_W = 210;
export const CARD_H = 104;
export const CARD_R = 8;
export const COUPLE_GAP = 16;

// Colors
const GENDER_ACCENT: Record<string, string> = {
  male: '#3B82F6',
  female: '#EC4899',
  other: '#6B7280',
};
const GENDER_BG: Record<string, string> = {
  male: '#EFF6FF',
  female: '#FDF2F8',
  other: '#F9FAFB',
};
const CARD_STROKE = '#E5E7EB';
const SELECTED_STROKE = '#2E7D32';
const SPOUSE_LINE_COLOR = '#FB7185';

function nameLines(person: PersonNode): string[] {
  const words = `${person.firstName} ${person.lastName}`.trim().split(/\s+/);
  if (words.length <= 2) return [words.join(' ')];
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
}

function formatYear(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : String(d.getFullYear());
}

function lifeSpan(person: PersonNode): string {
  const birth = formatYear(person.dateOfBirth);
  const death = formatYear(person.dateOfDeath);
  if (birth && death) return `${birth} - ${death}`;
  if (birth) return `b. ${birth}`;
  return '';
}

/**
 * Renders a single person card as an SVG <g> group.
 * Card is centered at (0, 0).
 */
export function renderPersonCard(
  parent: d3.Selection<SVGGElement, unknown, null, undefined>,
  person: PersonNode,
  isSelected: boolean,
  onClick?: (id: string) => void,
  isHighlighted?: boolean
): d3.Selection<SVGGElement, unknown, null, undefined> {
  const g = parent.append('g')
    .attr('cursor', 'pointer')
    .attr('role', 'button')
    .attr('tabindex', '0')
    .attr('aria-label', `${person.firstName} ${person.lastName}`)
    .on('click', () => onClick?.(person.id))
    .on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick?.(person.id);
      }
    });

  const accent = GENDER_ACCENT[person.gender] ?? GENDER_ACCENT.other;
  const bg = GENDER_BG[person.gender] ?? GENDER_BG.other;
  const opacity = person.isAlive ? 1 : 0.6;

  // Highlight glow when navigated to — finite transition chain, no setTimeout
  if (isHighlighted) {
    const glow = g.append('rect')
      .attr('x', -CARD_W / 2 - 4)
      .attr('y', -CARD_H / 2 - 4)
      .attr('width', CARD_W + 8)
      .attr('height', CARD_H + 8)
      .attr('rx', CARD_R + 2)
      .attr('fill', 'none')
      .attr('stroke', '#F9A825')
      .attr('stroke-width', 3)
      .attr('opacity', 1);

    // 3 pulses (800ms each way × 3 = ~4.8s) then fade out and remove
    glow.transition().duration(800).attr('opacity', 0.3)
      .transition().duration(800).attr('opacity', 1)
      .transition().duration(800).attr('opacity', 0.3)
      .transition().duration(800).attr('opacity', 1)
      .transition().duration(800).attr('opacity', 0.3)
      .transition().duration(800).attr('opacity', 1)
      .transition().duration(600).attr('opacity', 0).remove();
  }

  // Card background
  g.append('rect')
    .attr('x', -CARD_W / 2)
    .attr('y', -CARD_H / 2)
    .attr('width', CARD_W)
    .attr('height', CARD_H)
    .attr('rx', CARD_R)
    .attr('fill', isSelected ? '#F0FFF0' : bg)
    .attr('stroke', isSelected ? SELECTED_STROKE : CARD_STROKE)
    .attr('stroke-width', isSelected ? 2.5 : 1)
    .attr('opacity', opacity);

  // Gender accent bar (left side)
  g.append('rect')
    .attr('x', -CARD_W / 2)
    .attr('y', -CARD_H / 2)
    .attr('width', 4)
    .attr('height', CARD_H)
    .attr('rx', 2)
    .attr('fill', accent)
    .attr('opacity', opacity);

  // Initials circle
  const circleX = -CARD_W / 2 + 28;
  const circleY = -10;
  g.append('circle')
    .attr('cx', circleX)
    .attr('cy', circleY)
    .attr('r', 18)
    .attr('fill', '#FFFFFF')
    .attr('stroke', accent)
    .attr('stroke-width', 1.5)
    .attr('opacity', opacity);

  g.append('text')
    .attr('x', circleX)
    .attr('y', circleY)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('fill', accent)
    .attr('opacity', opacity)
    .text(`${person.firstName[0] ?? ''}${person.lastName[0] ?? ''}`);

  // Full name
  const textX = -CARD_W / 2 + 54;
  const lines = nameLines(person);
  const nameText = g.append('text')
    .attr('x', textX)
    .attr('y', -26)
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('fill', '#1F2937')
    .attr('opacity', opacity);

  lines.forEach((line, index) => {
    nameText.append('tspan')
      .attr('x', textX)
      .attr('dy', index === 0 ? 0 : 14)
      .text(line);
  });

  // Life span
  const span = lifeSpan(person);
  if (span) {
    g.append('text')
      .attr('x', textX)
      .attr('y', lines.length > 1 ? 8 : -6)
      .attr('font-size', '10px')
      .attr('fill', '#6B7280')
      .attr('opacity', opacity)
      .text(span);
  }

  g.append('text')
    .attr('x', textX)
    .attr('y', 28)
    .attr('font-size', '10px')
    .attr('fill', person.placeOfBirth ? '#4B5563' : '#9CA3AF')
    .attr('opacity', opacity)
    .text(person.placeOfBirth ? `Born in ${person.placeOfBirth}` : 'Birth place not added');

  // Status dot
  g.append('circle')
    .attr('cx', CARD_W / 2 - 12)
    .attr('cy', -CARD_H / 2 + 12)
    .attr('r', 4)
    .attr('fill', person.isAlive ? '#22C55E' : '#9CA3AF');

  return g;
}

/**
 * Renders a couple node at (cx, cy).
 * If couple has a spouse, two cards side-by-side with a connector.
 * If single, one centered card.
 */
export function renderCoupleNode(
  parent: d3.Selection<SVGGElement, unknown, null, undefined>,
  node: CoupleNode,
  cx: number,
  cy: number,
  selectedPersonId: string | null | undefined,
  onClick?: (id: string) => void,
  onNavigateToFamily?: (id: string) => void,
  highlightPersonId?: string | null
) {
  const g = parent.append('g').attr('transform', `translate(${cx},${cy})`);

  if (node.spouse) {
    const offset = (CARD_W + COUPLE_GAP) / 2;

    // Spouse connector line
    g.append('line')
      .attr('x1', -offset + CARD_W / 2 + 2)
      .attr('y1', 0)
      .attr('x2', offset - CARD_W / 2 - 2)
      .attr('y2', 0)
      .attr('stroke', SPOUSE_LINE_COLOR)
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round');

    // Small heart/ring circle at center
    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 5)
      .attr('fill', SPOUSE_LINE_COLOR)
      .attr('opacity', 0.8);

    const leftG = g.append('g').attr('transform', `translate(${-offset},0)`);
    renderPersonCard(leftG, node.primary, node.primary.id === selectedPersonId, onClick, node.primary.id === highlightPersonId);

    const rightG = g.append('g').attr('transform', `translate(${offset},0)`);
    renderPersonCard(rightG, node.spouse, node.spouse.id === selectedPersonId, onClick, node.spouse.id === highlightPersonId);

    // "View Family" button below spouse card if navigable
    if (node.spouseIsNavigable && node.spouseLineageId && onNavigateToFamily) {
      const btnW = CARD_W - 8;
      const btnH = 20;
      const btnY = CARD_H / 2 + 4;
      const navG = rightG.append('g')
        .attr('transform', `translate(0, ${btnY})`)
        .attr('cursor', 'pointer')
        .attr('role', 'button')
        .attr('tabindex', '0')
        .attr('aria-label', `View ${node.spouse.firstName}'s family`)
        .on('click', (event: MouseEvent) => {
          event.stopPropagation();
          onNavigateToFamily(node.spouseLineageId!);
        })
        .on('keydown', (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onNavigateToFamily(node.spouseLineageId!);
          }
        });

      // Button background
      navG.append('rect')
        .attr('x', -btnW / 2)
        .attr('y', 0)
        .attr('width', btnW)
        .attr('height', btnH)
        .attr('rx', 4)
        .attr('fill', SPOUSE_LINE_COLOR)
        .attr('opacity', 0.12);

      navG.append('rect')
        .attr('x', -btnW / 2)
        .attr('y', 0)
        .attr('width', btnW)
        .attr('height', btnH)
        .attr('rx', 4)
        .attr('fill', 'none')
        .attr('stroke', SPOUSE_LINE_COLOR)
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.4);

      // Button text
      navG.append('text')
        .attr('x', 0)
        .attr('y', btnH / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .attr('fill', '#B07D10')
        .text(`${node.spouse.firstName}'s Family →`);
    }
  } else {
    renderPersonCard(g, node.primary, node.primary.id === selectedPersonId, onClick, node.primary.id === highlightPersonId);
  }
}

// --- Link styles per relationship type ---

export const PARENT_CHILD_LINK = {
  stroke: '#10B981',
  strokeWidth: 2,
  opacity: 0.75,
  strokeDasharray: '',
};

export const SIBLING_BAR = {
  stroke: PARENT_CHILD_LINK.stroke,
  strokeWidth: 2,
  opacity: PARENT_CHILD_LINK.opacity,
  strokeDasharray: '',
};

/**
 * Draws the T-junction parent→children links for top-down layout.
 *
 * Pattern:
 *   Parent (bottom center)
 *      |  (vertical drop)
 *      |
 *   ---+---+---  (horizontal sibling bar, dashed blue)
 *   |       |
 *   Child1  Child2  (vertical drops, solid green)
 */
export function drawParentChildLinksVertical(
  linksG: d3.Selection<SVGGElement, unknown, null, undefined>,
  parentPos: { x: number; y: number },
  childPositions: Array<{ x: number; y: number }>,
) {
  if (childPositions.length === 0) return;

  const parentBottomY = parentPos.y + CARD_H / 2;
  const midY = parentBottomY + (childPositions[0].y - CARD_H / 2 - parentBottomY) / 2;

  // Vertical drop from parent to midpoint
  linksG.append('path')
    .attr('d', `M${parentPos.x},${parentBottomY} V${midY}`)
    .attr('fill', 'none')
    .attr('stroke', PARENT_CHILD_LINK.stroke)
    .attr('stroke-width', PARENT_CHILD_LINK.strokeWidth)
    .attr('stroke-linecap', 'round')
    .attr('opacity', PARENT_CHILD_LINK.opacity);

  // Horizontal bar at midY connecting parent drop point to all child x positions
  const allXs = [parentPos.x, ...childPositions.map((c) => c.x)].sort((a, b) => a - b);
  const minX = allXs[0];
  const maxX = allXs[allXs.length - 1];
  if (maxX > minX) {
    if (childPositions.length > 1) {
      // Sibling bar spanning all children
      const childXs = childPositions.map((c) => c.x).sort((a, b) => a - b);
      const sibMinX = childXs[0];
      const sibMaxX = childXs[childXs.length - 1];

      // Green connector from parent drop to sibling bar
      if (parentPos.x < sibMinX) {
        linksG.append('path')
          .attr('d', `M${parentPos.x},${midY} H${sibMinX}`)
          .attr('fill', 'none')
          .attr('stroke', PARENT_CHILD_LINK.stroke)
          .attr('stroke-width', PARENT_CHILD_LINK.strokeWidth)
          .attr('stroke-linecap', 'round')
          .attr('opacity', PARENT_CHILD_LINK.opacity);
      } else if (parentPos.x > sibMaxX) {
        linksG.append('path')
          .attr('d', `M${sibMaxX},${midY} H${parentPos.x}`)
          .attr('fill', 'none')
          .attr('stroke', PARENT_CHILD_LINK.stroke)
          .attr('stroke-width', PARENT_CHILD_LINK.strokeWidth)
          .attr('stroke-linecap', 'round')
          .attr('opacity', PARENT_CHILD_LINK.opacity);
      }

      // Blue dashed sibling bar between children
      linksG.append('path')
        .attr('d', `M${sibMinX},${midY} H${sibMaxX}`)
        .attr('fill', 'none')
        .attr('stroke', SIBLING_BAR.stroke)
        .attr('stroke-width', SIBLING_BAR.strokeWidth)
        .attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', SIBLING_BAR.strokeDasharray)
        .attr('opacity', SIBLING_BAR.opacity);
    } else {
      // Single child offset from parent: green connector
      linksG.append('path')
        .attr('d', `M${minX},${midY} H${maxX}`)
        .attr('fill', 'none')
        .attr('stroke', PARENT_CHILD_LINK.stroke)
        .attr('stroke-width', PARENT_CHILD_LINK.strokeWidth)
        .attr('stroke-linecap', 'round')
        .attr('opacity', PARENT_CHILD_LINK.opacity);
    }
  }

  // Vertical drops from midY to each child
  childPositions.forEach((cp) => {
    linksG.append('path')
      .attr('d', `M${cp.x},${midY} V${cp.y - CARD_H / 2}`)
      .attr('fill', 'none')
      .attr('stroke', PARENT_CHILD_LINK.stroke)
      .attr('stroke-width', PARENT_CHILD_LINK.strokeWidth)
      .attr('stroke-linecap', 'round')
      .attr('opacity', PARENT_CHILD_LINK.opacity);
  });
}

/**
 * Draws the T-junction parent→children links for left-right layout.
 */
export function drawParentChildLinksHorizontal(
  linksG: d3.Selection<SVGGElement, unknown, null, undefined>,
  parentPos: { x: number; y: number },
  childPositions: Array<{ x: number; y: number }>,
  parentCoupleWidth: number,
) {
  if (childPositions.length === 0) return;

  const parentRightX = parentPos.x + parentCoupleWidth / 2;
  const midX = parentRightX + (childPositions[0].x - CARD_W / 2 - parentRightX) / 2;

  // Horizontal drop from parent to midpoint
  linksG.append('path')
    .attr('d', `M${parentRightX},${parentPos.y} H${midX}`)
    .attr('fill', 'none')
    .attr('stroke', PARENT_CHILD_LINK.stroke)
    .attr('stroke-width', PARENT_CHILD_LINK.strokeWidth)
    .attr('stroke-linecap', 'round')
    .attr('opacity', PARENT_CHILD_LINK.opacity);

  if (childPositions.length > 1) {
    // Vertical sibling bar
    const ys = childPositions.map((c) => c.y).sort((a, b) => a - b);
    linksG.append('path')
      .attr('d', `M${midX},${ys[0]} V${ys[ys.length - 1]}`)
      .attr('fill', 'none')
      .attr('stroke', SIBLING_BAR.stroke)
      .attr('stroke-width', SIBLING_BAR.strokeWidth)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', SIBLING_BAR.strokeDasharray)
      .attr('opacity', SIBLING_BAR.opacity);
  }

  // Horizontal drops from sibling bar to each child
  childPositions.forEach((cp) => {
    linksG.append('path')
      .attr('d', `M${midX},${cp.y} H${cp.x - CARD_W / 2}`)
      .attr('fill', 'none')
      .attr('stroke', PARENT_CHILD_LINK.stroke)
      .attr('stroke-width', PARENT_CHILD_LINK.strokeWidth)
      .attr('stroke-linecap', 'round')
      .attr('opacity', PARENT_CHILD_LINK.opacity);
  });
}

/**
 * Draws simple radial links (straight lines with color coding).
 */
export function drawRadialLink(
  linksG: d3.Selection<SVGGElement, unknown, null, undefined>,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
) {
  linksG.append('path')
    .attr('d', `M${sx},${sy} L${tx},${ty}`)
    .attr('fill', 'none')
    .attr('stroke', PARENT_CHILD_LINK.stroke)
    .attr('stroke-width', PARENT_CHILD_LINK.strokeWidth)
    .attr('stroke-linecap', 'round')
    .attr('opacity', PARENT_CHILD_LINK.opacity);
}

/**
 * Cross-link style for relationships not in the tree hierarchy
 * (e.g., in-law parent → spouse). Drawn as a curved dashed green line.
 */
export const CROSS_LINK = {
  stroke: '#10B981',
  strokeWidth: 1.5,
  opacity: 0.5,
  strokeDasharray: '6 4',
};

export function drawCrossLink(
  linksG: d3.Selection<SVGGElement, unknown, null, undefined>,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
) {
  // Curved path: drop from source, curve to target
  const midY = (sy + ty) / 2;
  const pathD = `M${sx},${sy + CARD_H / 2} C${sx},${midY} ${tx},${midY} ${tx},${ty - CARD_H / 2}`;
  linksG.append('path')
    .attr('d', pathD)
    .attr('fill', 'none')
    .attr('stroke', CROSS_LINK.stroke)
    .attr('stroke-width', CROSS_LINK.strokeWidth)
    .attr('stroke-dasharray', CROSS_LINK.strokeDasharray)
    .attr('stroke-linecap', 'round')
    .attr('opacity', CROSS_LINK.opacity);
}
