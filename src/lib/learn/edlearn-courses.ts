export interface EdLearnLesson {
  id: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  explanation: string;
  workedExample: {
    title: string;
    description: string;
    input?: string;
    output?: string;
    explanation: string;
    codeSnippet?: string;
  };
  practiceTask: {
    prompt: string;
    starterCode?: string;
    solutionCode: string;
    testCases: Array<{
      input: string;
      expectedOutput: string;
      description?: string;
    }>;
    hints: string[]; // Staged hints: Hint 1 (direction) -> Hint 2 (strategy) -> Hint 3 (pseudo-code)
    commonMistakes: Array<{
      triggerRegexOrValue: string;
      explanation: string;
      suggestedFix: string;
    }>;
  };
}

export interface EdLearnModule {
  id: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  summary: string;
  lessons: EdLearnLesson[];
}

export interface EdLearnCapstone {
  id: string;
  title: string;
  scenario: string;
  deliverables: string[];
  rubric: Array<{
    criterion: string;
    weight: number;
    description: string;
  }>;
  passingScore: number;
  starterCodeOrData: string;
  solutionTests: Array<{
    name: string;
    testFnOrInput: string;
    expectedRegexOrResult: string;
  }>;
}

export interface EdLearnCourse {
  slug: string;
  title: string;
  tagline: string;
  track: "DSA" | "Aptitude" | "SQL";
  level: "Beginner to Advanced";
  estimatedHours: number;
  prerequisites: string[];
  skills: string[];
  icon: string;
  color: string;
  modules: EdLearnModule[];
  capstone: EdLearnCapstone;
}

