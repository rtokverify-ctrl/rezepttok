import os
import re

TARGETS = [
    "mobile/components",
    "mobile/screens",
    "mobile/app/(tabs)"
]

def get_relative_path_for_context(filepath):
    # Depending on depth, return correct '../context/GlobalContext' path
    depth = filepath.count('/') - 1
    if "app/(tabs)" in filepath:
        return "'../../context/GlobalContext'"
    elif "screens" in filepath:
        return "'../context/GlobalContext'"
    elif "components" in filepath:
        return "'../context/GlobalContext'"
    return "'../context/GlobalContext'"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "THEME_COLOR" not in content and "THEME_COLOR" not in content:
        return

    print(f"Refactoring {filepath}")

    # 1. Replace THEME_COLOR with themeColor
    content = content.replace("THEME_COLOR", "themeColor")
    
    # Remove from imports from Config
    content = re.sub(r'themeColor,\s*', '', content)
    content = re.sub(r',\s*themeColor', '', content)
    
    # 2. Add useGlobal import if missing
    if "useGlobal" not in content:
        rel_path = get_relative_path_for_context(filepath)
        import_stmt = f"import {{ useGlobal }} from {rel_path};\n"
        # stick it after the last import
        imports_end = content.rfind("import ")
        if imports_end != -1:
            next_line = content.find("\n", imports_end)
            content = content[:next_line+1] + import_stmt + content[next_line+1:]
        else:
            content = import_stmt + content

    # 3. Inject const { themeColor } = useGlobal(); into the main component
    # We find the first component definition like: const X = ({...}) => { or export default function X() {
    # and insert it on the next line.
    match = re.search(r'(const\s+\w+\s*=\s*(?:async\s)?\([^)]*\)\s*=>\s*\{|export\s+default\s+function\s+\w+\([^)]*\)\s*\{)', content)
    if match:
        insert_idx = match.end()
        # Ensure we don't insert it again if it already exists
        if "const { themeColor }" not in content and "themeColor } = useGlobal()" not in content:
            # Check if there is already a const { ... } = useGlobal()
            existing_hook = re.search(r'const\s+\{([^}]+)\}\s*=\s*useGlobal\(\);', content[insert_idx:insert_idx+500])
            if existing_hook:
                orig = existing_hook.group(0)
                new_hook = orig.replace("{", "{ themeColor, ")
                content = content.replace(orig, new_hook, 1)
            else:
                injection = "\n    const { themeColor } = useGlobal();"
                content = content[:insert_idx] + injection + content[insert_idx:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root_dir in TARGETS:
    for dirpath, _, filenames in os.walk(root_dir):
        for f in filenames:
            if f.endswith(".js"):
                process_file(os.path.join(dirpath, f).replace("\\", "/"))
