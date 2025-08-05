import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/**
 * Detects if we're in a monorepo by looking for workspace indicators
 */
function detectWorkspaceRoot(startDir: string): string | null {
	const workspaceIndicators = [
		"pnpm-workspace.yaml",
		"lerna.json",
		"nx.json",
		"turbo.json",
		"rush.json",
	];

	let currentDir = startDir;
	const maxDepth = 10; // Prevent infinite loops
	let depth = 0;

	while (depth < maxDepth) {
		// Check for workspace indicators
		for (const indicator of workspaceIndicators) {
			const indicatorPath = path.join(currentDir, indicator);
			if (fs.existsSync(indicatorPath)) {
				return currentDir;
			}
		}

		// Check for multiple package.json files (another monorepo indicator)
		const packageJsonPath = path.join(currentDir, "package.json");
		if (fs.existsSync(packageJsonPath)) {
			// Look for packages/ or apps/ directories
			const commonDirs = ["packages", "apps"];
			for (const dir of commonDirs) {
				const dirPath = path.join(currentDir, dir);
				if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
					// Check if this directory contains subdirectories with package.json
					const subdirs = fs.readdirSync(dirPath);
					for (const subdir of subdirs) {
						const subdirPath = path.join(dirPath, subdir);
						const subPackageJson = path.join(subdirPath, "package.json");
						if (fs.existsSync(subPackageJson)) {
							return currentDir; // Found monorepo structure
						}
					}
				}
			}
		}

		// Move up one directory
		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			break; // Reached filesystem root
		}
		currentDir = parentDir;
		depth++;
	}

	return null;
}

/**
 * Gets git repository root directory
 */
function getGitRoot(): string | null {
	try {
		const gitRoot = execSync("git rev-parse --show-toplevel", {
			encoding: "utf8",
			stdio: "pipe",
		}).trim();
		return gitRoot;
	} catch {
		return null;
	}
}

/**
 * Finds all potential directories to search for environment files
 * Returns array in priority order: current dir → workspace root → git root
 */
export function findEnvDirectories(cwd: string = process.cwd()): string[] {
	const directories: string[] = [];

	// Always include current directory first
	directories.push(cwd);

	// Add workspace root if different from current directory
	const workspaceRoot = detectWorkspaceRoot(cwd);
	if (workspaceRoot && workspaceRoot !== cwd) {
		directories.push(workspaceRoot);
	}

	// Add git root if different from current directory and workspace root
	const gitRoot = getGitRoot();
	if (
		gitRoot &&
		fs.existsSync(gitRoot) &&
		gitRoot !== cwd &&
		gitRoot !== workspaceRoot
	) {
		directories.push(gitRoot);
	}

	return directories;
}
