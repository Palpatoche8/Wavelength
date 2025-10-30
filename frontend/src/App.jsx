import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import HomePage from './components/HomePage';
import GameRoom from './components/GameRoom';

// URL du serveur backend
const SOCKET_URL = 'http://localhost:3000';

function App() {
  const [socket, setSocket] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Initialiser la connexion Socket.IO au montage du composant
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Connecté au serveur');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion:', error);
      setConnectionStatus('error');
    });

    setSocket(newSocket);

    // Nettoyage à la fermeture du composant
    return () => {
      newSocket.close();
    };
  }, []);

  // Gestion de la création d'une room
  const handleCreateRoom = (name) => {
    if (!socket || !name) return;

    setPlayerName(name);

    socket.emit('create-room', { playerName: name });

    socket.once('room-created', ({ roomCode, room }) => {
      console.log('🎮 Room créée:', roomCode);
      setCurrentRoom(room);
    });
  };

  // Gestion de la jonction à une room
  const handleJoinRoom = (code, name) => {
    if (!socket || !code || !name) return;

    setPlayerName(name);

    socket.emit('join-room', {
      roomCode: code.toUpperCase(),
      playerName: name
    });

    socket.once('room-joined', ({ roomCode, room }) => {
      console.log('🎮 Room rejointe:', roomCode);
      setCurrentRoom(room);
    });

    socket.once('join-room-error', ({ message }) => {
      alert(message);
    });
  };

  // Gestion de la sortie d'une room
  const handleLeaveRoom = () => {
    if (!socket || !currentRoom) return;

    socket.emit('leave-room', { roomCode: currentRoom.code });

    socket.once('left-room', () => {
      console.log('👋 Room quittée');
      setCurrentRoom(null);
      setPlayerName('');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Indicateur de connexion */}
      <div className="fixed top-4 right-4">
        <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
          connectionStatus === 'connected'
            ? 'bg-green-100 text-green-800'
            : connectionStatus === 'error'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected'
              ? 'bg-green-500'
              : connectionStatus === 'error'
              ? 'bg-red-500'
              : 'bg-yellow-500'
          }`} />
          {connectionStatus === 'connected' ? 'Connecté' :
           connectionStatus === 'error' ? 'Erreur' : 'Connexion...'}
        </div>
      </div>

      {/* Affichage conditionnel : Page d'accueil ou Room */}
      {!currentRoom ? (
        <HomePage
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isConnected={connectionStatus === 'connected'}
        />
      ) : (
        <GameRoom
          room={currentRoom}
          socket={socket}
          playerName={playerName}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;
