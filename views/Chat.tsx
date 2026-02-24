
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Task } from '../types';
import { processUserIntent } from '../services/geminiService';

const API_BASE = "https://harmonious-nature-production-ed16.up.railway.app";

interface ChatViewProps {
  history: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  onTaskCreated: (task: any, needMore: boolean) => void;
  pendingTask?: Task | null;
}

const ChatView: React.FC<ChatViewProps> = ({ history, onSendMessage, onTaskCreated, pendingTask }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSpeechSupported(false);
      setSpeechError('您的浏览器不支持语音功能');
      return;
    }
    setSpeechSupported(true);
  }, []);



  const recognizeAudio = async (audioBlob: Blob) => {
    try {
      setIsRecognizing(true);
      setIsTyping(true);
      setSpeechError('');
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await fetch(`${API_BASE}/api/speech/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Recognition failed');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.text || !data.text.trim()) {
        throw new Error('未能识别到语音内容，请重试');
      }

      const userText = data.text.trim();
      const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

      onSendMessage({ id: Date.now().toString(), role: 'user', content: userText, time });

      const { reply, task, needMore } = await processUserIntent(userText, history);
      const replyTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      const finalReply = needMore ? `${reply}\n\n什么时候？（也可以说“每周一次 / 每天一次”）` : reply;

      onSendMessage({ id: (Date.now() + 1).toString(), role: 'ai', content: finalReply, time: replyTime });

      if (task) {
        onTaskCreated(task, needMore ?? false);
      }
    } catch (e: any) {
      console.error('Recognition error:', e);
      setSpeechError(e.message || '语音识别失败，请重试');
    } finally {
      setIsRecognizing(false);
      setIsTyping(false);
    }
  };

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
        
        const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          await recognizeAudio(audioBlob);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(500);
        setIsRecording(true);
        setSpeechError('');
      } catch (e: any) {
        console.error('Failed to start recording:', e);
        if (e.name === 'NotAllowedError') {
          setSpeechError('请允许麦克风权限后重试');
        } else {
          setSpeechError('无法启动录音，请检查麦克风');
        }
      }
    }
  }, [isRecording]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    onSendMessage({ id: Date.now().toString(), role: 'user', content: userText, time });
    setInput('');
    setIsTyping(true);

    try {
      const { reply, task, needMore } = await processUserIntent(userText, history);
      const replyTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      const finalReply = needMore ? `${reply}\n\n什么时候？（也可以说“每周一次 / 每天一次”）` : reply;

      onSendMessage({
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: finalReply,
        time: replyTime,
      });

      if (task) {
        onTaskCreated(task, needMore ?? false);
      }
    } catch (error) {
      onSendMessage({
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '抱歉，我暂时无法回应。请检查AI配置是否正确。',
        time: time,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const getStatusText = () => {
    if (speechError) return speechError;
    if (isRecording) return '正在录音，点击停止...';
    if (isRecognizing) return '正在识别语音...';
    if (isTyping) return '思考中...';
    return '说出你的计划，我来帮你创建任务';
  };

  const getStatusColor = () => {
    if (speechError) return 'text-red-500';
    if (isRecording || isRecognizing || isTyping) return 'text-blue-500';
    return 'text-zinc-400';
  };

  return (
    <div className="flex flex-col flex-1 pb-20 animate-in">
      <header className="px-6 pt-12 pb-5 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl z-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight dark:text-white leading-none">Toxic Plan</h1>
            <p className={`text-xs mt-2 ${getStatusColor()}`}>{getStatusText()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300">
              Poison Mode
            </span>
            <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
              Task Forge
            </span>
          </div>
        </div>
        {pendingTask && (
          <div className="mt-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Pending Task</p>
                <p className="text-sm font-semibold truncate dark:text-white">{pendingTask.title}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2 py-1 text-[10px] rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300">
                  {pendingTask.deadline ? `截止 ${pendingTask.deadline}` : '缺少时间'}
                </span>
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              </div>
            </div>
          </div>
        )}
      </header>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {history.map((msg: ChatMessage) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-black dark:bg-white text-white dark:text-black' 
                : 'bg-zinc-100 dark:bg-zinc-800 dark:text-white'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <span className="text-[10px] opacity-50 mt-1 block">{msg.time}</span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-1.5">
          <button
            type="button"
            onClick={toggleRecording}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : isRecognizing
                  ? 'bg-amber-500 text-white'
                  : speechSupported
                    ? 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    : 'text-zinc-200 cursor-not-allowed'
            }`}
            title={speechSupported ? (isRecording ? '录音中，点击停止' : isRecognizing ? '识别中...' : '点击说话') : speechError}
            disabled={!speechSupported || isRecognizing}
          >
            {isRecording ? (
              <span className="material-icons-round">stop</span>
            ) : isRecognizing ? (
              <span className="material-icons-round animate-spin">sync</span>
            ) : (
              <span className="material-icons-round">mic</span>
            )}
          </button>
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
            placeholder={pendingTask ? '补充时间或频次...' : (isRecording ? '正在录音...' : isRecognizing ? '正在识别...' : isTyping ? '思考中...' : '说出你的计划...')}
            disabled={isRecording || isRecognizing || isTyping}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm dark:text-white placeholder:text-zinc-400 disabled:opacity-50" 
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-all"
          >
            <span className="material-icons-round">arrow_upward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
