
import React, { useState } from 'react';

const API_BASE = "https://sui-kou-ji.onrender.com";

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
    <div className="relative flex flex-col flex-1 bg-white dark:bg-zinc-950 p-6 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        {/* 装饰性圆点 */}
        <div className="absolute top-1/4 right-8 w-2 h-2 bg-purple-400/30 rounded-full"></div>
        <div className="absolute top-1/3 left-4 w-3 h-3 bg-pink-400/20 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-cyan-400/20 rounded-full"></div>
      </div>
      
      <div className="relative flex-1 flex flex-col justify-center">
        <div className="space-y-3 mb-12">
          {/* Logo 区域 */}
          <div className="relative inline-flex">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="material-icons-round text-white text-3xl">edit</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-black tracking-tight dark:text-white mt-6">
            随口记
          </h1>
          <p className="text-sm text-zinc-400">让毒舌教练督促你完成任务</p>
        </div>

        <div className="space-y-5">
          {error && (
            <div className="relative px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl text-red-600 dark:text-red-400 text-sm">
              <span className="material-icons-round text-sm mr-1">error_outline</span>
              {error}
            </div>
          )}
          
          <div className="relative">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">账号</label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-zinc-400 text-lg">person</span>
              <input 
                type="text" 
                placeholder="请输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium dark:text-white text-sm transition-all"
              />
            </div>
          </div>
          
          <div className="relative">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">密码</label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-zinc-400 text-lg">lock</span>
              <input 
                type="password" 
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium dark:text-white text-sm transition-all"
              />
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleLogin}
            disabled={loading || !username.trim() || !password.trim()}
            className="relative w-full py-4 bg-black dark:bg-white rounded-2xl font-bold text-sm mt-4 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group"
          >
            {/* 按钮渐变背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative flex items-center gap-2">
              {loading ? (
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></span>
                </div>
              ) : (
                <>
                  <span>开始使用</span>
                  <span className="material-icons-round text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      <div className="relative mt-auto pb-4 text-center">
        <p className="text-[10px] text-zinc-300 dark:text-zinc-700">
          登录即表示同意服务条款
        </p>
      </div>
    </div>
  );
};

export default Login;
