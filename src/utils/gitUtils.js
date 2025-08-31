const { spawn, exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const { promisify } = require("util");

const execAsync = promisify(exec);

/**
 * Check if Git is available on the system
 * @returns {Promise<boolean>} - True if Git is available
 */
async function isGitAvailable() {
  try {
    await execAsync("git --version");
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if directory is already a Git repository
 * @param {string} dirPath - Directory path to check
 * @returns {Promise<boolean>} - True if it's a Git repository
 */
async function isGitRepository(dirPath) {
  try {
    const gitPath = path.join(dirPath, ".git");
    return await fs.pathExists(gitPath);
  } catch (error) {
    return false;
  }
}

/**
 * Initialize Git repository in the specified directory
 * @param {string} dirPath - Directory path
 * @param {Object} options - Initialization options
 * @returns {Promise<boolean>} - Success status
 */
async function initializeGit(dirPath, options = {}) {
  const {
    initialBranch = "main",
    createInitialCommit = true,
    addGitignore = true,
    commitMessage = "Initial commit from create-titas-app",
  } = options;

  try {
    // Check if Git is available
    if (!(await isGitAvailable())) {
      console.warn(
        chalk.yellow("Git is not available. Skipping Git initialization.")
      );
      return false;
    }

    // Check if already a Git repository
    if (await isGitRepository(dirPath)) {
      console.warn(
        chalk.yellow(
          "Directory is already a Git repository. Skipping initialization."
        )
      );
      return true;
    }

    console.log(chalk.blue("Initializing Git repository..."));

    // Initialize Git repository
    await execInDirectory(
      dirPath,
      `git init --initial-branch=${initialBranch}`
    );

    // Create .gitignore if requested
    if (addGitignore) {
      await createGitignore(dirPath);
    }

    if (createInitialCommit) {
      // Add all files
      await execInDirectory(dirPath, "git add .");

      // Create initial commit
      await execInDirectory(dirPath, `git commit -m "${commitMessage}"`);

      console.log(
        chalk.green("✓ Git repository initialized with initial commit")
      );
    } else {
      console.log(chalk.green("✓ Git repository initialized"));
    }

    return true;
  } catch (error) {
    console.error(chalk.red(`Error initializing Git: ${error.message}`));
    return false;
  }
}

/**
 * Execute Git command in specific directory
 * @param {string} dirPath - Directory path
 * @param {string} command - Git command to execute
 * @returns {Promise<string>} - Command output
 */
async function execInDirectory(dirPath, command) {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: dirPath });
    if (stderr) {
      console.warn(chalk.yellow(`Git warning: ${stderr}`));
    }
    return stdout.trim();
  } catch (error) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

/**
 * Create .gitignore file with common patterns
 * @param {string} dirPath - Directory path
 * @param {Array} additionalPatterns - Additional patterns to add
 * @returns {Promise<boolean>} - Success status
 */
async function createGitignore(dirPath, additionalPatterns = []) {
  const gitignoreContent = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production builds
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary folders
tmp/
temp/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

${
  additionalPatterns.length > 0
    ? "\n# Additional patterns\n" + additionalPatterns.join("\n")
    : ""
}
`;

  try {
    const gitignorePath = path.join(dirPath, ".gitignore");
    await fs.writeFile(gitignorePath, gitignoreContent);
    return true;
  } catch (error) {
    console.error(chalk.red(`Error creating .gitignore: ${error.message}`));
    return false;
  }
}

/**
 * Check Git configuration (user name and email)
 * @returns {Promise<Object>} - Git configuration status
 */
async function checkGitConfig() {
  try {
    const userName = await execAsync("git config --global user.name")
      .then((r) => r.stdout.trim())
      .catch(() => null);
    const userEmail = await execAsync("git config --global user.email")
      .then((r) => r.stdout.trim())
      .catch(() => null);

    return {
      hasUserName: !!userName,
      hasUserEmail: !!userEmail,
      userName,
      userEmail,
    };
  } catch (error) {
    return {
      hasUserName: false,
      hasUserEmail: false,
      userName: null,
      userEmail: null,
    };
  }
}

/**
 * Set up Git configuration interactively
 * @returns {Promise<boolean>} - Success status
 */
async function setupGitConfig() {
  try {
    const config = await checkGitConfig();

    if (config.hasUserName && config.hasUserEmail) {
      console.log(
        chalk.green(
          `✓ Git is configured for ${config.userName} <${config.userEmail}>`
        )
      );
      return true;
    }

    console.log(chalk.yellow("Git configuration is incomplete."));

    if (!config.hasUserName) {
      console.log(chalk.blue("Please set your Git username:"));
      console.log(chalk.gray('git config --global user.name "Your Name"'));
    }

    if (!config.hasUserEmail) {
      console.log(chalk.blue("Please set your Git email:"));
      console.log(
        chalk.gray('git config --global user.email "your.email@example.com"')
      );
    }

    return false;
  } catch (error) {
    console.error(
      chalk.red(`Error checking Git configuration: ${error.message}`)
    );
    return false;
  }
}

/**
 * Clone a repository to a specific directory
 * @param {string} repoUrl - Repository URL
 * @param {string} targetDir - Target directory
 * @param {Object} options - Clone options
 * @returns {Promise<boolean>} - Success status
 */
async function cloneRepository(repoUrl, targetDir, options = {}) {
  const { branch = null, depth = null, removeGitHistory = false } = options;

  try {
    if (!(await isGitAvailable())) {
      throw new Error("Git is not available");
    }

    let cloneCommand = `git clone ${repoUrl} ${targetDir}`;

    if (branch) {
      cloneCommand += ` --branch ${branch}`;
    }

    if (depth) {
      cloneCommand += ` --depth ${depth}`;
    }

    console.log(chalk.blue(`Cloning repository from ${repoUrl}...`));
    await execAsync(cloneCommand);

    if (removeGitHistory) {
      const gitDir = path.join(targetDir, ".git");
      await fs.remove(gitDir);
      console.log(chalk.green("✓ Repository cloned and Git history removed"));
    } else {
      console.log(chalk.green("✓ Repository cloned successfully"));
    }

    return true;
  } catch (error) {
    console.error(chalk.red(`Error cloning repository: ${error.message}`));
    return false;
  }
}

/**
 * Add remote repository
 * @param {string} dirPath - Repository directory
 * @param {string} remoteName - Remote name (e.g., 'origin')
 * @param {string} remoteUrl - Remote URL
 * @returns {Promise<boolean>} - Success status
 */
async function addRemote(dirPath, remoteName, remoteUrl) {
  try {
    await execInDirectory(dirPath, `git remote add ${remoteName} ${remoteUrl}`);
    console.log(chalk.green(`✓ Added remote '${remoteName}': ${remoteUrl}`));
    return true;
  } catch (error) {
    console.error(chalk.red(`Error adding remote: ${error.message}`));
    return false;
  }
}

/**
 * Get current Git status
 * @param {string} dirPath - Repository directory
 * @returns {Promise<Object|null>} - Git status information
 */
async function getGitStatus(dirPath) {
  try {
    if (!(await isGitRepository(dirPath))) {
      return null;
    }

    const statusOutput = await execInDirectory(
      dirPath,
      "git status --porcelain"
    );
    const branchOutput = await execInDirectory(
      dirPath,
      "git branch --show-current"
    );

    const files = statusOutput
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const status = line.substring(0, 2);
        const filename = line.substring(3);
        return { status, filename };
      });

    return {
      branch: branchOutput || "HEAD",
      hasChanges: files.length > 0,
      files,
    };
  } catch (error) {
    console.error(chalk.red(`Error getting Git status: ${error.message}`));
    return null;
  }
}

/**
 * Create and push initial commit to remote
 * @param {string} dirPath - Repository directory
 * @param {string} remoteUrl - Remote repository URL
 * @param {Object} options - Push options
 * @returns {Promise<boolean>} - Success status
 */
async function pushToRemote(dirPath, remoteUrl, options = {}) {
  const {
    remoteName = "origin",
    branch = "main",
    commitMessage = "Initial commit from create-titas-app",
    createRepo = false,
  } = options;

  try {
    // Add remote if it doesn't exist
    const remoteExists = await execInDirectory(
      dirPath,
      `git remote get-url ${remoteName}`
    )
      .then(() => true)
      .catch(() => false);

    if (!remoteExists) {
      await addRemote(dirPath, remoteName, remoteUrl);
    }

    // Check if there are any commits
    const hasCommits = await execInDirectory(dirPath, "git rev-parse HEAD")
      .then(() => true)
      .catch(() => false);

    if (!hasCommits) {
      // Create initial commit
      await execInDirectory(dirPath, "git add .");
      await execInDirectory(dirPath, `git commit -m "${commitMessage}"`);
    }

    // Push to remote
    await execInDirectory(dirPath, `git push -u ${remoteName} ${branch}`);
    console.log(chalk.green(`✓ Pushed to ${remoteName}/${branch}`));

    return true;
  } catch (error) {
    console.error(chalk.red(`Error pushing to remote: ${error.message}`));
    return false;
  }
}

/**
 * Create a new branch and switch to it
 * @param {string} dirPath - Repository directory
 * @param {string} branchName - New branch name
 * @returns {Promise<boolean>} - Success status
 */
async function createBranch(dirPath, branchName) {
  try {
    await execInDirectory(dirPath, `git checkout -b ${branchName}`);
    console.log(
      chalk.green(`✓ Created and switched to branch '${branchName}'`)
    );
    return true;
  } catch (error) {
    console.error(chalk.red(`Error creating branch: ${error.message}`));
    return false;
  }
}

/**
 * Get the last commit information
 * @param {string} dirPath - Repository directory
 * @returns {Promise<Object|null>} - Last commit info
 */
async function getLastCommit(dirPath) {
  try {
    const hash = await execInDirectory(dirPath, "git rev-parse HEAD");
    const message = await execInDirectory(
      dirPath,
      'git log -1 --pretty=format:"%s"'
    );
    const author = await execInDirectory(
      dirPath,
      'git log -1 --pretty=format:"%an <%ae>"'
    );
    const date = await execInDirectory(
      dirPath,
      'git log -1 --pretty=format:"%ci"'
    );

    return {
      hash: hash.substring(0, 7), // Short hash
      fullHash: hash,
      message,
      author,
      date: new Date(date),
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  isGitAvailable,
  isGitRepository,
  initializeGit,
  createGitignore,
  checkGitConfig,
  setupGitConfig,
  cloneRepository,
  addRemote,
  getGitStatus,
  pushToRemote,
  createBranch,
  getLastCommit,
  execInDirectory,
};
