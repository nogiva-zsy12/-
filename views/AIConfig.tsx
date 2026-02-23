
import React, { useEffect, useState } from 'react';

interface AIConfigProps {
  onBack: () => void;
}

interface ModelOption {
  value: string;
  label: string;
  description: string;
  provider: string;
}

const DEFAULT_MODELS: ModelOption[] = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: '快速响应，适合日常毒舌任务', provider: 'gemini' },
  { value: 'gemini-3-pro', label: 'Gemini 3 Pro', description: '高攻速模式，更精准的嘲讽', provider: 'gemini' },
  { value: 'deepseek-r1', label: 'DeepSeek R1', description: '深度推理，逻辑更严密', provider: 'deepseek' },
  { value: 'kimi-moonshot-8k', label: 'Kimi Moonshot 8K', description: '月之暗面Kimi，长文本处理能力强', provider: 'kimi' },
  { value: 'kimi-moonshot-32k', label: 'Kimi Moonshot 32K', description: '超长上下文，更适合复杂任务分析', provider: 'kimi' },
  { value: 'minimax-abab5.5', label: 'Minimax abab5.5', description: 'MiniMax AI，平衡性能与成本', provider: 'minimax' },
  { value: 'minimax-abab6.5', label: 'Minimax abab6.5s', description: '最新版本，更强的推理能力', provider: 'minimax' },
  { value: 'qwen-plus', label: '通义千问 Qwen-Plus', description: '阿里云通义千问，性价比高', provider: 'qwen' },
  { value: 'qwen-turbo', label: '通义千问 Qwen-Turbo', description: '快速响应，适合高频调用', provider: 'qwen' },
  { value: 'qwen-max', label: '通义千问 Qwen-Max', description: '最强版本，最精准的毒舌', provider: 'qwen' },
];

const getUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("toxicplan_user_id");
  } catch {
    return null;
  }
};

const AIConfigView: React.FC<AIConfigProps> = ({ onBack }) => {
  const [modelKey, setModelKey] = useState<string>("deepseek-chat");
  const [models, setModels] = useState<ModelOption[]>(DEFAULT_MODELS);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [hasBackendKey, setHasBackendKey] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const configRes = await fetch("/api/ai-config");
        if (configRes.ok) {
          const configData = await configRes.json();
          setModelKey(configData.modelKey || "deepseek-chat");
          setHasBackendKey(configData.hasBackendKey || false);
          setConfigured(configData.configured || false);
        }

        const modelsRes = await fetch("/api/ai-models");
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          if (Array.isArray(modelsData.models) && modelsData.models.length > 0) {
            const values = modelsData.models
              .map((m: any) => {
                if (!m) return null;
                if (typeof m === "string") return m;
                if (typeof m.key === "string") return m.key;
                if (typeof m.value === "string") return m.value;
                return null;
              })
              .filter((v: string | null): v is string => !!v);

            const merged = DEFAULT_MODELS.filter((m) => values.includes(m.value));
            if (merged.length > 0) {
              setModels(merged);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const userId = getUserId();
      const response = await fetch("/api/ai-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({ modelKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        setStatus({ type: 'error', message: data.error || '保存失败' });
        return;
      }

      setStatus({ type: 'success', message: '模型选择已保存' });
    } catch {
      setStatus({ type: 'error', message: '保存失败，请稍后重试' });
    } finally {
      setSaving(false);
    }
  };

  const selectedModel = models.find(m => m.value === modelKey);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 animate-in slide-in-from-right duration-500 p-8">
      <header className="flex justify-between items-center mb-12">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-start text-zinc-400">
          <span className="material-icons-round">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-black dark:text-white">AI 实验室</h1>
        <div className="w-10"></div>
      </header>

      <main className="space-y-8">
        <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium">
            选择毒舌教练的智商来源。API Key已配置在后端，此处只需选择模型。
            {hasBackendKey && <span className="text-green-500 ml-1">后端已配置</span>}
            {!hasBackendKey && <span className="text-stageRed ml-1">请在.env.local配置API Key</span>}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-30 dark:text-white">教练引擎 (Model)</label>
            <select
              value={modelKey}
              onChange={(e) => {
                setModelKey(e.target.value);
                setStatus(null);
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl py-4 px-6 font-bold dark:text-white focus:ring-2 focus:ring-black"
            >
              {models.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {selectedModel && (
              <p className="text-[10px] text-zinc-400 mt-2 px-2">
                {selectedModel.description}
              </p>
            )}
          </div>
        </div>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 dark:text-white mb-3">当前配置状态</h3>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">模型</span>
              <span className="font-bold dark:text-white">{selectedModel?.label || modelKey}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">API Key</span>
              <span className={`font-bold ${hasBackendKey ? 'text-green-500' : 'text-stageRed'}`}>
                {hasBackendKey ? '后端已配置' : '未配置'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">状态</span>
              <span className={`font-bold ${configured ? 'text-green-500' : 'text-stageRed'}`}>
                {configured ? '可用' : '不可用'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
          >
            {saving ? "保存中..." : "保存配置"}
          </button>
          {status && (
            <p className={`text-[11px] text-center font-bold leading-relaxed ${
              status.type === 'success' ? 'text-green-500' : 
              status.type === 'error' ? 'text-stageRed' : 
              'text-zinc-500'
            }`}>
              {status.message}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AIConfigView;
