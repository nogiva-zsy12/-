
import React, { useState } from 'react';

const API_BASE = "https://harmonious-nature-production-ed16.up.railway.app";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("请输入账号和密码");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/login-or-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "登录失败");
        setLoading(false);
        return;
      }

      if (data.userId) {
        localStorage.setItem("toxicplan_user_id", data.userId);
      }

      setLoading(false);
      onLogin();
    } catch (e) {
      setError("网络错误，请检查服务器是否启动");
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-2 mb-10">
          <h1 className="text-4xl font-black tracking-tight dark:text-white">
            随口记
          </h1>
          <p className="text-sm text-zinc-400">让毒舌教练督促你完成任务</p>
        </div>

        <div className="space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">账号</label>
            <input 
              type="text" 
              placeholder="请输入账号"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full mt-2 px-4 py-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border-none focus:ring-2 focus:ring-black dark:focus:ring-white font-medium dark:text-white text-sm"
            />
          </div>
          
          <div>
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">密码</label>
            <input 
              type="password" 
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full mt-2 px-4 py-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border-none focus:ring-2 focus:ring-black dark:focus:ring-white font-medium dark:text-white text-sm"
            />
          </div>
          
          <button 
            type="button"
            onClick={handleLogin}
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm mt-4 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-200"></span>
              </div>
            ) : (
              <>
                <span>登录</span>
                <span className="material-icons-round text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-auto pb-4 text-center">
        <p className="text-[10px] text-zinc-300 dark:text-zinc-700">
          登录即表示同意服务条款
        </p>
      </div>
    </div>
  );
};

export default Login;
