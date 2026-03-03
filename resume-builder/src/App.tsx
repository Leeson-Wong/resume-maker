import { useState, useEffect } from 'react';
import { Resume } from './components/Resume';
import { ResumeEditor } from './components/ResumeEditor';
import { Toolbar } from './components/Toolbar';
import type { ResumeData, ThemeType } from './types/resume';
import resumeData from './data/resume.json';

const STORAGE_KEY = 'resume-data';

function App() {
  const [theme, setTheme] = useState<ThemeType>('modern');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [data, setData] = useState<ResumeData>(() => {
    // 尝试从 localStorage 恢复数据
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return resumeData as ResumeData;
      }
    }
    return resumeData as ResumeData;
  });

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Toolbar
        theme={theme}
        onThemeChange={setTheme}
        mode={mode}
        onModeChange={setMode}
      />
      <div className="pt-16 pb-8">
        {mode === 'edit' ? (
          <ResumeEditor data={data} onChange={setData} />
        ) : (
          <Resume data={data} theme={theme} />
        )}
      </div>
      {mode === 'edit' && (
        <div className="fixed bottom-4 right-4 no-print">
          <button
            onClick={() => setMode('preview')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            预览简历
          </button>
        </div>
      )}
      {mode === 'preview' && (
        <div className="fixed bottom-4 right-4 no-print">
          <button
            onClick={() => setMode('edit')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            继续编辑
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
