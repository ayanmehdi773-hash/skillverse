import React, { useState } from 'react';

export default function App() {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [result, setResult] = useState(null);

  const projects = [
    {
      level: "beginner",
      title: "Micro-SaaS Pricing Calculator",
      desc: "A client-side interactive widget allowing users to calculate SaaS pricing tiers based on active users and feature toggles.",
      stack: ["HTML5", "Tailwind CSS", "JavaScript (ES6)"],
      features: ["Dynamic slider controls", "Monthly/Yearly discount toggle", "Export summary as JSON"]
    },
    {
      level: "intermediate",
      title: "Developer Portfolio CMS & Showcase",
      desc: "A minimal, lightning-fast public showcase platform where developers can pin live project cards and tech tags.",
      stack: ["React / Next.js", "Tailwind CSS", "LocalStorage"],
      features: ["Live preview iframe modal", "Tag-based filtering system", "One-click shareable profile link"]
    },
    {
      level: "advanced",
      title: "Browser-Based OS Workstation Widget",
      desc: "A distraction-free web environment featuring draggable utility windows (Markdown editor, Timer, Todo checklist).",
      stack: ["TypeScript", "React", "Zustand", "Tailwind CSS"],
      features: ["Window drag & resize system", "Persistent local state storage", "Dark / Cyberpunk theme switcher"]
    },
    {
      level: "beginner",
      title: "AI Prompt Template Builder",
      desc: "A structured form generator that converts user inputs into optimized system prompts for ChatGPT / Claude.",
      stack: ["HTML", "CSS", "JavaScript"],
      features: ["Role & goal input fields", "One-click copy formatted prompt", "Saved prompt history list"]
    },
    {
      level: "intermediate",
      title: "Real-time Code Snippet Sharing Tool",
      desc: "A fast web utility to paste code, select syntax highlighting, and generate a short shareable clean view.",
      stack: ["React", "Prism.js", "LocalStorage"],
      features: ["Syntax theme customization", "Copy-to-clipboard raw code", "Read-only preview link"]
    }
  ];

  const generateIdea = () => {
    let filtered = projects;
    if (selectedLevel !== 'all') {
      filtered = projects.filter(p => p.level === selectedLevel);
    }
    const randomProject = filtered[Math.floor(Math.random() * filtered.length)];
    setResult(randomProject);
  };

  const copyProjectDetails = () => {
    if (!result) return;
    const text = `Project: ${result.title}\n\nDescription: ${result.desc}\n\nGenerated via Skillverse Free Tools.`;
    navigator.clipboard.writeText(text);
    alert('Project details copied to clipboard!');
  };

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '100%', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#38bdf8', marginBottom: '8px', textAlign: 'center' }}>🚀 Dev Project Idea Generator</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', textAlign: 'center', marginBottom: '24px' }}>Stop watching tutorials. Select a level and build something real today.</p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <select 
            value={selectedLevel} 
            onChange={(e) => setSelectedLevel(e.target.value)}
            style={{ flex: 1, padding: '10px', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', borderRadius: '8px', fontSize: '0.9rem' }}
          >
            <option value="all">Any Difficulty Level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <button 
          onClick={generateIdea}
          style={{ width: '100%', padding: '12px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
        >
          Generate Project Idea
        </button>

        {result && (
          <div style={{ marginTop: '24px', padding: '20px', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '1.3rem', color: '#facc15', marginBottom: '8px', fontWeight: '600' }}>{result.title}</div>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '16px', lineHeight: '1.5' }}>{result.desc}</p>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>RECOMMENDED TECH STACK:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {result.stack.map((tech, idx) => (
                <span key={idx} style={{ background: '#1e293b', color: '#38bdf8', border: '1px solid #0284c7', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '500' }}>
                  {tech}
                </span>
              ))}
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>KEY FEATURES TO BUILD:</div>
            <ul style={{ marginLeft: '20px', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
              {result.features.map((feat, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{feat}</li>
              ))}
            </ul>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={copyProjectDetails}
                style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #475569', color: '#f8fafc', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                📋 Copy Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
