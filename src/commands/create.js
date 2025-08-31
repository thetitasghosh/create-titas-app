const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const inquirer = require("inquirer");
const validateProjectName = require("validate-npm-package-name");
const { spawn } = require("child_process");

// Import your utilities
const {
  checkDirectory,
  ensureDirectory,
  copyFiles,
  processTemplateFiles,
  writeJsonFile,
} = require("../utils/fileUtils");

const {
  initializeGit,
  isGitAvailable,
  checkGitConfig,
} = require("../utils/gitUtils");

/**
 * Main function to create a new Titas app
 * @param {string} projectName - Name of the project
 * @param {Object} options - CLI options from commander
 */
/**
 * Check system requirements and environment
 */
async function checkEnvironment() {
  const { execSync } = require("child_process");

  console.log(chalk.blue("🔍 Checking environment..."));

  try {
    // Check Node.js
    const nodeVersion = process.version;
    console.log(chalk.green(`✅ Node.js: ${nodeVersion}`));

    // Check npm
    try {
      const npmVersion = execSync("npm --version", {
        encoding: "utf8",
        timeout: 5000,
      }).trim();
      console.log(chalk.green(`✅ npm: v${npmVersion}`));
    } catch (error) {
      console.log(chalk.red("❌ npm: Not found or not working"));
      console.log(
        chalk.yellow("   Please install Node.js from https://nodejs.org/")
      );
    }

    // Check yarn (optional)
    try {
      const yarnVersion = execSync("yarn --version", {
        encoding: "utf8",
        timeout: 5000,
      }).trim();
      console.log(chalk.green(`✅ yarn: v${yarnVersion}`));
    } catch (error) {
      console.log(chalk.gray("ℹ️ yarn: Not available (optional)"));
    }

    // Check Git
    try {
      const gitVersion = execSync("git --version", {
        encoding: "utf8",
        timeout: 5000,
      }).trim();
      console.log(chalk.green(`✅ ${gitVersion}`));
    } catch (error) {
      console.log(chalk.yellow("⚠️ Git: Not found (optional for --no-git)"));
    }

    console.log();
  } catch (error) {
    console.error(chalk.red("Error checking environment:", error.message));
  }
}

async function createApp(projectName, options) {
  // Add environment check for debugging
  if (process.env.DEBUG || options.verbose) {
    await checkEnvironment();
  }
  // Validate project name
  const validation = validateProjectName(projectName);
  if (!validation.validForNewPackages) {
    console.error(chalk.red(`❌ Invalid project name: ${projectName}`));
    if (validation.errors) {
      validation.errors.forEach((error) =>
        console.error(chalk.red(`  - ${error}`))
      );
    }
    if (validation.warnings) {
      validation.warnings.forEach((warning) =>
        console.warn(chalk.yellow(`  - ${warning}`))
      );
    }
    process.exit(1);
  }

  // Determine template type
  const templateType = await determineTemplate(options);

  // Create project directory
  const projectPath = path.resolve(projectName);

  // Check if directory already exists
  const { exists, isEmpty } = await checkDirectory(projectPath);
  if (exists && !isEmpty) {
    console.error(
      chalk.red(`❌ Directory ${projectName} already exists and is not empty!`)
    );
    process.exit(1);
  }

  const spinner = ora("Setting up your project...").start();

  try {
    // Create directory
    spinner.text = "Creating project directory...";
    await ensureDirectory(projectPath);

    // Copy template files
    spinner.text = "Copying template files...";
    const templatePath = path.resolve(
      __dirname,
      "../../templates",
      templateType
    );
    await copyFiles(templatePath, projectPath, {
      overwrite: true,
      filter: (src, dest) => {
        // Skip certain files during copy
        const filename = path.basename(src);
        return !["package-lock.json", "yarn.lock", "node_modules"].includes(
          filename
        );
      },
    });

    // Process template variables
    spinner.text = "Processing template...";
    await processTemplate(projectPath, {
      projectName,
      templateType,
      ...options,
    });

    // Install dependencies if requested
    if (options.install !== false) {
      spinner.text = "Installing dependencies...";
      try {
        await installDependencies(projectPath);
      } catch (error) {
        spinner.warn(
          chalk.yellow("⚠️ Failed to install dependencies automatically")
        );
        console.log(chalk.red(`Error: ${error.message}`));
        console.log();
        console.log(chalk.blue("💡 You can install dependencies manually:"));
        console.log(chalk.gray(`  cd ${projectName}`));
        console.log(chalk.gray("  npm install"));
        console.log();

        // Continue without throwing error
      }
    }

    // Initialize git if requested
    if (options.git !== false) {
      spinner.text = "Initializing Git repository...";
      await setupGit(projectPath);
    }

    spinner.succeed(chalk.green("✅ Successfully created your Titas app!"));

    // Show next steps
    showNextSteps(projectName, options);
  } catch (error) {
    spinner.fail("❌ Failed to create app");

    // Cleanup on failure
    try {
      await fs.remove(projectPath);
    } catch (cleanupError) {
      console.error(
        chalk.red("Failed to cleanup after error:", cleanupError.message)
      );
    }

    throw error;
  }
}

