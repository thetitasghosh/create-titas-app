const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

/**
 * Check if a directory exists and is empty
 * @param {string} dirPath - Path to directory
 * @returns {Object} - { exists: boolean, isEmpty: boolean }
 */
async function checkDirectory(dirPath) {
  try {
    const exists = await fs.pathExists(dirPath);
    if (!exists) {
      return { exists: false, isEmpty: true };
    }

    const files = await fs.readdir(dirPath);
    const isEmpty = files.length === 0;

    return { exists: true, isEmpty };
  } catch (error) {
    console.error(chalk.red(`Error checking directory: ${error.message}`));
    return { exists: false, isEmpty: true };
  }
}

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Path to directory
 * @returns {Promise<boolean>} - Success status
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.ensureDir(dirPath);
    return true;
  } catch (error) {
    console.error(chalk.red(`Error creating directory: ${error.message}`));
    return false;
  }
}

/**
 * Copy files from source to destination with filtering
 * @param {string} source - Source directory
 * @param {string} destination - Destination directory
 * @param {Object} options - Copy options
 * @returns {Promise<boolean>} - Success status
 */
async function copyFiles(source, destination, options = {}) {
  const { overwrite = false, filter = null, transform = null } = options;

  try {
    const copyOptions = {
      overwrite,
      filter: (src, dest) => {
        // Skip node_modules and .git directories
        if (src.includes("node_modules") || src.includes(".git")) {
          return false;
        }

        // Apply custom filter if provided
        if (filter && typeof filter === "function") {
          return filter(src, dest);
        }

        return true;
      },
    };

    await fs.copy(source, destination, copyOptions);

    // Apply transformations if needed
    if (transform && typeof transform === "function") {
      await transform(destination);
    }

    return true;
  } catch (error) {
    console.error(chalk.red(`Error copying files: ${error.message}`));
    return false;
  }
}

/**
 * Read and parse JSON file safely
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object|null>} - Parsed JSON or null
 */
async function readJsonFile(filePath) {
  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return null;
    }

    const content = await fs.readJson(filePath);
    return content;
  } catch (error) {
    console.error(
      chalk.red(`Error reading JSON file ${filePath}: ${error.message}`)
    );
    return null;
  }
}

/**
 * Write JSON file safely with formatting
 * @param {string} filePath - Path to JSON file
 * @param {Object} data - Data to write
 * @param {Object} options - Write options
 * @returns {Promise<boolean>} - Success status
 */
async function writeJsonFile(filePath, data, options = {}) {
  const { spaces = 2, backup = false } = options;

  try {
    // Create backup if requested
    if (backup && (await fs.pathExists(filePath))) {
      const backupPath = `${filePath}.backup`;
      await fs.copy(filePath, backupPath);
    }

    await fs.writeJson(filePath, data, { spaces });
    return true;
  } catch (error) {
    console.error(
      chalk.red(`Error writing JSON file ${filePath}: ${error.message}`)
    );
    return false;
  }
}

/**
 * Process template files by replacing variables
 * @param {string} dirPath - Directory containing template files
 * @param {Object} variables - Variables to replace
 * @param {Object} options - Processing options
 * @returns {Promise<boolean>} - Success status
 */
async function processTemplateFiles(dirPath, variables = {}, options = {}) {
  const {
    fileExtensions = [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".json",
      ".md",
      ".html",
      ".css",
    ],
    templateSuffix = ".template",
    variablePattern = /\{\{(\w+)\}\}/g,
  } = options;

  try {
    await processDirectory(dirPath, variables, {
      fileExtensions,
      templateSuffix,
      variablePattern,
    });
    return true;
  } catch (error) {
    console.error(
      chalk.red(`Error processing template files: ${error.message}`)
    );
    return false;
  }
}

/**
 * Recursively process directory for template files
 * @param {string} dirPath - Directory path
 * @param {Object} variables - Variables to replace
 * @param {Object} options - Processing options
 */
async function processDirectory(dirPath, variables, options) {
  const items = await fs.readdir(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = await fs.stat(itemPath);

    if (stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (item === "node_modules" || item === ".git") {
        continue;
      }
      await processDirectory(itemPath, variables, options);
    } else {
      await processFile(itemPath, variables, options);
    }
  }
}

