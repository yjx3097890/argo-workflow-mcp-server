---
inclusion: always
---

# 测试标准规范

## 核心原则

- **测试是代码质量的保障**：所有测试必须通过，警告必须处理
- **不要逃避问题**：遇到依赖特殊环境的测试，寻求用户帮助配置，而不是自动 ignore
- **测试要有意义**：每个测试都应验证具体的行为或属性
- **测试要可维护**：测试代码应该清晰、简洁、易于理解

## 1. 单元测试标准

### 1.1 定义

单元测试验证单个函数、方法或模块的行为，应该：
- 测试单一职责
- 独立于外部依赖（数据库、网络、文件系统等）
- 快速执行（毫秒级）
- 可重复运行

### 1.2 命名规范

```rust
// ✅ 好的命名：清晰描述测试场景和期望结果
#[test]
fn should_return_error_when_url_is_empty() { }

#[test]
fn should_parse_valid_json_successfully() { }

#[test]
fn should_calculate_correct_total_for_multiple_items() { }

// ❌ 不好的命名：模糊不清
#[test]
fn test_1() { }

#[test]
fn test_url() { }

#[test]
fn it_works() { }
```

### 1.3 测试结构

使用 AAA 模式（Arrange-Act-Assert）：

```rust
#[test]
fn should_add_task_to_empty_list() {
    // Arrange（准备）：设置测试数据和环境
    let mut task_list = TaskList::new();
    let task = Task::new("完成测试");
    
    // Act（执行）：调用被测试的功能
    let result = task_list.add(task);
    
    // Assert（断言）：验证结果
    assert!(result.is_ok());
    assert_eq!(task_list.len(), 1);
}
```

### 1.4 覆盖范围

单元测试应该覆盖：
- **正常路径**：功能按预期工作的情况
- **边界条件**：空输入、最大值、最小值等
- **错误情况**：无效输入、异常状态等
- **特殊情况**：null、空字符串、特殊字符等

### 1.5 示例

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn should_create_task_with_valid_description() {
        let task = Task::new("测试任务");
        assert_eq!(task.description(), "测试任务");
        assert!(!task.is_completed());
    }

    #[test]
    fn should_reject_empty_description() {
        let result = Task::try_new("");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), TaskError::EmptyDescription);
    }

    #[test]
    fn should_mark_task_as_completed() {
        let mut task = Task::new("测试任务");
        task.complete();
        assert!(task.is_completed());
    }
}
```

## 2. 属性测试标准

### 2.1 定义

属性测试（Property-Based Testing）验证代码在大量随机输入下都满足某些属性。使用 `proptest` 或 `quickcheck` 库。

### 2.2 何时使用

属性测试适用于：
- **通用规则**：对所有输入都应该成立的规则
- **不变量**：操作前后保持不变的属性
- **往返属性**：序列化/反序列化、编码/解码等
- **关系属性**：两个操作之间的关系

### 2.3 命名和标注规范

```rust
// ✅ 必须标注验证的需求
#[test]
fn property_round_trip_preserves_data() {
    // **Feature: task-manager, Property 1: 序列化往返保持数据一致性**
    // **Validates: Requirements 3.1**
    proptest!(|(task in any::<Task>())| {
        let json = serde_json::to_string(&task)?;
        let decoded: Task = serde_json::from_str(&json)?;
        prop_assert_eq!(task, decoded);
    });
}
```

### 2.4 配置要求

- 每个属性测试至少运行 **100 次迭代**
- 使用 `ProptestConfig` 配置迭代次数

```rust
use proptest::prelude::*;

