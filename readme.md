# Ticket Game Simulator

[![Deploy to Render](https://img.shields.io/badge/Deploy%20to-Render-00D735)](https://ticket-game-simulation.onrender.com/)
![GitHub last commit](https://img.shields.io/github/last-commit/at672/ticket-game)

A probability-based level-up game simulator built with Flask and React. Players navigate through 50 levels using tickets, with strategy required to manage resources and maximize success probability.

This project is deployed on Render on their free tier. Please allow up to three minutes for the process to start up, as Render will need to spool up the process on their backend.

## Summary

Based on a fun minigame within the mobile game Idle Miner Tycoon, the ticket game simulator provides a framework for players to analyze their probability of winning the minigame as they navigate through 50 levels using a finite number of tickets as currency. The goal of the game is to reach level 50 without running out of tickets, which are needed to play the game. 

Levels are either safe, or non-safe. Each non-safe level presents a 75% chance of success and a 25% chance of failure, simulated through a simple box-selection mechanic where one of four boxes leads to failure. While failing a level does not reset progress, continuing after a failure requires spending additional tickets. The ticket cost for failures follows a strategic scaling system - the first failure is free, but subsequent failures become increasingly expensive, following a cost pattern of 0, 1, 2, 4, 8, and 10 tickets. The game incorporates safe levels at every multiple of 5 (levels 5, 10, 15, etc.) where success is guaranteed, providing strategic checkpoints for players. 

As if that was not complicated enough, there exists the express ticket, which allows a user to begin directly at level 20. This reduces the number of risky trials (non-safe levels) that a person needs to clear, meaning they can play the game and achieve a high probability of success (reaching level 50) with less total (regular) tickets. The game actively calculates and displays success probabilities and expected costs, helping players make informed decisions about their progression strategy.

## Live Demo
🎮 [Play the Game](https://ticket-game-simulation.onrender.com/)

## Features

- 50 challenging levels
- Probability-based gameplay (75% success, 25% failure rate)
- Safe checkpoints every 5 levels
- Dynamic ticket cost system for failures
- Real-time probability calculations
- Express ticket system
- Interactive UI with keyboard controls

## Technical Implementation

### Core Technology Stack

The application leverages a modern full-stack architecture with careful consideration for mathematical precision and user experience:

#### Backend Architecture
- **Python/Flask**: Powers the web server and API endpoints
- **NumPy/SciPy**: Handles precise probability calculations using binomial cumulative distribution functions
- **Gunicorn**: Production-grade WSGI server for deployment

#### Frontend Architecture
- **React**: Manages game state and provides responsive user interactions
- **Tailwind CSS**: Implements responsive design through utility classes
- **Browser APIs**: Implements keyboard controls for enhanced user experience

### Technical Challenges and Solutions

#### Probability Calculation Precision
- Implemented exact binomial probability calculations using SciPy's `binom.cdf` function
- Deliberately avoided rounding to ensure mathematical accuracy
- Only display 100% probability when the cumulative distribution function confirms absolute certainty
- Handled edge cases where failure count exceeds the cost array length

#### State Management Implementation
- Implemented careful state updates for game progression
- Structured React component state to handle all game variables
- Added comprehensive error handling for API responses
- Designed a robust failure tracking system that properly calculates cumulative costs

#### User Interface Features
- Implemented keyboard controls with proper event listeners
- Created an intuitive express ticket system with proper validation
- Developed clear visual feedback for success/failure states
- Used Tailwind's utility classes for consistent styling

#### Deployment Setup
- Configured Gunicorn for production deployment
- Set up static file serving
- Implemented proper error handling
- Established automatic deployment through Render

### Development Insights

The development process revealed several interesting technical considerations:

1. **Probability Implementation**: The game's probability system required careful handling of edge cases, particularly around:
   - Safe level probability calculations
   - Express start scenarios
   - Maximum failure calculations based on remaining tickets
   - Proper handling of the failure cost array

2. **State Management**: The game state management required attention to:
   - Proper initialization of game state
   - Handling user inputs and validation
   - Updating probability calculations based on state changes
   - Managing the relationship between regular and express tickets

3. **User Experience**: Several features were implemented for better gameplay:
   - Keyboard controls for faster gameplay
   - Clear visual feedback for game events
   - Real-time probability updates
   - Intuitive failure recovery system

## Game Mechanics

- Players start with a set number of tickets
- Each level (except safe levels) has:
  - 75% chance of success
  - 25% chance of failure
- Safe levels occur every 5 levels (5, 10, 15, etc.)
- Failure costs increase based on total failures:
  - First failure: 0 tickets
  - Second failure: 1 ticket
  - Third failure: 2 tickets
  - Fourth failure: 4 tickets
  - Fifth failure: 8 tickets
  - Sixth and beyond: 10 tickets each
- Express tickets allow starting at level 20

## Controls

- **Enter**: Progress to next level
- **Z**: Trigger failure (for testing)
- On-screen buttons for all actions

## Development

1. Clone the repository:
```bash
git clone https://github.com/at672/ticket-game.git
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run locally:
```bash
python backend.py
```

## Deployment

This project is deployed on Render. The deployment process is automated through GitHub integration:

1. Changes pushed to the main branch trigger automatic deployments
2. Render handles all dependencies and build processes
3. The application is served using Gunicorn for production-grade performance

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.