/**
 * Process individual file for template variables
 * @param {string} filePath - File path
 * @param {Object} variables - Variables to replace
 * @param {Object} options - Processing options
 */
async function processFile(filePath, variables, options) {
  const { fileExtensions, templateSuffix, variablePattern } = options;
  const ext = path.extname(filePath);
  const isTemplateFile = filePath.endsWith(templateSuffix);

  // Process template files or files with allowed extensions
  if (isTemplateFile || fileExtensions.includes(ext)) {
    try {
      let content = await fs.readFile(filePath, "utf8");
      let hasChanges = false;

      // Replace variables
      content = content.replace(variablePattern, (match, variableName) => {
        if (variables.hasOwnProperty(variableName)) {
          hasChanges = true;
          return variables[variableName];
        }
        return match; // Keep original if variable not found
      });

      // Write back if changes were made
      if (hasChanges) {
        await fs.writeFile(filePath, content, "utf8");
      }

      // Remove .template suffix if it's a template file
      if (isTemplateFile) {
        const newFilePath = filePath.replace(templateSuffix, "");
        await fs.move(filePath, newFilePath);
      }
    } catch (error) {
      // Skip binary files or files that can't be read as text
      if (error.code !== "EISDIR") {
        console.warn(
          chalk.yellow(
            `Warning: Could not process file ${filePath}: ${error.message}`
          )
        );
      }
    }
  }
}

/**
 * Clean up directory by removing unwanted files/folders
 * @param {string} dirPath - Directory path
 * @param {Array} patterns - Patterns to remove
 * @returns {Promise<boolean>} - Success status
 */
async function cleanupDirectory(dirPath, patterns = []) {
  const defaultPatterns = [
    "node_modules",
    ".git",
    ".DS_Store",
    "Thumbs.db",
    "*.log",
    ".env.local",
    ".env.development.local",
    ".env.test.local",
    ".env.production.local",
  ];

  const allPatterns = [...defaultPatterns, ...patterns];

  try {
    for (const pattern of allPatterns) {
      const matches = await findFilesByPattern(dirPath, pattern);
      for (const match of matches) {
        await fs.remove(match);
      }
    }
    return true;
  } catch (error) {
    console.error(chalk.red(`Error cleaning directory: ${error.message}`));
    return false;
  }
}

/**
 * Find files by glob pattern
 * @param {string} dirPath - Directory to search
 * @param {string} pattern - Glob pattern
 * @returns {Promise<Array>} - Array of matching file paths
 */
async function findFilesByPattern(dirPath, pattern) {
  // Simple pattern matching - you might want to use a proper glob library
  const results = [];

  try {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);

      if (pattern.includes("*")) {
        // Simple wildcard matching
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        if (regex.test(item)) {
          results.push(itemPath);
        }
      } else if (item === pattern) {
        results.push(itemPath);
      }
    }
  } catch (error) {
    // Directory might not exist or be accessible
  }

  return results;
}

/**
 * Get file/directory size
 * @param {string} itemPath - Path to file or directory
 * @returns {Promise<number>} - Size in bytes
 */
async function getSize(itemPath) {
  try {
    const stat = await fs.stat(itemPath);

    if (stat.isFile()) {
      return stat.size;
    } else if (stat.isDirectory()) {
      let totalSize = 0;
      const items = await fs.readdir(itemPath);

      for (const item of items) {
        const subPath = path.join(itemPath, item);
        totalSize += await getSize(subPath);
      }

      return totalSize;
    }

    return 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
function formatSize(bytes) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Create a file with content if it doesn't exist
 * @param {string} filePath - Path to file
 * @param {string} content - Content to write
 * @returns {Promise<boolean>} - Success status
 */
async function createFileIfNotExists(filePath, content = "") {
  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      await fs.outputFile(filePath, content);
      return true;
    }
    return false; // File already exists
  } catch (error) {
    console.error(
      chalk.red(`Error creating file ${filePath}: ${error.message}`)
    );
    return false;
  }
}

module.exports = {
  checkDirectory,
  ensureDirectory,
  copyFiles,
  readJsonFile,
  writeJsonFile,
  processTemplateFiles,
  cleanupDirectory,
  findFilesByPattern,
  getSize,
  formatSize,
  createFileIfNotExists,
};