proptest! {
    #![proptest_config(ProptestConfig::with_cases(100))]
    
    #[test]
    fn property_adding_task_increases_length(
        task in any::<Task>()
    ) {
        // **Feature: task-manager, Property 2: 添加任务增加列表长度**
        // **Validates: Requirements 1.1**
        let mut list = TaskList::new();
        let initial_len = list.len();
        list.add(task);
        prop_assert_eq!(list.len(), initial_len + 1);
    }
}
```

### 2.5 常见属性模式

#### 往返属性（Round-trip）
```rust
// 序列化后反序列化应得到相同值
encode(decode(x)) == x
parse(format(x)) == x
```

#### 不变量（Invariant）
```rust
// 操作后某些属性保持不变
sort(list).len() == list.len()
map(list, f).len() == list.len()
```

#### 幂等性（Idempotence）
```rust
// 执行两次和执行一次效果相同
f(f(x)) == f(x)
```

#### 交换律（Commutativity）
```rust
// 操作顺序不影响结果
a + b == b + a
```

### 2.6 生成器策略

编写智能的生成器，约束输入空间：

```rust
// ✅ 好的生成器：约束到有效输入
fn valid_task() -> impl Strategy<Value = Task> {
    "[a-zA-Z0-9 ]{1,100}".prop_map(|desc| Task::new(desc))
}

// ✅ 好的生成器：生成边界情况
fn task_description() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("".to_string()),           // 空字符串
        Just(" ".to_string()),          // 纯空格
        Just("a".repeat(1000)),         // 超长字符串
        "[a-zA-Z0-9 ]{1,100}",         // 正常字符串
    ]
}
```

## 3. 集成测试标准

### 3.1 定义

集成测试验证多个模块或组件协同工作的行为。

### 3.2 位置

- 放在 `tests/` 目录下（crate 级别的集成测试）
- 或在模块内使用 `#[cfg(test)]` 标记

### 3.3 测试范围

集成测试应该：
- 测试公共 API 的行为
- 验证组件之间的交互
- 测试真实的使用场景
- 可以使用真实的依赖（但要快速可靠）

### 3.4 示例

```rust
// tests/integration_test.rs
use my_crate::{TaskManager, Task};

#[test]
fn should_persist_and_retrieve_tasks() {
    // 测试任务管理器的完整流程
    let manager = TaskManager::new();
    
    // 添加任务
    let task_id = manager.add_task("完成集成测试").unwrap();
    
    // 检索任务
    let task = manager.get_task(task_id).unwrap();
    assert_eq!(task.description(), "完成集成测试");
    
    // 完成任务
    manager.complete_task(task_id).unwrap();
    
    // 验证状态
    let task = manager.get_task(task_id).unwrap();
    assert!(task.is_completed());
}
```

## 4. 接口测试标准

### 4.1 定义

接口测试验证 API 端点的行为，包括 HTTP API、gRPC 等。

### 4.2 测试内容

- **请求/响应格式**：验证 JSON/Protobuf 序列化
- **状态码**：验证正确的 HTTP 状态码
- **错误处理**：验证错误响应格式
- **认证/授权**：验证安全机制
- **边界条件**：大请求、无效输入等

