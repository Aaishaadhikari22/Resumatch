import { createContext, useContext, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { getActiveAuthToken } from "../utils/auth";

const SocketContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function SocketProvider({ children }) {
  const socket = useMemo(() => {
    const token = getActiveAuthToken();

    if (!token) {
      return null;
    }

    const socketInstance = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected", socketInstance.id);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message || error, error);
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    return socketInstance;
  }, []);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value = useMemo(() => ({ socket }), [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context.socket;
};
