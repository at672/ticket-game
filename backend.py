from flask import Flask, request, jsonify, render_template
import numpy as np
from scipy.stats import binom

app = Flask(__name__)

# Game Constants
MAX_LEVEL = 50
COST_ARRAY = [0, 1, 2, 4, 8, 10]
FAILURE_PROB = 0.25
SUCCESS_PROB = 0.75
EXPRESS_START_LEVEL = 20
TICKETS_FOR_100_EXPRESS = 206  # Updated from 205
TICKETS_FOR_100_REGULAR = 367  # Updated from 366 for consistency

def calculate_binom_probability(n_trials, max_failures):
    """Calculate probability of having max_failures or fewer failures in n_trials"""
    if max_failures < 0:
        return 0.0
    return binom.cdf(max_failures, n_trials, FAILURE_PROB)

def get_failure_cost(num_failures):
    """Calculate total ticket cost given number of failures"""
    if num_failures <= 0:
        return 1  # Initial cost to play (unless express start)
    
    total_cost = 1  # Initial cost (unless express start)
    for i in range(num_failures):
        cost_index = min(i, len(COST_ARRAY) - 1)
        total_cost += COST_ARRAY[cost_index]
    return total_cost

def get_max_failures_covered(regular_tickets, is_express_start):
    """
    Calculate maximum number of failures that can be covered with given tickets.
    
    Args:
        regular_tickets (int): Number of regular tickets available
        is_express_start (bool): Whether using express start (costs 1 express ticket) or regular start (costs 1 regular ticket)
    
    Returns:
        int: Maximum number of failures that can be covered
    """
    failures = 0
    current_cost = 0 if is_express_start else 1  # Initial regular ticket cost
    remaining_tickets = regular_tickets
    
    # If regular start and no tickets to even start the game
    if not is_express_start and remaining_tickets < 1:
        return 0
        
    # Adjust remaining tickets if regular start
    if not is_express_start:
        remaining_tickets -= 1
        
    while True:
        next_failure_cost = COST_ARRAY[min(failures, len(COST_ARRAY) - 1)]
        if current_cost + next_failure_cost > remaining_tickets:
            return failures
        current_cost += next_failure_cost
        failures += 1

def calculate_expected_additional_cost(n_trials, current_failures):
    """
    Calculate expected additional ticket cost for remaining trials
    n_trials: number of risky trials remaining
    current_failures: number of failures encountered so far
    """
    expected_cost = 0
    
    # For each possible number of additional failures (0 to n_trials)
    for k in range(n_trials + 1):
        # Probability of exactly k failures in n_trials
        prob_k = binom.pmf(k, n_trials, FAILURE_PROB)
        
        # Calculate cost of k additional failures
        additional_cost = 0
        for i in range(k):
            failure_index = current_failures + i
            cost_index = min(failure_index, len(COST_ARRAY) - 1)
            additional_cost += COST_ARRAY[cost_index]
            
        expected_cost += prob_k * additional_cost
    
    return expected_cost

@app.route('/')
def home():
    """Serve the main game page"""
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    """
    Calculate game probabilities and expected costs
    """
    try:
        data = request.json
        current_level = data.get("current_level", 1)
        remaining_tickets = data.get("remaining_tickets", 0)
        total_failures = data.get("total_failures", 0)
        is_express_start = data.get("is_express_start", False)
        
        print(f"Received calculate request: level={current_level}, tickets={remaining_tickets}, failures={total_failures}, express={is_express_start}")
        
        # Calculate remaining risky trials
        risky_trials = sum(1 for level in range(current_level, MAX_LEVEL + 1) 
                          if level % 5 != 0)
        
        print(f"Risky trials calculated: {risky_trials}")
        
        # Calculate max additional failures we can afford
        current_cost = get_failure_cost(total_failures)
        if is_express_start:
            current_cost -= 1  # Remove initial ticket cost for express start
            
        max_additional_failures = 0
        while get_failure_cost(total_failures + max_additional_failures + 1) - current_cost <= remaining_tickets:
            max_additional_failures += 1
            
        print(f"Max additional failures: {max_additional_failures}")

        # Calculate probabilities
        current_prob = calculate_binom_probability(risky_trials, max_additional_failures)
        
        print(f"Current probability calculated: {current_prob}")
        
        # Calculate expected additional cost
        expected_cost = calculate_expected_additional_cost(risky_trials, total_failures)
        
        # For restart probability calculations...
        start_level = EXPRESS_START_LEVEL if is_express_start else 1
        total_risky_trials = sum(1 for level in range(start_level, MAX_LEVEL + 1) 
                                if level % 5 != 0)
        restart_max_failures = 0
        while get_failure_cost(restart_max_failures + 1) <= remaining_tickets:
            restart_max_failures += 1
        restart_prob = calculate_binom_probability(total_risky_trials, restart_max_failures)

        response = {
            "current_probability": float(current_prob),
            "restart_probability": float(restart_prob),
            "is_safe_level": (current_level % 5 == 0),
            "next_failure_cost": COST_ARRAY[min(total_failures, len(COST_ARRAY) - 1)],
            "expected_additional_cost": float(expected_cost)
        }
        
        print(f"Sending response: {response}")
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in calculate endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "current_probability": 0,
            "restart_probability": 0,
            "is_safe_level": False,
            "next_failure_cost": 0,
            "expected_additional_cost": 0
        }), 200  # Return 200 instead of 500 to avoid HTML error page
@app.route('/max_failures', methods=['POST'])
def calculate_max_failures():
    """Calculate maximum failures covered based on initial conditions"""
    data = request.json
    regular_tickets = data.get("regular_tickets", 0)
    is_express_start = data.get("is_express_start", False)
    
    print(f"Received request: tickets={regular_tickets}, express_start={is_express_start}")

    max_failures = get_max_failures_covered(regular_tickets, is_express_start)
    
    print(f"Calculated max failures: {max_failures}")

    return jsonify({
        "max_failures_covered": max_failures
    })

if __name__ == '__main__':
    app.run(debug=True)