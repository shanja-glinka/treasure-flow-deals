import os

def count_lines_of_code(directory):
    total_lines = 0
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in {'node_modules', '.git'}]
        for file in files:
            if file.endswith('.ts') or file.endswith('.js'):  # Учитываем только файлы TypeScript и JavaScript
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    total_lines += len(lines)
                    # for line in f:
                    #     if line.strip():
                    #         total_lines += 1
    return total_lines

project_path = './src'
total_lines = count_lines_of_code(project_path)
print(f"Total lines of code: {total_lines}")
