'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSocket, Room } from '@/hooks/use-socket';
import { useGameStore, useGameActions } from '@/store/game-store';

interface LobbyProps {
  onBack: () => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
}

export function Lobby({ onBack, onJoinRoom }: LobbyProps) {
  const { 
    isConnected, 
    rooms, 
    createRoom, 
    joinRoom, 
    getRooms, 
    error,
    currentRoom 
  } = useSocket();

  const { playerName, setPlayerName } = useGameStore();
  const { setError } = useGameActions();

  const [newRoomName, setNewRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPlayerName, setJoinPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (isConnected) {
      getRooms();
    }
  }, [isConnected, getRooms]);

  useEffect(() => {
    if (playerName) {
      setJoinPlayerName(playerName);
    }
  }, [playerName]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !joinPlayerName.trim()) {
      setError('لطفاً نام اتاق و نام خود را وارد کنید');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createRoom(newRoomName.trim(), joinPlayerName.trim());
      if (result.success && result.roomId) {
        setPlayerName(joinPlayerName.trim());
        onJoinRoom(result.roomId, joinPlayerName.trim());
      } else {
        setError(result.error || 'خطا در ایجاد اتاق');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinExistingRoom = async () => {
    if (!joinRoomId.trim() || !joinPlayerName.trim()) {
      setError('لطفاً کد اتاق و نام خود را وارد کنید');
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinRoom(joinRoomId.trim(), joinPlayerName.trim());
      if (result.success) {
        setPlayerName(joinPlayerName.trim());
        onJoinRoom(joinRoomId.trim(), joinPlayerName.trim());
      } else {
        setError(result.error || 'خطا در پیوستن به اتاق');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setIsJoining(false);
    }
  };

  const handleQuickJoin = async (roomId: string) => {
    if (!joinPlayerName.trim()) {
      setError('لطفاً نام خود را وارد کنید');
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinRoom(roomId, joinPlayerName.trim());
      if (result.success) {
        setPlayerName(joinPlayerName.trim());
        onJoinRoom(roomId, joinPlayerName.trim());
      } else {
        setError(result.error || 'خطا در پیوستن به اتاق');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setIsJoining(false);
    }
  };

  const getRoomStatusText = (room: Room) => {
    if (room.gameStarted) return 'در حال بازی';
    if (room.players.length === 4) return 'پر';
    return `${room.players.length}/4 بازیکن`;
  };

  const getRoomStatusColor = (room: Room) => {
    if (room.gameStarted) return 'bg-red-500';
    if (room.players.length === 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" onClick={onBack} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            بازگشت
          </Button>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white">لابی بازی</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-purple-200 text-sm">
                {isConnected ? 'متصل به سرور' : 'قطع از سرور'}
              </span>
            </div>
          </div>
          <div className="w-20"></div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-white text-center">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Create/Join Room */}
          <div className="space-y-6">
            {/* Create New Room */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">➕</span>
                  ساخت اتاق جدید
                </CardTitle>
                <CardDescription className="text-purple-200">
                  یک اتاق جدید ایجاد کنید و دوستان خود را دعوت کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="roomName" className="text-white">نام اتاق</Label>
                  <Input
                    id="roomName"
                    placeholder="نام اتاق را وارد کنید"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <Label htmlFor="playerName" className="text-white">نام شما</Label>
                  <Input
                    id="playerName"
                    placeholder="نام خود را وارد کنید"
                    value={joinPlayerName}
                    onChange={(e) => setJoinPlayerName(e.target.value)}
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <Button 
                  onClick={handleCreateRoom}
                  disabled={isCreating || !newRoomName.trim() || !joinPlayerName.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isCreating ? 'در حال ایجاد...' : 'ساخت اتاق'}
                </Button>
              </CardContent>
            </Card>

            {/* Join Existing Room */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🚪</span>
                  پیوستن به اتاق
                </CardTitle>
                <CardDescription className="text-purple-200">
                  با کد اتاق به بازی دوستان خود بپیوندید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="roomId" className="text-white">کد اتاق</Label>
                  <Input
                    id="roomId"
                    placeholder="کد ۶ رقمی اتاق را وارد کنید"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="joinPlayerName" className="text-white">نام شما</Label>
                  <Input
                    id="joinPlayerName"
                    placeholder="نام خود را وارد کنید"
                    value={joinPlayerName}
                    onChange={(e) => setJoinPlayerName(e.target.value)}
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <Button 
                  onClick={handleJoinExistingRoom}
                  disabled={isJoining || !joinRoomId.trim() || !joinPlayerName.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isJoining ? 'در حال اتصال...' : 'پیوستن به اتاق'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Room List */}
          <div>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">🏠</span>
                    اتاق‌های موجود
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={getRooms}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  >
                    تازه‌سازی
                  </Button>
                </CardTitle>
                <CardDescription className="text-purple-200">
                  روی یک اتاق کلیک کنید تا به آن بپیوندید
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rooms.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">هیچ اتاق فعالی وجود ندارد</p>
                    <p className="text-white/50 text-sm mt-2">یک اتاق جدید ایجاد کنید</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {rooms.map((room) => (
                      <div 
                        key={room.id} 
                        className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => handleQuickJoin(room.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{room.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {room.id}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getRoomStatusColor(room)}`}></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/70">
                            {getRoomStatusText(room)}
                          </span>
                          <span className="text-white/50">
                            {room.players.length}/4 بازیکن
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game Rules */}
        <Card className="mt-8 bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-center">قوانین بازی حکم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-white/80 text-sm">
              <div>
                <h4 className="font-semibold text-white mb-2">هدف بازی</h4>
                <p>حکم یک بازی کارت ۴ نفره است که در دو تیم دو نفره انجام می‌شود. هدف هر تیم این است که ۷ دست را برنده شود.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">شروع بازی</h4>
                <p>ابتدا هر بازیکن ۱۳ کارت دریافت می‌کند. سپس یکی از بازیکنان یک خال را به عنوان "حکم" انتخاب می‌کند.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">قوانین بازی</h4>
                <p>بازیکنی که کارت می‌اندازد، خال را تعیین می‌کند. دیگران باید همان خال را بازی کنند. اگر کارت نداشته باشند، می‌توانند هر کارتی بازی کنند.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">امتیازدهی</h4>
                <p>کارت‌های حکم بالاترین ارزش را دارند. تیمی که ۷ دست را برنده شود، برنده بازی است.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}