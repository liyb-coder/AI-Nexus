import { describe, it, expect } from 'vitest';
import { assessRisk } from '../src/services/cli-executor.js';

describe('CLIExecutor — Risk Assessment', () => {
  it('should classify read commands as low risk', () => {
    expect(assessRisk('ls -la')).toBe('low');
    expect(assessRisk('cat file.txt')).toBe('low');
    expect(assessRisk('git status')).toBe('low');
    expect(assessRisk('echo hello')).toBe('low');
    expect(assessRisk('pwd')).toBe('low');
    expect(assessRisk('whoami')).toBe('low');
  });

  it('should classify write commands as medium risk', () => {
    expect(assessRisk('mkdir newdir')).toBe('medium');
    expect(assessRisk('cp file1 file2')).toBe('medium');
    expect(assessRisk('git add .')).toBe('medium');
    expect(assessRisk('git commit -m "msg"')).toBe('medium');
    expect(assessRisk('npm install lodash')).toBe('medium');
  });

  it('should classify exec commands as high risk', () => {
    expect(assessRisk('npm run build')).toBe('high');
    expect(assessRisk('python3 script.py')).toBe('high');
    expect(assessRisk('bash install.sh')).toBe('high');
    expect(assessRisk('lark-cli doc create')).toBe('high');
  });

  it('should classify curl as high risk', () => {
    expect(assessRisk('curl https://example.com')).toBe('high');
  });

  it('should classify rm -rf and sudo as critical risk', () => {
    expect(assessRisk('rm -rf node_modules')).toBe('critical');
    expect(assessRisk('sudo npm install -g')).toBe('critical');
    expect(assessRisk('chmod 777 file')).toBe('critical');
  });

  it('should default to medium for unrecognized commands', () => {
    expect(assessRisk('some-unknown-tool arg1')).toBe('medium');
  });
});
