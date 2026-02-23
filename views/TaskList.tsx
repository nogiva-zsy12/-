
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
    <div className="flex flex-col flex-1 pb-20 animate-in">
      <header className="px-6 pt-12 pb-6 border-b border-zinc-50 dark:border-zinc-800">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight dark:text-white leading-none">Toxic Plan</h1>
            <p className="text-zinc-400 text-xs font-medium mt-2">把计划变成压力，把压力变成行动</p>
          </div>
          <button 
            onClick={onAddClick}
            className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <span className="material-icons-round text-2xl">add</span>
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Poison</p>
            <p className="text-lg font-black dark:text-white">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Detox</p>
            <p className="text-lg font-black dark:text-white">{stats.completed}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Overdue</p>
            <p className={`text-lg font-black ${stats.expired > 0 ? 'text-red-500' : 'dark:text-white'}`}>{stats.expired}</p>
          </div>
        </div>
      </header>
      <main className="px-6 py-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-icons-round text-5xl text-zinc-200 dark:text-zinc-700">assignment</span>
            <p className="text-sm text-zinc-400 mt-4">暂无任务，点击 + 添加</p>
          </div>
        ) : (
          sortedTasks.map((task: Task) => (
            <div 
              key={task.id} 
              onClick={() => onSelectTask(task.id)} 
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  {task.status === TaskStatus.COMPLETED && (
                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                  )}
                  {task.status === TaskStatus.EXPIRED && (
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                  )}
                  {task.frequency && task.frequency !== 'ONCE' && (
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-medium rounded">
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
                      <span className="text-orange-500">{getCountdown(task.deadline)}</span>
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
              <span className="material-icons-round text-zinc-300">chevron_right</span>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default TaskListView;
