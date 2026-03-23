# Homework 3: Confidence Intervals

**Student:** Alex Johnson
**Course:** STAT-101
**Date:** 2026-02-15
**Total Points:** 40

---

## Problem 1 (10 points)

A sample of 50 students had a mean GPA of 3.2 with a standard deviation of 0.5. Construct a 95% confidence interval for the population mean GPA.

### My Answer:

The confidence interval is calculated as:

$$\bar{x} \pm z_{\alpha/2} \cdot \frac{s}{\sqrt{n}}$$

Plugging in values:
- $\bar{x} = 3.2$
- $s = 0.5$
- $n = 50$
- $z_{0.025} = 1.96$

$$3.2 \pm 1.96 \cdot \frac{0.5}{\sqrt{50}} = 3.2 \pm 0.139$$

**95% CI: (3.061, 3.339)**

---

## Problem 2 (15 points)

Explain the interpretation of a 95% confidence interval. What does "95% confident" mean?

### My Answer:

A 95% confidence interval means we are 95% sure the true population mean is in our interval. If we calculated the interval as (3.061, 3.339), there's a 95% chance the real mean GPA is somewhere in that range.

The "95%" refers to how confident we are that our specific interval captured the true value.

---

## Problem 3 (15 points)

If we wanted a narrower confidence interval, what are two ways to achieve this? Explain the trade-offs for each approach.

### My Answer:

**Two ways to get a narrower interval:**

1. **Increase sample size (n)**
   - Larger n makes the standard error $\frac{s}{\sqrt{n}}$ smaller
   - Trade-off: Costs more money and takes more time to collect data
   - Example: n=200 would cut the margin of error roughly in half

2. **Lower the confidence level**
   - Using 90% instead of 95% gives a smaller z-value (1.645 vs 1.96)
   - Trade-off: We're less confident our interval contains the true mean
   - We trade precision for certainty

**Additional note:** We cannot reduce s (the sample standard deviation) because it's a property of the data, not something we control.

---

## Self-Assessment

I feel confident about Problem 1 and Problem 3. I'm less sure about my explanation in Problem 2 - I know the basic idea but I'm not sure if I explained the frequentist interpretation correctly.
