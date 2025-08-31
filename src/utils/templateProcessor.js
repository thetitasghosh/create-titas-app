const fs = require("fs-extra");
const path = require("path");

async function copyTemplate(templateType, targetPath) {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates",
      templateType
    );

    // Check if template exists
    if (!(await fs.pathExists(templatePath))) {
      throw new Error(
        `❌ Template "${templateType}" not found at ${templatePath}`
      );
    }

    await fs.copy(templatePath, targetPath);
    console.log(`✅ Copied ${templateType} template to ${targetPath}`);
  } catch (error) {
    console.error(`⚠️ Failed to copy template: ${error.message}`);
    process.exit(1);
  }
}

async function processTemplate(projectPath, variables) {
  try {
    // Process package.json
    const packageJsonPath = path.join(projectPath, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = variables.projectName || packageJson.name;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    // Process other template files with variable substitution
    await processTemplateFiles(projectPath, variables);
  } catch (error) {
    console.error(`⚠️ Failed to process template: ${error.message}`);
    process.exit(1);
  }
}

async function processTemplateFiles(dir, variables) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      await processTemplateFiles(filePath, variables);
    } else if (file.endsWith(".template")) {
      let content = await fs.readFile(filePath, "utf8");

      // Replace variables like {{projectName}}
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        content = content.replace(regex, variables[key] || "");
      });

      const newFilePath = filePath.replace(".template", "");
      await fs.writeFile(newFilePath, content);
      await fs.remove(filePath);
    }
  }
}

module.exports = {
  copyTemplate,
  processTemplate,
};
