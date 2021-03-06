import { getPackageChangeTypes } from '../changefile/getPackageChangeTypes';
import { readChangeFiles } from '../changefile/readChangeFiles';
import { getPackageInfos } from '../monorepo/getPackageInfos';
import { ChangeSet } from '../types/ChangeInfo';
import { BumpInfo } from '../types/BumpInfo';
import { bumpInPlace } from './bumpInPlace';
import { BeachballOptions } from '../types/BeachballOptions';

function gatherPreBumpInfo(cwd: string): BumpInfo {
  // Collate the changes per package
  const changes = readChangeFiles(cwd);
  const packageChangeTypes = getPackageChangeTypes(changes);
  const packageInfos = getPackageInfos(cwd);
  const dependentChangeTypes = {};
  const groupOptions = {};

  // Clear non-existent changes
  const filteredChanges: ChangeSet = new Map();
  for (let [changeFile, change] of changes) {
    if (packageInfos[change.packageName]) {
      filteredChanges.set(changeFile, change);
    }

    dependentChangeTypes[change.packageName] = change.dependentChangeType || 'patch';
  }

  // Clear non-existent changeTypes
  Object.keys(packageChangeTypes).forEach(packageName => {
    if (!packageInfos[packageName]) {
      delete packageChangeTypes[packageName];
    }
  });

  return {
    packageChangeTypes,
    packageInfos,
    packageGroups: {},
    changes: filteredChanges,
    modifiedPackages: new Set<string>(),
    newPackages: new Set<string>(),
    dependentChangeTypes,
    groupOptions,
    dependents: {},
  };
}

export function gatherBumpInfo(options: BeachballOptions): BumpInfo {
  const bumpInfo = gatherPreBumpInfo(options.path);
  bumpInPlace(bumpInfo, options);
  return bumpInfo;
}
