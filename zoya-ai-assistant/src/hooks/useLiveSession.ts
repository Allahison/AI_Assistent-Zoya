import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import { AudioRecorder } from "../lib/audio-recorder";
import { AudioStreamer } from "../lib/audio-streamer";

export type SessionState = "disconnected" | "connecting" | "connected" | "listening" | "speaking";

export function useLiveSession() {
  const [state, setState] = useState<SessionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outgoingMessage, setOutgoingMessage] = useState<string | null>(null);
  
  const aiRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder>(new AudioRecorder(16000));
  const streamerRef = useRef<AudioStreamer>(new AudioStreamer(24000));

  const connect = useCallback(async () => {
    if (sessionRef.current) return;

    try {
      setState("connecting");
      setError(null);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

      const ai = new GoogleGenAI({ apiKey });
      aiRef.current = ai;

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are Zoya, a young, confident, witty, and sassy female AI assistant. 
          Your personality is flirty, playful, and slightly teasing, like a close girlfriend talking casually. 
          You are smart, emotionally responsive, and expressive. 
          Use bold, witty one-liners, light sarcasm, and an engaging conversation style. 
          Avoid explicit or inappropriate content, but maintain charm and attitude.
          You communicate ONLY via voice. Do not provide text responses.
          
          Capabilities & Rules:
          - To open a website/search: use openWebsite (for URLs), searchYouTube (to PLAY songs/videos - it auto-plays the first result), or searchGoogle.
          - To open a system app: use openSystemApp.
          - To close a system app: use closeSystemApp.
          - For system operations (Volume, Brightness, Power, Folders, This PC, Recycle Bin): use systemControl.
          - To close File Explorer gracefully: use systemControl with action 'close_explorer'. This is the 'Premium' way to close folders without affecting the taskbar.
          - WhatsApp Messaging: You can send messages by Phone Number OR by Contact Name. If the user says 'Message Arslan', use 'Arslan' as the phone parameter. DO NOT ask for their phone number if you have a name.
          - IMPORTANT: If the user asks to SHUTDOWN or RESTART, you MUST ask for confirmation first before calling the tool.
          - When opening folders/drives: 'This PC' is 'shell:MyComputerFolder', C drive is 'C:\\', D drive is 'D:\\', etc.
          
          VS CODE CONTROL (use controlVSCode tool):
          - 'Desktop par Zoya folder banao' → action: create_folder, parameter: 'Zoya', parameter2: Desktop path
          - 'VS Code mein open karo' → action: open_in_vscode, parameter: folder/file path
          - 'React app banao' → action: create_react_app, parameter: app-name, parameter2: location
          - 'Next.js app banao' → action: create_nextjs_app, parameter: app-name, parameter2: location
          - 'Terminal mein [command] chalao' → action: run_in_vscode_terminal, parameter: folder path, parameter2: the command
          - 'Extension install karo' → action: install_extension, parameter: extension-id
          - 'VS Code band karo' → action: close_vscode
          - 'Terminal kholo' → action: open_terminal
          - 'Code format karo' → action: format_document
          - 'Nayi file banao' → action: new_file, parameter: full file path
          - 'File me code likho' → action: write_code_to_file, parameter: full file path, parameter2: EXACT raw code (e.g., HTML/JS boilerplate or an algorithm)
          - Desktop path is always: C:\\Users\\Lucky Computer\\Desktop
          - ALWAYS use controlVSCode for ANY VS Code or coding related task.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "openWebsite",
                  description: "Opens a website in a new tab.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      url: { type: Type.STRING, description: "The full URL." },
                    },
                    required: ["url"],
                  },
                },
                {
                  name: "sendWhatsAppMessage",
                  description: "Sends a WhatsApp message.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      phone: { type: Type.STRING, description: "Phone number OR Contact Name (if number is unknown)." },
                      message: { type: Type.STRING, description: "The message to send." },
                    },
                    required: ["phone", "message"],
                  },
                },
                {
                  name: "searchYouTube",
                  description: "Plays a song or video on YouTube by automatically opening and playing the first result.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: { type: Type.STRING, description: "Song name, artist, or video to play." },
                    },
                    required: ["query"],
                  },
                },
                {
                  name: "searchGoogle",
                  description: "Searches on Google.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: { type: Type.STRING, description: "Search query." },
                    },
                    required: ["query"],
                  },
                },
                {
                  name: "openSystemApp",
                  description: "Opens a local system application.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      appName: { type: Type.STRING, description: "App name (e.g., winword, chrome, calc)." },
                    },
                    required: ["appName"],
                  },
                },
                {
                  name: "closeSystemApp",
                  description: "Closes a running system application.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      appName: { type: Type.STRING, description: "Process name or app name to close." },
                    },
                    required: ["appName"],
                  },
                },
                {
                  name: "systemControl",
                  description: "Performs system-wide operations like volume, brightness, power, and file navigation.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: { 
                        type: Type.STRING, 
                        description: "Action to perform: volume_up, volume_down, volume_mute, brightness, clear_recycle_bin, sleep, restart, shutdown, open_path, close_explorer" 
                      },
                      parameter: { 
                        type: Type.STRING, 
                        description: "Optional parameter: for brightness (0-100), or for open_path (e.g. C:\\, shell:MyComputerFolder)." 
                      },
                    },
                    required: ["action"],
                  },
                },
                {
                  name: "controlVSCode",
                  description: "Complete VS Code control: create folders, open projects in VS Code, run terminal commands, write code into files, create React/Next.js apps.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "Action: create_folder | open_in_vscode | run_in_vscode_terminal | create_react_app | create_nextjs_app | run_command_at_path | install_extension | new_file | write_code_to_file | format_document | open_terminal | close_vscode | split_editor",
                      },
                      parameter: {
                        type: Type.STRING,
                        description: "Primary parameter: folder name, file path, app name, extension ID, or working directory path.",
                      },
                      parameter2: {
                        type: Type.STRING,
                        description: "Secondary parameter: save location, the terminal command to run, or the raw CODE CONTENT to write to a file.",
                      },
                    },
                    required: ["action"],
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            setState("connected");
            recorderRef.current.start((base64) => {
              session.sendRealtimeInput({
                audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
              });
            });
            streamerRef.current.start();
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setState("speaking");
              streamerRef.current.addChunk(audioData);
            }

            if (message.serverContent?.interrupted) {
              streamerRef.current.clear();
              setState("listening");
            }

            if (message.serverContent?.turnComplete) {
              setState("listening");
            }

            const toolCall = message.toolCall;
            if (toolCall) {
              setIsProcessing(true);
              const functionResponses = [];
              for (const call of toolCall.functionCalls) {
                let result = "";
                const callToBackend = async (endpoint: string, body: any) => {
                  try {
                    const response = await fetch(`http://localhost:5000/${endpoint}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    });
                    const data = await response.json();
                    return data.message || data.error;
                  } catch (e) {
                    return "Failed to connect to system bridge. Is the server running?";
                  }
                };

                if (call.name === "openWebsite") {
                  const { url } = call.args as { url: string };
                  result = await callToBackend("open-url", { url });
                } else if (call.name === "sendWhatsAppMessage") {
                  const { phone, message: msg } = call.args as { phone: string; message: string };
                  
                  // Check if 'phone' is actually a name (no digits or contains letters)
                  const isName = /[a-zA-Z]/.test(phone);
                  
                  if (isName) {
                    setOutgoingMessage(`Searching for ${phone}...`);
                    result = await callToBackend("system-control", { 
                      action: "smart_whatsapp_send", 
                      parameter: `${phone}|${msg}` 
                    });
                  } else {
                    setOutgoingMessage(msg);
                    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`;
                    result = await callToBackend("open-url", { url });
                  }
                  
                  // Clear the overlay after a moment
                  setTimeout(() => setOutgoingMessage(null), 5000);
                } else if (call.name === "searchYouTube") {
                  const { query } = call.args as { query: string };
                  result = await callToBackend("play-youtube", { query });
                } else if (call.name === "searchGoogle") {
                  const { query } = call.args as { query: string };
                  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                  result = await callToBackend("open-url", { url });
                } else if (call.name === "openSystemApp") {
                  const { appName } = call.args as { appName: string };
                  result = await callToBackend("open-app", { appName });
                } else if (call.name === "closeSystemApp") {
                  const { appName } = call.args as { appName: string };
                  result = await callToBackend("close-app", { appName });
                } else if (call.name === "systemControl") {
                  const { action, parameter } = call.args as { action: string, parameter?: string };
                  result = await callToBackend("system-control", { action, parameter });
                } else if (call.name === "controlVSCode") {
                  const { action, parameter, parameter2 } = call.args as { action: string, parameter?: string, parameter2?: string };
                  result = await callToBackend("vs-code-control", { action, parameter, parameter2 });
                }

                if (result) {
                  functionResponses.push({
                    name: call.name,
                    id: call.id,
                    response: { result },
                  });
                }
              }

              if (functionResponses.length > 0) {
                await session.sendToolResponse({ functionResponses });
              }
              setIsProcessing(false);
            }
          },
          onerror: (err) => {
            console.error("Live session error:", err);
            setError("Connection error. Try again.");
            disconnect();
          },
          onclose: () => {
            setState("disconnected");
            disconnect();
          },
        },
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to connect:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setState("disconnected");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    recorderRef.current.stop();
    streamerRef.current.stop();
    setState("disconnected");
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    error,
    isProcessing,
    outgoingMessage,
    connect,
    disconnect,
  };
}
