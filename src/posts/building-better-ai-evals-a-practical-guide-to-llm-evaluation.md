---
author: 'Jonathan Haas'
pubDate: '2025-01-01'
title: 'Building Better AI Evals: A Practical Guide to LLM Evaluation'
description: 'How to create custom evaluations, model-graded assessments, and domain-specific benchmarks that actually predict real-world performance'
featured: false
draft: true
tags: ['ai-evaluation', 'benchmarking', 'llm', 'evals', 'openai-evals']
---

I've built custom evaluation frameworks for everything from security compliance to code analysis. Here's what I've learned: most teams are evaluating the wrong things, in the wrong ways, for the wrong reasons.

The difference between a useful eval and academic theater often comes down to one question: **Does this actually predict real-world performance?**

## What AI Evaluation Really Is

AI evaluation (evals) is about creating systematic tests to measure how well language models perform on specific tasks. Think of it like unit tests for model behavior—but instead of testing code, you're testing intelligence.

Real evals consist of:


- **Datasets**: Carefully curated input-output pairs
- **Grading logic**: How you determine if a response is correct
- **Metrics**: Quantitative measures of performance
- **Reproducibility**: Others can run your eval and get consistent results

This is different from monitoring production systems or testing API reliability. We're testing the model's actual capabilities.

## The Three Types of Evals That Matter

### 1. Basic Template Evals

These are your bread and butter for straightforward tasks with clear right/wrong answers.


**Match Eval**: Exact string matching

```python
# Example: Testing if model outputs specific commands
test_case = {
    "input": "Show me the Git command to view commit history",
    "expected": ["git log", "git log --one-line"]
}
# Passes if response starts with any expected answer
```


**Includes Eval**: Substring matching

```python
# Example: Testing if model mentions key concepts
test_case = {
    "input": "Explain SQL injection vulnerabilities",
    "expected": ["prepared statements", "parameterized queries", "input validation"]
}
# Passes if response contains any expected concept

```

**FuzzyMatch Eval**: Flexible matching for variations

```python
# Example: Testing technical explanations with word variations
test_case = {
    "input": "What is authentication?",
    "expected": ["verify identity", "confirm user identity", "validate credentials"]
}
# Passes if response contains or is contained in expected answers
```

### 2. Model-Graded Evals


When responses have significant variation, use the model to grade itself. This is where the real power lies.

**The Pattern**:

1. Get model response to original prompt
2. Wrap response in evaluation prompt
3. Model grades its own response
4. Parse the grade into metrics

Here's a factual consistency eval I use:

```yaml
# fact.yaml - Model-graded evaluation
prompt: |
  You are comparing a submitted answer to an expert answer. Please analyze:

  [Submitted]: {completion}
  [Expert]: {correct_answer}

  Choose one:
  A) Submitted answer is subset of expert answer (partially correct)
  B) Submitted answer is superset of expert answer (correct + extra info)  
  C) Submitted answer matches expert answer (exactly correct)
  D) Submitted answer contradicts expert answer (factually wrong)
  E) Submitted answer differs but differences don't affect factual accuracy

  Think step by step, then answer with just the letter.

choice_strings: 'ABCDE'
choice_scores:
  A: 0.7 # Partial credit
  B: 0.9 # Mostly correct
  C: 1.0 # Perfect
  D: 0.0 # Wrong
  E: 0.8 # Different but acceptable
```

### 3. Custom Domain Evals

Generic benchmarks miss domain-specific nuances. Build evals for your actual use case.

For security compliance, I built this eval:

```python
class PolicyComplianceEval:
    def __init__(self):
        self.policy_patterns = self.load_compliance_patterns()

    def evaluate(self, input_text, model_response):
        """
        Evaluates if model correctly identifies compliance violations
        """
        expected_violations = self.extract_violations(input_text)
        model_violations = self.parse_model_response(model_response)

        # Calculate precision and recall
        precision = len(expected_violations & model_violations) / len(model_violations)
        recall = len(expected_violations & model_violations) / len(expected_violations)

        return {
            "precision": precision,
            "recall": recall,
            "f1": 2 * precision * recall / (precision + recall)
        }
```

## The Secret Sauce: Chain-of-Thought Evaluation

The biggest improvement to model-graded evals comes from using chain-of-thought reasoning:

```yaml
eval_type: 'cot_classify' # Chain-of-thought then classify

prompt: |
  Evaluate this code review comment for helpfulness:

  Comment: {completion}
  Code: {code_context}

  Consider:
  1. Does it identify real issues?
  2. Is the suggestion actionable?
  3. Is the tone constructive?

  Think through each criterion, then answer:
  A) Very helpful
  B) Somewhat helpful  
  C) Not helpful
```

