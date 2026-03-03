import type { ThemeType } from '../types/resume';
import { themes } from '../themes';

interface ToolbarProps {
  theme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  mode: 'edit' | 'preview';
  onModeChange: (mode: 'edit' | 'preview') => void;
}

export function Toolbar({ theme, onThemeChange, mode, onModeChange }: ToolbarProps) {
  const printResume = () => {
    window.print();
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