### 4.3 示例（使用 actix-web）

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, App};

    #[actix_web::test]
    async fn should_create_task_via_api() {
        let app = test::init_service(
            App::new().service(create_task)
        ).await;

        let req = test::TestRequest::post()
            .uri("/tasks")
            .set_json(&json!({
                "description": "测试任务"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());

        let body: Task = test::read_body_json(resp).await;
        assert_eq!(body.description(), "测试任务");
    }

    #[actix_web::test]
    async fn should_return_400_for_invalid_request() {
        let app = test::init_service(
            App::new().service(create_task)
        ).await;

        let req = test::TestRequest::post()
            .uri("/tasks")
            .set_json(&json!({
                "description": ""  // 无效：空描述
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 400);
    }
}
```

## 5. 端到端测试标准

### 5.1 定义

端到端测试（E2E）验证整个系统从用户角度的行为，包括所有组件和依赖。

### 5.2 何时使用

- 验证关键用户流程
- 测试系统集成点
- 验证部署配置
- 回归测试重要场景

### 5.3 特点

- 使用真实的依赖（数据库、Redis、外部服务等）
- 执行时间较长
- 数量应该少于单元测试和集成测试
- 应该可以在 CI/CD 环境中运行

### 5.4 示例

```rust
#[tokio::test]
#[ignore] // 默认不运行，需要特殊环境
async fn e2e_complete_conversion_workflow() {
    // **注意**：此测试需要 Redis 和 S3 环境
    // 运行前请确保：
    // 1. Redis 运行在 localhost:6379
    // 2. 配置了 AWS 凭证
    // 3. 设置了 S3_BUCKET 环境变量
    
    let config = Config::from_env().expect("配置环境变量");
    let app = App::new(config).await.expect("初始化应用");
    
    // 1. 提交转换任务
    let task_id = app.submit_conversion_task(
        "input.pdf",
        ConversionFormat::Docx
    ).await.expect("提交任务");
    
    // 2. 等待任务完成
    let result = app.wait_for_completion(task_id, Duration::from_secs(30))
        .await
        .expect("任务完成");
    
    // 3. 验证结果
    assert_eq!(result.status, TaskStatus::Completed);
    assert!(result.output_url.is_some());
    
    // 4. 下载并验证输出文件
    let output = app.download_result(&result.output_url.unwrap())
        .await
        .expect("下载结果");
    assert!(!output.is_empty());
}
```

## 6. 依赖特殊环境的测试

### 6.1 核心原则

**绝对不要自动 ignore 需要特殊环境的测试！**

当测试需要特殊环境时：
1. **首先询问用户**是否可以配置环境
2. **提供清晰的配置说明**
3. **只有在用户明确表示无法配置时**才考虑 ignore

### 6.2 处理流程

```rust
// ❌ 错误做法：自动 ignore
#[test]
#[ignore] // 需要 Redis
fn test_redis_connection() { }

// ✅ 正确做法：检查环境并提供清晰错误
#[test]
fn test_redis_connection() {
    let redis_url = std::env::var("REDIS_URL")
        .expect("请设置 REDIS_URL 环境变量。例如：export REDIS_URL=redis://localhost:6379");
    
    // 继续测试...
}

// ✅ 更好的做法：提供跳过选项但默认运行
#[test]
fn test_redis_connection() {
    if std::env::var("SKIP_REDIS_TESTS").is_ok() {
        eprintln!("跳过 Redis 测试（设置了 SKIP_REDIS_TESTS）");
        return;
    }
    
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| {
            panic!("需要 Redis 环境。请：\n\
                   1. 安装 Redis: brew install redis (macOS) 或 apt install redis (Linux)\n\
                   2. 启动 Redis: redis-server\n\
                   3. 设置环境变量: export REDIS_URL=redis://localhost:6379\n\
                   或者设置 SKIP_REDIS_TESTS=1 跳过这些测试");
        });
    
    // 继续测试...
}
```

### 6.3 询问用户的模板

当遇到需要特殊环境的测试时，使用以下模板询问用户：

```
我注意到这个测试需要 [依赖名称]（例如：Redis、PostgreSQL、AWS S3）。

为了运行这个测试，需要：
1. [配置步骤 1]
2. [配置步骤 2]
3. [配置步骤 3]

你希望如何处理？

选项：
1. 我会配置环境，请继续编写测试（推荐）
2. 暂时跳过这个测试，稍后配置
3. 使用 mock 替代真实依赖（可能降低测试价值）

请告诉我你的选择，我会相应调整测试代码。
```

### 6.4 环境配置文档

为需要特殊环境的测试创建配置文档：

```rust
// tests/README.md

# 测试环境配置

## Redis 测试

需要运行 Redis 服务器：

```bash
# macOS
brew install redis
redis-server

# Linux
sudo apt install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

设置环境变量：
```bash
export REDIS_URL=redis://localhost:6379
```

## S3 测试

需要 AWS 凭证和 S3 bucket：

```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export S3_BUCKET=your-test-bucket
export AWS_REGION=us-east-1
```

## 跳过特定测试

如果暂时无法配置某些环境：

```bash
# 跳过 Redis 测试
export SKIP_REDIS_TESTS=1

# 跳过 S3 测试
export SKIP_S3_TESTS=1
```
```

## 7. 警告处理标准

### 7.1 核心原则

**所有警告都必须处理，不能忽视！**

警告通常指示：
- 潜在的 bug
- 代码质量问题
- 未来可能的错误

### 7.2 常见警告类型

#### 未使用的变量
```rust
// ❌ 有警告
let result = some_function();

// ✅ 修复方式 1：使用变量
let result = some_function();
assert!(result.is_ok());

// ✅ 修复方式 2：明确表示忽略
let _ = some_function();

// ✅ 修复方式 3：使用下划线前缀（表示有意不使用）
let _result = some_function();
```

#### 未使用的导入
```rust
// ❌ 有警告
use std::collections::HashMap;

// ✅ 删除未使用的导入
// 或者实际使用它
```

#### 死代码
```rust
// ❌ 有警告：函数从未被调用
fn unused_function() { }

// ✅ 修复方式 1：删除未使用的代码
// ✅ 修复方式 2：如果是测试辅助函数，添加属性
#[cfg(test)]
fn test_helper() { }

// ✅ 修复方式 3：如果是公共 API，确保导出
pub fn public_api() { }
```

#### 类型推断失败
```rust
// ❌ 有警告：无法推断类型
let numbers = vec![];

// ✅ 明确指定类型
let numbers: Vec<i32> = vec![];
let numbers = Vec::<i32>::new();
```

### 7.3 处理流程

1. **运行测试并检查警告**
```bash
cargo test 2>&1 | grep warning
```

2. **分析每个警告**
   - 理解警告的含义
   - 确定根本原因

3. **修复警告**
   - 优先修复代码而不是抑制警告
   - 只在确实需要时使用 `#[allow(...)]`

4. **验证修复**
```bash
cargo test --all-features
cargo clippy -- -D warnings  # 将警告视为错误
```

### 7.4 Clippy 集成

使用 Clippy 捕获更多潜在问题：

```bash
# 运行 Clippy
cargo clippy --all-targets --all-features -- -D warnings

# 自动修复部分问题
cargo clippy --fix
```

在 CI 中强制执行：
```yaml
# .github/workflows/ci.yml
- name: Run Clippy
  run: cargo clippy --all-targets --all-features -- -D warnings
```

### 7.5 允许警告的例外情况

只在以下情况下使用 `#[allow(...)]`：

```rust
// ✅ 合理的例外：测试中的有意未使用
#[cfg(test)]
#[allow(dead_code)]
fn test_fixture() -> TestData {
    // 某些测试可能不使用这个 fixture
}

// ✅ 合理的例外：外部 API 要求
#[allow(non_snake_case)]
struct ExternalApiResponse {
    UserId: String,  // 外部 API 使用 PascalCase
}

// ❌ 不合理：掩盖真正的问题
#[allow(unused_variables)]
fn buggy_function(important_param: i32) {
    // 忘记使用 important_param - 这可能是 bug！
}
```

## 8. 测试执行标准

### 8.1 本地开发

```bash
# 运行所有测试
cargo test

# 运行特定测试
cargo test test_name

# 运行特定模块的测试
cargo test module_name::

# 显示测试输出
cargo test -- --nocapture

# 运行被 ignore 的测试
cargo test -- --ignored

# 运行所有测试（包括 ignored）
cargo test -- --include-ignored
```

### 8.2 CI/CD 要求

```yaml
# 示例 CI 配置
test:
  script:
    # 1. 运行所有测试
    - cargo test --all-features
    
    # 2. 检查代码格式
    - cargo fmt -- --check
    
    # 3. 运行 Clippy（将警告视为错误）
    - cargo clippy --all-targets --all-features -- -D warnings
    
    # 4. 检查文档
    - cargo doc --no-deps --all-features
```

### 8.3 性能要求

- **单元测试**：每个测试 < 10ms
- **集成测试**：每个测试 < 1s
- **端到端测试**：每个测试 < 30s

如果测试超时，考虑：
- 优化测试代码
- 使用更小的测试数据
- 拆分为多个小测试
- 使用并行执行

## 9. 测试覆盖率

### 9.1 目标

- **核心功能**：100% 覆盖
- **整体代码**：> 80% 覆盖
- **关键路径**：100% 覆盖

### 9.2 测量覆盖率

使用 `tarpaulin` 或 `cargo-llvm-cov`：

```bash
# 安装 tarpaulin
cargo install cargo-tarpaulin

# 运行覆盖率测试
cargo tarpaulin --out Html --output-dir coverage

# 或使用 llvm-cov
cargo install cargo-llvm-cov
cargo llvm-cov --html
```

### 9.3 覆盖率不是唯一指标

高覆盖率不等于高质量测试：
- 关注测试的**有效性**而不仅是覆盖率
- 确保测试验证**正确的行为**
- 使用属性测试覆盖**更广的输入空间**

## 10. 测试最佳实践总结

### 10.1 DO（应该做）

- ✅ 为每个公共函数编写测试
- ✅ 测试边界条件和错误情况
- ✅ 使用描述性的测试名称
- ✅ 保持测试简单和专注
- ✅ 使用属性测试验证通用规则
- ✅ 处理所有警告
- ✅ 在 CI 中运行所有测试
- ✅ 为需要特殊环境的测试提供清晰文档
- ✅ 询问用户如何配置测试环境

### 10.2 DON'T（不应该做）

- ❌ 不要忽视测试失败
- ❌ 不要忽视警告
- ❌ 不要自动 ignore 需要环境的测试
- ❌ 不要编写依赖执行顺序的测试
- ❌ 不要在测试中使用随机数（除非是属性测试）
- ❌ 不要编写过于复杂的测试
- ❌ 不要使用 mock 来掩盖设计问题
- ❌ 不要为了覆盖率而写无意义的测试

### 10.3 检查清单

在提交代码前：

- [ ] 所有测试通过
- [ ] 没有编译警告
- [ ] Clippy 检查通过
- [ ] 代码格式化正确
- [ ] 新功能有对应的测试
- [ ] 属性测试标注了验证的需求
- [ ] 需要特殊环境的测试有清晰文档
- [ ] 测试名称清晰描述测试内容

## 11. 故障排查

### 11.1 测试失败

1. **仔细阅读错误信息**
2. **使用 `--nocapture` 查看输出**
3. **添加调试输出**
4. **隔离失败的测试**
5. **检查测试假设是否正确**

### 11.2 测试不稳定（Flaky Tests）

如果测试有时通过有时失败：
- 检查是否依赖时间
- 检查是否依赖执行顺序
- 检查是否有竞态条件
- 检查是否依赖外部状态

### 11.3 测试太慢

- 使用 `cargo test -- --test-threads=1` 检查是否是并发问题
- 分析哪些测试最慢：`cargo test -- --nocapture | grep "test result"`
- 考虑使用 mock 替代慢速依赖
- 将慢速测试标记为集成测试

## 12. 记住

**测试是投资，不是成本。**

- 好的测试让你有信心重构
- 好的测试是最好的文档
- 好的测试能尽早发现 bug
- 好的测试让团队协作更顺畅

**不要逃避问题，要解决问题。**

- 遇到警告？修复它
- 需要环境？配置它
- 测试失败？找出原因

**质量是做出来的，不是测出来的，但测试是质量的保障。**
---
inclusion: always
---
