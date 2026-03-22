import { Plus } from 'lucide-react';
import { PersonMiniCard } from './PersonMiniCard';

interface RelationshipSlotsProps {
  personId: string;
  relationships: any;
  onAddFromSlot: (relType: string) => void;
}

export function RelationshipSlots({ personId, relationships, onAddFromSlot }: RelationshipSlotsProps) {
  if (!relationships) return null;

  const direct = relationships.direct || [];

  const parents = direct.filter(
    (r: any) => r.relationshipType === 'parent_child' && r.personId2 === personId
  );
  const children = direct.filter(
    (r: any) => r.relationshipType === 'parent_child' && r.personId1 === personId
  );
  const spouses = direct.filter((r: any) => r.relationshipType === 'spouse');
  const siblings = relationships.derivedSiblings || [];

  const sections = [
    { label: 'Parents', items: parents.map((r: any) => r.personId1), relType: 'parent_child', max: 2 },
    {
      label: 'Spouse',
      items: spouses.map((r: any) => (r.personId1 === personId ? r.personId2 : r.personId1)),
      relType: 'spouse',
      max: 4,
    },
    { label: 'Children', items: children.map((r: any) => r.personId2), relType: 'parent_child', max: 20 },
    { label: 'Siblings', items: siblings, relType: 'half_sibling', max: 20 },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.label}>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">{section.label}</h3>
          <div className="flex flex-wrap gap-2">
            {section.items.map((id: string) => (
              <PersonMiniCard key={id} personId={id} />
            ))}
            {section.items.length < section.max && (
              <button
                onClick={() => onAddFromSlot(section.relType)}
                className="flex min-h-[44px] items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Plus className="h-3 w-3" /> Add {section.label.replace(/s$/, '')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
