
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Frequency } from '../types';

interface CreateProps {
  onBack: () => void;
  onAdd: (task: Task) => void;
}

const Create: React.FC<CreateProps> = ({ onBack, onAdd }) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('ONCE');

  useEffect(() => {
    if (deadline && startTime && deadline < startTime) {
      setDeadline(startTime);
    }
  }, [startTime]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      description: frequency === 'ONCE' ? '一次性任务' : `重复任务: ${frequency === 'DAILY' ? '每天' : '每周'}`,
      status: TaskStatus.IN_PROGRESS,
      deadline: deadline,
      startTime: startTime || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      estimatedTime: '待评估',
      progress: 0,
      toxicRecords: [],
      frequency: frequency
    };
    onAdd(newTask);
  };

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 animate-in slide-in-bottom">
      <header className="px-6 pt-12 pb-4 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-start text-zinc-400">
          <span className="material-icons-round">close</span>
        </button>
        <h1 className="text-lg font-bold dark:text-white">新建任务</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-8 py-8 space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">任务名称</label>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-none border-b-2 border-zinc-100 dark:border-zinc-800 focus:border-black dark:focus:border-white text-2xl font-medium py-3 px-0 placeholder:text-zinc-200 dark:text-white transition-all"
            placeholder="请输入任务名称"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">重复频率</label>
          <div className="flex gap-3">
            {(['ONCE', 'DAILY', 'WEEKLY'] as Frequency[]).map(f => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
                  frequency === f 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400'
                }`}
              >
                {f === 'ONCE' ? '仅一次' : f === 'DAILY' ? '每天' : '每周'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">开始时间</label>
            <input 
              type="time" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl font-medium dark:text-white border-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">截止时间</label>
            <input 
              type="time" 
              value={deadline}
              min={startTime}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl font-medium dark:text-white border-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {frequency === 'DAILY' 
              ? "此任务将每日重复，帮助你养成习惯。" 
              : "设置截止时间可以帮助你更好地规划时间。"}
          </p>
        </div>
      </main>

      <footer className="p-8 pt-4">
        <button 
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-medium text-base shadow-lg active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          创建任务
        </button>
      </footer>
    </div>
  );
};

export default Create;
