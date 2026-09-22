import type { Problem } from "../types/tracker";

/**
 * Raw problem definitions as assigned across all Smart Interviews and LeetCode lab sessions.
 * Duplicate entries across labs (e.g. Subset Sum on 03 Aug and 04 Aug) are deduplicated
 * into a single unique record holding all assigned lab dates.
 */
export const PROBLEMS: Problem[] = [
  // --- Lab: 03 Aug 2026 ---
  {
    id: "triple-trouble",
    title: "Triple Trouble",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/triple-trouble",
    platform: "Smart Interviews",
    topics: ["Bit Manipulation", "Arrays"],
    labDates: ["03 Aug 2026"],
  },
  {
    id: "repeated-numbers",
    title: "Repeated Numbers",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/repeated-numbers",
    platform: "Smart Interviews",
    topics: ["Bit Manipulation", "Arrays"],
    labDates: ["03 Aug 2026"],
  },
  {
    id: "xor-of-sum-of-pairs",
    title: "XOR of Sum of Pairs",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/xor-of-sum-of-pairs",
    platform: "Smart Interviews",
    topics: ["Bit Manipulation", "Arrays"],
    labDates: ["03 Aug 2026"],
  },
  {
    id: "sum-of-xor-of-pairs",
    title: "Sum of XOR of Pairs",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/sum-of-xor-of-pairs",
    platform: "Smart Interviews",
    topics: ["Bit Manipulation", "Arrays", "Prefix Sum"],
    labDates: ["03 Aug 2026"],
  },
  {
    id: "subset-sum",
    title: "Subset Sum",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/subset-sum",
    platform: "Smart Interviews",
    topics: ["Recursion", "Backtracking", "Dynamic Programming"],
    labDates: ["03 Aug 2026", "04 Aug 2026"], // Deduplicated: assigned in both 03 Aug and 04 Aug
  },
  {
    id: "count-subset-sums-equals-k",
    title: "Count Subset Sums Equals K",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/count-subset-sums-equals-k",
    platform: "Smart Interviews",
    topics: ["Recursion", "Backtracking", "Dynamic Programming"],
    labDates: ["03 Aug 2026"],
  },
  {
    id: "count-total-set-bits",
    title: "Count Total Set Bits",
    url: "https://www.interviewbit.com/problems/count-total-set-bits/",
    platform: "InterviewBit",
    topics: ["Bit Manipulation", "Mathematical / Combinatorics"],
    labDates: ["03 Aug 2026"],
  },

  // --- Lab: 04 Aug 2026 ---
  // Note: Subset Sum is deduplicated above with labDates ["03 Aug 2026", "04 Aug 2026"]
  {
    id: "balanced-parentheses",
    title: "Balanced Parentheses",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/balanced-parentheses",
    platform: "Smart Interviews",
    topics: ["Recursion", "Backtracking", "Stack"],
    labDates: ["04 Aug 2026"],
  },
  {
    id: "smart-square",
    title: "Smart Square",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/smart-square",
    platform: "Smart Interviews",
    topics: ["Recursion", "Backtracking"],
    labDates: ["04 Aug 2026"],
  },
  {
    id: "string-partitioning",
    title: "String Partitioning",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/string-partitioning",
    platform: "Smart Interviews",
    topics: ["Recursion", "Backtracking", "Strings"],
    labDates: ["04 Aug 2026"],
  },
  {
    id: "n-queens",
    title: "N-Queens",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/n-queens",
    platform: "Smart Interviews",
    topics: ["Recursion", "Backtracking"],
    labDates: ["04 Aug 2026"],
  },
  {
    id: "interleavings",
    title: "Interleavings",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/interleavings",
    platform: "Smart Interviews",
    topics: ["Recursion", "Strings"],
    labDates: ["04 Aug 2026"],
  },

  // --- Lab: 11 Aug 2026 ---
  {
    id: "cabinets-partitioning",
    title: "Cabinets Partitioning",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/cabinets-partitioning",
    platform: "Smart Interviews",
    topics: ["Binary Search", "Arrays"],
    labDates: ["11 Aug 2026"],
  },
  {
    id: "protective-villagers",
    title: "Protective Villagers",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/protective-villagers",
    platform: "Smart Interviews",
    topics: ["Binary Search", "Arrays"],
    labDates: ["11 Aug 2026"],
  },
  {
    id: "enclosing-substring",
    title: "Enclosing Substring",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/enclosing-substring",
    platform: "Smart Interviews",
    topics: ["Binary Search", "Sliding Window", "Substrings"],
    labDates: ["11 Aug 2026"],
  },

  // --- Lab: 17 Aug 2026 ---
  {
    id: "sum-of-subarrays",
    title: "Sum of Subarrays",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/sum-of-subarrays",
    platform: "Smart Interviews",
    topics: ["Arrays", "Subarrays", "Prefix Sum"],
    labDates: ["17 Aug 2026"],
  },
  {
    id: "query-odd-sum",
    title: "Query Odd Sum",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/query-odd-sum",
    platform: "Smart Interviews",
    topics: ["Arrays", "Prefix Sum"],
    labDates: ["17 Aug 2026"],
  },
  {
    id: "words-start-and-end-with-vowel",
    title: "Words Start & End with Vowel",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/words-start-and-end-with-vowel",
    platform: "Smart Interviews",
    topics: ["Strings", "Prefix Sum"],
    labDates: ["17 Aug 2026"],
  },
  {
    id: "substring-matching",
    title: "Substring Matching",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/substring-matching",
    platform: "Smart Interviews",
    topics: ["Strings", "String Matching"],
    labDates: ["17 Aug 2026"],
  },
  {
    id: "rabin-karp-string-matching-algorithm",
    title: "Rabin Karp String Matching Algorithm",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/rabin-karp-string-matching-algorithm",
    platform: "Smart Interviews",
    topics: ["Strings", "String Matching", "Hashing"],
    labDates: ["17 Aug 2026"],
  },
  {
    id: "kmp-string-matching-algorithm",
    title: "KMP String Matching Algorithm",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/kmp-string-matching-algorithm",
    platform: "Smart Interviews",
    topics: ["Strings", "String Matching"],
    labDates: ["17 Aug 2026"],
  },
  {
    id: "longest-palindromic-substring-hard",
    title: "Longest Palindromic Substring Hard",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/longest-palindromic-substring-hard",
    platform: "Smart Interviews",
    topics: ["Strings", "Substrings", "Dynamic Programming"],
    labDates: ["17 Aug 2026"],
  },

  // --- Lab: 24 Aug 2026 ---
  {
    id: "prime-love",
    title: "Prime Love",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/prime-love",
    platform: "Smart Interviews",
    topics: ["Number Theory", "Prime / Sieve"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "two-primes",
    title: "Two Primes",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/two-primes",
    platform: "Smart Interviews",
    topics: ["Number Theory", "Prime / Sieve"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "check-isprime",
    title: "Check isPrime",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/check-isprime",
    platform: "Smart Interviews",
    topics: ["Number Theory", "Prime / Sieve"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "large-range-primes",
    title: "Large Range Primes",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/large-range-primes",
    platform: "Smart Interviews",
    topics: ["Number Theory", "Prime / Sieve"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "prime-coins",
    title: "Prime Coins",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/prime-coins",
    platform: "Smart Interviews",
    topics: ["Game Theory", "Number Theory"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "optimal-prime-game",
    title: "Optimal Prime Game",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/optimal-prime-game",
    platform: "Smart Interviews",
    topics: ["Game Theory", "Number Theory", "Dynamic Programming"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "greedy-prime-game",
    title: "Greedy Prime Game",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/greedy-prime-game",
    platform: "Smart Interviews",
    topics: ["Game Theory", "Greedy"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "mixed-prime-game",
    title: "Mixed Prime Game",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/mixed-prime-game",
    platform: "Smart Interviews",
    topics: ["Game Theory", "Number Theory"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "alice-and-bob-coin-game-1",
    title: "Alice and Bob Coin Game-1",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/alice-and-bob-coin-game-1",
    platform: "Smart Interviews",
    topics: ["Game Theory"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "alice-and-bob-coin-game-2",
    title: "Alice and Bob Coin Game-2",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/alice-and-bob-coin-game-2",
    platform: "Smart Interviews",
    topics: ["Game Theory", "Dynamic Programming"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "game-of-letters",
    title: "Game of Letters",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/game-of-letters",
    platform: "Smart Interviews",
    topics: ["Game Theory", "Strings"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "shifting-stones",
    title: "Shifting Stones",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/shifting-stones",
    platform: "Smart Interviews",
    topics: ["Game Theory", "Greedy"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "quadruples-of-xor",
    title: "Quadruples of XOR",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/quadruples-of-xor",
    platform: "Smart Interviews",
    topics: ["Bit Manipulation", "Hashing", "Arrays"],
    labDates: ["24 Aug 2026"],
  },
  {
    id: "subsequence-sum",
    title: "Subsequence Sum",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/subsequence-sum",
    platform: "Smart Interviews",
    topics: ["Arrays", "Dynamic Programming", "Recursion"],
    labDates: ["24 Aug 2026"],
  },

  // --- Lab: 25 Aug 2026 ---
  {
    id: "equal-0s-and-1s",
    title: "Equal 0s and 1s",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/equal-0s-and-1s",
    platform: "Smart Interviews",
    topics: ["Arrays", "Prefix Sum", "Hashing"],
    labDates: ["25 Aug 2026"],
  },
  {
    id: "toggle-01",
    title: "Toggle 01",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/toggle-01",
    platform: "Smart Interviews",
    topics: ["Arrays", "Bit Manipulation", "Prefix Sum"],
    labDates: ["25 Aug 2026"],
  },
  {
    id: "first-missing-positive-integer",
    title: "First Missing Positive Integer",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/first-missing-positive-integer",
    platform: "Smart Interviews",
    topics: ["Arrays", "Hashing"],
    labDates: ["25 Aug 2026"],
  },
  {
    id: "sum-of-or-of-subarrays",
    title: "Sum of OR of Subarrays",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/sum-of-or-of-subarrays",
    platform: "Smart Interviews",
    topics: ["Arrays", "Bit Manipulation", "Subarrays"],
    labDates: ["25 Aug 2026"],
  },
  {
    id: "sum-of-and-of-subarrays",
    title: "Sum of AND of Subarrays",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/sum-of-and-of-subarrays",
    platform: "Smart Interviews",
    topics: ["Arrays", "Bit Manipulation", "Subarrays"],
    labDates: ["25 Aug 2026"],
  },

  // --- Lab: 01 Sep 2026 ---
  {
    id: "next-greater-element-i",
    title: "Next Greater Element I",
    url: "https://leetcode.com/problems/next-greater-element-i/description/?envType=problem-list-v2&envId=monotonic-stack",
    platform: "LeetCode",
    topics: ["Stack", "Monotonic Stack", "Arrays"],
    labDates: ["01 Sep 2026"],
  },
  {
    id: "daily-temperatures",
    title: "Daily Temperatures",
    url: "https://leetcode.com/problems/daily-temperatures/description/?envType=problem-list-v2&envId=monotonic-stack",
    platform: "LeetCode",
    topics: ["Stack", "Monotonic Stack", "Arrays"],
    labDates: ["01 Sep 2026"],
  },
  {
    id: "rectangular-area-under-histogram",
    title: "Rectangular Area Under Histogram",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/rectangular-area-under-histogram",
    platform: "Smart Interviews",
    topics: ["Stack", "Monotonic Stack", "Arrays"],
    labDates: ["01 Sep 2026"],
  },
  {
    id: "implement-deque",
    title: "Implement Deque",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/implement-deque",
    platform: "Smart Interviews",
    topics: ["Queue / Deque", "Data Structures"],
    labDates: ["01 Sep 2026"],
  },
  {
    id: "window-maximum",
    title: "Window Maximum",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/window-maximum",
    platform: "Smart Interviews",
    topics: ["Queue / Deque", "Sliding Window", "Monotonic Stack"],
    labDates: ["01 Sep 2026"],
  },
  {
    id: "maximal-rectangle",
    title: "Maximal Rectangle",
    url: "https://leetcode.com/problems/maximal-rectangle/description/?envType=problem-list-v2&envId=monotonic-stack",
    platform: "LeetCode",
    topics: ["Stack", "Monotonic Stack", "Dynamic Programming", "Arrays"],
    labDates: ["01 Sep 2026"],
  },

  // --- Lab: 02 Sep 2026 ---
  {
    id: "lru-cache",
    title: "LRU Cache",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/lru-cache",
    platform: "Smart Interviews",
    topics: ["Linked List", "Hashing", "Data Structures"],
    labDates: ["02 Sep 2026"],
  },
  {
    id: "hackerrank-pending-data-structures-linked-lists",
    title: "HackerRank — Pending Data Structures / Linked Lists",
    url: "https://www.hackerrank.com/domains/data-structures?filters%5Bsubdomains%5D%5B%5D=linked-lists",
    platform: "HackerRank",
    topics: ["Linked List", "Data Structures"],
    labDates: ["02 Sep 2026"],
  },
  {
    id: "copy-list-with-random-pointer",
    title: "Copy List with Random Pointer",
    url: "https://leetcode.com/problems/copy-list-with-random-pointer/description/",
    platform: "LeetCode",
    topics: ["Linked List", "Hashing"],
    labDates: ["02 Sep 2026"],
  },

  // --- Lab: 21 Sep 2026 ---
  {
    id: "max-rhyming-word-length",
    title: "Max Rhyming Word Length",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/max-rhyming-word-length",
    platform: "Smart Interviews",
    topics: ["Trie", "Strings"],
    labDates: ["21 Sep 2026"],
  },
  {
    id: "maximum-xor",
    title: "Maximum XOR",
    url: "https://hive.smartinterviews.in/contests/smart-interviews-primary/problems/maximum-xor",
    platform: "Smart Interviews",
    topics: ["Trie", "Bit Manipulation"],
    labDates: ["21 Sep 2026"],
  },
];

/**
 * All distinct chronological lab dates represented in the agenda.
 */
export const LAB_DATES: string[] = [
  "03 Aug 2026",
  "04 Aug 2026",
  "11 Aug 2026",
  "17 Aug 2026",
  "24 Aug 2026",
  "25 Aug 2026",
  "01 Sep 2026",
  "02 Sep 2026",
  "21 Sep 2026",
];

/**
 * All distinct primary algorithmic categories.
 */
export const ALL_TOPICS: string[] = Array.from(
  new Set(PROBLEMS.flatMap((p) => p.topics))
).sort();

export const ALL_PLATFORMS = [
  "Smart Interviews",
  "LeetCode",
  "InterviewBit",
  "HackerRank",
] as const;
