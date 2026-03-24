import os
import re

TARGETS = [
    "components",
    "screens",
    "app/(tabs)"
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "THEME_COLOR" not in content and "themeColor" not in content:
        return

    print("Refactoring", filepath)

    # 1. Strip THEME_COLOR from Config import ONLY
    def remove_theme_color_from_import(match):
        imp = match.group(0)
        imp = imp.replace("THEME_COLOR,", "").replace(", THEME_COLOR", "").replace("THEME_COLOR", "")
        # If it becomes `import { } from`, we should probably just leave it or remove it, but leaving is fine.
        return imp
        
    content = re.sub(r'import\s+\{([^}]*THEME_COLOR[^}]*)\}\s+from\s+[\'"](?:\.\./)+constants/Config[\'"];', remove_theme_color_from_import, content)

    # 2. Rename THEME_COLOR to themeColor everywhere EXCEPT in imports (already handled)
    content = content.replace("THEME_COLOR", "themeColor")

    # 3. Add useGlobal import if missing
    if "useGlobal" not in content:
        if "app/(tabs)" in filepath.replace("\\", "/"):
            dotpath = "'../../context/GlobalContext'"
        elif "screens" in filepath.replace("\\", "/"):
            dotpath = "'../context/GlobalContext'"
        elif "components" in filepath.replace("\\", "/"):
            dotpath = "'../context/GlobalContext'"
        else:
            dotpath = "'../context/GlobalContext'"
        
        # Insert after the last import line
        imports_end = content.rfind("import ")
        if imports_end != -1:
            next_line = content.find("\n", imports_end)
            content = content[:next_line+1] + f"import {{ useGlobal }} from {dotpath};\n" + content[next_line+1:]
        else:
            content = f"import {{ useGlobal }} from {dotpath};\n" + content

    # 4 & 5. Transform StyleSheet.create and inject hooks into main components
    has_stylesheet = "const styles = StyleSheet.create" in content
    
    if has_stylesheet:
        content = content.replace("const styles = StyleSheet.create", "const getStyles = (themeColor) => StyleSheet.create")

    # Regex to find main React components (starting with uppercase letter)
    # matching: const ScreenName = (...) => { OR export default function ScreenName(...) {
    comp_pattern = re.compile(r'((?:export\s+default\s+)?(?:const\s+[A-Z]\w+\s*=\s*(?:async\s)?\([^)]*\)\s*=>\s*\{|function\s+[A-Z]\w+\([^)]*\)\s*\{))')
    
    def inject_vars(match):
        decl = match.group(1)
        # Avoid double injection
        if "const { themeColor } = useGlobal();" in content[match.end():match.end()+200]:
            return decl
            
        injection = "\n    const { themeColor } = useGlobal();\n"
        if has_stylesheet:
            injection += "    const styles = getStyles(themeColor);\n"
        return decl + injection

    content = comp_pattern.sub(inject_vars, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root_dir in TARGETS:
    for dirpath, _, filenames in os.walk(root_dir):
        for f in filenames:
            if f.endswith(".js"):
                process_file(os.path.join(dirpath, f).replace("\\", "/"))

print("Done Refactoring!")
