import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Moon, Sun, Star, RefreshCw, Heart, Coins, Users, Briefcase, RefreshCcw } from 'lucide-react';
import Markdown from 'react-markdown';
import { getTarotReading } from './services/gemini';
import { TAROT_CARDS } from './data/tarotCards';

const CATEGORIES = [
  { id: '연애', label: '연애', icon: Heart },
  { id: '금전', label: '금전', icon: Coins },
  { id: '가족', label: '가족', icon: Users },
  { id: '커리어', label: '커리어', icon: Briefcase },
  { id: '이직', label: '이직', icon: RefreshCcw },
];

// 진짜 라이더 웨이트 타로 카드 이미지 베이스 URL (GitHub에서 가져옴 - 안정적)
const CARD_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/everestlaw/tarot-images/master/images-light/';

export default function App() {
  const [step, setStep] = useState<'form' | 'drawing' | 'loading' | 'result'>('form');
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    calendarType: '양력',
    category: '',
  });
  const [reading, setReading] = useState('');
  const [error, setError] = useState('');
  const [drawnCards, setDrawnCards] = useState<{name: string, id: string, isReversed: boolean}[]>([]);
  const [availableCards, setAvailableCards] = useState<{name: string, id: string}[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  // 카드 이미지 URL 생성 함수 (안정적인 이미지 링크로 교체)
  const getCardImageUrl = (cardId: string) => {
    return `${CARD_IMAGE_BASE_URL}${cardId}.jpg`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate || !formData.category) {
      setError('이름, 생년월일, 질문 카테고리는 필수입니다.');
      return;
    }
    setError('');
    
    setAvailableCards([...TAROT_CARDS]);
    setDrawnCards([]);
    setStep('drawing');
    setIsShuffling(true);
    
    setTimeout(() => {
      setIsShuffling(false);
    }, 2000);
  };

  const drawCard = () => {
    if (drawnCards.length >= 6 || availableCards.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards[randomIndex];
    const isReversed = Math.random() > 0.5;
    
    const newAvailable = [...availableCards];
    newAvailable.splice(randomIndex, 1);
    
    setAvailableCards(newAvailable);
    setDrawnCards([...drawnCards, { name: card.name, id: card.id, isReversed }]);
  };

  const getReading = async () => {
    setStep('loading');
    try {
      const result = await getTarotReading(
        formData.name,
        formData.birthDate,
        formData.birthTime || '모름',
        formData.calendarType,
        formData.category,
        drawnCards
      );
      setReading(result || '리딩을 가져오지 못했습니다. 다시 시도해주세요.');
      setStep('result');
    } catch (err) {
      console.error(err);
      setError('타로 리딩 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setStep('form');
    }
  };

  const resetForm = () => {
    setStep('form');
    setReading('');
    setDrawnCards([]);
  };

  return (
    <div className="min-h-screen atmosphere flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* 1. 배경 오로라 애니메이션 추가 */}
      <div className="absolute inset-0 z-0 op-10">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 70%, rgba(217, 70, 239, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        />
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 80% 20%, rgba(217, 70, 239, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(217, 70, 239, 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear', delay: 7.5 }}
          className="absolute inset-0"
        />
      </div>

      <div className="w-full max-w-2xl z-10 relative">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center justify-center p-3 rounded-full bg-violet-900/30 border border-violet-500/30 mb-6"
          >
            <Moon className="w-6 h-6 text-violet-300 mr-2" />
            <Star className="w-5 h-5 text-violet-400 mr-2" />
            <Sun className="w-6 h-6 text-violet-300" />
          </motion.div>
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-fuchsia-200 to-violet-200 mb-4"
          >
            영타로 마스터
          </motion.h1>
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-violet-200/70 text-lg"
          >
            당신의 운명과 마주하는 신비로운 시간
          </motion.p>
        </div>

        {step === 'form' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel rounded-3xl p-6 sm:p-10"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-violet-200 mb-2">이름</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-violet-950/40 border border-violet-500/30 rounded-xl px-4 py-3 text-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-violet-300/30"
                    placeholder="홍길동"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-violet-200 mb-2">생년월일</label>
                    <input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full bg-violet-950/40 border border-violet-500/30 rounded-xl px-4 py-3 text-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label htmlFor="calendarType" className="block text-sm font-medium text-violet-200 mb-2">양력/음력</label>
                    <div className="flex space-x-4 h-[50px]">
                      <label className="flex-1 flex items-center justify-center cursor-pointer">
                        <input
                          type="radio"
                          name="calendarType"
                          value="양력"
                          checked={formData.calendarType === '양력'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`w-full h-full flex items-center justify-center rounded-xl border transition-all ${
                          formData.calendarType === '양력' 
                            ? 'bg-violet-600/40 border-violet-400 text-white' 
                            : 'bg-violet-950/40 border-violet-500/30 text-violet-300/70 hover:bg-violet-900/40'
                        }`}>
                          양력
                        </div>
                      </label>
                      <label className="flex-1 flex items-center justify-center cursor-pointer">
                        <input
                          type="radio"
                          name="calendarType"
                          value="음력"
                          checked={formData.calendarType === '음력'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`w-full h-full flex items-center justify-center rounded-xl border transition-all ${
                          formData.calendarType === '음력' 
                            ? 'bg-violet-600/40 border-violet-400 text-white' 
                            : 'bg-violet-950/40 border-violet-500/30 text-violet-300/70 hover:bg-violet-900/40'
                        }`}>
                          음력
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="birthTime" className="block text-sm font-medium text-violet-200 mb-2">태어난 시 (선택)</label>
                  <input
                    type="time"
                    id="birthTime"
                    name="birthTime"
                    value={formData.birthTime}
                    onChange={handleInputChange}
                    className="w-full bg-violet-950/40 border border-violet-500/30 rounded-xl px-4 py-3 text-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-violet-200 mb-4">어떤 고민이 있으신가요?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-violet-600/40 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                            : 'bg-violet-950/40 border-violet-500/30 text-violet-300/70 hover:bg-violet-900/40 hover:border-violet-400/50'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-violet-200' : 'text-violet-400/70'}`} />
                        <span className="text-sm font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-200 text-sm text-center">
                  {error}
                </div>
              )}

              {/* 2. 버튼 무지개 빛 호버 효과 추가 */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl font-medium text-lg text-white bg-violet-600 hover:bg-violet-500 transition-all flex items-center justify-center group relative overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 animate-rainbow opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  타로 카드 뽑기
                </div>
              </button>
            </form>
          </motion.div>
        )}

        {step === 'drawing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center"
          >
            <h2 className="text-2xl font-serif text-violet-200 mb-6 relative">
              <Sparkles className="absolute -left-8 top-1 w-5 h-5 text-violet-400 animate-pulse" />
              {isShuffling ? '카드를 섞는 중...' : `카드를 뽑아주세요 (${drawnCards.length}/6)`}
              <Sparkles className="absolute -right-8 top-1 w-5 h-5 text-violet-400 animate-pulse" />
            </h2>
            
            {isShuffling ? (
              <div className="relative w-40 h-60 mb-12">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      x: [0, (i % 2 === 0 ? 1 : -1) * 30, 0],
                      y: [0, (i % 2 === 0 ? -1 : 1) * 10, 0],
                      rotate: [0, (i % 2 === 0 ? 5 : -5), 0]
                    }}
                    transition={{ duration: 0.5, repeat: 3, ease: "easeInOut", delay: i * 0.1 }}
                    className="absolute inset-0 bg-violet-900 border-2 border-violet-400/50 rounded-xl shadow-xl flex items-center justify-center"
                    style={{ zIndex: i }}
                  >
                    <Star className="w-8 h-8 text-violet-400/50" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="mb-12 relative w-40 h-60 cursor-pointer group" onClick={drawCard}>
                  {drawnCards.length < 6 ? (
                    <motion.div 
                      whileHover={{ y: -10, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute inset-0 bg-gradient-to-br from-violet-800 to-indigo-900 border-2 border-violet-400/50 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.3)] flex items-center justify-center group-hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all"
                    >
                      <div className="w-full h-full border-4 border-transparent border-t-violet-400/30 border-b-violet-400/30 rounded-lg m-2 flex items-center justify-center">
                        <Moon className="w-12 h-12 text-violet-300/50" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 border-2 border-dashed border-violet-500/30 rounded-xl flex items-center justify-center">
                      <span className="text-violet-400/50">모두 뽑았습니다</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full opacity-90">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const card = drawnCards[index];
                    const position = index < 2 ? '과거' : index < 4 ? '현재' : '미래';
                    
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <span className="text-violet-300/70 text-sm mb-2">{position} {index % 2 + 1}</span>
                        <div className="w-full aspect-[2/3] relative perspective-1000">
                          <motion.div
                            initial={false}
                            animate={{ rotateY: card ? 180 : 0 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                            className="w-full h-full relative preserve-3d"
                          >
                            {/* Back of card */}
                            <div className="absolute inset-0 backface-hidden bg-violet-950/50 border border-violet-500/30 rounded-lg flex items-center justify-center">
                              <Star className="w-6 h-6 text-violet-500/20" />
                            </div>
                            
                            {/* Front of card */}
                            <div 
                              className="absolute inset-0 backface-hidden bg-violet-900 border-2 border-violet-300 rounded-lg overflow-hidden shadow-lg"
                              style={{ transform: 'rotateY(180deg)' }}
                            >
                              {card && (
                                <>
                                  <img 
                                    src={getCardImageUrl(card.id)} // 진짜 이미지 URL 사용
                                    alt={card.name}
                                    className={`w-full h-full object-cover transition-transform duration-700 ${card.isReversed ? 'rotate-180' : ''}`}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      // Fallback to picsum if sacred-texts blocks the image
                                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(card.name)}/400/600`;
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-violet-950/90 via-violet-900/40 to-transparent flex flex-col justify-end p-2 text-center">
                                    <span className="text-white font-serif text-xs sm:text-sm font-bold leading-tight drop-shadow-lg">
                                      {card.name.split(' (')[0]}
                                    </span>
                                    <span className="text-violet-300 text-[10px] sm:text-xs mt-1 drop-shadow-md">
                                      {card.isReversed ? '(역방향)' : '(정방향)'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {drawnCards.length === 6 && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={getReading}
                    className="mt-12 px-8 py-4 rounded-xl font-medium text-lg text-white bg-violet-600 hover:bg-violet-500 transition-all flex items-center group relative overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 animate-rainbow opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                      타로 리딩 보기
                    </div>
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative w-32 h-32 mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-violet-500/50 rounded-full"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-2 border-violet-400/30 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-violet-300 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-serif text-violet-200 mb-2">우주의 기운을 모으는 중...</h2>
            <p className="text-violet-400/70">당신의 운명의 카드를 해석하고 있습니다</p>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl p-6 sm:p-10 w-full"
          >
            <div className="flex items-center justify-center mb-8">
              <Star className="w-6 h-6 text-violet-400 mr-3 animate-pulse" />
              <h2 className="text-2xl font-serif text-violet-100">당신의 타로 리딩</h2>
              <Star className="w-6 h-6 text-violet-400 ml-3 animate-pulse" />
            </div>

            <div className="mb-12 space-y-8 opacity-90">
              {[
                { title: '과거', cards: [drawnCards[0], drawnCards[1]] },
                { title: '현재', cards: [drawnCards[2], drawnCards[3]] },
                { title: '미래', cards: [drawnCards[4], drawnCards[5]] },
              ].map((section, idx) => (
                <div key={idx} className="flex flex-col items-center bg-violet-950/30 p-6 rounded-2xl border border-violet-500/20">
                  <h3 className="text-xl font-serif text-violet-200 mb-6 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-violet-400" />
                    [{section.title}]
                    <Sparkles className="w-5 h-5 ml-2 text-violet-400" />
                  </h3>
                  <div className="flex justify-center gap-4 sm:gap-8 w-full">
                    {section.cards.map((card, cardIdx) => card && (
                      <div key={cardIdx} className="relative w-32 h-48 sm:w-40 sm:h-60 rounded-xl overflow-hidden border-2 border-violet-400/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                        <img 
                          src={getCardImageUrl(card.id)} // 진짜 이미지 URL 사용
                          alt={card.name}
                          className={`w-full h-full object-cover ${card.isReversed ? 'rotate-180' : ''}`}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(card.name)}/400/600`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-violet-950/90 via-violet-900/40 to-transparent flex flex-col justify-end p-3 text-center">
                          <span className="text-white font-serif text-sm sm:text-base font-bold leading-tight drop-shadow-lg">
                            {card.name.split(' (')[0]}
                          </span>
                          <span className="text-violet-300 text-xs sm:text-sm mt-1 drop-shadow-md">
                            {card.isReversed ? '(역방향)' : '(정방향)'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 3. 리딩창 광채 효과 추가 */}
            <div className="markdown-body mb-10 bg-violet-950/20 p-6 sm:p-8 rounded-2xl border border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.2)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-600/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Markdown>{reading.replace(/\\\*/g, '*').replace(/\*\*\s+([^\*]+?)\s+\*\*/g, '**$1**')}</Markdown>
            </div>

            <button
              onClick={resetForm}
              className="w-full py-4 rounded-xl bg-violet-900/40 border border-violet-500/30 text-violet-200 font-medium hover:bg-violet-800/50 transition-all flex items-center justify-center group"
            >
              <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              새로운 질문하기
            </button>
          </motion.div>
        )}
      </div>

      {/* Tailwind CSS 사용자 정의 애니메이션 등록 */}
      <style>{`
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-rainbow {
          background-size: 200% 200%;
          animation: rainbow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}