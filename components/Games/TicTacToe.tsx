
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Icons } from '../Icons';
import { calculateWinner, getBestMove, Player, SquareValue, Difficulty } from '../../services/gameService';
import { useSettings } from '../../contexts/SettingsContext';
import { User, GameSession } from '../../types';
import { AppContext } from '../../App';
import { 
    createOnlineGame, 
    updateGameState, 
    subscribeToGame, 
    subscribeToInvites, 
    sendSignal, 
    subscribeToSignals, 
    subscribeToUsers 
} from '../../services/firebase';

interface TicTacToeProps {
  onBack: () => void;
}

export const TicTacToe: React.FC<TicTacToeProps> = ({ onBack }) => {
  const { showToast } = useSettings();
  const { currentUser } = useContext(AppContext);
  
  const [board, setBoard] = useState<SquareValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); 
  const [gameMode, setGameMode] = useState<'pvp_local' | 'pve' | 'pvp_online' | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [score, setScore] = useState({ X: 0, O: 0 });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [onlinePlayerRole, setOnlinePlayerRole] = useState<Player | null>(null); 
  const [invites, setInvites] = useState<GameSession[]>([]);
  const [opponent, setOpponent] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
      const unsub = subscribeToUsers((users) => {
          setAllUsers(users);
          setOnlineUsers(users.filter(u => u.id !== currentUser?.id));
      });
      return () => unsub();
  }, [currentUser]);

  useEffect(() => {
      if (!currentUser) return;
      const unsubscribe = subscribeToInvites(currentUser.id, (incomingGames) => {
          setInvites(incomingGames);
      });
      return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
      if (!onlineGameId) return;
      const unsubscribe = subscribeToGame(onlineGameId, (game) => {
          setBoard(game.board as SquareValue[]);
          setIsXNext(game.currentTurn === 'X');
          
          if (game.winner) {
              const result = calculateWinner(game.board as SquareValue[]);
              setWinner(game.winner as any);
              if (result) setWinningLine(result.line);
          } else {
              setWinner(null);
              setWinningLine(null);
          }

          if (game.status === 'active' && !opponent) {
              const opponentId = onlinePlayerRole === 'X' ? game.playerO : game.playerX;
              const oppUser = allUsers.find(u => u.id === opponentId);
              if (oppUser) setOpponent(oppUser);
          }
      });
      return () => unsubscribe();
  }, [onlineGameId, onlinePlayerRole, allUsers, opponent]);

  const handleSquareClick = async (index: number) => {
    if (board[index] || winner) return;
    if (gameMode === 'pvp_online') {
        if (!onlineGameId || !onlinePlayerRole) return;
        if ((isXNext && onlinePlayerRole !== 'X') || (!isXNext && onlinePlayerRole !== 'O')) return;
    }
    const newBoard = [...board];
    const currentPlayer = isXNext ? 'X' : 'O';
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    const result = calculateWinner(newBoard);
    let newWinner = null;
    if (result) {
      newWinner = result.winner;
      setWinner(result.winner);
      setWinningLine(result.line);
      setScore(prev => ({ ...prev, [result.winner as string]: prev[result.winner as any] + 1 }));
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else if (!newBoard.includes(null)) { newWinner = 'Draw'; setWinner('Draw'); }
    else { setIsXNext(!isXNext); }
    if (gameMode === 'pvp_online' && onlineGameId) { await updateGameState(onlineGameId, { board: newBoard, currentTurn: isXNext ? 'O' : 'X', winner: newWinner as any }); }
  };

  useEffect(() => {
    if (gameMode === 'pve' && !isXNext && !winner) {
      const timer = setTimeout(() => {
        const move = getBestMove(board, 'O', difficulty);
        if (move !== -1) handleSquareClick(move);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameMode, winner, board, difficulty]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    if (onlineGameId) updateGameState(onlineGameId, { board: Array(9).fill(null), currentTurn: 'X', winner: null });
  };

  const startOnlineGame = async (friendId: string) => {
      if (!currentUser) return;
      setIsSearching(true);
      try {
          const gameId = await createOnlineGame(currentUser.id, friendId);
          setOnlineGameId(gameId);
          setOnlinePlayerRole('X');
          setGameMode('pvp_online');
          const friend = onlineUsers.find(u => u.id === friendId);
          if (friend) setOpponent(friend);
          showToast("تم إرسال الدعوة، في انتظار القبول...", "info");
      } catch (e) { console.error(e); showToast("فشل إنشاء اللعبة", "error"); setIsSearching(false); }
  };

  const acceptInvite = (game: GameSession) => {
      setOnlineGameId(game.id);
      setOnlinePlayerRole('O');
      setGameMode('pvp_online');
      setBoard(game.board as SquareValue[]);
      const host = allUsers.find(u => u.id === game.playerX);
      if (host) setOpponent(host);
      updateGameState(game.id, { status: 'active' });
  };

  if (!gameMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 animate-pop-in pb-20">
        <div className="w-32 h-32 bg-gradient-to-tr from-indigo-500 via-purple-600 to-blue-700 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/40 rotate-3"><Icons.Game className="w-16 h-16 text-white" /></div>
        <h2 className="text-4xl font-black dark:text-white mb-2 font-branding tracking-tight">ميدان التحدي</h2>
        <p className="text-gray-500 mb-10 text-center font-bold">لعبة XO بنكهة الرقة الغربية الذكية</p>
        
        {invites.length > 0 && (
            <div className="w-full max-w-sm mb-8 space-y-3">
                {invites.map(game => {
                    const inviter = allUsers.find(u => u.id === game.playerX);
                    return (<button key={game.id} onClick={() => acceptInvite(game)} className="w-full p-4 bg-green-500 text-white rounded-[1.8rem] flex items-center gap-4 animate-bounce shadow-2xl border-4 border-white/20"><img src={inviter?.avatarUrl} className="w-12 h-12 rounded-full border-2 border-white shadow-md" alt="" /><div className="text-start"><div className="text-[10px] font-black uppercase tracking-widest opacity-80">تحدي وارد!</div><div className="text-lg font-black">{inviter?.username}</div></div><Icons.Play className="mr-auto w-6 h-6 fill-current" /></button>);
                })}
            </div>
        )}

        <div className="w-full max-w-sm space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-2 shadow-xl">
              <button onClick={() => setGameMode('pve')} className="w-full p-5 flex items-center gap-5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-[2rem] transition-all group">
                  <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform"><Icons.Magic className="w-7 h-7" /></div>
                  <div className="text-start flex-1">
                      <div className="font-black dark:text-white text-xl">تحدي الروبوت</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-widest">AI Mastermind</div>
                  </div>
              </button>
              <div className="flex gap-2 p-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                      <button key={d} onClick={(e) => { e.stopPropagation(); setDifficulty(d); }} className={`flex-1 py-2 text-[10px] font-black rounded-xl border-2 transition-all ${difficulty === d ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-transparent text-gray-500 border-gray-100 dark:border-gray-800'}`}>
                          {d === 'easy' ? 'مبتدئ' : d === 'medium' ? 'محترف' : 'أسطوري'}
                      </button>
                  ))}
              </div>
          </div>

          <button onClick={() => setGameMode('pvp_local')} className="w-full p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] flex items-center gap-5 hover:border-purple-500 transition-all shadow-xl group">
              <div className="bg-purple-600 p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform"><Icons.User className="w-7 h-7" /></div>
              <div className="text-start">
                  <div className="font-black dark:text-white text-xl">صديق بجانبك</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest">Local Multiplayer</div>
              </div>
          </button>
          
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
              <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-white/5">
                  <Icons.Globe className="w-6 h-6 text-green-500 animate-pulse" />
                  <span className="font-black text-white">العب أونلاين</span>
              </div>
              <div className="h-56 overflow-y-auto p-3 space-y-2 no-scrollbar">
                  {onlineUsers.length === 0 ? (
                      <div className="text-center py-14 text-gray-600 text-xs font-bold animate-pulse">جاري البحث عن محاربين...</div>
                  ) : (
                      onlineUsers.map(user => (
                          <button key={user.id} onClick={() => startOnlineGame(user.id)} disabled={isSearching} className="w-full flex items-center gap-4 p-3 hover:bg-white/10 rounded-[1.5rem] transition-all group border border-transparent hover:border-white/10">
                              <div className="relative">
                                  <img src={user.avatarUrl} className="w-12 h-12 rounded-full border-2 border-white/10 object-cover" alt="" />
                                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full shadow-lg"></div>
                              </div>
                              <div className="text-start flex-1 overflow-hidden">
                                  <div className="text-sm font-black text-white truncate">{user.username}</div>
                                  <div className="text-[9px] text-gray-500 truncate font-bold uppercase tracking-tighter">مستعد للنزال</div>
                              </div>
                              <div className="bg-white/5 text-gray-400 p-3 rounded-full group-hover:bg-green-500 group-hover:text-white transition-all"><Icons.Play className="w-4 h-4 fill-current" /></div>
                          </button>
                      ))
                  )}
              </div>
          </div>
        </div>
        <button onClick={onBack} className="mt-10 text-gray-500 hover:text-white font-black text-xs uppercase tracking-[0.4em]">رجوع للساحة</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-black p-4 animate-slide-up relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none opacity-50" />

      <div className="w-full flex justify-between items-center mb-10 z-10 sticky top-0 bg-black/50 backdrop-blur-xl p-4 rounded-[2rem] border border-white/5 shadow-2xl">
         <button onClick={() => {setGameMode(null); setOnlineGameId(null);}} className="p-3 bg-white/5 rounded-2xl text-white active:scale-90 border border-white/10"><Icons.Back className="w-7 h-7" /></button>
         <div className="flex flex-col items-center">
            <span className="text-xs font-black text-blue-500 uppercase tracking-widest">{gameMode === 'pve' ? 'VS AI' : 'BATTLE'}</span>
            <span className="text-lg font-black text-white">{gameMode === 'pve' ? `صعوبة ${difficulty}` : 'مباراة حماسية'}</span>
         </div>
         <button onClick={resetGame} className="p-3 bg-white/5 rounded-2xl text-yellow-500 border border-white/10 active:rotate-180 transition-transform duration-700"><Icons.Magic className="w-7 h-7" /></button>
      </div>

      {gameMode === 'pvp_online' && opponent && (
          <div className="flex items-center gap-4 mb-8 bg-white/5 p-3 pr-8 rounded-full border border-white/10 backdrop-blur-md shadow-2xl animate-pop-in">
              <span className="font-black text-white text-lg">تحدي: {opponent.username}</span>
              <img src={opponent.avatarUrl} className="w-12 h-12 rounded-full border-2 border-white shadow-xl" alt="" />
          </div>
      )}

      <div className="flex gap-6 mb-12 w-full max-w-sm justify-center z-10">
          <div className={`flex-1 flex flex-col items-center p-6 rounded-[2.5rem] transition-all duration-500 ${isXNext && !winner ? 'bg-blue-600 text-white scale-110 shadow-[0_20px_50px_rgba(37,99,235,0.4)]' : 'bg-white/5 dark:text-white opacity-40 grayscale border border-white/5'}`}>
              <div className="text-[9px] font-black mb-1 uppercase tracking-widest">PLAYER X</div>
              <div className="text-5xl font-black">{score.X}</div>
          </div>
          <div className={`flex-1 flex flex-col items-center p-6 rounded-[2.5rem] transition-all duration-500 ${!isXNext && !winner ? 'bg-rose-600 text-white scale-110 shadow-[0_20px_50px_rgba(225,29,72,0.4)]' : 'bg-white/5 dark:text-white opacity-40 grayscale border border-white/5'}`}>
              <div className="text-[9px] font-black mb-1 uppercase tracking-widest">{gameMode === 'pve' ? 'AI ROBOT' : 'PLAYER O'}</div>
              <div className="text-5xl font-black">{score.O}</div>
          </div>
      </div>

      <div className="relative z-10">
          <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10">
              <div className="grid grid-cols-3 gap-5">
                  {board.map((sq, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSquareClick(i)} 
                        className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] flex items-center justify-center text-6xl font-black transition-all duration-300 relative group
                            ${sq === 'X' ? 'text-blue-500 bg-blue-600/10' : sq === 'O' ? 'text-rose-500 bg-rose-600/10' : 'bg-white/5 hover:bg-white/10'} 
                            ${winningLine?.includes(i) ? (sq === 'X' ? '!bg-blue-500 !text-white shadow-[0_0_40px_rgba(37,99,235,0.6)] animate-bounce' : '!bg-rose-500 !text-white shadow-[0_0_40px_rgba(225,29,72,0.6)] animate-bounce') : ''}`} 
                        disabled={!!sq || !!winner || (gameMode === 'pvp_online' && ((isXNext && onlinePlayerRole !== 'X') || (!isXNext && onlinePlayerRole !== 'O')))}
                      >
                          {sq && <span className="animate-pop-in drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">{sq}</span>}
                          {!sq && !winner && <span className="text-white/5 opacity-0 group-hover:opacity-100 transition-opacity text-2xl">{isXNext ? 'X' : 'O'}</span>}
                      </button>
                  ))}
              </div>
          </div>

          {winner && (
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none px-4">
                  <div className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.9)] text-center transform animate-pop-in pointer-events-auto border-4 border-blue-500/20 max-w-xs w-full relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                      <div className="text-7xl mb-6 animate-bounce">
                          {winner === 'X' ? '🏆' : winner === 'O' ? (gameMode === 'pve' ? '🤖' : '🏆') : '🤝'}
                      </div>
                      <h3 className="text-4xl font-black mb-2 dark:text-white tracking-tighter">
                          {winner === 'Draw' ? 'تعادل عادل!' : `الفائز ${winner}!`}
                      </h3>
                      <p className="text-gray-500 text-sm mb-10 font-bold uppercase tracking-widest opacity-60">
                          {winner === 'X' ? 'لقد كنت مذهلاً!' : winner === 'Draw' ? 'كان نزالاً تاريخياً' : 'الروبوت كسب المرة دي'}
                      </p>
                      <button 
                        onClick={resetGame} 
                        className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-500/40"
                      >
                          جولة جديدة
                      </button>
                  </div>
              </div>
          )}
      </div>

      <div className="mt-auto py-10 text-gray-600 text-[10px] font-black uppercase tracking-[0.5em] text-center opacity-40">
          Raqqa Combat Logic Pro X
      </div>
    </div>
  );
};
