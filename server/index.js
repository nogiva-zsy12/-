import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";
import https from "https";
import crypto from "crypto";
import { spawn } from "child_process";
import RPCClient from "@alicloud/pop-core";
import { 
  CHAT_PROMPT, 
  MESSAGE_PROMPT, 
  buildTaskCreatedMessage, 
  buildTaskCompletedMessage,
  buildDeadlineReminderMessage,
  buildTaskDeletedMessage 
} from "./prompts.js";

dotenv.config({ path: ".env.local" });

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase configuration");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ALIYUN_CONFIG = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  appkey: process.env.ALIYUN_APPKEY,
};

let tokenCache = null;

const getAliyunToken = async () => {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expireTime > now + 60) {
    return tokenCache.token;
  }

  if (!ALIYUN_CONFIG.accessKeyId || !ALIYUN_CONFIG.accessKeySecret) {
    throw new Error("Missing Aliyun AccessKey configuration");
  }

  const client = new RPCClient.RPCClient({
    accessKeyId: ALIYUN_CONFIG.accessKeyId,
    accessKeySecret: ALIYUN_CONFIG.accessKeySecret,
    endpoint: "https://nls-meta.cn-shanghai.aliyuncs.com",
    apiVersion: "2019-02-28",
  });

  try {
    const result = await client.request("CreateToken");
    
    if (result && result.Token && result.Token.Id) {
      tokenCache = {
        token: result.Token.Id,
        expireTime: result.Token.ExpireTime,
      };
      return result.Token.Id;
    }
    throw new Error("Invalid token response structure");
  } catch (error) {
    console.error("Failed to get Aliyun token:", error);
    throw error;
  }
};

const getUserIdFromRequest = (req) => {
  const headerId = req.header("x-user-id");
  if (headerId && typeof headerId === "string" && headerId.trim().length > 0) {
    return headerId.trim();
  }
  return null;
};

const pad2 = (n) => String(n).padStart(2, "0");

