
const getUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("toxicplan_user_id");
  } catch {
    return null;
  }
};

const API_BASE = "https://harmonious-nature-production-ed16.up.railway.app";

export const recognizeSpeech = async (audioBase64: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/api/speech/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioBase64 }),
    });

    if (!response.ok) {
      throw new Error('Recognition failed');
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Speech recognition error:', error);
    throw error;
  }
};

export const processUserIntent = async (input: string, history?: any[]): Promise<{ reply: string; task?: any; intent?: string; needMore?: boolean }> => {
  const userId = getUserId();
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId || "",
      },
      body: JSON.stringify({ message: input, history: history || [] }),
    });

    if (!response.ok) {
      let errorMessage = "Chat API error";
      try {
        const errData = await response.json();
        if (errData && typeof errData.error === "string") {
          errorMessage = errData.error;
        }
      } catch {
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { 
      reply: data.reply, 
      task: data.task,
      intent: data.intent,
      needMore: data.needMore
    };
  } catch (error) {
    console.error("Chat Error:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "AI 教练暂时离线，请稍后再试。";
    return {
      reply: `AI 教练开小差了：${message}`,
      task: undefined,
      intent: undefined,
      needMore: false,
    };
  }
};

export const getToxicInsult = async (taskTitle: string, context: string): Promise<string> => {
  const userId = getUserId();
  try {
    const response = await fetch(`${API_BASE}/api/insult`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId || "",
      },
      body: JSON.stringify({ taskTitle, context }),
    });

    if (!response.ok) {
      let errorMessage = "Insult API error";
      try {
        const errData = await response.json();
        if (errData && typeof errData.error === "string") {
          errorMessage = errData.error;
        }
      } catch {
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.insult || "废物。";
  } catch (error) {
    console.error("Insult Error:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "AI 教练骂不动了，先检查一下你的配置。";
    return `AI 教练嘴瓢了：${message}`;
  }
};
