import { RepositoryFactory } from '../fixtures/repository';
import { writeChangeFiles } from '../changefile/writeChangeFiles';
import { git } from '../git';
import { bump } from '../commands/bump';
import { getPackageInfos } from '../monorepo/getPackageInfos';
import { BeachballOptions } from '../types/BeachballOptions';

describe('version bumping', () => {
  it('bumps only packages with change files', async () => {
    const repositoryFactory = new RepositoryFactory();
    await repositoryFactory.create();
    const repo = await repositoryFactory.cloneRepository();

    await repo.commitChange(
      'packages/pkg-1/package.json',
      JSON.stringify({
        name: 'pkg-1',
        version: '1.0.0',
      })
    );

    await repo.commitChange(
      'packages/pkg-2/package.json',
      JSON.stringify({
        name: 'pkg-2',
        version: '1.0.0',
        dependencies: {
          'pkg-1': '1.0.0',
        },
      })
    );

    await repo.commitChange(
      'packages/pkg-3/package.json',
      JSON.stringify({
        name: 'pkg-3',
        version: '1.0.0',
        devDependencies: {
          'pkg-2': '1.0.0',
        },
      })
    );

    await repo.commitChange(
      'packages/pkg-4/package.json',
      JSON.stringify({
        name: 'pkg-4',
        version: '1.0.0',
        peerDependencies: {
          'pkg-3': '1.0.0',
        },
      })
    );

    await repo.commitChange(
      'package.json',
      JSON.stringify({
        name: 'foo-repo',
        version: '1.0.0',
        private: true,
      })
    );

    writeChangeFiles(
      {
        'pkg-1': {
          type: 'minor',
          comment: 'test',
          commit: 'test',
          date: new Date('2019-01-01'),
          email: 'test@test.com',
          packageName: 'pkg-1',
          dependentChangeType: 'patch',
        },
      },
      repo.rootPath
    );

    git(['push', 'origin', 'master'], { cwd: repo.rootPath });

    bump({ path: repo.rootPath, bumpDeps: false } as BeachballOptions);

    const packageInfos = getPackageInfos(repo.rootPath);

    expect(packageInfos['pkg-1'].version).toBe('1.1.0');
    expect(packageInfos['pkg-2'].version).toBe('1.0.0');
    expect(packageInfos['pkg-3'].version).toBe('1.0.0');

    expect(packageInfos['pkg-2'].dependencies!['pkg-1']).toBe('1.1.0');
    expect(packageInfos['pkg-3'].devDependencies!['pkg-2']).toBe('1.0.0');
    expect(packageInfos['pkg-4'].peerDependencies!['pkg-3']).toBe('1.0.0');
  });

  it('bumps all dependent packages with `bumpDeps` flag', async () => {
    const repositoryFactory = new RepositoryFactory();
    await repositoryFactory.create();
    const repo = await repositoryFactory.cloneRepository();

    await repo.commitChange(
      'packages/pkg-1/package.json',
      JSON.stringify({
        name: 'pkg-1',
        version: '1.0.0',
      })
    );

    await repo.commitChange(
      'packages/pkg-2/package.json',
      JSON.stringify({
        name: 'pkg-2',
        version: '1.0.0',
        dependencies: {
          'pkg-1': '1.0.0',
        },
      })
    );

    await repo.commitChange(
      'packages/pkg-3/package.json',
      JSON.stringify({
        name: 'pkg-3',
        version: '1.0.0',
        devDependencies: {
          'pkg-2': '1.0.0',
        },
      })
    );

    await repo.commitChange(
      'packages/pkg-4/package.json',
      JSON.stringify({
        name: 'pkg-4',
        version: '1.0.0',
        peerDependencies: {
          'pkg-3': '1.0.0',
        },
      })
    );

    await repo.commitChange(
      'package.json',
      JSON.stringify({
        name: 'foo-repo',
        version: '1.0.0',
        private: true,
      })
    );

    writeChangeFiles(
      {
        'pkg-1': {
          type: 'minor',
          comment: 'test',
          commit: 'test',
          date: new Date('2019-01-01'),
          email: 'test@test.com',
          packageName: 'pkg-1',
          dependentChangeType: 'patch',
        },
      },
      repo.rootPath
    );

    git(['push', 'origin', 'master'], { cwd: repo.rootPath });

    bump({ path: repo.rootPath, bumpDeps: true } as BeachballOptions);

    const packageInfos = getPackageInfos(repo.rootPath);

    expect(packageInfos['pkg-1'].version).toBe('1.1.0');
    expect(packageInfos['pkg-2'].version).toBe('1.0.1');
    expect(packageInfos['pkg-3'].version).toBe('1.0.1');

    expect(packageInfos['pkg-2'].dependencies!['pkg-1']).toBe('1.1.0');
    expect(packageInfos['pkg-3'].devDependencies!['pkg-2']).toBe('1.0.1');
    expect(packageInfos['pkg-4'].peerDependencies!['pkg-3']).toBe('1.0.1');
  });

  it('bumps all grouped packages', async () => {
    const repositoryFactory = new RepositoryFactory();
    await repositoryFactory.create();
    const repo = await repositoryFactory.cloneRepository();

    await repo.commitChange(
      'packages/pkg-1/package.json',
      JSON.stringify({
        name: 'pkg-1',
        version: '1.0.0',
      })
    );

    await repo.commitChange(
      'packages/pkg-2/package.json',
      JSON.stringify({
        name: 'pkg-2',
        version: '1.0.0',
      })
    );

    await repo.commitChange(
      'packages/pkg-3/package.json',
      JSON.stringify({
        name: 'pkg-3',
        version: '1.0.0',
      })
    );

    await repo.commitChange(
      'unrelated/pkg-4/package.json',
      JSON.stringify({
        name: 'pkg-4',
        version: '1.0.0',
      })
    );

    writeChangeFiles(
      {
        'pkg-1': {
          type: 'minor',
          comment: 'test',
          commit: 'test',
          date: new Date('2019-01-01'),
          email: 'test@test.com',
          packageName: 'pkg-1',
          dependentChangeType: 'patch',
        },
      },
      repo.rootPath
    );

    git(['push', 'origin', 'master'], { cwd: repo.rootPath });

    bump({ path: repo.rootPath, groups: [{ include: 'packages/*', name: 'testgroup' }] } as BeachballOptions);

    const packageInfos = getPackageInfos(repo.rootPath);

    expect(packageInfos['pkg-1'].version).toBe('1.1.0');
    expect(packageInfos['pkg-2'].version).toBe('1.1.0');
    expect(packageInfos['pkg-3'].version).toBe('1.1.0');
    expect(packageInfos['pkg-4'].version).toBe('1.0.0');
  });

  it('bumps all grouped AND dependent packages', async () => {
    const repositoryFactory = new RepositoryFactory();
    await repositoryFactory.create();
    const repo = await repositoryFactory.cloneRepository();

    await repo.commitChange(
      'packages/grp/1/package.json',
      JSON.stringify({
        name: 'pkg-1',
        version: '1.0.0',
      })
    );

    await repo.commitChange(
      'packages/grp/2/package.json',
      JSON.stringify({
        name: 'pkg-2',
        version: '1.0.0',
      })
    );

    await repo.commitChange(
      'packages/grp/3/package.json',
      JSON.stringify({
        name: 'pkg-3',
        version: '1.0.0',
        dependencies: {
          commonlib: '1.0.0',
        },
      })
    );

    await repo.commitChange(
      'packages/commonlib/package.json',
      JSON.stringify({
        name: 'commonlib',
        version: '1.0.0',
      })
    );

    await repo.commitChange(
      'packages/app/package.json',
      JSON.stringify({
        name: 'app',
        version: '1.0.0',
        dependencies: {
          'pkg-1': '1.0.0',
        },
      })
    );

    await repo.commitChange(
      'packages/unrelated/package.json',
      JSON.stringify({
        name: 'unrelated',
        version: '1.0.0',
      })
    );

    writeChangeFiles(
      {
        commonlib: {
          type: 'minor',
          comment: 'test',
          commit: 'test',
          date: new Date('2019-01-01'),
          email: 'test@test.com',
          packageName: 'commonlib',
          dependentChangeType: 'minor',
        },
      },
      repo.rootPath
    );

    git(['push', 'origin', 'master'], { cwd: repo.rootPath });

    bump({
      path: repo.rootPath,
      groups: [{ include: 'packages/grp/*', name: 'grp' }],
      bumpDeps: true,
    } as BeachballOptions);

    const packageInfos = getPackageInfos(repo.rootPath);

    expect(packageInfos['pkg-1'].version).toBe('1.1.0');
    expect(packageInfos['pkg-2'].version).toBe('1.1.0');
    expect(packageInfos['pkg-3'].version).toBe('1.1.0');
    expect(packageInfos['commonlib'].version).toBe('1.1.0');
    expect(packageInfos['app'].version).toBe('1.1.0');
    expect(packageInfos['unrelated'].version).toBe('1.0.0');
  });
});
