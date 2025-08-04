/**
 * Checks if a package is available for import
 */
export const checkPackage = async (packageName: string): Promise<boolean> => {
  try {
    await import(packageName);
    return true;
  } catch {
    return false;
  }
};
