
import React, { useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { getCountdown, getRelativeTime, getFrequencyLabel } from '../utils';

interface TaskListViewProps {
  tasks: Task[];
  onSelectTask: (id: string) => void;
  onAddClick: () => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onSelectTask, onAddClick }) => {
  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const expired = tasks.filter((t) => t.status === TaskStatus.EXPIRED).length;
    const active = tasks.length - completed;
    return { completed, expired, active };
  }, [tasks]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aCompleted = a.status === TaskStatus.COMPLETED;
      const bCompleted = b.status === TaskStatus.COMPLETED;
      const aExpired = a.status === TaskStatus.EXPIRED;
      const bExpired = b.status === TaskStatus.EXPIRED;
      
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      
      if (aExpired && !bExpired && !bCompleted) return -1;
      if (!aExpired && bExpired && !aCompleted) return 1;
      
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [tasks]);

  return (
    <div className="relative flex flex-col flex-1 pb-20 animate-in">
      {/* 装饰性背景 */}
      <div className="absolute top-0 left-0 right-0 h-48 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/20 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-10 left-1/4 w-4 h-4 bg-purple-400/20 rounded-full"></div>
        <div className="absolute top-20 right-1/3 w-3 h-3 bg-pink-400/15 rounded-full"></div>
      </div>
      
      <header className="relative px-6 pt-12 pb-6 border-b border-zinc-50/50 dark:border-zinc-800/50">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight dark:text-white leading-none">
              <span className="text-gradient">随口记</span>
            </h1>
            <p className="text-zinc-400 text-xs font-medium mt-2">把计划变成压力，把压力变成行动</p>
          </div>
          <button 
            onClick={onAddClick}
            className="relative w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative material-icons-round text-2xl text-white dark:text-black">add</span>
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="relative rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">进行中</p>
            <p className="text-lg font-black dark:text-white relative">{stats.active}</p>
          </div>
          <div className="relative rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">已完成</p>
            <p className="text-lg font-black dark:text-white relative">{stats.completed}</p>
          </div>
          <div className="relative rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">已过期</p>
            <p className={`text-lg font-black ${stats.expired > 0 ? 'text-red-500' : 'dark:text-white'} relative`}>{stats.expired}</p>
          </div>
        </div>
      </header>
      <main className="relative px-6 py-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="py-20 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-5xl text-zinc-300 dark:text-zinc-600">assignment</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-2">还没有任务</p>
            <p className="text-xs text-zinc-300 dark:text-zinc-600">点击右上角 + 创建你的第一个任务</p>
          </div>
        ) : (
          sortedTasks.map((task: Task) => (
            <div 
              key={task.id} 
              onClick={() => onSelectTask(task.id)} 
              className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group overflow-hidden"
            >
              {/* 悬停效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex-1 min-w-0 pr-4 relative">
                <div className="flex items-center gap-2 mb-1">
                  {task.status === TaskStatus.COMPLETED && (
                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                  )}
                  {task.status === TaskStatus.EXPIRED && (
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                  )}
                  {task.frequency && task.frequency !== 'ONCE' && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-medium rounded">
                      {getFrequencyLabel(task.frequency)}
                    </span>
                  )}
                  <h3 className={`text-base font-medium truncate ${task.status === TaskStatus.EXPIRED ? 'text-red-500 dark:text-red-400' : 'dark:text-white'}`}>{task.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  {task.status === TaskStatus.EXPIRED ? (
                    <span className="text-red-500">已过期</span>
                  ) : task.deadline && task.deadline !== '' ? (
                    <>
                      <span>截止 {task.deadline}</span>
                      <span>·</span>
                      <span className="text-orange-500 font-medium">{getCountdown(task.deadline)}</span>
                    </>
                  ) : (
                    <span>未设置截止时间</span>
                  )}
                  {task.createdAt && (
                    <>
                      <span>·</span>
                      <span>{getRelativeTime(task.createdAt)}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="relative material-icons-round text-zinc-300 group-hover:text-zinc-500 transition-colors">chevron_right</span>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default TaskListView;
