###### Builder Image
FROM rust:slim as builder
WORKDIR /app

# 安装基础工具
RUN apt-get update && \
    apt-get install -y git

# 复制所有源码
COPY . .

# 初始化 git 仓库以支持 build.rs
RUN git init && \
    git add . && \
    git config --global user.email "docker@build.local" && \
    git config --global user.name "Docker Build" && \
    git commit -m "Initial commit"

# 构建项目
ARG ARCH
RUN __ARCH="$(dpkg --print-architecture)"; \
    [ -z  "$ARCH" ] || __ARCH=$ARCH; \
    case "$__ARCH" in \
        arm64) \
            # Setup cross compiling for arm64
            apt-get install -y gcc-aarch64-linux-gnu && \
            rustup target add aarch64-unknown-linux-gnu && \
            export __TARGET='aarch64-unknown-linux-gnu' \
            ;; \
        amd64) \
            export __TARGET='x86_64-unknown-linux-gnu' \
            ;; \
        *) \
            echo "Unsupported architecture: $__ARCH" && \
            exit 1 \
            ;; \
    esac && \
    # 构建项目 (允许警告但不允许错误)
    RUSTFLAGS="-A warnings" RUST_BACKTRACE=1 cargo build --release --target $__TARGET && \
    # 移动二进制文件到固定位置
    mkdir -p artifacts && \
    cp target/$__TARGET/release/bin artifacts/

###### Runner Image
FROM ubuntu:22.04 as runner
WORKDIR /app

# 安装基本依赖
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/artifacts/bin .

ENV BIN_ADDRESS=0.0.0.0
EXPOSE 6162

CMD ["./bin"]
