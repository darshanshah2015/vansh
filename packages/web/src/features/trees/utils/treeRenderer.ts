import * as d3 from 'd3';
import type { PersonNode, CoupleNode } from './treeLayout';

// Card dimensions
export const CARD_W = 160;
export const CARD_H = 72;
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
const SPOUSE_LINE_COLOR = '#F9A825';

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
  onClick?: (id: string) => void
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

  // Card background
  g.append('rect')
    .attr('x', -CARD_W / 2)
    .attr('y', -CARD_H / 2)
    .attr('width', CARD_W)
    .attr('height', CARD_H)
    .attr('rx', CARD_R)
    .attr('fill', isSelected ? '#F0FFF0' : '#FFFFFF')
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
  const circleY = 0;
  g.append('circle')
    .attr('cx', circleX)
    .attr('cy', circleY)
    .attr('r', 18)
    .attr('fill', bg)
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
  g.append('text')
    .attr('x', textX)
    .attr('y', -8)
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('fill', '#1F2937')
    .attr('opacity', opacity)
    .text(`${person.firstName} ${person.lastName}`.slice(0, 16));

  // Life span
  const span = lifeSpan(person);
  if (span) {
    g.append('text')
      .attr('x', textX)
      .attr('y', 8)
      .attr('font-size', '10px')
      .attr('fill', '#6B7280')
      .attr('opacity', opacity)
      .text(span);
  }

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
  onClick?: (id: string) => void
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
    renderPersonCard(leftG, node.primary, node.primary.id === selectedPersonId, onClick);

    const rightG = g.append('g').attr('transform', `translate(${offset},0)`);
    renderPersonCard(rightG, node.spouse, node.spouse.id === selectedPersonId, onClick);
  } else {
    renderPersonCard(g, node.primary, node.primary.id === selectedPersonId, onClick);
  }
}

/**
 * Renders an orthogonal elbow link for top-down layout.
 */
export function elbowLinkVertical(sx: number, sy: number, tx: number, ty: number): string {
  const midY = (sy + ty) / 2;
  return `M${sx},${sy} V${midY} H${tx} V${ty}`;
}

/**
 * Renders an orthogonal elbow link for left-right layout.
 */
export function elbowLinkHorizontal(sx: number, sy: number, tx: number, ty: number): string {
  const midX = (sx + tx) / 2;
  return `M${sx},${sy} H${midX} V${ty} H${tx}`;
}

export const LINK_STYLE = {
  stroke: '#94A3B8',
  strokeWidth: 1.5,
  opacity: 0.6,
};
