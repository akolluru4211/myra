const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const visualTestPath = path.join(root, "test/e2e/e2e_visual_design_system.test.js");
const pageLogicTestPath = path.join(root, "test/e2e/e2e_page_logic_preservation.test.js");
const navbarPath = path.join(root, "src/components/layout/ModernEdworldNavbar.tsx");

const visualCode = fs.readFileSync(visualTestPath, "utf8");
const pageLogicCode = fs.readFileSync(pageLogicTestPath, "utf8");
const navbarCode = fs.readFileSync(navbarPath, "utf8");

const results = {
  tautologies: [],
  inMemoryDuplicates: [],
  groundedFilesChecked: [],
  hardcodedArtificialBypasses: [],
  syntaxOrContractAnomalies: []
};

// 1. TAUTOLOGY SCAN
const tautologyRegexes = [
  /assert(?:\.strictEqual|\.equal|\.deepStrictEqual|\.deepEqual)?\s*\(\s*([^,]+?)\s*===?\s*\1\s*[,)]/g,
  /assert\.strictEqual\s*\(\s*([^,]+?)\s*,\s*\1\s*[,)]/g,
  /assert\.equal\s*\(\s*([^,]+?)\s*,\s*\1\s*[,)]/g,
  /assert\.deepStrictEqual\s*\(\s*([^,]+?)\s*,\s*\1\s*[,)]/g,
  /assert\s*\(\s*true\s*[,)]/g,
  /assert\.ok\s*\(\s*true\s*[,)]/g
];

function checkTautologies(filename, code) {
  const lines = code.split("\n");
  lines.forEach((line, idx) => {
    for (const r of tautologyRegexes) {
      r.lastIndex = 0;
      const m = r.exec(line);
      if (m) {
        results.tautologies.push({ file: filename, line: idx + 1, content: line.trim(), match: m[0] });
      }
    }
  });
}

checkTautologies("e2e_visual_design_system.test.js", visualCode);
checkTautologies("e2e_page_logic_preservation.test.js", pageLogicCode);

// 2. IN-MEMORY DUPLICATES & SYNTHETIC MOCK DETECTION
const syntheticMockKeywords = [
  "MockLocalStorage",
  "MockCustomEvent",
  "MockEventTarget",
  "hydrateDashboardData",
  "generateTimetableSlots",
  "GamificationEngine",
  "getDailyAptitudeQuestions",
  "computeLeaderboard",
  "StudySquadService",
  "calculateProfileStrength",
  "generateEdworldDigitalId",
  "calculateJobMatch",
  "class Mock",
  "function mock"
];

function checkSyntheticMocks(filename, code) {
  const lines = code.split("\n");
  lines.forEach((line, idx) => {
    // ignore comments
    if (line.trim().startsWith("*") || line.trim().startsWith("//") || line.trim().startsWith("/*")) return;
    for (const kw of syntheticMockKeywords) {
      if (line.includes(kw)) {
        results.inMemoryDuplicates.push({ file: filename, line: idx + 1, keyword: kw, content: line.trim() });
      }
    }
  });
}

checkSyntheticMocks("e2e_visual_design_system.test.js", visualCode);
checkSyntheticMocks("e2e_page_logic_preservation.test.js", pageLogicCode);

// 3. GROUNDED SOURCE INSPECTION
// Find all files passed to readProjectFile(...)
const readProjectFileRegex = /readProjectFile\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
function checkGroundedFiles(filename, code) {
  let m;
  while ((m = readProjectFileRegex.exec(code)) !== null) {
    const rel = m[1];
    const full = path.join(root, rel);
    const exists = fs.existsSync(full);
    results.groundedFilesChecked.push({ file: filename, target: rel, exists });
  }
}

checkGroundedFiles("e2e_visual_design_system.test.js", visualCode);
checkGroundedFiles("e2e_page_logic_preservation.test.js", pageLogicCode);

// 4. CHECK FAILURES OR DISCREPANCIES
console.log(JSON.stringify(results, null, 2));
