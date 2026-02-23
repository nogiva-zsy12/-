
import React from 'react';

interface SettingsProps {
  user: { nickname: string; email: string };
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onNav: (view: string, taskId?: string) => void;
}

const SettingItem: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
  desc?: string;
  showArrow?: boolean;
}> = ({ icon, label, onClick, desc, showArrow = true }) => (
  <button 
    onClick={onClick} 
    className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
  >
    <div className="flex items-center gap-3">
      <span className="material-icons-round text-lg text-zinc-400">{icon}</span>
      <div className="text-left">
        <span className="text-sm font-medium dark:text-white block">{label}</span>
        {desc && <span className="text-xs text-zinc-400">{desc}</span>}
      </div>
    </div>
    {showArrow && <span className="material-icons-round text-zinc-300">chevron_right</span>}
  </button>
);

const Settings: React.FC<SettingsProps> = ({ user, isDarkMode, onToggleTheme, onNav }) => {
  return (
    <div className="flex flex-col flex-1 pb-20 animate-in">
      <header className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold dark:text-white">我的</h1>
      </header>
      
      <main className="px-6 space-y-6">
        <div 
          onClick={() => onNav('PROFILE_EDIT')} 
          className="bg-zinc-100 dark:bg-zinc-900 p-5 rounded-2xl flex items-center justify-between cursor-pointer"
        >
          <div>
            <h2 className="text-xl font-bold dark:text-white">{user.nickname}</h2>
            <p className="text-xs text-zinc-400 mt-1">{user.email}</p>
          </div>
          <span className="material-icons-round text-zinc-400">edit</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
          <SettingItem 
            icon="person" 
            label="个人资料" 
            onClick={() => onNav('PROFILE_EDIT')}
          />
          <SettingItem 
            icon="lock" 
            label="账号安全" 
            onClick={() => alert('该功能即将上线')}
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
          <SettingItem 
            icon="psychology" 
            label="AI 模型配置" 
            onClick={() => onNav('AI_CONFIG')}
            desc="选择AI教练引擎"
          />
          <SettingItem 
            icon="tune" 
            label="模型参数" 
            onClick={() => alert('该功能即将上线')}
            desc="Temperature、TopP等"
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-icons-round text-lg text-zinc-400">dark_mode</span>
              <span className="text-sm font-medium dark:text-white">深色模式</span>
            </div>
            <button 
              onClick={onToggleTheme} 
              className={`w-11 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-500' : 'bg-zinc-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isDarkMode ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <button 
          onClick={() => onNav('LOGIN')} 
          className="w-full py-4 text-red-500 font-medium text-sm"
        >
          退出登录
        </button>
      </main>
    </div>
  );
};

export default Settings;