const formatYmdHm = (d) => {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hour = pad2(d.getHours());
  const minute = pad2(d.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const normalizeDeadline = (deadline) => {
  if (!deadline || typeof deadline !== "string") return null;
  const raw = deadline.trim();
  if (!raw || raw.toLowerCase() === "null") return null;
  if (raw.includes("YYYY-MM-DD")) return null;

  const normalized = raw.replace(/\//g, "-").replace(/\s+/g, " ");

  const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const hour = Number(m[4]);
    const minute = Number(m[5]);
    const second = m[6] ? Number(m[6]) : 0;
    const d = new Date(year, month - 1, day, hour, minute, second, 0);
    if (isNaN(d.getTime())) return null;
    return formatYmdHm(d);
  }

  const d = new Date(normalized);
  if (isNaN(d.getTime())) return null;
  return formatYmdHm(d);
};

const parseTaskFromText = (text) => {
  const match = text.match(/\[META:(.*?)\]/);
  if (!match) {
    return { reply: text.trim(), task: null, intent: null, needMore: false };
  }
  let meta = null;
  try {
    meta = JSON.parse(match[1]);
  } catch (e) {
    meta = null;
  }
  const reply = text.replace(/\[META:.*?\]/, "").trim();
  if (meta?.task && typeof meta.task === "object") {
    const fixedDeadline = normalizeDeadline(meta.task.deadline);
    meta.task.deadline = fixedDeadline;
    if (!fixedDeadline) {
      meta.needMore = true;
    }
  }
  return { 
    reply, 
    task: meta?.task || null, 
    intent: meta?.intent || null,
    needMore: meta?.needMore || false
  };
};

const MODEL_MAP = {
  "gemini-2.5-flash": { provider: "gemini", modelId: "gemini-2.5-flash" },
  "gemini-3-pro": { provider: "gemini", modelId: "gemini-3.0-pro" },
  "deepseek-chat": { provider: "deepseek", modelId: "deepseek-chat" },
  "deepseek-r1": { provider: "deepseek", modelId: "deepseek-reasoner" },
  "kimi-moonshot-8k": { provider: "kimi", modelId: "moonshot-v1-8k" },
  "kimi-moonshot-32k": { provider: "kimi", modelId: "moonshot-v1-32k" },
  "minimax-abab5.5": { provider: "minimax", modelId: "abab5.5-chat" },
  "minimax-abab6.5": { provider: "minimax", modelId: "abab6.5s-chat" },
  "qwen-plus": { provider: "qwen", modelId: "qwen-plus" },
  "qwen-turbo": { provider: "qwen", modelId: "qwen-turbo" },
  "qwen-max": { provider: "qwen", modelId: "qwen-max" },
};

const getDefaultModel = () => process.env.DEFAULT_MODEL_KEY || "deepseek-chat";

const DEFAULT_API_KEYS = {
  'gemini-2.5-flash': process.env.GEMINI_API_KEY || '',
  'gemini-3-pro': process.env.GEMINI_API_KEY || '',
  'deepseek-chat': process.env.DEEPSEEK_API_KEY || '',
  'deepseek-r1': process.env.DEEPSEEK_API_KEY || '',
  'kimi-moonshot-8k': process.env.KIMI_API_KEY || '',
  'kimi-moonshot-32k': process.env.KIMI_API_KEY || '',
  'minimax-abab5.5': process.env.MINIMAX_API_KEY || '',
  'minimax-abab6.5': process.env.MINIMAX_API_KEY || '',
  'qwen-plus': process.env.QWEN_API_KEY || '',
  'qwen-turbo': process.env.QWEN_API_KEY || '',
  'qwen-max': process.env.QWEN_API_KEY || '',
};

const getApiKeyForModel = (modelKey, userApiKey) => {
  if (userApiKey) {
    return userApiKey;
  }
  return DEFAULT_API_KEYS[modelKey] || null;
};

const generateWithModel = async (
  apiKey,
  modelKey,
  systemInstruction,
  userMessage
) => {
  const config = MODEL_MAP[modelKey];
  if (!config) {
    throw new Error("Unsupported model");
  }

  if (!apiKey) {
    throw new Error("Missing API key");
  }

  const { provider, modelId } = config;

  if (provider === "gemini") {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });
    return response.text || "";
  }

  if (provider === "deepseek") {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userMessage },
        ],
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(errText);
    }
    const data = await resp.json();
    const choice = data.choices && data.choices[0];
    const content = choice && choice.message && choice.message.content;
    return content || "";
  }

  if (provider === "kimi") {
    const resp = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userMessage },
        ],
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(errText);
    }
    const data = await resp.json();
    const choice = data.choices && data.choices[0];
    const content = choice && choice.message && choice.message.content;
    return content || "";
  }

  if (provider === "qwen") {
    const resp = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userMessage },
        ],
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(errText);
    }
    const data = await resp.json();
    const choice = data.choices && data.choices[0];
    const content = choice && choice.message && choice.message.content;
    return content || "";
  }

  if (provider === "minimax") {
    const resp = await fetch("https://api.minimax.chat/v1/text/chatcompletion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { sender_type: "SYSTEM", text: systemInstruction },
          { sender_type: "USER", text: userMessage },
        ],
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(errText);
    }
    const data = await resp.json();
    const choices = data.choices && data.choices[0];
    const msgList = choices && choices.messages;
    const last = msgList && msgList[msgList.length - 1];
    const content = last && last.text;
    return content || "";
  }

  throw new Error("Unsupported provider");
};

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

const mapTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  deadline: row.deadline,
  startTime: row.start_time,
  estimatedTime: row.estimated_time,
  progress: row.progress,
  toxicRecords: row.toxic_records || [],
  frequency: row.frequency || undefined,
  createdAt: row.created_at,
});

const mapMessage = (row) => ({
  id: row.id,
  time: row.time,
  title: row.title,
  content: row.content,
  isRead: row.is_read,
  type: row.type,
});

app.get("/api/tasks", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ tasks: data.map(mapTask) });
});

app.post("/api/tasks", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { title, description, deadline, startTime, estimatedTime, frequency } = req.body;

  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const { data: taskRows, error: taskError } = await supabase
    .from("tasks")
    .insert([
      {
        user_id: userId,
        title,
        description: description ?? "",
        status: "IN_PROGRESS",
        deadline: deadline ?? "",
        start_time: startTime ?? now,
        estimated_time: estimatedTime ?? "",
        progress: 0,
        toxic_records: [],
        frequency: frequency ?? null,
      },
    ])
    .select()
    .limit(1);

  if (taskError || !taskRows || taskRows.length === 0) {
    res.status(500).json({ error: taskError ? taskError.message : "Failed to create task" });
    return;
  }

  const taskRow = taskRows[0];

  res.status(201).json({
    task: mapTask(taskRow),
  });
});

