export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface Problem {
  title: string;
  description: string;
  testCases: TestCase[];
}

export interface ProblemSet {
  title: string;
  problems: Problem[];
}
