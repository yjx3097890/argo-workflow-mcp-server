/**
 * 属性测试示例 - 验证 fast-check 配置
 */

import * as fc from 'fast-check';

describe('属性测试框架验证', () => {
  it('应该能够运行基本的属性测试', () => {
    // 验证加法交换律
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
      { numRuns: 100 }
    );
  });

  it('应该能够运行字符串属性测试', () => {
    // 验证字符串连接长度
    fc.assert(
      fc.property(fc.string(), fc.string(), (s1, s2) => {
        const combined = s1 + s2;
        return combined.length === s1.length + s2.length;
      }),
      { numRuns: 100 }
    );
  });
});
