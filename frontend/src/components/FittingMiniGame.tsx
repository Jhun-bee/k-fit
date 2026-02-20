import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const FittingMiniGame: React.FC = () => {
    const { t } = useTranslation();
    const [grid, setGrid] = useState<string[]>([]);
    const [targetIndex, setTargetIndex] = useState<number>(0);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [message, setMessage] = useState<string | null>(null);

    // Game Config
    const GRID_SIZE = 16; // 4x4

    const generateLevel = (currentLevel: number) => {
        let mainChar = '';
        let diffChar = '';

        if (currentLevel <= 3) {
            // Easy: Distinct numbers
            const pairs = [
                ['1', '7'], ['6', '9'], ['3', '8'], ['2', '5'], ['0', '8']
            ];
            const pair = pairs[Math.floor(Math.random() * pairs.length)];
            mainChar = pair[0];
            diffChar = pair[1];
        } else if (currentLevel <= 6) {
            // Hard: Similar looking or Mix
            const pairs = [
                ['O', '0'], ['5', 'S'], ['1', 'I'], ['8', 'B'], ['Z', '2']
            ];
            const pair = pairs[Math.floor(Math.random() * pairs.length)];
            mainChar = pair[0];
            diffChar = pair[1];
        } else {
            // Expert: Emojis
            const emojiPairs = [
                ['😀', '😃'], ['😐', '😑'], ['🐱', '🐯'], ['🌙', '🌜'], ['⭐', '🌟']
            ];
            const pair = emojiPairs[Math.floor(Math.random() * emojiPairs.length)];
            mainChar = pair[0];
            diffChar = pair[1];
        }

        // Randomize who is main
        if (Math.random() > 0.5) [mainChar, diffChar] = [diffChar, mainChar];

        const newGrid = Array(GRID_SIZE).fill(mainChar);
        const newTargetIndex = Math.floor(Math.random() * GRID_SIZE);
        newGrid[newTargetIndex] = diffChar;

        setGrid(newGrid);
        setTargetIndex(newTargetIndex);
    };

    useEffect(() => {
        generateLevel(level);
    }, [level]);

    const handleClick = (index: number) => {
        if (index === targetIndex) {
            // Correct
            setMessage('Correct! +1');
            setScore(prev => prev + 1);

            setTimeout(() => {
                setMessage(null);
                setLevel(prev => prev + 1);
            }, 500);
        } else {
            // Wrong
            setMessage('Try again!');
            setTimeout(() => {
                setMessage(null);
            }, 500);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white/90 rounded-2xl shadow-lg border-2 border-pink-100 max-w-xs mx-auto">
            <h3 className="font-bold text-gray-700 mb-2">{t('mini_game.title', 'Find the different one!')}</h3>

            <div className="flex justify-between w-full mb-3 px-2 text-sm font-bold text-pink-500">
                <span>Lv. {level}</span>
                <span>Score: {score}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2">
                {grid.map((char, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleClick(idx)}
                        className={`w-12 h-12 flex items-center justify-center text-2xl font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95
                            ${idx === targetIndex ? 'bg-white hover:bg-gray-50' : 'bg-white'} 
                            border-2 border-gray-100 shadow-sm
                        `}
                        // Note: User asked for "background color slightly different for answer but hard to see"
                        // Tailwind 'bg-white' vs something very subtle like 'bg-[#fefefe]' is hard. 
                        // Let's stick to uniform visuals as the user said "background color... different... (should not be obvious?)"
                        // Actually the user said: "일반은 white, 정답은 살짝 다른 white (눈에 안 띄게)"
                        // Let's try stylistic: bg-white for all, maybe faint pattern? 
                        // Simplified: Uniform look is harder, which is the point.
                        style={{
                            backgroundColor: idx === targetIndex ? '#fcfcfc' : '#ffffff',
                            color: '#333'
                        }}
                    >
                        {char}
                    </button>
                ))}
            </div>

            {message ? (
                <div className={`text-sm font-bold animate-bounce ${message.includes('Correct') ? 'text-green-500' : 'text-red-500'}`}>
                    {message}
                </div>
            ) : (
                <div className="h-5"></div>
            )}

            <p className="text-xs text-center text-gray-400 mt-2">
                {t('mini_game.keep_playing', 'Keep playing while we fit your style!')}
            </p>
        </div>
    );
};

export default FittingMiniGame;