/**
 * Determine which template to use
 */
async function determineTemplate(options) {
  const templates = [
    {
      key: "portfolio",
      name: "📄 Portfolio",
      description: "Personal/professional showcase",
    },
    {
      key: "ecom",
      name: "🛒 E-commerce",
      description: "Online store with cart & payments",
    },
    {
      key: "dashboard",
      name: "📊 Dashboard",
      description: "Analytics & data visualization",
    },
    {
      key: "webapp",
      name: "🌐 Web App",
      description: "Full-stack application",
    },
  ];

  // Check if template was specified via flags
  const selectedTemplate = templates.find((template) => options[template.key]);
  if (selectedTemplate) {
    console.log(chalk.green(`📋 Using ${selectedTemplate.name} template`));
    return selectedTemplate.key;
  }

  // If no flag provided, prompt user
  const { template } = await inquirer.prompt([
    {
      type: "list",
      name: "template",
      message: "📋 Which template would you like to use?",
      choices: templates.map((t) => ({
        name: `${t.name} - ${t.description}`,
        value: t.key,
      })),
    },
  ]);

  return template;
}

/**
 * Process template files with variables
 */
async function processTemplate(projectPath, variables) {
  // Update package.json
  const packageJsonPath = path.join(projectPath, "package.json");
  let packageJson = {};

  try {
    packageJson = await fs.readJson(packageJsonPath);
  } catch (error) {
    // Create basic package.json if it doesn't exist
    packageJson = {
      name: variables.projectName,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
    };
  }

  // Update package.json with project details
  packageJson.name = variables.projectName;

  // Add TypeScript dependencies if requested
  if (variables.typescript) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      typescript: "^5.0.0",
      "@types/node": "^20.0.0",
      "@types/react": "^18.0.0",
      "@types/react-dom": "^18.0.0",
    };
  }

  // Add Tailwind CSS if requested
  if (variables.tailwind) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      tailwindcss: "^3.3.0",
      postcss: "^8.4.0",
      autoprefixer: "^10.4.0",
    };
  }

  await writeJsonFile(packageJsonPath, packageJson);

  // Process template files with variable substitution
  await processTemplateFiles(projectPath, variables);
}

/**
 * Install project dependencies
 */
async function installDependencies(projectPath) {
  return new Promise((resolve, reject) => {
    // Determine which package manager to use
    const packageManager = detectPackageManager();

    console.log(
      chalk.blue(`📦 Installing dependencies with ${packageManager}...`)
    );

    const installCommand = packageManager === "yarn" ? "yarn" : "npm install";
    const [command, ...args] = installCommand.split(" ");

    const child = spawn(command, args, {
      cwd: projectPath,
      stdio: "pipe",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Package installation failed with code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(
        new Error(`Failed to start package installation: ${error.message}`)
      );
    });
  });
}

