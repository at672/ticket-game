// Game constants
const MAX_LEVEL = 50;
const COST_ARRAY = [0, 1, 2, 4, 8, 10];
const EXPRESS_START_LEVEL = 20;

// Add the format function here
const formatProbability = (probability) => {
    if (probability === 1) return '100%';
    
    const percentage = probability * 100;
    if (percentage > 99.99) return '> 99.99%';
    
    return `${percentage.toFixed(2)}%`;
};

function GameInterface() {
    // Main game state
    const [gameState, setGameState] = React.useState({
        isStarted: false,
        currentLevel: 1,
        totalFailures: 0,
        initialTickets: 0,
        remainingTickets: 0,
        expressTickets: 0,
        isExpressStart: false,
        currentProbability: 0,
        restartProbability: 0,
        expectedAdditionalCost: 0,
        isSafeLevel: false,
        showFailurePrompt: false,
        nextFailureCost: 0,
        showStartOptions: false,  // Shows express/regular start choice
        maxFailuresCovered: 0,
        hasFailedCurrentLevel: false,  // New state to track if current level has had a failure
    });

    // Effect to calculate probabilities when game state changes
    React.useEffect(() => {
        if (!gameState.isStarted) return;

        const fetchProbabilities = async () => {
            try {
                console.log('Fetching probabilities with:', {
                    current_level: gameState.currentLevel,
                    remaining_tickets: gameState.remainingTickets,
                    total_failures: gameState.totalFailures,
                    is_express_start: gameState.isExpressStart
                });

                const response = await fetch('/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        current_level: gameState.currentLevel,
                        remaining_tickets: gameState.remainingTickets,
                        total_failures: gameState.totalFailures,
                        is_express_start: gameState.isExpressStart
                    }),
                });
                const data = await response.json();
                console.log('Received probability data:', data);

                setGameState(prev => ({
                    ...prev,
                    currentProbability: data.current_probability,
                    restartProbability: data.restart_probability,
                    expectedAdditionalCost: data.expected_additional_cost,
                    isSafeLevel: data.is_safe_level,
                    nextFailureCost: data.next_failure_cost,
                }));
            } catch (error) {
                console.error('Failed to fetch probabilities:', error);
            }
        };

        fetchProbabilities();
    }, [gameState.isStarted, gameState.currentLevel, gameState.remainingTickets, gameState.totalFailures, gameState.isExpressStart]);

    // Handler for initial ticket inputs
    const handleTicketInput = (type, value) => {
        const numValue = parseInt(value) || 0;
        setGameState(prev => {
            const newState = {
                ...prev,
                [type === 'regular' ? 'initialTickets' : 'expressTickets']: numValue
            };
            
            // Show start options if we have both types of tickets
            newState.showStartOptions = (type === 'regular' ? numValue : prev.initialTickets) > 0 && 
                                      (type === 'express' ? numValue : prev.expressTickets) > 0;
            
            return newState;
        });
    };

    // Handler for starting game (either regular or express)
    const handleStartGame = async (isExpressStart) => {
        if (isExpressStart && gameState.expressTickets <= 0) {
            return; // Can't express start without express tickets
        }

        // Calculate remaining tickets first
        const remainingTickets = gameState.initialTickets - (isExpressStart ? 0 : 1);

        try {
            console.log('Sending to /max_failures:', {
                regular_tickets: remainingTickets,
                is_express_start: isExpressStart
            });

        // // Calculate max failures covered at start
        // try {
            const response = await fetch('/max_failures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    regular_tickets: remainingTickets,
                    is_express_start: isExpressStart
                }),
            });
            const data = await response.json();
            console.log('Received from /max_failures:', data);

            setGameState(prev => ({
                ...prev,
                isStarted: true,
                currentLevel: isExpressStart ? EXPRESS_START_LEVEL : 1,
                // remainingTickets: prev.initialTickets - (isExpressStart ? 0 : 1), // Only regular start costs 1 ticket
                remainingTickets: remainingTickets,
                isExpressStart: isExpressStart,
                expressTickets: isExpressStart ? prev.expressTickets - 1 : prev.expressTickets,
                totalFailures: 0,
                isSafeLevel: false,
                showStartOptions: false,
                maxFailuresCovered: data.max_failures_covered, // Set it once at start
                // Reset probability values on start
                currentProbability: 0,
                restartProbability: 0,
                expectedAdditionalCost: 0
            }));
        } catch (error) {
            console.error('Failed to fetch max failures:', error);
        }
    };

    // Handler for failures
    const handleFailure = () => {
        const nextCost = COST_ARRAY[Math.min(gameState.totalFailures, COST_ARRAY.length - 1)];
        setGameState(prev => ({
            ...prev,
            showFailurePrompt: true,
            nextFailureCost: nextCost,
            hasFailedCurrentLevel: true,  // Set to true when failure occurs
        }));
    };

    // Handler for continuing after failure
    const handleContinueAfterFailure = () => {
        if (gameState.remainingTickets < gameState.nextFailureCost) return;
        
        setGameState(prev => ({
            ...prev,
            remainingTickets: prev.remainingTickets - prev.nextFailureCost,
            totalFailures: prev.totalFailures + 1,
            showFailurePrompt: false,
        }));
    };

    // Handler for level progression
    const handleLevelUp = () => {
        if (gameState.currentLevel >= MAX_LEVEL) return;
        
        setGameState(prev => ({
            ...prev,
            currentLevel: prev.currentLevel + 1,
            isSafeLevel: ((prev.currentLevel + 1) % 5 === 0),
            hasFailedCurrentLevel: false,  // Reset failure state for new level
        }));
    };

    // Handler for quitting game
    const handleQuit = () => {
        setGameState(prev => ({
            ...prev,
            isStarted: false,
            currentLevel: 1,
            totalFailures: 0,
            remainingTickets: 0,
            expressTickets: 0,
            showFailurePrompt: false,
            isExpressStart: false,
            hasFailedCurrentLevel: false,  // Reset failure state
            // Reset probability values as well
            currentProbability: 0,
            restartProbability: 0,
            expectedAdditionalCost: 0
        }));
    };

    // Add keyboard event listeners
    React.useEffect(() => {
        const handleKeyPress = (event) => {
            if (!gameState.isStarted) return;
            
            if (event.key === 'Enter' && !gameState.showFailurePrompt) {
                handleLevelUp();
            } else if (event.key === 'z' && !gameState.showFailurePrompt && !gameState.isSafeLevel) {
                handleFailure();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState.isStarted, gameState.showFailurePrompt, gameState.isSafeLevel]);

    // Render game interface
    return React.createElement('div', { className: 'p-4 max-w-2xl mx-auto' },
        !gameState.isStarted ? (
            // Game Start Screen
            React.createElement('div', { className: 'mb-4 p-6 bg-white rounded-lg shadow' },
                // Regular Tickets Input
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('label', { className: 'block text-sm font-medium mb-2' },
                        'Enter number of regular tickets:'
                    ),
                    React.createElement('input', {
                        type: 'number',
                        min: '1',
                        value: gameState.initialTickets || '',
                        onChange: (e) => handleTicketInput('regular', e.target.value),
                        className: 'w-full p-2 border rounded'
                    })
                ),
                // Express Tickets Input
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('label', { className: 'block text-sm font-medium mb-2' },
                        'Enter number of express tickets (optional):'
                    ),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        value: gameState.expressTickets || '',
                        onChange: (e) => handleTicketInput('express', e.target.value),
                        className: 'w-full p-2 border rounded'
                    })
                ),
                // Start Game Buttons
                gameState.showStartOptions ? 
                    React.createElement('div', { className: 'space-y-2' },
                        React.createElement('button', {
                            onClick: () => handleStartGame(false),
                            className: 'w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600'
                        }, 'Regular Start (1 ticket)'),
                        React.createElement('button', {
                            onClick: () => handleStartGame(true),
                            disabled: gameState.expressTickets <= 0,
                            className: `w-full p-2 rounded ${
                                gameState.expressTickets > 0 
                                    ? 'bg-green-500 text-white hover:bg-green-600' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`
                        }, `Express Start (Level ${EXPRESS_START_LEVEL})`)  // Updated text to use constant
                    )
                    : React.createElement('button', {
                        onClick: () => handleStartGame(false),
                        disabled: gameState.initialTickets <= 0,
                        className: 'w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-300'
                    }, 'Start Game')
            )
        ) : (
            // Active Game Screen
            React.createElement('div', { className: 'space-y-4' },
                // Game Status Card
                React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow' },
                    React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                        // Level Display
                        React.createElement('div', null,
                            React.createElement('p', { className: 'font-medium' }, 'Current Level:'),
                            React.createElement('p', { className: 'text-2xl' }, gameState.currentLevel)
                        ),
                        // Tickets Display
                        React.createElement('div', null,
                            React.createElement('p', { className: 'font-medium' }, 'Remaining Tickets:'),
                            React.createElement('p', { className: 'text-2xl' }, gameState.remainingTickets)
                        ),
                        // Failures Display
                        React.createElement('div', null,
                            React.createElement('p', { className: 'font-medium' }, 'Total Failures:'),
                            React.createElement('p', { className: 'text-2xl' }, gameState.totalFailures)
                        ),
                        // Success Probability Display
                        React.createElement('div', null,
                            React.createElement('p', { className: 'font-medium' }, 'Success Probability:'),
                            React.createElement('p', { className: 'text-2xl' }, 
                                formatProbability(gameState.currentProbability)
                            )
                        ),
                        // Expected Additional Cost Display
                        React.createElement('div', { className: 'col-span-2' },
                            React.createElement('p', { className: 'font-medium' }, 'Expected Additional Ticket Cost:'),
                            React.createElement('p', { className: 'text-2xl' }, 
                                gameState.expectedAdditionalCost.toFixed(2)
                            )
                        ),
                        React.createElement('div', { className: 'col-span-2' },
                            React.createElement('p', { className: 'font-medium' }, 
                                'Maximum Failures Covered:'
                            ),
                            React.createElement('p', { className: 'text-2xl' }, 
                                gameState.maxFailuresCovered
                            )
                        )
                    )
                ),

                // Safe Level Alert
                gameState.isSafeLevel && React.createElement('div', { 
                    className: 'bg-green-100 border-l-4 border-green-500 p-4'
                },
                    React.createElement('p', { className: 'text-xl font-bold text-green-800' },
                        'Safe level! Press Enter to continue.'
                    )
                ),

                // Failure Prompt
                gameState.showFailurePrompt && React.createElement('div', {
                    className: 'bg-red-50 p-6 rounded-lg shadow'
                },
                    React.createElement('p', { className: 'mb-4' },
                        `Failure! Cost to continue: ${gameState.nextFailureCost} tickets`
                    ),
                    React.createElement('div', { className: 'space-x-4' },
                        React.createElement('button', {
                            onClick: handleContinueAfterFailure,
                            disabled: gameState.remainingTickets < gameState.nextFailureCost,
                            className: 'bg-blue-500 text-white p-2 rounded disabled:bg-gray-300'
                        }, 'Continue'),
                        React.createElement('button', {
                            onClick: handleQuit,
                            className: 'bg-red-500 text-white p-2 rounded'
                        }, 'Quit Game')
                    )
                ),

                // Game Control Buttons
                React.createElement('div', { className: 'space-x-4' },
                    React.createElement('button', {
                        onClick: handleLevelUp,
                        disabled: gameState.showFailurePrompt,
                        className: 'bg-green-500 text-white p-2 rounded disabled:bg-gray-300'
                    }, 'Next Level (Enter)'),
                    React.createElement('button', {
                        id: 'failure-button',
                        onClick: handleFailure,
                        disabled: gameState.showFailurePrompt || gameState.isSafeLevel || gameState.hasFailedCurrentLevel,
                        className: `bg-yellow-500 text-white p-2 rounded 
                            ${(gameState.showFailurePrompt || gameState.isSafeLevel || gameState.hasFailedCurrentLevel) 
                                ? 'bg-gray-300 cursor-not-allowed' 
                                : 'hover:bg-yellow-600'}`
                    }, 'Trigger Failure (Z)'),
                    React.createElement('button', {
                        onClick: handleQuit,
                        className: 'bg-red-500 text-white p-2 rounded'
                    }, 'Quit Game')
                )
            )
        )
    );
}

// Mount the React component
ReactDOM.render(
    React.createElement(GameInterface),
    document.getElementById('root')
);