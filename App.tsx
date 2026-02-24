
import React, { useState, useEffect, useCallback } from "react";
import { View, Task, TaskStatus, Message, ChatMessage } from "./types";
import ChatView from "./views/Chat";
import MessagesView from "./views/Messages";
import TaskListView from "./views/TaskList";
import Settings from "./views/Settings";
import Login from "./views/Login";
import Detail from "./views/Detail";
import ProfileEdit from "./views/ProfileEdit";
import AIConfigView from "./views/AIConfig";
import Create from "./views/Create";

const API_BASE = "https://sui-kou-ji.onrender.com";

const getUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("toxicplan_user_id");
  } catch {
    return null;
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('LOGIN');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{ id: '1', role: 'ai', content: '说说你的计划，我来帮你创建任务。', time: '现在' }]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [remindedTasks, setRemindedTasks] = useState<Record<string, number[]>>({});
  const [user, setUser] = useState({ nickname: '用户', email: 'user@example.com' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userId = getUserId();
        const headers = userId ? { "x-user-id": userId } : {};

        const [tasksRes, messagesRes] = await Promise.all([
          fetch(`${API_BASE}/api/tasks`, { headers }),
          fetch(`${API_BASE}/api/messages`, { headers }),
        ]);

        if (tasksRes.ok) {
          const tasksJson = await tasksRes.json();
          setTasks(tasksJson.tasks || []);
        }

        if (messagesRes.ok) {
          const messagesJson = await messagesRes.json();
          const msgs = messagesJson.messages || [];
          setMessages(msgs);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const unread = messages.filter((m: Message) => !m.isRead).length;
    setUnreadCount(unread);
  }, [messages]);

  useEffect(() => {
    const checkDeadlines = async () => {
      const now = new Date();
      const userId = getUserId();
      if (!userId) return;

      for (const task of tasks) {
        if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.EXPIRED || !task.deadline) continue;

        const deadlineDate = new Date(task.deadline);
        if (isNaN(deadlineDate.getTime())) continue;

        const diffMs = deadlineDate.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        const remindedMinutes = remindedTasks[task.id] || [];
        const minutesToRemind: number[] = [];

        if (diffMinutes <= 0) {
          if (!remindedMinutes.includes(-1)) {
            minutesToRemind.push(-1);
          }
        } else {
          if (diffMinutes > 50 && diffMinutes <= 60 && !remindedMinutes.includes(60)) {
            minutesToRemind.push(60);
          }
          if (diffMinutes > 20 && diffMinutes <= 30 && !remindedMinutes.includes(30)) {
            minutesToRemind.push(30);
          }
          if (diffMinutes > 0 && diffMinutes <= 10 && !remindedMinutes.includes(10)) {
            minutesToRemind.push(10);
          }
        }

        if (minutesToRemind.length > 0) {
          for (const mins of minutesToRemind) {
            let content = '';
            let title = '';
            let type = 'WARNING';

            if (mins === -1) {
              title = '任务已过期';
              content = `任务"${task.title}"已经过期了！你又要拖延了吗？`;
              type = 'WARNING';

              await fetch(`${API_BASE}/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-id": userId,
                },
                body: JSON.stringify({ status: TaskStatus.EXPIRED }),
              });

              setTasks((prev) => prev.map((t) => 
                t.id === task.id ? { ...t, status: TaskStatus.EXPIRED } : t
              ));
            } else {
              title = '截止提醒';
              content = `任务"${task.title}"还有${mins}分钟就要截止了！别告诉我你又忘了！`;
            }

            await fetch(`${API_BASE}/api/messages`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-id": userId,
              },
              body: JSON.stringify({
                title,
                content,
                type,
              }),
            });

            const msgId = Date.now().toString() + Math.random();
            const newMessage: Message = {
              id: msgId,
              time: "刚刚",
              title,
              content,
              isRead: false,
              type: type as any,
            };
            setMessages((prev) => [newMessage, ...prev]);
          }

          setRemindedTasks((prev) => ({
            ...prev,
            [task.id]: [...(prev[task.id] || []), ...minutesToRemind],
          }));
        }
      }
    };

    const interval = setInterval(checkDeadlines, 60000);
    checkDeadlines();

    return () => clearInterval(interval);
  }, [tasks, remindedTasks]);

  const sendSystemMessage = async (title: string, content: string, type: string = "SYSTEM") => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ title, content, type }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          setMessages((prev) => [data.message, ...prev]);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const navigateTo = useCallback((view: View, taskId?: string) => {
    setCurrentView(view);
    if (taskId) setSelectedTaskId(taskId);
    window.scrollTo(0, 0);
  }, []);

  const handleAddTask = async (newTask: Task, shouldNavigate: boolean = true): Promise<string | null> => {
    try {
      const payload = {
        title: newTask.title,
        description: newTask.description,
        deadline: newTask.deadline,
        startTime: newTask.startTime,
        estimatedTime: newTask.estimatedTime,
        frequency: newTask.frequency,
      };

      const userId = getUserId();
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const created = await response.json();
      const createdTask: Task = created.task;

      setTasks((prev) => [createdTask, ...prev]);

      if (newTask.deadline) {
        const frequencyText = newTask.frequency === 'DAILY' ? '每天重复' : newTask.frequency === 'WEEKLY' ? '每周重复' : '';
        const deadlineText = newTask.deadline || '未设置截止时间';
        const content = `任务"${newTask.title}"已创建，截止时间${deadlineText}。${frequencyText}赶紧完成吧，别又拖延！`;
        await sendSystemMessage('任务已创建', content, 'SYSTEM');
        
        setRemindedTasks((prev) => ({
          ...prev,
          [createdTask.id]: [],
        }));
      }
      
      if (shouldNavigate) {
        navigateTo("TASK_LIST");
      }
      
      return createdTask.id;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleUpdateTask = async (taskId: string, updates: { deadline?: string; frequency?: string }) => {
    try {
      const userId = getUserId();
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updated = await response.json();
      const updatedTask: Task = updated.task;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (error) {
      console.error(error);
    }
  };

  const [pendingTaskDraft, setPendingTaskDraft] = useState<Partial<Task> | null>(null);

  const handleNewTaskFromAI = async (taskData: any, needMore: boolean) => {
    if (!taskData) return;

    if (needMore) {
      if (pendingTaskDraft) {
        setPendingTaskDraft(prev => ({
          ...prev,
          ...taskData,
          // 如果新数据里没有 title 且旧 draft 里有 title，保留旧的
          // 如果新数据里有 title，覆盖旧的
          title: taskData.title || prev?.title,
          deadline: taskData.deadline || prev?.deadline,
          frequency: taskData.frequency || prev?.frequency,
          estimatedTime: taskData.estimatedTime || prev?.estimatedTime
        }));
      } else {
        setPendingTaskDraft({
          title: taskData.title,
          deadline: taskData.deadline,
          frequency: taskData.frequency || "ONCE",
          estimatedTime: taskData.estimatedTime || "1小时"
        });
      }
    } else {
      // 最终提交：合并 draft 和当前的新数据
      const finalTitle = taskData.title || pendingTaskDraft?.title || "新任务";
      const finalDeadline = taskData.deadline || pendingTaskDraft?.deadline || "";
      const finalFrequency = taskData.frequency || pendingTaskDraft?.frequency || "ONCE";
      
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 5),
        title: finalTitle,
        description: "",
        status: TaskStatus.IN_PROGRESS,
        deadline: finalDeadline,
        startTime: new Date().toLocaleTimeString(),
        estimatedTime: taskData.estimatedTime || pendingTaskDraft?.estimatedTime || "1小时",
        progress: 0,
        toxicRecords: [],
        frequency: finalFrequency,
      };

      await handleAddTask(newTask, true);
      setPendingTaskDraft(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const userId = getUserId();
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({
          status: TaskStatus.COMPLETED,
          progress: 100,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updated = await response.json();
      const updatedTask: Task = updated.task;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      
      if (task) {
        await sendSystemMessage('任务已完成', `恭喜你完成了"${task.title}"！终于太阳打西边出来了。继续加油吧！`, 'SYSTEM');
      }
      
      navigateTo("TASK_LIST");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const userId = getUserId();
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          ...(userId ? { "x-user-id": userId } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      navigateTo("TASK_LIST");
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkMessagesRead = () => {
    setUnreadCount(0);
    setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const userId = getUserId();
      const response = await fetch(`${API_BASE}/api/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          ...(userId ? { "x-user-id": userId } : {}),
        },
      });

      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case "LOGIN":
        return <Login onLogin={() => navigateTo("CHAT")} />;
      case "CHAT": {
        const pendingTask = pendingTaskDraft ? {
          ...pendingTaskDraft,
          id: 'draft',
          description: '',
          status: TaskStatus.IN_PROGRESS,
          startTime: '',
          progress: 0,
          toxicRecords: [],
          deadline: pendingTaskDraft.deadline || '',
          frequency: pendingTaskDraft.frequency || 'ONCE',
          title: pendingTaskDraft.title || '新任务',
          estimatedTime: pendingTaskDraft.estimatedTime || '1小时'
        } as Task : null;
        
        return (
          <ChatView
            history={chatHistory}
            onSendMessage={(msg) => setChatHistory((p) => [...p, msg])}
            onTaskCreated={handleNewTaskFromAI}
            pendingTask={pendingTask}
          />
        );
      }
      case "MESSAGES":
        return <MessagesView messages={messages} onMarkRead={handleMarkMessagesRead} onDelete={handleDeleteMessage} />;
      case "TASK_LIST":
        return (
          <TaskListView
            tasks={tasks}
            onSelectTask={(id) => navigateTo("DETAIL", id)}
            onAddClick={() => navigateTo("CREATE_TASK")}
          />
        );
      case "CREATE_TASK":
        return <Create onBack={() => navigateTo("TASK_LIST")} onAdd={handleAddTask} />;
      case "DETAIL": {
        const currentTask = tasks.find((t) => t.id === selectedTaskId);
        if (!currentTask) return null;
        return (
          <Detail
            task={currentTask}
            onBack={() => navigateTo("TASK_LIST")}
            onComplete={() => handleCompleteTask(currentTask.id)}
            onDelete={() => handleDeleteTask(currentTask.id)}
          />
        );
      }
      case "SETTINGS":
        return (
          <Settings
            user={user}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            onNav={navigateTo}
          />
        );
      case "PROFILE_EDIT":
        return (
          <ProfileEdit
            user={user}
            onBack={() => navigateTo("SETTINGS")}
            onSave={(n) => {
              setUser({ ...user, nickname: n });
              navigateTo("SETTINGS");
            }}
          />
        );
      case "AI_CONFIG":
        return <AIConfigView onBack={() => navigateTo("SETTINGS")} />;
      default:
        return null;
    }
  };

  const showNav = !["LOGIN", "DETAIL", "PROFILE_EDIT", "AI_CONFIG", "CREATE_TASK"].includes(currentView);

  return (
    <div className="min-h-screen flex justify-center bg-zinc-100 dark:bg-zinc-900 transition-colors duration-300">
      <div className="w-full max-w-[430px] bg-white dark:bg-zinc-950 min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
        {renderView()}
        {showNav && (
          <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 flex justify-around items-center px-6 pb-4 z-50 max-w-[430px] mx-auto">
            <NavItem 
              active={currentView === "CHAT"} 
              icon="add_circle" 
              label="创建" 
              onClick={() => navigateTo("CHAT")} 
            />
            <NavItem 
              active={currentView === "MESSAGES"} 
              icon="notifications" 
              label="消息" 
              badge={unreadCount}
              onClick={() => navigateTo("MESSAGES")} 
            />
            <NavItem 
              active={currentView === "TASK_LIST"} 
              icon="checklist" 
              label="任务" 
              onClick={() => navigateTo("TASK_LIST")} 
            />
            <NavItem 
              active={currentView === "SETTINGS"} 
              icon="person" 
              label="我的" 
              onClick={() => navigateTo("SETTINGS")} 
            />
          </nav>
        )}
      </div>
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  icon: string;
  label: string;
  badge?: number;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ active, icon, label, badge, onClick }) => (
  <button 
    onClick={onClick} 
    className={`relative flex flex-col items-center gap-1 transition-all ${active ? "opacity-100 scale-110" : "opacity-40 hover:opacity-60"}`}
  >
    <span className={`material-icons-round text-2xl ${active ? "text-black dark:text-white" : "text-zinc-500"}`}>
      {icon}
    </span>
    <span className="text-[9px] font-medium dark:text-white">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

export default App;
