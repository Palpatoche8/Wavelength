import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Composant de chat en bulle flottante
 */
function Chat({ socket, roomCode, playerName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      // Incrémenter les non-lus si le chat est fermé et que ce n'est pas notre message
      if (!isOpen && message.playerName !== playerName) {
        setUnreadCount((c) => c + 1);
      }
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [socket, isOpen, playerName]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      // Scroll vers le bas quand on ouvre ou reçoit un message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [isOpen, messages]);

  const handleSend = (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    socket.emit('chat-message', {
      roomCode,
      message: trimmed
    });

    setInput('');
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-2xl flex items-center justify-center border-2 border-white/30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          rotate: isOpen ? 180 : 0
        }}
      >
        <span className="text-2xl">{isOpen ? '×' : '💬'}</span>
        {unreadCount > 0 && !isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Panneau de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] h-96 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 bg-gradient-to-r from-purple-600/80 to-pink-600/80 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-white font-bold">💬 Chat</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white text-xl leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-white/50 text-sm text-center italic mt-4">
                  Aucun message pour l'instant
                </p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.playerName === playerName;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          isMe
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {!isMe && (
                          <p className={`text-xs font-bold mb-0.5 ${
                            msg.team === 'blue' ? 'text-blue-300' :
                            msg.team === 'red' ? 'text-red-300' :
                            'text-purple-200'
                          }`}>
                            {msg.playerName}
                          </p>
                        )}
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-2 border-t border-white/20 bg-white/5">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Écrire un message..."
                  maxLength={200}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm placeholder:text-white/40 focus:ring-2 focus:ring-purple-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition"
                >
                  →
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Chat;
