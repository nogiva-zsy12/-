
import React, { useState } from 'react';

interface ProfileEditProps {
  user: { nickname: string, email: string };
  onBack: () => void;
  onSave: (nickname: string) => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ user, onBack, onSave }) => {
  const [nickname, setNickname] = useState(user.nickname);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 animate-in slide-in-from-bottom duration-300 p-6">
      <header className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-start text-zinc-400">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold dark:text-white">编辑资料</h1>
        <div className="w-10"></div>
      </header>

      <main className="space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 relative overflow-hidden group cursor-pointer">
            <span className="material-icons-round text-4xl text-zinc-300">person</span>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs text-white font-medium">更换</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400">点击更换头像</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider">昵称</label>
            <input 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full mt-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 font-medium dark:text-white"
            />
          </div>
          
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider">邮箱</label>
            <input 
              value={user.email}
              disabled
              className="w-full mt-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl border-none font-medium text-zinc-400 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-400 mt-2">邮箱不可修改</p>
          </div>
        </div>

        <button 
          onClick={() => onSave(nickname)}
          disabled={!nickname.trim()}
          className="w-full py-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-4"
        >
          保存修改
        </button>
      </main>
    </div>
  );
};

export default ProfileEdit;
