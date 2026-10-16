import path from "node:path";
import {
  validateConfig,
  fixConfigIssues,
  type ValidationReport,
} from "../helpers/configValidator";

// Colors for terminal output
const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

export async function runCli(): Promise<number> {
  const args = process.argv.slice(2);
  const isFix = args.includes("--fix");
  const isJson = args.includes("--json");
  const isStrict = args.includes("--strict");

  let configPath = path.resolve(process.cwd(), "config.json");
  const fileArgIndex = args.indexOf("--file");
  if (fileArgIndex !== -1 && args[fileArgIndex + 1]) {
    configPath = path.resolve(process.cwd(), args[fileArgIndex + 1]);
  }

  if (isFix) {
    try {
      const fixResult = fixConfigIssues(configPath);
      if (!isJson) {
        console.log(
          `\n${COLORS.cyan}${COLORS.bold}[Config Auto-Fixer]${COLORS.reset} Applied ${fixResult.fixedCount} automated fix(es):`,
        );
        for (const fix of fixResult.fixes) {
          console.log(`  ${COLORS.green}✓${COLORS.reset} ${fix}`);
        }
        console.log("");
      }
    } catch (err: any) {
      console.error(
        `${COLORS.red}[Auto-Fix Error]${COLORS.reset} Failed to apply fixes: ${err.message}`,
      );
    }
  }

  const report: ValidationReport = validateConfig({ configPath });

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
    if (!report.valid || (isStrict && report.warningsCount > 0)) {
      return 1;
    }
    return 0;
  }

  // Terminal Human-Readable Report
  console.log("");
  console.log(
    `${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}`,
  );
  console.log(
    ` ${COLORS.bold}Core Platform - Configuration & Schema Validator${COLORS.reset}`,
  );
  console.log(` Target: ${COLORS.gray}${configPath}${COLORS.reset}`);
  console.log(
    `${COLORS.bold}${COLORS.cyan}================================================================================${COLORS.reset}\n`,
  );

  const errors = report.issues.filter((i) => i.severity === "error");
  const warnings = report.issues.filter((i) => i.severity === "warning");
  const infos = report.issues.filter((i) => i.severity === "info");

  // Output Errors
  if (errors.length > 0) {
    console.log(
      `${COLORS.red}${COLORS.bold}❌ ERRORS (${errors.length}):${COLORS.reset}`,
    );
    for (const issue of errors) {
      console.log(
        `  ${COLORS.red}• [${issue.code}]${COLORS.reset} ${COLORS.bold}${issue.path}${COLORS.reset}`,
      );
      console.log(`    Message:    ${issue.message}`);
      if (issue.suggestion) {
        console.log(
          `    ${COLORS.cyan}Suggestion:${COLORS.reset} ${issue.suggestion}`,
        );
      }
      console.log("");
    }
  }

  // Output Warnings
  if (warnings.length > 0) {
    console.log(
      `${COLORS.yellow}${COLORS.bold}⚠️  WARNINGS & ANOMALIES (${warnings.length}):${COLORS.reset}`,
    );
    for (const issue of warnings) {
      console.log(
        `  ${COLORS.yellow}• [${issue.code}]${COLORS.reset} ${COLORS.bold}${issue.path}${COLORS.reset}`,
      );
      console.log(`    Message:    ${issue.message}`);
      if (issue.suggestion) {
        console.log(
          `    ${COLORS.cyan}Suggestion:${COLORS.reset} ${issue.suggestion}`,
        );
      }
      if (issue.fixable) {
        console.log(
          `    ${COLORS.green}Fixable:${COLORS.reset}    Run with ${COLORS.bold}--fix${COLORS.reset} to automatically resolve.`,
        );
      }
      console.log("");
    }
  }

  // Output Recommendations / Info
  if (infos.length > 0) {
    console.log(
      `${COLORS.blue}${COLORS.bold}ℹ️  RECOMMENDATIONS & RELATIONS (${infos.length}):${COLORS.reset}`,
    );
    for (const issue of infos) {
      console.log(
        `  ${COLORS.blue}• [${issue.code}]${COLORS.reset} ${COLORS.bold}${issue.path}${COLORS.reset}`,
      );
      console.log(`    Message:    ${issue.message}`);
      if (issue.suggestion) {
        console.log(
          `    ${COLORS.cyan}Suggestion:${COLORS.reset} ${issue.suggestion}`,
        );
      }
      console.log("");
    }
  }

  // Summary Card
  console.log(
    `${COLORS.bold}--------------------------------------------------------------------------------${COLORS.reset}`,
  );
  console.log(
    ` Summary: ${report.summary.resourcesCount} resources, ${report.summary.pagesCount} pages inspected.`,
  );
  if (report.valid && report.warningsCount === 0) {
    console.log(
      ` Status:  ${COLORS.green}${COLORS.bold}PASSED${COLORS.reset} - No errors or anomalies detected.`,
    );
  } else if (report.valid) {
    console.log(
      ` Status:  ${COLORS.yellow}${COLORS.bold}PASSED WITH WARNINGS${COLORS.reset} (${report.warningsCount} warning(s), ${report.infoCount} recommendation(s)).`,
    );
  } else {
    console.log(
      ` Status:  ${COLORS.red}${COLORS.bold}FAILED${COLORS.reset} (${report.errorsCount} error(s), ${report.warningsCount} warning(s)).`,
    );
  }
  console.log(
    `${COLORS.bold}--------------------------------------------------------------------------------${COLORS.reset}\n`,
  );

  if (!report.valid || (isStrict && report.warningsCount > 0)) {
    return 1;
  }
  return 0;
}

const isDirectRun =
  Boolean(process.argv[1]?.endsWith("validate_config.ts")) ||
  Boolean(process.argv[1]?.endsWith("validate_config.js"));

if (isDirectRun) {
  runCli().then((code) => {
    process.exit(code);
  });
}

export default runCli;
