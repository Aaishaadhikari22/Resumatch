
import { useContext, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { getActiveAuthToken } from "../utils/auth";
import { SocketContext } from "./socketContext";

export function useSocket() {
  const context = useContext(SocketContext);
  return context?.socket || null;
}

export function SocketProvider({ children }) {
    const socket = useMemo(() => {
    const token = getActiveAuthToken();

    if (!token) {
      return null;
    }

    const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;
    const socketHost = apiBase.replace(/\/api$/, "");

    const socketInstance = io(socketHost, {
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

