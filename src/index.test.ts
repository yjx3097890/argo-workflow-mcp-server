/**
 * 基础测试 - 验证测试框架配置
 */

describe('项目初始化', () => {
  it('应该能够运行测试', () => {
    expect(true).toBe(true);
  });

  it('应该能够进行基本的断言', () => {
    const sum = (a: number, b: number) => a + b;
    expect(sum(1, 2)).toBe(3);
  });
});
