#!/usr/bin/env python3
from pathlib import Path
import os

# ===== 配置区：按需修改 =====
OLD_TEXT = "SIJIWUYU_"       # 要替换的旧名字（示例：'SIJIWUYU_16'）
NEW_TEXT = "SIJIWUYU_"        # 要替换的新名字（示例：'SIJIWUYU_15'）
ROOT_DIR = Path(__file__).parent  # 当前脚本所在目录作为根路径
UPDATE_CONTENT = False  # 替换文本内容
RENAME_FILES = True    # 重命名文件
RENAME_DIRS = False    # 重命名文件夹
DRY_RUN = False         # 试运行（只打印不改动），改为 False 执行

# 仅对这些文本类型做内容替换（可按需增删）
TEXT_FILE_EXTS = {
    '.meta', '.scene', '.json', '.ts', '.js', '.md'
}

# 可选：跳过这些目录
EXCLUDE_DIRS = {'.git', 'node_modules', '.idea', '.vscode'}


def replace_in_file(file_path: Path):
    try:
        # 只处理配置的文本类型
        if file_path.suffix.lower() not in TEXT_FILE_EXTS:
            return False
        text = file_path.read_text(encoding='utf-8', errors='replace')
        if OLD_TEXT not in text:
            return False
        new_text = text.replace(OLD_TEXT, NEW_TEXT)
        if DRY_RUN:
            print(f'[CONTENT] 将替换: {file_path}')
        else:
            file_path.write_text(new_text, encoding='utf-8')
            print(f'[CONTENT] 已替换: {file_path}')
        return True
    except Exception as e:
        print(f'[WARN] 跳过文件（读取失败）: {file_path} -> {e}')
        return False


def rename_path(path: Path):
    try:
        name = path.name
        if OLD_TEXT not in name:
            return False
        new_name = name.replace(OLD_TEXT, NEW_TEXT)
        new_path = path.with_name(new_name)
        if new_path.exists():
            print(f'[SKIP] 目标已存在，跳过重命名: {path} -> {new_path}')
            return False
        if DRY_RUN:
            print(f'[RENAME] 将重命名: {path} -> {new_path}')
        else:
            path.rename(new_path)
            print(f'[RENAME] 已重命名: {path} -> {new_path}')
        return True
    except Exception as e:
        print(f'[ERROR] 重命名失败: {path} -> {e}')
        return False


def main():
    if not OLD_TEXT or OLD_TEXT == NEW_TEXT:
        print('[ERROR] 请正确设置 OLD_TEXT 与 NEW_TEXT。')
        return

    changed_content = 0
    renamed_files = 0
    renamed_dirs = 0

    # 自底向上遍历，以便安全重命名目录
    for dirpath, dirnames, filenames in os.walk(ROOT_DIR, topdown=False):
        # 跳过指定目录
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]

        # 替换文件内容
        if UPDATE_CONTENT:
            for fname in filenames:
                fpath = Path(dirpath) / fname
                if replace_in_file(fpath):
                    changed_content += 1

        # 重命名文件
        if RENAME_FILES:
            for fname in filenames:
                fpath = Path(dirpath) / fname
                if rename_path(fpath):
                    renamed_files += 1

        # 重命名目录（在 bottom-up 下，这里处理的是子目录）
        if RENAME_DIRS:
            for dname in dirnames:
                dpath = Path(dirpath) / dname
                if rename_path(dpath):
                    renamed_dirs += 1

    print('—— 任务完成 ——')
    print(f'内容替换文件数: {changed_content}')
    print(f'重命名文件数:   {renamed_files}')
    print(f'重命名目录数:   {renamed_dirs}')
    if DRY_RUN:
        print('当前为试运行（未做实际改动）。将 DRY_RUN 设为 False 执行。')


if __name__ == '__main__':
    main()