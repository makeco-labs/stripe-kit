import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import dotenv from 'dotenv';

import { findEnvDirectories, getEnvFilePatterns } from '../utils/workspace';
import type { EnvironmentKey } from './definitions';

/**
 * Loads environment variables using environment-specific auto-detection
 */
export function loadEnvironment(env: EnvironmentKey): void {
  // Find all potential directories to search for environment files
  const searchDirectories = findEnvDirectories();
  
  // Get environment-specific file patterns in priority order
  const envPatterns = getEnvFilePatterns(env);
  
  const loadedFiles: string[] = [];
  const searchedDirs: string[] = [];
  
  // Search each directory for env files
  for (const directory of searchDirectories) {
    searchedDirs.push(path.relative(process.cwd(), directory) || '.');
    
    for (const pattern of envPatterns) {
      const envPath = path.join(directory, pattern);
      
      if (fs.existsSync(envPath)) {
        const relativePath = path.relative(process.cwd(), envPath);
        console.log(
          chalk.blue(`Loading environment from: ${chalk.bold(relativePath)}`)
        );
        
        dotenv.config({ path: envPath, override: false }); // Don't override already loaded vars
        loadedFiles.push(relativePath);
      }
    }
    
    // If we found files in this directory, stop searching (prioritize closer directories)
    if (loadedFiles.length > 0) {
      break;
    }
  }
  
  if (loadedFiles.length === 0) {
    console.warn(
      chalk.yellow(`⚠️  No environment files found for environment: ${env}`)
    );
    console.log(
      chalk.gray(`Searched in: ${searchedDirs.join(', ')}`)
    );
    console.log(
      chalk.gray(`Expected files: ${envPatterns.join(', ')}`)
    );
  } else {
    console.log(
      chalk.green(`✅ Loaded ${loadedFiles.length} environment file(s) for: ${env}`)
    );
  }
}
