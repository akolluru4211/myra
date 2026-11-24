import fs from "fs";
import path from "path";

export function validateMyraDataset(filePath) {
  const errors = [];
  const splits = {};
  const courses = {};
  const taskTypes = {};
  const seenIds = new Set();
  const seenInputs = new Set();

  const requiredFields = [
    "id",
    "course",
    "topic",
    "level",
    "task_type",
    "source_id",
    "license",
    "student_input",
    "reviewed_response",
    "split"
  ];

  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      totalRecords: 0,
      splits: {},
      courses: {},
      taskTypes: {},
      errors: [`Dataset file not found at: ${filePath}`]
    };
  }

  const rawLines = fs.readFileSync(filePath, "utf-8").split("\n").filter((l) => l.trim().length > 0);

  rawLines.forEach((line, lineNum) => {
    try {
      const record = JSON.parse(line);

      // Check required fields
      for (const field of requiredFields) {
        if (!record[field] || typeof record[field] !== "string" || !record[field].trim()) {
          errors.push(`Line ${lineNum + 1}: Missing or empty required field '${field}'`);
        }
      }

      // Check unique ID
      if (seenIds.has(record.id)) {
        errors.push(`Line ${lineNum + 1}: Duplicate ID detected: '${record.id}'`);
      }
      seenIds.add(record.id);

      // Check for training/eval data leakage across splits
      const normInput = (record.student_input || "").toLowerCase().trim();
      if (seenInputs.has(normInput)) {
        errors.push(`Line ${lineNum + 1}: Potential data leakage. Identical student input across dataset: '${normInput}'`);
      }
      seenInputs.add(normInput);

      // Tally metrics
      splits[record.split] = (splits[record.split] || 0) + 1;
      courses[record.course] = (courses[record.course] || 0) + 1;
      taskTypes[record.task_type] = (taskTypes[record.task_type] || 0) + 1;

      // Validate split names
      if (!["train", "validation", "test"].includes(record.split)) {
        errors.push(`Line ${lineNum + 1}: Invalid split name '${record.split}'. Must be train, validation, or test.`);
      }
    } catch (parseErr) {
      errors.push(`Line ${lineNum + 1}: Malformed JSON line: ${parseErr.message}`);
    }
  });

  return {
    valid: errors.length === 0,
    totalRecords: rawLines.length,
    splits,
    courses,
    taskTypes,
    errors
  };
}

// Execute when invoked directly
const targetPath = path.resolve(process.cwd(), "src/data/edlearn-myra-dataset.jsonl");
const summary = validateMyraDataset(targetPath);
console.log("=== Myra Reviewed Dataset Validation Report ===");
console.log(`Valid: ${summary.valid}`);
console.log(`Total Records: ${summary.totalRecords}`);
console.log("Splits:", summary.splits);
console.log("Courses:", summary.courses);
console.log("Task Types:", summary.taskTypes);
if (!summary.valid) {
  console.error("Errors found:", summary.errors);
  process.exit(1);
} else {
  console.log("✅ All dataset schemas, splits, and leakage checks passed cleanly.");
  process.exit(0);
}