This consistently outperforms immediate classification by 15-20% in my testing.


## Building Evaluation Datasets

The quality of your eval depends entirely on your dataset. Here's my process:

### 1. Start With Real Examples

Don't create synthetic data first. Pull actual examples from your production use case:

```python
# Example: Building a code explanation eval
real_examples = [
    {
        "code": "def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)",
        "good_explanation": "Recursive function that calculates Fibonacci numbers...",

        "bad_explanation": "This is a function that does math..."
    }
]
```

### 2. Create Edge Cases Systematically

For each "happy path" example, create variations that test edge cases:

```python
edge_cases = [
    {"code": "", "test": "empty input handling"},

    {"code": "print('hello')", "test": "trivial code explanation"},
    {"code": complex_algorithm, "test": "advanced algorithm explanation"},
    {"code": obfuscated_code, "test": "unclear code interpretation"}
]
```

### 3. Balance Your Dataset

- 60% typical cases

- 25% edge cases
- 15% adversarial cases

## Measuring What Matters


Standard metrics often miss the point. Here's what I track:


### Beyond Accuracy

- **Calibration**: How often is the model confident when it's right?
- **Consistency**: Same input, similar outputs across runs?

- **Robustness**: Performance degrades gracefully with edge cases?

### Domain-Specific Metrics

For security analysis:

- **False Negative Rate**: Missing real vulnerabilities (critical)
- **False Positive Rate**: Flagging benign code (productivity killer)
- **Severity Correlation**: Does the model recognize high-impact issues?

### Practical Metrics

- **Latency**: How long does evaluation take?
- **Cost**: Token usage per evaluation
- **Maintenance**: How often do evals need updating?


## The Evaluation Development Cycle


1. **Start Simple**: Begin with basic template evals
2. **Identify Gaps**: Where do simple evals fail?
3. **Build Model-Graded**: Create model-graded evals for complex cases

4. **Validate Results**: Compare model grades to human judgment on subset
5. **Iterate**: Refine prompts and expand datasets


## Common Pitfalls to Avoid

**Data Leakage**: Your eval dataset appeared in training data

- Solution: Use post-training-cutoff examples or synthetic variations


**Evaluation Prompt Contamination**: Your grading prompt is too similar to training examples

- Solution: Test multiple prompt variations and choose the most reliable

**Insufficient Sample Size**: Drawing conclusions from too few examples


- Solution: Use statistical significance testing

**Gaming the Eval**: Optimizing for the benchmark instead of real performance

- Solution: Hold out a secret test set, refresh evals regularly

## Tools and Frameworks

**OpenAI Evals**: Start here for standard eval patterns

```bash
pip install evals
evals run gpt-4 your-eval-name
```

**Custom Frameworks**: For complex domain-specific evals

```python
from my_eval_framework import Evaluator, ModelGradedEval

evaluator = Evaluator()
evaluator.add_eval(ModelGradedEval("factual-consistency"))
results = evaluator.run(test_cases)
```

## What Actually Predicts Real-World Performance

After building dozens of evals, here's what correlates with production success:


1. **Task-Specific Accuracy**: Generic benchmarks are useful, domain evals are essential
2. **Edge Case Handling**: How gracefully does performance degrade?
3. **Consistency**: Variance in outputs for similar inputs
4. **Calibration**: Model confidence aligns with actual correctness

## Building Your First Eval

Start with this template:


1. **Define the task clearly**: What exactly are you testing?
2. **Collect 50-100 real examples**: Pull from actual usage
3. **Try a basic template eval first**: Often sufficient for MVP
4. **Upgrade to model-graded if needed**: For subjective or complex tasks
5. **Validate on holdout set**: Ensure eval predicts real performance

## The Meta-Game

The most valuable evals evolve with your use case. Set up systems to:

- Automatically flag when eval performance diverges from production
- A/B test different evaluation approaches
- Continuously collect new examples from production

Remember: The goal isn't perfect evaluation—it's evaluation that guides better decisions.

Building good evals is hard work. But it's the difference between shipping models that work in demos and shipping models that work for users.

_Want to see real evaluation frameworks in action? Check out my [semantic-sast project](https://github.com/haasonsaas/semantic-sast) which uses custom evals to achieve 60-70% vulnerability detection vs traditional tools' 44.7%._