app.post("/api/messages", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { title, content, type } = req.body;

  if (!title || !content) {
    res.status(400).json({ error: "Title and content are required" });
    return;
  }

  const { data: messageRows, error: messageError } = await supabase
    .from("messages")
    .insert([
      {
        user_id: userId,
        time: "刚刚",
        title,
        content,
        is_read: false,
        type: type || "SYSTEM",
      },
    ])
    .select()
    .limit(1);

  if (messageError || !messageRows || messageRows.length === 0) {
    res.status(500).json({ error: messageError ? messageError.message : "Failed to create message" });
    return;
  }

  const messageRow = messageRows[0];

  res.status(201).json({
    message: mapMessage(messageRow),
  });
});

app.patch("/api/tasks/:id", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const { status, progress, title, description, deadline, startTime, estimatedTime, frequency } = req.body;

  const updates = {};
  if (status) updates.status = status;
  if (typeof progress === "number") updates.progress = progress;
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (deadline !== undefined) updates.deadline = deadline;
  if (startTime !== undefined) updates.start_time = startTime;
  if (estimatedTime !== undefined) updates.estimated_time = estimatedTime;
  if (frequency !== undefined) updates.frequency = frequency;

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .limit(1);

  if (error || !data || data.length === 0) {
    res.status(500).json({ error: error ? error.message : "Task not found" });
    return;
  }

  res.json({ task: mapTask(data[0]) });
});

app.delete("/api/tasks/:id", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  const { data: taskData, error: taskError } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", id)
    .eq("user_id", userId)
    .limit(1);

  const taskTitle = taskData && taskData.length > 0 ? taskData[0].title : '未知任务';

  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const notificationContent = buildTaskDeletedMessage(taskTitle);

  await supabase.from("messages").insert([
    {
      user_id: userId,
      time: "刚刚",
      title: "任务已删除",
      content: notificationContent,
      is_read: false,
      type: "WARNING",
    },
  ]);

  res.json({ success: true });
});

app.get("/api/messages", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ messages: data.map(mapMessage) });
});

app.delete("/api/messages/:id", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true });
});

app.post("/api/auth/login-or-register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const { data: existingUsers, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .limit(1);

  if (userError) {
    res.status(500).json({ error: userError.message });
    return;
  }

  if (!existingUsers || existingUsers.length === 0) {
    const passwordHash = await bcrypt.hash(password, 10);
    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          username,
          password_hash: passwordHash,
        },
      ])
      .select()
      .limit(1);

    if (insertError || !inserted || inserted.length === 0) {
      res.status(500).json({ error: insertError ? insertError.message : "Failed to create user" });
      return;
    }

    const user = inserted[0];
    res.json({ userId: user.id, username: user.username });
    return;
  }

  const user = existingUsers[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.json({ userId: user.id, username: user.username });
});

app.get("/api/ai-models", (req, res) => {
  res.json({ models: [{ key: "deepseek-chat" }] });
});

app.get("/api/ai-config", (req, res) => {
  const modelKey = "deepseek-chat";
  const hasBackendKey = !!process.env.DEEPSEEK_API_KEY;

  res.json({
    modelKey,
    hasApiKey: hasBackendKey,
    hasBackendKey,
    configured: hasBackendKey,
  });
});

app.post("/api/ai-config", (req, res) => {
  const modelKey = "deepseek-chat";
  const hasBackendKey = !!process.env.DEEPSEEK_API_KEY;
  res.json({ success: true, modelKey, configured: hasBackendKey });
});

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const modelKey = "deepseek-chat";
  const apiKey = getApiKeyForModel(modelKey);

  if (!apiKey) {
    res.status(400).json({ error: "DeepSeek API key not configured" });
    return;
  }

  try {
    let chatHistory = "";
    if (history && Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      chatHistory = recentHistory
        .map((msg) => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
        .join('\n');
    }

    const userMessage = chatHistory 
      ? `【对话历史】\n${chatHistory}\n\n【当前用户输入】\n${message}`
      : message;

    const now = new Date();
    const currentDate = formatYmdHm(now);
    const weekday = now.toLocaleDateString("zh-CN", { weekday: "long" });
    const promptWithDate = `${CHAT_PROMPT}\n\n【系统时间】\n当前真实时间是：${currentDate}（${weekday}）\n请基于此时间推算"明天"、"后天"等相对时间，并确保 deadline 输出为 YYYY-MM-DD HH:mm。`;

    const text = await generateWithModel(apiKey, modelKey, promptWithDate, userMessage);

    const { reply, task, intent, needMore } = parseTaskFromText(text);
    res.json({ reply, task, intent, needMore });
  } catch (e) {
    console.error("Chat error:", e);
    const msg = e instanceof Error ? e.message : "AI request failed";
    res.status(500).json({ error: msg });
  }
});

