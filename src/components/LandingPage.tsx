import { ArrowRight, BarChart3, Check, Layers3, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f1faf2] text-[#051f20]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#235347] text-[#daf1de]">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-['Space_Grotesk'] text-lg font-bold tracking-tight">Infographic<span className="text-[#235347]">Studio</span></span>
        </div>
        <button onClick={onEnter} className="inline-flex items-center gap-2 rounded-full border border-[#235347]/30 px-4 py-2 text-xs font-semibold text-[#235347] transition hover:bg-[#daf1de]">
          Sign in <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-24 lg:pt-16">
        <div className="max-w-xl">
          <p className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#235347]"><span className="h-2 w-2 rounded-full bg-[#d97706]" /> Make the idea visible</p>
          <h1 className="font-['Space_Grotesk'] text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">Turn complex thoughts into clear visual stories.</h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#235347] sm:text-lg">InfographicStudio gives you a calm, capable canvas for turning research, data, and rough ideas into infographics people can understand at a glance.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button onClick={onEnter} className="inline-flex items-center gap-2 rounded-full bg-[#235347] px-6 py-3.5 text-sm font-semibold text-[#daf1de] shadow-lg shadow-[#235347]/20 transition hover:-translate-y-0.5 hover:bg-[#163832]">
              Start creating free <ArrowRight className="h-4 w-4" />
            </button>
            <span className="text-xs text-[#235347]/70">No design degree required</span>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#235347]/15 pt-5 text-xs font-medium text-[#235347]">
            <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#d97706]" /> Autosaved projects</span>
            <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#d97706]" /> Export-ready</span>
            <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#d97706]" /> Built for iteration</span>
          </div>
        </div>

        <div className="relative min-h-[430px] lg:min-h-[540px]">
          <div className="absolute right-0 top-0 h-[76%] w-[78%] overflow-hidden rounded-[2rem] bg-[#163832] shadow-2xl shadow-[#235347]/20">
            <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1400&q=85" alt="Team collaborating around visual work" className="h-full w-full object-cover opacity-75 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-[#163832]/35" />
            <div className="absolute bottom-7 left-7 right-7 text-[#daf1de]"><p className="text-xs uppercase tracking-[0.2em] text-[#8eb69b]">From first thought</p><p className="mt-2 max-w-sm font-['Space_Grotesk'] text-2xl font-semibold leading-tight">to something your audience can carry with them.</p></div>
          </div>
          <div className="absolute bottom-0 left-0 w-[58%] border border-[#235347]/20 bg-[#daf1de] p-5 shadow-xl shadow-[#235347]/10 sm:p-6">
            <div className="mb-8 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#235347]">Your visual system</span><span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" /></div>
            <div className="flex items-end gap-2 border-b border-[#235347]/20 pb-4"><span className="h-20 w-8 bg-[#235347]" /><span className="h-28 w-8 bg-[#8eb69b]" /><span className="h-16 w-8 bg-[#d97706]" /><span className="h-24 w-8 bg-[#0b2b26]" /><span className="ml-3 text-xs text-[#235347]">Make the pattern obvious.</span></div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#235347]"><BarChart3 className="h-4 w-4" /> Data that earns attention</div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#235347]/15 bg-[#daf1de]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 sm:grid-cols-3 lg:px-10">
          <div><Layers3 className="h-5 w-5 text-[#d97706]" /><h2 className="mt-4 font-['Space_Grotesk'] text-xl font-bold">Build in layers</h2><p className="mt-2 text-sm leading-6 text-[#235347]">Compose with text, charts, shapes, images, templates, and reusable components.</p></div>
          <div><BarChart3 className="h-5 w-5 text-[#d97706]" /><h2 className="mt-4 font-['Space_Grotesk'] text-xl font-bold">Explain the signal</h2><p className="mt-2 text-sm leading-6 text-[#235347]">Edit chart data directly, guide the eye, and make the important part legible.</p></div>
          <div><Sparkles className="h-5 w-5 text-[#d97706]" /><h2 className="mt-4 font-['Space_Grotesk'] text-xl font-bold">Keep moving</h2><p className="mt-2 text-sm leading-6 text-[#235347]">Autosave locally, keep revisions, share read-only views, and export when it is ready.</p></div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-[#235347] sm:flex-row sm:items-center sm:justify-between lg:px-10"><span>InfographicStudio</span><button onClick={onEnter} className="inline-flex items-center gap-2 font-semibold hover:text-[#051f20]">Enter the studio <ArrowRight className="h-3.5 w-3.5" /></button></footer>
    </main>
  );
}
