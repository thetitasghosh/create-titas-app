const fs = require("fs-extra");
const path = require("path");

async function copyTemplate(templateType, targetPath) {
  const templatePath = path.join(__dirname, "../../templates", templateType);
  await fs.copy(templatePath, targetPath);
}

async function processTemplate(projectPath, variables) {
  // Process package.json
  const packageJsonPath = path.join(projectPath, "package.json");
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = variables.projectName;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  // Process other template files with variable substitution
  await processTemplateFiles(projectPath, variables);
}

async function processTemplateFiles(dir, variables) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      await processTemplateFiles(filePath, variables);
    } else if (file.endsWith(".template")) {
      // Process template files
      let content = await fs.readFile(filePath, "utf8");

      // Replace variables
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        content = content.replace(regex, variables[key]);
      });

      // Write processed file without .template extension
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