app.post("/api/insult", async (req, res) => {
  const { taskTitle, context } = req.body;
  const modelKey = "deepseek-chat";
  const apiKey = getApiKeyForModel(modelKey);

  if (!apiKey) {
    res.status(400).json({ error: "DeepSeek API key not configured" });
    return;
  }

  const userMessage = `Task: ${taskTitle}. Context: ${context}.`;

  try {
    const text = await generateWithModel(apiKey, modelKey, MESSAGE_PROMPT, userMessage);
    res.json({ insult: text || "废物。" });
  } catch (e) {
    console.error("Insult error:", e);
    const msg = e instanceof Error ? e.message : "AI request failed";
    res.status(500).json({ error: msg });
  }
});



app.post("/api/speech/recognize", async (req, res) => {
  try {
    const { audio } = req.body;
    
    if (!audio) {
      res.status(400).json({ error: "Audio data is required" });
      return;
    }

    if (!ALIYUN_CONFIG.accessKeyId || !ALIYUN_CONFIG.accessKeySecret || !ALIYUN_CONFIG.appkey) {
      res.status(500).json({ error: "语音识别未配置" });
      return;
    }

    const token = await getAliyunToken();
    const buffer = Buffer.from(audio, "base64");

    const pcmBuffer = await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        "pipe:0",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-f",
        "s16le",
        "-acodec",
        "pcm_s16le",
        "pipe:1",
      ]);

      const chunks = [];

      ffmpeg.stdout.on("data", (chunk) => {
        chunks.push(chunk);
      });

      ffmpeg.stderr.on("data", () => {});

      ffmpeg.on("error", (err) => {
        reject(err);
      });

      ffmpeg.on("close", (code) => {
        if (code !== 0 || chunks.length === 0) {
          reject(new Error("ffmpeg 转换失败"));
        } else {
          resolve(Buffer.concat(chunks));
        }
      });

      ffmpeg.stdin.write(buffer);
      ffmpeg.stdin.end();
    });
    
    const url = `https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr?appkey=${ALIYUN_CONFIG.appkey}&format=pcm&sample_rate=16000&enable_punctuation_prediction=true&enable_inverse_text_normalization=true`;
    
    return new Promise((resolve) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Accept': 'application/json',
          'X-NLS-Token': token,
          'Content-Length': pcmBuffer.length,
        }
      }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 400) {
            let message = "语音识别请求失败";
            try {
              const parsed = JSON.parse(data);
              if (parsed?.message) message = parsed.message;
            } catch {}
            console.error("Aliyun response error:", response.statusCode, data);
            res.status(500).json({ error: `${message}（HTTP ${response.statusCode}）` });
            resolve();
            return;
          }

          try {
            const result = JSON.parse(data);
            if (result.status === 20000000 && result.result) {
              res.json({ text: result.result });
            } else {
              console.error("Aliyun response:", result);
              res.status(500).json({ error: result.message || "识别失败" });
            }
          } catch (e) {
            console.error("Parse error:", e, data);
            res.status(500).json({ error: "解析结果失败" });
          }
          resolve();
        });
      });

      req.on('error', (e) => {
        console.error("Request error:", e);
        res.status(500).json({ error: "网络请求失败" });
        resolve();
      });

      req.write(pcmBuffer);
      req.end();
    });
  } catch (e) {
    console.error("Speech error:", e);
    if (e instanceof Error && e.message.includes("ffmpeg")) {
      res.status(500).json({ error: "语音转换失败，请检查服务器是否安装 ffmpeg" });
    } else {
      res.status(500).json({ error: e.message || "语音识别失败" });
    }
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`AI Models available: ${Object.keys(MODEL_MAP).join(', ')}`);
  console.log(`Default model: ${process.env.DEFAULT_MODEL_KEY || getDefaultModel()}`);
});
