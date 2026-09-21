interface TemplatePanelProps {
  onApplyTemplate: (template: 'process' | 'comparison' | 'quote' | 'timeline' | 'funnel' | 'cycle' | 'stats' | 'org') => void;
}

export default function TemplatePanel({ onApplyTemplate }: TemplatePanelProps) {
  const templates = [
    { id: 'process' as const, title: '3-step process', description: 'A simple flow for stages and milestones' },
    { id: 'comparison' as const, title: 'Before / After', description: 'Two-column comparison layout' },
    { id: 'quote' as const, title: 'Editorial quote', description: 'A centered statement card' },
    { id: 'timeline' as const, title: 'Timeline', description: 'Milestones across a horizontal axis' },
    { id: 'funnel' as const, title: 'Funnel', description: 'Stages that narrow toward an outcome' },
    { id: 'cycle' as const, title: 'Cycle diagram', description: 'Four-step repeating workflow' },
    { id: 'stats' as const, title: 'Statistics card', description: 'A bold metric with supporting context' },
    { id: 'org' as const, title: 'Org chart', description: 'Simple leader and team structure' },
  ];

  return (
    <div className="p-4 flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Starter templates</h3>
      <p className="text-xs text-slate-500">Templates add editable objects to your current canvas.</p>
      {templates.map((template) => (
        <button key={template.id} onClick={() => onApplyTemplate(template.id)} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100">
          <span className="block text-sm font-semibold text-slate-700">{template.title}</span>
          <span className="mt-1 block text-xs text-slate-400">{template.description}</span>
        </button>
      ))}
    </div>
  );
}
