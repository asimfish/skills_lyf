# Lecture Slides: Probability Fundamentals

**Course:** STAT-101 - Introduction to Statistical Methods
**Topic:** Probability Fundamentals
**Week:** 4
**Duration:** 50 minutes

---

## Learning Objectives

By the end of this lecture, students will be able to:

1. Define probability using the frequentist interpretation
2. Identify sample spaces and events
3. Apply the three basic probability rules
4. Calculate conditional probabilities
5. Determine if events are independent

---

## Slide 1: What is Probability?

### Probability: A Measure of Uncertainty

**Definition:** Probability is a number between 0 and 1 that measures the likelihood of an event occurring.

- $P(A) = 0$ means A is impossible
- $P(A) = 1$ means A is certain
- $P(A) = 0.5$ means A is equally likely to occur or not

**Frequentist Interpretation:**
If we repeat an experiment many times, $P(A)$ is the proportion of times A occurs.

$$P(A) = \lim_{n \to \infty} \frac{\text{number of times A occurs}}{n}$$

---

## Slide 2: Sample Spaces and Events

### Key Terminology

**Sample Space (S):** The set of all possible outcomes

**Event:** A subset of the sample space

### Example: Rolling a Die

- **Sample Space:** $S = \{1, 2, 3, 4, 5, 6\}$
- **Event A:** Rolling an even number = $\{2, 4, 6\}$
- **Event B:** Rolling greater than 4 = $\{5, 6\}$

### Visual Representation

```
Sample Space S = {1, 2, 3, 4, 5, 6}

Event A (even): [2] [4] [6]
Event B (>4):           [5] [6]
```

---

## Slide 3: Basic Probability Rules

### The Three Fundamental Rules

**Rule 1: Range**
$$0 \leq P(A) \leq 1$$

**Rule 2: Complement**
$$P(\text{not } A) = P(A^c) = 1 - P(A)$$

**Rule 3: Sum of all outcomes**
$$P(S) = 1$$

### Example
If $P(\text{rain}) = 0.3$, then $P(\text{no rain}) = 1 - 0.3 = 0.7$

---

## Slide 4: Addition Rule

### For Two Events A and B

**General Addition Rule:**
$$P(A \text{ or } B) = P(A) + P(B) - P(A \text{ and } B)$$

**Special Case - Mutually Exclusive Events:**
If A and B cannot both occur, then $P(A \text{ and } B) = 0$

$$P(A \text{ or } B) = P(A) + P(B)$$

### Example: Drawing Cards

What is $P(\text{King or Heart})$?

- $P(\text{King}) = 4/52$
- $P(\text{Heart}) = 13/52$
- $P(\text{King and Heart}) = 1/52$ (King of Hearts)

$$P(\text{King or Heart}) = \frac{4}{52} + \frac{13}{52} - \frac{1}{52} = \frac{16}{52} = 0.308$$

---

## Slide 5: Conditional Probability

### Probability Given New Information

**Definition:** The probability of A given that B has occurred:

$$P(A|B) = \frac{P(A \text{ and } B)}{P(B)}$$

### Example: Disease Testing

- 1% of population has disease: $P(D) = 0.01$
- Test is 95% accurate for diseased: $P(+|D) = 0.95$
- Test is 90% accurate for healthy: $P(-|D^c) = 0.90$

If someone tests positive, what's the probability they have the disease?

*This leads to Bayes' Theorem (next lecture)*

---

## Slide 6: Independence

### When Does One Event Not Affect Another?

**Definition:** Events A and B are independent if:
$$P(A|B) = P(A)$$

Equivalently:
$$P(A \text{ and } B) = P(A) \times P(B)$$

### Example: Coin Flips

Each flip is independent of previous flips.

$P(\text{Heads on flip 2} | \text{Heads on flip 1}) = P(\text{Heads}) = 0.5$

**Common Misconception:** After 5 heads in a row, a tail is "due"
- **Wrong!** Each flip is still 50-50

---

## Slide 7: Multiplication Rule

### For Dependent Events

$$P(A \text{ and } B) = P(A) \times P(B|A)$$

### For Independent Events

$$P(A \text{ and } B) = P(A) \times P(B)$$

### Example: Drawing Without Replacement

Draw 2 cards without replacement. $P(\text{both Kings})$?

$$P(K_1 \text{ and } K_2) = P(K_1) \times P(K_2|K_1) = \frac{4}{52} \times \frac{3}{51} = 0.0045$$

---

## Slide 8: Summary Table

| Concept | Formula |
|---------|---------|
| Complement | $P(A^c) = 1 - P(A)$ |
| Addition (general) | $P(A \cup B) = P(A) + P(B) - P(A \cap B)$ |
| Addition (mutually exclusive) | $P(A \cup B) = P(A) + P(B)$ |
| Conditional | $P(A|B) = \frac{P(A \cap B)}{P(B)}$ |
| Multiplication (general) | $P(A \cap B) = P(A) \times P(B|A)$ |
| Multiplication (independent) | $P(A \cap B) = P(A) \times P(B)$ |

---

## Slide 9: Practice Problems

### Problem 1
A bag contains 3 red and 5 blue marbles. If you draw 2 marbles without replacement, what is $P(\text{both red})$?

### Problem 2
If $P(A) = 0.4$ and $P(B) = 0.3$, and A and B are independent, find:
- $P(A \text{ and } B)$
- $P(A \text{ or } B)$

### Problem 3
In a class, 60% are women. Of the women, 30% are statistics majors. Of the men, 20% are statistics majors. What is $P(\text{woman | statistics major})$?

---

## Slide 10: Key Takeaways

1. **Probability quantifies uncertainty** (0 to 1)
2. **Addition rule** for "or" questions
3. **Multiplication rule** for "and" questions
4. **Conditional probability** updates beliefs with new information
5. **Independence** means one event doesn't affect another

### Next Lecture
- Bayes' Theorem
- Random Variables
- Expected Value

### Reading
- Textbook Chapter 4.1-4.3
- Practice problems 4.1-4.20

---

*Slides generated by scholar v2.0.0*