export const EDLEARN_COURSES: Record<string, EdLearnCourse> = {
  dsa: {
    slug: "dsa",
    title: "Data Structures & Algorithms",
    tagline: "Master foundational and placement-critical algorithms through high-throughput interactive problem solving.",
    track: "DSA",
    level: "Beginner to Advanced",
    estimatedHours: 40,
    prerequisites: ["Basic programming familiarity in Python, Java, or C++"],
    skills: ["Time & Space Complexity", "Hash Maps", "Two Pointers", "Stacks & Queues", "Binary Search", "Trees", "Dynamic Programming"],
    icon: "Binary",
    color: "#5C59E8",
    modules: [
      {
        id: "dsa-mod-1",
        title: "Beginner Foundations: Complexity & Linear Structures",
        level: "beginner",
        summary: "Big-O notation, arrays, strings, two pointers, and constant-time hash map lookups.",
        lessons: [
          {
            id: "dsa-b1",
            title: "Big-O Asymptotic Complexity & Growth Rates",
            level: "beginner",
            estimatedMinutes: 20,
            explanation: "Asymptotic notation measures how algorithm runtime or memory scales as input size N grows toward infinity. We focus on upper-bound Worst-Case O(f(N)). Drop multiplicative constants and lower-order polynomial terms.",
            workedExample: {
              title: "Analyzing Linear vs Quadratic Search",
              description: "Single loop through array vs nested pairs comparison.",
              codeSnippet: `# O(N) Linear Search\ndef find_target(arr, target):\n    for num in arr:\n        if num == target: return True\n    return False\n\n# O(N^2) Nested Pair Check\ndef has_duplicate(arr):\n    for i in range(len(arr)):\n        for j in range(i+1, len(arr)):\n            if arr[i] == arr[j]: return True\n    return False`,
              explanation: "Linear search performs at most N comparisons O(N). Nested loops over pairs perform N*(N-1)/2 iterations, which simplifies asymptotically to O(N^2)."
            },
            practiceTask: {
              prompt: "Write a function `max_difference(arr)` that finds the maximum difference between any two elements in an array where the larger element appears after the smaller element in O(N) time. Return 0 if array length < 2 or no profit.",
              starterCode: "def max_difference(arr):\n    # TODO: Implement O(N) single pass tracking min_val\n    pass",
              solutionCode: "def max_difference(arr):\n    if not arr or len(arr) < 2:\n        return 0\n    min_val = arr[0]\n    max_diff = 0\n    for num in arr[1:]:\n        if num - min_val > max_diff:\n            max_diff = num - min_val\n        if num < min_val:\n            min_val = num\n    return max_diff",
              testCases: [
                { input: "[7, 1, 5, 3, 6, 4]", expectedOutput: "5", description: "Standard stock buying peak" },
                { input: "[7, 6, 4, 3, 1]", expectedOutput: "0", description: "Decreasing prices" },
                { input: "[2, 4, 1]", expectedOutput: "2", description: "Small array" }
              ],
              hints: [
                "Notice that checking every pair takes O(N^2). Can you do this in a single pass O(N)?",
                "Keep track of the minimum value seen so far as you iterate from left to right.",
                "At each element `num`, calculate `num - min_seen` and update `max_diff`, then update `min_seen = min(min_seen, num)`."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "for.*in.*for.*in",
                  explanation: "Nested loop detected. This runs in O(N^2) time complexity which will time out on placement platforms with N=100,000.",
                  suggestedFix: "Use a single pass maintaining a running minimum variable."
                }
              ]
            }
          },
          {
            id: "dsa-b2",
            title: "Hash Maps & O(1) Amortized Lookups",
            level: "beginner",
            estimatedMinutes: 25,
            explanation: "A Hash Table maps keys to values using a deterministic hash function. In the average case, insertions, deletions, and lookups happen in O(1) amortized time, trading O(N) space for dramatic time improvements.",
            workedExample: {
              title: "Pair Sum Equality via Complement Hash Set",
              description: "Given numbers, find if any two sum up to Target.",
              codeSnippet: `def two_sum_exists(nums, target):\n    seen = set()\n    for num in nums:\n        complement = target - num\n        if complement in seen:\n            return True\n        seen.add(num)\n    return False`,
              explanation: "Instead of searching the rest of the array (O(N)), checking `complement in seen` executes in average O(1) time."
            },
            practiceTask: {
              prompt: "Implement `first_unique_char(s)`: return the index of the first non-repeating character in string `s`. Return -1 if every character repeats.",
              starterCode: "def first_unique_char(s):\n    # TODO: Build frequency map and return first index with count == 1\n    pass",
              solutionCode: "def first_unique_char(s):\n    counts = {}\n    for ch in s:\n        counts[ch] = counts.get(ch, 0) + 1\n    for idx, ch in enumerate(s):\n        if counts[ch] == 1:\n            return idx\n    return -1",
              testCases: [
                { input: "'leetcode'", expectedOutput: "0", description: "First unique at 0" },
                { input: "'loveleetcode'", expectedOutput: "2", description: "First unique 'v' at 2" },
                { input: "'aabb'", expectedOutput: "-1", description: "No unique characters" }
              ],
              hints: [
                "Two passes are sufficient: one to count frequencies, and one to find the first index.",
                "Use a dictionary or hash map where keys are characters and values are their occurrence counts.",
                "In the second pass over the string with index, check if `counts[s[i]] == 1` and return immediately."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "\\.count\\(",
                  explanation: "Calling `s.count(ch)` inside a loop causes an O(N^2) scan because `.count()` traverses the entire string each time.",
                  suggestedFix: "Build a single frequency hash map first in O(N) time."
                }
              ]
            }
          }
        ]
      },
      {
        id: "dsa-mod-2",
        title: "Intermediate Mastery: Stacks, Binary Search & Sorting",
        level: "intermediate",
        summary: "LIFO order, Monotonic Stacks, and divide-and-conquer logarithmic binary search.",
        lessons: [
          {
            id: "dsa-i1",
            title: "Monotonic Stacks & Valid Parentheses",
            level: "intermediate",
            estimatedMinutes: 30,
            explanation: "Stacks operate on Last-In-First-Out (LIFO). They excel at tracking nested scopes, syntax validation, and maintaining monotonically increasing or decreasing elements for nearest greater/smaller problems.",
            workedExample: {
              title: "Valid Parentheses Matcher",
              description: "Determine if parentheses '()[]{}' close in proper order.",
              codeSnippet: `def is_valid_brackets(s):\n    mapping = {')': '(', '}': '{', ']': '['}\n    stack = []\n    for ch in s:\n        if ch in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[ch] != top: return False\n        else:\n            stack.append(ch)\n    return len(stack) == 0`,
              explanation: "Opening brackets push to stack; closing brackets must match top item immediately."
            },
            practiceTask: {
              prompt: "Implement `next_greater_element(nums)`: for each element in `nums`, find the first greater element to its right. Return -1 for elements that have no greater element to their right.",
              starterCode: "def next_greater_element(nums):\n    # TODO: Implement using a monotonic decreasing stack in O(N)\n    pass",
              solutionCode: "def next_greater_element(nums):\n    res = [-1] * len(nums)\n    stack = [] # holds indices\n    for i, num in enumerate(nums):\n        while stack and nums[stack[-1]] < num:\n            prev_idx = stack.pop()\n            res[prev_idx] = num\n        stack.append(i)\n    return res",
              testCases: [
                { input: "[4, 5, 2, 25]", expectedOutput: "[5, 25, 25, -1]", description: "Standard array" },
                { input: "[13, 7, 6, 12]", expectedOutput: "[-1, 12, 12, -1]", description: "Partially decreasing" }
              ],
              hints: [
                "A brute-force search takes O(N^2). A monotonic stack gives O(N) total push/pop operations.",
                "Store the indices of elements in the stack whose next greater element is not yet found.",
                "While current element > element at top index of stack, pop top index and set its answer to current element."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "for.*in.*for.*in",
                  explanation: "Nested loop scan takes O(N^2). Use a monotonic stack.",
                  suggestedFix: "Push un-matched indices to stack; pop when a larger number is encountered."
                }
              ]
            }
          },
          {
            id: "dsa-i2",
            title: "Binary Search on Sorted & Monotonic Spaces",
            level: "intermediate",
            estimatedMinutes: 30,
            explanation: "Binary Search cuts search space by 50% at each step, yielding O(log N) runtime. It applies to sorted arrays as well as monotonic predicate answer functions (Binary Search on Answer).",
            workedExample: {
              title: "Standard Lower Bound Binary Search",
              description: "Find index of target in sorted array in O(log N).",
              codeSnippet: `def binary_search(nums, target):\n    low, high = 0, len(nums) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1`,
              explanation: "Each iteration halves the remaining elements."
            },
            practiceTask: {
              prompt: "Implement `search_insert_position(nums, target)`: given sorted array of distinct integers and a target, return index if found. If not, return index where it would be inserted in order in O(log N).",
              starterCode: "def search_insert_position(nums, target):\n    # TODO: Implement O(log N) binary search returning insertion index\n    pass",
              solutionCode: "def search_insert_position(nums, target):\n    low, high = 0, len(nums) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return low",
              testCases: [
                { input: "[1, 3, 5, 6], 5", expectedOutput: "2", description: "Element present" },
                { input: "[1, 3, 5, 6], 2", expectedOutput: "1", description: "Insert in middle" },
                { input: "[1, 3, 5, 6], 7", expectedOutput: "4", description: "Insert at end" }
              ],
              hints: [
                "When the `low <= high` loop finishes without an exact match, where does `low` point?",
                "`low` will always point to the insertion index where `target` fits monotonically.",
                "Ensure your loop condition is `low <= high` and update with `mid + 1` and `mid - 1` to prevent infinite loops."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "\\.index\\(",
                  explanation: "Using `.index()` is an O(N) linear scan and fails logarithmic requirements.",
                  suggestedFix: "Use two pointers `low` and `high` and compute `mid`."
                }
              ]
            }
          }
        ]
      },
      {
        id: "dsa-mod-3",
        title: "Advanced Engineering: Dynamic Programming & Graphs",
        level: "advanced",
        summary: "Optimal substructure, memoization, DAG traversal, and greedy interval scheduling.",
        lessons: [
          {
            id: "dsa-a1",
            title: "Dynamic Programming: Memoization & Tabulation",
            level: "advanced",
            estimatedMinutes: 35,
            explanation: "Dynamic Programming decomposes problems into overlapping subproblems with optimal substructure. We save subproblem solutions (memoization / bottom-up table) to prevent exponential 2^N recursion trees.",
            workedExample: {
              title: "Climbing Stairs (Fibonacci recurrence)",
              description: "Ways to reach step N taking 1 or 2 steps.",
              codeSnippet: `def climb_stairs(n):\n    if n <= 2: return n\n    dp = [0] * (n + 1)\n    dp[1], dp[2] = 1, 2\n    for i in range(3, n + 1):\n        dp[i] = dp[i-1] + dp[i-2]\n    return dp[n]`,
              explanation: "O(N) time and O(1) space if optimized to two state variables."
            },
            practiceTask: {
              prompt: "Implement `coin_change(coins, amount)`: return fewest coins needed to make up `amount`. If not possible, return -1. Example: coins=[1,2,5], amount=11 -> 3 (5+5+1).",
              starterCode: "def coin_change(coins, amount):\n    # TODO: DP array initialized to infinity, return dp[amount]\n    pass",
              solutionCode: "def coin_change(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for coin in coins:\n        for x in range(coin, amount + 1):\n            dp[x] = min(dp[x], dp[x - coin] + 1)\n    return dp[amount] if dp[amount] != float('inf') else -1",
              testCases: [
                { input: "[1, 2, 5], 11", expectedOutput: "3", description: "Standard greedy failure case" },
                { input: "[2], 3", expectedOutput: "-1", description: "Impossible amount" },
                { input: "[1], 0", expectedOutput: "0", description: "Zero amount" }
              ],
              hints: [
                "Greedy picking biggest coin fails on cases like coins=[1, 3, 4] and amount=6 (greedy gives 4+1+1=3, optimal is 3+3=2).",
                "Create a DP array `dp` of size `amount + 1` filled with infinity, with `dp[0] = 0`.",
                "For each coin and each target from `coin` to `amount`, `dp[x] = min(dp[x], dp[x - coin] + 1)`."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "sort.*reverse=True.*//",
                  explanation: "Greedy largest-first strategy fails for coin systems that are not canonical.",
                  suggestedFix: "Use dynamic programming to evaluate all valid sub-coin configurations."
                }
              ]
            }
          }
        ]
      }
    ],
    capstone: {
      id: "capstone-dsa-campus-scheduler",
      title: "Campus Event Conflict Detection & Scheduling Engine",
      scenario: "Build a production algorithmic scheduler for university hackathons and seminar halls. You must detect room conflicts, find maximum concurrent attendance, and schedule the maximum non-overlapping events.",
      deliverables: [
        "1. `has_conflict(events)`: Check if any booked intervals overlap in O(N log N) time.",
        "2. `min_rooms_required(events)`: Compute the minimum meeting rooms needed for all events to proceed.",
        "3. `max_non_overlapping(events)`: Select maximum non-conflicting events (Interval Scheduling algorithm).",
        "4. A short complexity explanation covering time & space performance."
      ],
      rubric: [
        { criterion: "Interval Conflict Correctness", weight: 30, description: "Correctly handles boundary conditions [start, end) where end == next start is not a conflict." },
        { criterion: "Room Allocation Efficiency", weight: 30, description: "Uses two-pointer sweep or min-heap in O(N log N) without nested scans." },
        { criterion: "Greedy Earliest-Deadline Scheduling", weight: 25, description: "Sorts by end time and greedily appends non-overlapping events." },
        { criterion: "Asymptotic Complexity & Edge Cases", weight: 15, description: "Explains O(N log N) sorting dominance and handles empty/single event inputs." }
      ],
      passingScore: 75,
      starterCodeOrData: `class CampusScheduler:
    def has_conflict(self, intervals):
        """intervals: list of (start, end). Return True if any overlap, else False."""
        # TODO
        pass

    def min_rooms_required(self, intervals):
        """Return minimum rooms required to host all events."""
        # TODO
        pass

    def max_non_overlapping(self, intervals):
        """Return list of intervals scheduled without conflict."""
        # TODO
        pass`,
      solutionTests: [
        {
          name: "Conflict detection",
          testFnOrInput: "s = CampusScheduler(); s.has_conflict([(9, 11), (11, 13), (10, 12)])",
          expectedRegexOrResult: "True"
        },
        {
          name: "No conflict boundary",
          testFnOrInput: "s = CampusScheduler(); s.has_conflict([(9, 10), (10, 11), (11, 12)])",
          expectedRegexOrResult: "False"
        },
        {
          name: "Minimum rooms required",
          testFnOrInput: "s = CampusScheduler(); s.min_rooms_required([(0, 30), (5, 10), (15, 20)])",
          expectedRegexOrResult: "2"
        },
        {
          name: "Greedy interval scheduling count",
          testFnOrInput: "s = CampusScheduler(); len(s.max_non_overlapping([(1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11), (8, 12), (2, 14), (12, 16)]))",
          expectedRegexOrResult: "4"
        }
      ]
    }
  },

  aptitude: {
    slug: "aptitude",
    title: "Placement Aptitude & Logical Reasoning",
    tagline: "High-yield quantitative reasoning, speed-accuracy techniques, and placement test strategies.",
    track: "Aptitude",
    level: "Beginner to Advanced",
    estimatedHours: 35,
    prerequisites: ["High school foundational arithmetic and algebra"],
    skills: ["Percentages & Ratios", "Speed & Distance", "Time & Work", "Data Interpretation", "Probability & Permutations", "Error Diagnosis"],
    icon: "TrendingUp",
    color: "#2563EB",
    modules: [
      {
        id: "apt-mod-1",
        title: "Beginner Arithmetic: Percentages, Ratios & Averages",
        level: "beginner",
        summary: "Base shifting, multiplying factors, and weighted averages for fast calculation.",
        lessons: [
          {
            id: "apt-b1",
            title: "Percentages & Multiplying Factors",
            level: "beginner",
            estimatedMinutes: 20,
            explanation: "Percentage changes are best computed using decimal multiplying factors. An increase of 25% corresponds to ×1.25. A decrease of 15% corresponds to ×0.85. Consecutive changes multiply: (1 + a)(1 + b) - 1.",
            workedExample: {
              title: "Consecutive Discounts vs Net Change",
              description: "A course is discounted by 20% then an extra 10%. Find net price percentage.",
              explanation: "Net Factor = 0.80 × 0.90 = 0.72. The final price is 72% of original, meaning total discount is 28% (not 30%)."
            },
            practiceTask: {
              prompt: "A student scores 75% on a 120-mark midterm and 85% on a 180-mark final. What is their overall weighted percentage score for the course?",
              solutionCode: "81",
              testCases: [
                { input: "Midterm: 75% of 120, Final: 85% of 180", expectedOutput: "81", description: "Weighted average calculation" }
              ],
              hints: [
                "Find total marks scored: (0.75 * 120) + (0.85 * 180).",
                "Divide total marks scored by total possible marks (120 + 180 = 300).",
                "(90 + 153) / 300 = 243 / 300 = 0.81 or 81%."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "80",
                  explanation: "Arithmetic mean (75 + 85)/2 = 80% is incorrect because the final has a heavier weight (180 vs 120 marks).",
                  suggestedFix: "Use weighted average: (75*120 + 85*180) / 300."
                }
              ]
            }
          }
        ]
      },
      {
        id: "apt-mod-2",
        title: "Intermediate Quantitative: Time, Work & Relative Speed",
        level: "intermediate",
        summary: "Unitary work rates, LCM efficiency method, and relative motion equations.",
        lessons: [
          {
            id: "apt-i1",
            title: "Time & Work: The LCM Unit Method",
            level: "intermediate",
            estimatedMinutes: 25,
            explanation: "Instead of fractions (1/A + 1/B), assume total work is the LCM of the days taken. Calculate each worker's daily efficiency units, sum their rates, and divide total work by combined efficiency.",
            workedExample: {
              title: "A takes 12 days, B takes 18 days",
              description: "How long do A and B take together?",
              explanation: "LCM(12, 18) = 36 units. Rate A = 3 units/day, Rate B = 2 units/day. Combined rate = 5 units/day. Time = 36 / 5 = 7.2 days."
            },
            practiceTask: {
              prompt: "Pipe A fills a tank in 10 hours, Pipe B fills it in 15 hours, and Pipe C drains it in 20 hours. If all three open together, in how many hours will the tank fill?",
              solutionCode: "8.57",
              testCases: [
                { input: "A=10, B=15, C=-20", expectedOutput: "8.57", description: "Two inlet pipes and one drain pipe" }
              ],
              hints: [
                "Find LCM(10, 15, 20) = 60 units of capacity.",
                "Efficiency: A = +6 units/hr, B = +4 units/hr, C = -3 units/hr.",
                "Net flow rate = 6 + 4 - 3 = 7 units/hr. Total time = 60 / 7 = 8.57 hours."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "4.6",
                  explanation: "Adding pipe C instead of subtracting drainage.",
                  suggestedFix: "Remember drain pipes do negative work (-3 units/hr)."
                }
              ]
            }
          }
        ]
      },
      {
        id: "apt-mod-3",
        title: "Advanced Placement: Probability & Placement Diagnostic Sets",
        level: "advanced",
        summary: "Combinatorics, conditional probability, and systematic mistake review.",
        lessons: [
          {
            id: "apt-a1",
            title: "Conditional Probability & Bayes Thinking",
            level: "advanced",
            estimatedMinutes: 30,
            explanation: "Probability P(A|B) = P(A ∩ B) / P(B). When choosing items without replacement, sample space shrinks with each draw.",
            workedExample: {
              title: "Two cards drawn without replacement",
              description: "Probability both cards are Aces.",
              explanation: "P(1st Ace) = 4/52. P(2nd Ace | 1st Ace) = 3/51. Product = (4/52) * (3/51) = 1/221."
            },
            practiceTask: {
              prompt: "A box contains 5 red and 7 blue balls. If two balls are selected at random without replacement, what is the probability (as a decimal rounded to 2 places) that both are red?",
              solutionCode: "0.15",
              testCases: [
                { input: "5 red, 7 blue", expectedOutput: "0.15", description: "5/12 * 4/11 = 20/132 = 0.1515" }
              ],
              hints: [
                "Total balls = 5 + 7 = 12.",
                "First ball red probability = 5/12.",
                "Second ball red probability = 4/11. Multiply: 20/132 = 0.15."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "0.17",
                  explanation: "Using replacement (5/12 * 5/12 = 0.17) is incorrect; the ball is drawn without replacement.",
                  suggestedFix: "Remember count drops by 1 for both red balls and total balls."
                }
              ]
            }
          }
        ]
      }
    ],
    capstone: {
      id: "capstone-aptitude-placement-analytics",
      title: "Campus Placement Aptitude Dataset Analysis",
      scenario: "Evaluate a synthetic cohort of 250 engineering candidates across Aptitude, Coding, and Interview rounds. Derive cutoff percentiles, track success ratios, and draft an audit report.",
      deliverables: [
        "1. Identify the 90th percentile score threshold in the aptitude section.",
        "2. Compute the conditional placement probability P(Placed | Aptitude > 75).",
        "3. Pinpoint the highest error-rate subcategory across the candidate pool.",
        "4. Submit your step-by-step mathematical reasoning and final insights."
      ],
      rubric: [
        { criterion: "Statistical Percentile Precision", weight: 30, description: "Correctly calculates ranking percentile threshold from dataset." },
        { criterion: "Conditional Probability Accuracy", weight: 35, description: "Calculates intersection and conditioned sample space accurately." },
        { criterion: "Error Diagnosis & Category Breakdown", weight: 20, description: "Identifies Permutations & Probability as highest difficulty subcategory." },
        { criterion: "Clarity of Reasoning", weight: 15, description: "Provides transparent calculations without omitting steps." }
      ],
      passingScore: 75,
      starterCodeOrData: `// Synthetic Placement Cohort Summary Data:
// Total Candidates: 250
// Candidates with Aptitude Score >= 75: 80
// Of those 80 candidates, 60 secured final offers.
// Candidates with Aptitude Score < 75: 170
// Of those 170 candidates, 25 secured final offers.
// Error rates by topic:
// Arithmetic: 18% | Time & Work: 24% | Data Interpretation: 31% | Probability: 49%

// Tasks:
// Q1: What is the conditional placement probability P(Offer | Aptitude >= 75) in percentage?
// Q2: What is the highest error-rate section?
// Q3: Total offers made across all 250 students?`,
      solutionTests: [
        {
          name: "Conditional probability test",
          testFnOrInput: "60 / 80",
          expectedRegexOrResult: "75%"
        },
        {
          name: "Highest error category",
          testFnOrInput: "Highest error rate",
          expectedRegexOrResult: "Probability"
        },
        {
          name: "Total offers",
          testFnOrInput: "60 + 25",
          expectedRegexOrResult: "85"
        }
      ]
    }
  },

  sql: {
    slug: "sql",
    title: "SQL & Relational Database Engineering",
    tagline: "Write fast, analytical SQL queries with joins, window functions, and real-world aggregations.",
    track: "SQL",
    level: "Beginner to Advanced",
    estimatedHours: 35,
    prerequisites: ["Understanding of tabular data and spreadsheets"],
    skills: ["SELECT & Filtering", "Aggregates & GROUP BY", "Multi-table JOINs", "Common Table Expressions (CTEs)", "Window Functions", "Query Plan Optimization"],
    icon: "Database",
    color: "#059669",
    modules: [
      {
        id: "sql-mod-1",
        title: "Beginner SQL: Filtering, Aggregates & NULL Handling",
        level: "beginner",
        summary: "Logical evaluation order, WHERE vs HAVING, and three-valued boolean logic with NULL.",
        lessons: [
          {
            id: "sql-b1",
            title: "SELECT, WHERE Filtering & Three-Valued Logic",
            level: "beginner",
            estimatedMinutes: 20,
            explanation: "SQL query execution order starts at `FROM`, then `WHERE`, `GROUP BY`, `HAVING`, `SELECT`, and `ORDER BY`. Because SQL uses Three-Valued Logic (TRUE, FALSE, UNKNOWN), you must check NULL values using `IS NULL` or `IS NOT NULL`, never `= NULL`.",
            workedExample: {
              title: "Filtering Active Engineering Interns",
              description: "Find all interns in department 'Eng' with GPA >= 8.0.",
              codeSnippet: `SELECT student_name, gpa\nFROM interns\nWHERE department = 'Engineering'\n  AND gpa >= 8.0\nORDER BY gpa DESC;`,
              explanation: "WHERE filters rows before grouping or projection."
            },
            practiceTask: {
              prompt: "Write a query to select `name` and `stipend` from `internships` where `stipend` is greater than 25000 and `status` is NOT 'closed'. Order results by `stipend` descending.",
              starterCode: "-- Write your query here:\nSELECT \nFROM internships\nWHERE \nORDER BY ",
              solutionCode: "SELECT name, stipend FROM internships WHERE stipend > 25000 AND status != 'closed' ORDER BY stipend DESC;",
              testCases: [
                {
                  input: "SELECT name, stipend FROM internships WHERE stipend > 25000 AND status != 'closed' ORDER BY stipend DESC;",
                  expectedOutput: "3 rows returned with stipend > 25000",
                  description: "Standard filtering"
                }
              ],
              hints: [
                "Use `WHERE stipend > 25000 AND status != 'closed'`.",
                "Ensure `ORDER BY stipend DESC` is at the end of the query.",
                "In SQL, single quotes `'closed'` are standard for string literals."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "= NULL",
                  explanation: "`= NULL` always yields UNKNOWN in SQL. Use `IS NULL` or `IS NOT NULL`.",
                  suggestedFix: "Replace `= NULL` with `IS NULL`."
                }
              ]
            }
          }
        ]
      },
      {
        id: "sql-mod-2",
        title: "Intermediate SQL: Relational JOINs & Aggregations",
        level: "intermediate",
        summary: "INNER, LEFT, and FULL OUTER joins, aggregate functions, and GROUP BY nuances.",
        lessons: [
          {
            id: "sql-i1",
            title: "INNER vs LEFT JOIN & GROUP BY Aggregations",
            level: "intermediate",
            estimatedMinutes: 25,
            explanation: "An `INNER JOIN` matches rows in both tables. A `LEFT JOIN` preserves all rows from the left table, filling unmatched right columns with NULL. `GROUP BY` collapses rows sharing key values for aggregate functions (`COUNT`, `SUM`, `AVG`).",
            workedExample: {
              title: "Average Stipend by Company with Multiple Postings",
              description: "Find companies with at least 2 postings and their avg stipend.",
              codeSnippet: `SELECT c.company_name, COUNT(j.id) as total_jobs, AVG(j.stipend) as avg_stipend\nFROM companies c\nJOIN jobs j ON c.id = j.company_id\nGROUP BY c.id, c.company_name\nHAVING COUNT(j.id) >= 2;`,
              explanation: "Use `HAVING` to filter after aggregation; `WHERE` filters before aggregation."
            },
            practiceTask: {
              prompt: "Write a query to list each `department` and the total number of students (`total_students`) who have a GPA of at least 7.0, only showing departments with more than 5 such students.",
              starterCode: "SELECT department, COUNT(*) as total_students\nFROM students\nWHERE \nGROUP BY \nHAVING ",
              solutionCode: "SELECT department, COUNT(*) as total_students FROM students WHERE gpa >= 7.0 GROUP BY department HAVING COUNT(*) > 5;",
              testCases: [
                {
                  input: "SELECT department, COUNT(*) as total_students FROM students WHERE gpa >= 7.0 GROUP BY department HAVING COUNT(*) > 5;",
                  expectedOutput: "Filtered departments with count > 5",
                  description: "HAVING filter on aggregate"
                }
              ],
              hints: [
                "Filter GPA in the `WHERE` clause before grouping: `WHERE gpa >= 7.0`.",
                "Group by `department`: `GROUP BY department`.",
                "Filter group counts in the `HAVING` clause: `HAVING COUNT(*) > 5`."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "WHERE.*COUNT\\(",
                  explanation: "Aggregate functions like `COUNT()` cannot be used inside a `WHERE` clause.",
                  suggestedFix: "Move aggregate filters to `HAVING COUNT(*) > 5`."
                }
              ]
            }
          }
        ]
      },
      {
        id: "sql-mod-3",
        title: "Advanced SQL: CTEs & Window Functions",
        level: "advanced",
        summary: "Common Table Expressions, OVER (PARTITION BY ... ORDER BY ...), ROW_NUMBER, and RANK.",
        lessons: [
          {
            id: "sql-a1",
            title: "Window Functions: OVER, PARTITION BY & RANK",
            level: "advanced",
            estimatedMinutes: 35,
            explanation: "Unlike `GROUP BY`, Window Functions compute aggregates without collapsing individual rows into a single output row. They retain row-level identity while calculating running totals, rankings, and lead/lag differences.",
            workedExample: {
              title: "Top 2 Highest Paid Interns Per Department",
              description: "Using DENSE_RANK() OVER (PARTITION BY ...).",
              codeSnippet: `WITH RankedInterns AS (\n    SELECT name, department, stipend,\n           DENSE_RANK() OVER (PARTITION BY department ORDER BY stipend DESC) as rank_in_dept\n    FROM interns\n)\nSELECT name, department, stipend\nFROM RankedInterns\nWHERE rank_in_dept <= 2;`,
              explanation: "CTE computes partition rankings; outer query filters on `rank_in_dept <= 2`."
            },
            practiceTask: {
              prompt: "Using a Common Table Expression (CTE) named `RankedSalaries`, write a query to rank students within each `college_id` by their `test_score` descending using `ROW_NUMBER()`. Return `student_id`, `college_id`, and `rank` for the top student in each college.",
              starterCode: "WITH RankedSalaries AS (\n    SELECT \n)\nSELECT \nFROM RankedSalaries\nWHERE ",
              solutionCode: "WITH RankedSalaries AS (SELECT student_id, college_id, ROW_NUMBER() OVER (PARTITION BY college_id ORDER BY test_score DESC) as rank FROM assessments) SELECT student_id, college_id, rank FROM RankedSalaries WHERE rank = 1;",
              testCases: [
                {
                  input: "WITH RankedSalaries AS (...) SELECT student_id, college_id, rank FROM RankedSalaries WHERE rank = 1;",
                  expectedOutput: "Top scorer for each unique college",
                  description: "CTE and ROW_NUMBER partition query"
                }
              ],
              hints: [
                "Start with `WITH RankedSalaries AS (SELECT student_id, college_id, ROW_NUMBER() OVER (PARTITION BY college_id ORDER BY test_score DESC) as rank FROM assessments)`.",
                "In the outer query, filter with `WHERE rank = 1`.",
                "Window functions cannot be directly filtered in the WHERE clause of the query where they are defined, which is why a CTE is necessary."
              ],
              commonMistakes: [
                {
                  triggerRegexOrValue: "WHERE.*ROW_NUMBER\\(",
                  explanation: "Window functions are not allowed in WHERE clauses because they execute after WHERE.",
                  suggestedFix: "Wrap the query in a CTE `WITH ... AS (...)` and filter in the outer query."
                }
              ]
            }
          }
        ]
      }
    ],
    capstone: {
      id: "capstone-sql-internship-analytics",
      title: "Campus Internship Database Reporting & Audit Suite",
      scenario: "Act as Database Lead for campus career services. Analyze a synthetic multi-table internship database (students, applications, interviews, and company offers) to solve four mission-critical reporting statements.",
      deliverables: [
        "1. Query 1: Conversion rate from application to interview offer by company industry.",
        "2. Query 2: Identify students who applied to 3+ roles but received 0 interview calls (at-risk candidates).",
        "3. Query 3: Compute running monthly totals of confirmed placement offers using window functions.",
        "4. Query 4: Check data quality for orphaned applications lacking valid student profiles."
      ],
      rubric: [
        { criterion: "Relational Joins & Null Safety", weight: 30, description: "Correct use of LEFT JOIN to capture 0-interview candidates and prevent row elimination." },
        { criterion: "Window Function Running Total", weight: 30, description: "Accurate `SUM(offers) OVER (ORDER BY month)` without unbounded duplication." },
        { criterion: "Conversion Rate Mathematics", weight: 25, description: "Accurate float division `CAST(interviews AS FLOAT) / applications` handling zero division." },
        { criterion: "Data Quality Audit Query", weight: 15, description: "Correct anti-join or `WHERE student_id IS NULL` check." }
      ],
      passingScore: 75,
      starterCodeOrData: `-- Synthetic Schema:
-- students(id, name, email, college_id)
-- applications(id, student_id, company_id, role_title, status, created_at)
-- interviews(id, application_id, round_number, status, interview_date)
-- offers(id, application_id, stipend, accepted, offer_date)

-- Write your analytical queries below:`,
      solutionTests: [
        {
          name: "At-risk candidate detection",
          testFnOrInput: "SELECT a.student_id, COUNT(a.id) FROM applications a LEFT JOIN interviews i ON a.id = i.application_id GROUP BY a.student_id HAVING COUNT(a.id) >= 3 AND COUNT(i.id) = 0",
          expectedRegexOrResult: "COUNT(i.id) = 0"
        },
        {
          name: "Running monthly total window function",
          testFnOrInput: "SUM(COUNT(id)) OVER (ORDER BY DATE_TRUNC('month', offer_date))",
          expectedRegexOrResult: "OVER"
        }
      ]
    }
  }
};