/**
 * Detect which package manager to use
 */
function detectPackageManager() {
  try {
    require.resolve("yarn");
    return "yarn";
  } catch {
    return "npm";
  }
}

/**
 * Set up Git repository
 */
async function setupGit(projectPath) {
  if (!(await isGitAvailable())) {
    console.warn(
      chalk.yellow("⚠️ Git is not available. Skipping Git initialization.")
    );
    return;
  }

  // Check Git configuration
  const gitConfig = await checkGitConfig();
  if (!gitConfig.hasUserName || !gitConfig.hasUserEmail) {
    console.warn(
      chalk.yellow(
        "⚠️ Git user configuration is incomplete. Please set up git config --global user.name and user.email"
      )
    );
  }

  await initializeGit(projectPath, {
    initialBranch: "main",
    createInitialCommit: true,
    commitMessage: "Initial commit from create-titas-app",
  });
}

/**
 * Show next steps to the user
 */
function showNextSteps(projectName, options) {
  console.log("\n" + chalk.cyan("🎉 Your project is ready!"));
  console.log("\nNext steps:");
  console.log(`  ${chalk.cyan("cd")} ${projectName}`);

  if (options.install === false) {
    const packageManager = detectPackageManager();
    console.log(
      `  ${chalk.cyan(packageManager === "yarn" ? "yarn" : "npm install")}`
    );
  }

  console.log(`  ${chalk.cyan("npm run dev")}`);
  console.log("\nHappy coding! 🚀\n");
}

/**
 * Install project dependencies
 */
async function installDependencies(projectPath) {
  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);

  try {
    // Determine which package manager to use
    const packageManager = detectPackageManager();

    console.log(
      chalk.blue(`📦 Installing dependencies with ${packageManager}...`)
    );

    // Use exec instead of spawn for better cross-platform compatibility
    const command = packageManager === "yarn" ? "yarn install" : "npm install";

    console.log(chalk.gray(`Running: ${command}`));

    const { stdout, stderr } = await execAsync(command, {
      cwd: projectPath,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      env: { ...process.env, FORCE_COLOR: "0" }, // Disable colors for cleaner output
    });

    // Log output if there's useful information
    if (stdout && stdout.trim()) {
      console.log(chalk.gray("Installation output:"));
      console.log(stdout.trim());
    }

    // Show warnings but don't fail
    if (stderr && stderr.trim() && !stderr.includes("WARN")) {
      console.warn(chalk.yellow("Installation warnings:"));
      console.warn(stderr.trim());
    }

    console.log(chalk.green("✅ Dependencies installed successfully!"));
  } catch (error) {
    // More specific error handling
    if (error.code === "ENOENT") {
      throw new Error(
        `${
          packageManager === "yarn" ? "Yarn" : "npm"
        } is not installed or not found in PATH. Please install Node.js from https://nodejs.org/`
      );
    } else if (error.code) {
      throw new Error(
        `Package installation failed with code ${error.code}: ${error.message}`
      );
    } else {
      throw new Error(`Package installation failed: ${error.message}`);
    }
  }
}

/**
 * Detect which package manager to use
 */
function detectPackageManager() {
  const { execSync } = require("child_process");
  const fs = require("fs");
  const path = require("path");

  // First check if yarn.lock exists in current directory
  if (fs.existsSync("yarn.lock")) {
    return "yarn";
  }

  // Then try to detect if yarn is available
  try {
    execSync("yarn --version", { stdio: "ignore", timeout: 5000 });
    return "yarn";
  } catch (error) {
    // Yarn not available, check npm
    try {
      execSync("npm --version", { stdio: "ignore", timeout: 5000 });
      return "npm";
    } catch (npmError) {
      // Neither available, default to npm
      console.warn(
        chalk.yellow(
          "⚠️ Neither npm nor yarn could be detected. Defaulting to npm."
        )
      );
      return "npm";
    }
  }
}

module.exports = { createApp, checkEnvironment };
