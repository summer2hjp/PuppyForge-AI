// __tests__/utils/jest.config.js
const path = require('path');
const nextJest = require('next/jest');

// ✅ 关键：计算真正的 Next.js 项目根目录 (frontend/)
const projectRoot = path.resolve(__dirname, '../..');

const createJestConfig = nextJest({
  dir: projectRoot,
});

const customConfig = {
  // ✅ 强制覆盖 Jest 的 <rootDir> 指向项目根目录
  rootDir: projectRoot,
  
  testEnvironment: 'jest-environment-jsdom',
  
  // ⚠️ 如果 __tests__/setup.ts 尚未创建，请先注释掉下一行，或按下方步骤创建它
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};

module.exports = createJestConfig(customConfig);
