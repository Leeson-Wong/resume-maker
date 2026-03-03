import { useRef } from 'react';
import type { ThemeType, ResumeData } from '../types/resume';
import { themes } from '../themes';

interface ToolbarProps {
  theme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  mode: 'edit' | 'preview';
  onModeChange: (mode: 'edit' | 'preview') => void;
  onExport: () => void;
  onImport: (data: ResumeData) => void;
}

export function Toolbar({ theme, onThemeChange, mode, onModeChange, onExport, onImport }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const printResume = () => {
    window.print();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          onImport(importedData);
          alert('导入成功！');
        } catch {
          alert('导入失败，请确保文件格式正确');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="no-print fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold text-gray-800">简历生成器</h1>

        <div className="flex items-center gap-4">
          {/* 模式切换 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onModeChange('edit')}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                mode === 'edit'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              编辑
            </button>
            <button
              onClick={() => onModeChange('preview')}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                mode === 'preview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              预览
            </button>
          </div>

          {/* 导入/导出按钮 - 仅编辑模式显示 */}
          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-all flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                导入
              </button>
              <button
                onClick={onExport}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-all flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出
              </button>
            </div>
          )}

          {/* 主题选择 - 仅预览模式显示 */}
          {mode === 'preview' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">主题:</span>
              <div className="flex gap-1">
                {Object.values(themes).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange(t.id)}
                    className={`px-3 py-1.5 rounded text-sm transition-all ${
                      theme === t.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 打印/导出按钮 - 仅预览模式显示 */}
          {mode === 'preview' && (
            <button
              onClick={printResume}
              className="px-4 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              打印 / 导出 PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
